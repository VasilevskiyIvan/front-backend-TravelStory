"""
Модуль для работы с профилями пользователей и отчетами.

Содержит эндпоинты для:
- Просмотра профилей пользователей
- Получения отчетов пользователей
- Управления видимостью профиля
"""

from uuid import UUID
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from pathlib import Path
from datetime import datetime, timezone
from typing import List

from app.database import get_db
from app.models import User, ProfileVisibilityEnum, subscriptions
from app.schemas import UserProfileResponse, UserFollowResponse, ChechSubscribersResponse
from app.security import get_current_user
from app.utils import save_upload_file

router = APIRouter(prefix="/users", tags=["Users"])
UPLOAD_DIR = Path(r"C:\Users\Иван\Desktop\MainApp\react-vite-project\public\uploads")

ERROR_USER_NOT_FOUND = "Пользователь не найден"
ERROR_PRIVATE_PROFILE = "Профиль закрыт для просмотра"
ERROR_FRIENDS_ONLY_PROFILE = "Профиль доступен только друзьям"


@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
        user_id: UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, detail=ERROR_USER_NOT_FOUND)

    response_data = {
        "user_id": user.user_id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "profile_visibility": user.profile_visibility,
    }

    if user.profile_visibility == ProfileVisibilityEnum.PRIVATE:
        if current_user.user_id != user_id:
            raise HTTPException(403, detail=ERROR_PRIVATE_PROFILE)
        response_data["travel_stats"] = user.travel_stats

    elif user.profile_visibility == ProfileVisibilityEnum.FRIENDS_ONLY:
        is_following = await db.execute(
            select(subscriptions).where(
                subscriptions.c.follower_id == current_user.user_id,
                subscriptions.c.following_id == user_id
            )
        )
        if current_user.user_id != user_id and not is_following.scalar():
            return UserProfileResponse(**{**response_data, "travel_stats": {}})

        response_data["travel_stats"] = user.travel_stats

    else:
        response_data["travel_stats"] = user.travel_stats

    return UserProfileResponse(**response_data)

@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Получить текущий профиль",
    description="Возвращает полную информацию о текущем аутентифицированном пользователе",
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Получение профиля текущего пользователя"""
    return current_user


@router.get(
    "/{user_id}/reports",
    summary="Получить отчеты пользователя",
    description="Возвращает публичные отчеты пользователя или все отчеты для владельца",
)
async def get_user_public_reports(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) :
    """
    Получение отчетов пользователя с учетом прав доступа.

    Для владельца: возвращает все отчеты
    Для других пользователей:
      - PUBLIC отчеты
      - FRIENDS_ONLY если есть подписка
    """
    user_exists = await db.execute(select(User).where(User.user_id == user_id))
    if not user_exists.scalar():
        raise HTTPException(
            status_code=404,
            detail=ERROR_USER_NOT_FOUND
        )

    base_query = """
        SELECT 
            r.*,
            u.username as author_username,
            (r.user_id = :current_user_id) as is_owner
        FROM reports r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.user_id = :user_id
    """

    if current_user.user_id != user_id:
        base_query += """
            AND (
                r.status = 'PUBLIC' 
                OR (
                    r.status = 'FRIENDS_ONLY' 
                    AND EXISTS (
                        SELECT 1 FROM subscriptions 
                        WHERE follower_id = :current_user_id 
                        AND following_id = :user_id
                    )
                )
            )
        """

    try:
        result = await db.execute(
            text(base_query),
            {
                "user_id": user_id,
                "current_user_id": current_user.user_id
            }
        )
        return {"reports": result.mappings().all()}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении отчетов: {str(e)}"
        )



@router.get(
    "/reports",
    summary="Получить собственные отчеты",
    description="Возвращает все отчеты текущего пользователя",
)
async def get_user_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получение всех отчетов текущего пользователя"""
    try:
        query = text("""
            SELECT 
                r.*,
                u.username as author_username,
                true as is_owner
            FROM reports r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.user_id = :user_id
        """)
        result = await db.execute(query, {"user_id": current_user.user_id})
        return {"reports": result.mappings().all()}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении отчетов: {str(e)}"
        )

@router.post(
    "/changeprof",
    response_model=UserProfileResponse,
    summary="Обновление данных пользователя",
    description="Обновляет данные полей имени, фамилии, описания, статус профиля и аватарку",
)
async def change_profile(
    first_name: str = Form(..., description="Имя"),
    last_name: str = Form(..., description="Фамилия"),
    bio: str = Form(..., description="Описание профиля"),
    profile_visibility: ProfileVisibilityEnum = Form(..., description="Приватность профиля"),
    avatar_url: UploadFile | None = File(None, description="Аватар профиля"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    avatar_filename = current_user.avatar_url.split("/")[-1] if current_user.avatar_url else None
    new_avatar_path = None

    try:
        if avatar_url:
            new_avatar_path = await save_upload_file(avatar_url)
            avatar_filename = new_avatar_path.split("/")[-1]

        user = await db.get(User, current_user.user_id)
        if not user:
            raise HTTPException(status_code=404, detail=ERROR_USER_NOT_FOUND)

        user.first_name = first_name
        user.last_name = last_name
        user.bio = bio
        user.profile_visibility = profile_visibility
        if new_avatar_path:
            user.avatar_url = new_avatar_path

        await db.commit()
        await db.refresh(user)
        return user

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        if new_avatar_path and (UPLOAD_DIR / avatar_filename).exists():
            (UPLOAD_DIR / avatar_filename).unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при обновлении профиля: {str(e)}"
        )

@router.get(
    "/subscribers",
    summary="Подписаться на пользователя"
)
async def get_follow_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = text("""
            SELECT 
                s.*,
                u.username,
                u.avatar_url
            FROM subscriptions s
            JOIN users u ON s.follower_id = u.user_id
            WHERE following_id = :following_id
            ORDER BY s.created_at DESC
        """)
        result = await db.execute(query, {"following_id": current_user.user_id})
        return {"subscribers": result.mappings().all()}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении отчетов: {str(e)}",
        )

@router.get(
    "/{user_id}/subscribers",
    summary="Подписаться на пользователя"
)
async def get_follow_others_user(
    user_id = UUID,
    db: AsyncSession = Depends(get_db)
):
    try:
        query = text("""
            SELECT 
                s.*,
                u.username,
                u.avatar_url
            FROM subscriptions s
            JOIN users u ON s.follower_id = u.user_id
            WHERE following_id = :following_id
            ORDER BY s.created_at DESC
        """)
        result = await db.execute(query, {"following_id": user_id})
        return {"subscribers": result.mappings().all()}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении отчетов: {str(e)}",
        )

@router.post(
    "/follow/{following_id}",
    response_model=UserFollowResponse,
    summary="Подписаться на пользователя"
)
async def follow_user(
    following_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.user_id == following_id:
            raise HTTPException(400, "Нельзя подписаться на себя")

        target_user = await db.get(User, following_id)
        if not target_user:
            raise HTTPException(404, "Пользователь не найден")

        existing = await db.execute(
            select(subscriptions).where(
                subscriptions.c.follower_id == current_user.user_id,
                subscriptions.c.following_id == following_id
            )
        )
        if existing.scalar():
            raise HTTPException(400, "Вы уже подписаны")

        query = subscriptions.insert().values(
            follower_id=current_user.user_id,
            following_id=following_id,
            created_at=func.now()
        )
        await db.execute(query)
        await db.commit()

        return {
            "follower_id": current_user.user_id,
            "following_id": following_id,
            "created_at": datetime.now(timezone.utc)
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"Ошибка: {str(e)}")

@router.delete(
    "/follow/{following_id}",
    summary="Отписаться от пользователя"
)
async def unfollow_user(
    following_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        subscriptions.delete().where(
            subscriptions.c.follower_id == current_user.user_id,
            subscriptions.c.following_id == following_id
        )
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Подписка не найдена")
    await db.commit()
    return {"message": "Подписка удалена"}

@router.get("/{following_id}/is-following", summary="Проверить подписку", response_model=bool)
async def check_subscription(
    following_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"Checking subscription: {current_user.user_id} -> {following_id}")
    try:
        result = await db.execute(
            select(subscriptions).where(
                subscriptions.c.follower_id == current_user.user_id,
                subscriptions.c.following_id == following_id
            )
        )
        is_following = result.scalar() is not None
        print(f"Subscription status: {is_following}")
        return is_following
    except Exception as e:
        print(f"Subscription check error: {str(e)}")
        raise HTTPException(500, f"Ошибка: {str(e)}")

