"""
Модуль аутентификации и управления пользователями.

Содержит эндпоинты для:
- Регистрации и входа пользователей
- Управления паролями
- Административных функций
"""

import time
import random
from datetime import datetime, timedelta, timezone

import smtplib
from email.mime.text import MIMEText
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.models import AccountStatusEnum, PasswordResetToken, RoleEnum, User
from app.schemas import (
    PasswordResetCodeVerify,
    PasswordResetNewPassword,
    PasswordResetRequest,
    Token,
    UserCreate,
    UserResponse,
)
from app.security import (
    ACCESS_TOKEN_EXPIRE_DAYS,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    get_admin_user,
    get_current_user,
    get_password_hash,
    verify_password,
)

router = APIRouter(tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)

SMTP_CONFIG = {
    "SERVER": "smtp.yandex.ru",
    "PORT": 465,
    "USER": "vasulevskyivan@yandex.ru",
    "PASSWORD": "emcvgsyqkqfruthv",
    "FROM": "vasulevskyivan@yandex.ru",
}

ERROR_MESSAGES = {
    "user_exists": "Username or email already registered",
    "invalid_credentials": "Incorrect username or password",
    "account_inactive": "Account is not active",
    "reset_limit": "Try again later",
    "invalid_code": "Invalid or expired code",
    "too_many_attempts": "Too many attempts",
}


# Вспомогательные функции
def generate_reset_code(length: int = 8):
    """Генерирует случайный код восстановления."""
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "".join(random.choice(chars) for _ in range(length))  # noqa: S311


async def validate_user_exists(db: AsyncSession, username: str, email: EmailStr):
    """
    Проверяет существование пользователя с указанными username или email.

    Вызывает HTTPException 400 при обнаружении существующего пользователя.
    """
    existing_user = await db.execute(
        select(User).where((User.username == username) | (User.email == email))
    )
    if existing_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["user_exists"],
        )


# Эндпоинты
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация нового пользователя",
    response_description="Успешная регистрация",
)
async def register(
        user_data: UserCreate,
        db: AsyncSession = Depends(get_db),
):
    """
    Регистрирует нового пользователя в системе.

    Требует:
    - Уникальные username и email
    - Пароль длиной не менее 8 символов
    """
    await validate_user_exists(db, user_data.username, user_data.email)

    new_user = User(
        **user_data.model_dump(exclude={"password"}),
        password_hash=get_password_hash(user_data.password),
        account_status=AccountStatusEnum.ACTIVE,
        role=RoleEnum.USER,
    )

    db.add(new_user)
    await db.commit()

    return {"message": "User created successfully"}


@router.post(
    "/login",
    response_model=Token,
    summary="Аутентификация пользователя",
    description="Возвращает access и refresh токены для аутентификации",
)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db),
):
    """Выполняет аутентификацию пользователя и выдает токены доступа."""
    user = await db.execute(select(User).where(User.username == form_data.username))
    user = user.scalars().first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=ERROR_MESSAGES["invalid_credentials"],
        )

    if user.account_status != AccountStatusEnum.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ERROR_MESSAGES["account_inactive"],
        )

    user.last_login = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(
        data={"sub": str(user.user_id)},
        expires_delta=timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    )
    refresh_token = create_access_token(
        data={"sub": str(user.user_id), "refresh": True},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
    }


@router.get(
    "/auth/me",
    response_model=UserResponse,
    summary="Получить текущего пользователя",
)
async def get_current_user_endpoint(
        current_user: User = Depends(get_current_user),
):
    """Возвращает информацию о текущем аутентифицированном пользователе."""
    return current_user


@router.post(
    "/create-admin",
    dependencies=[Depends(get_admin_user)],
    summary="Создать администратора",
    description="Требует прав администратора",
)
async def create_admin(
        user_data: UserCreate,
        db: AsyncSession = Depends(get_db),
):
    """Создает нового пользователя с правами администратора."""
    await validate_user_exists(db, user_data.username, user_data.email)

    new_user = User(
        **user_data.model_dump(exclude={"password"}),
        password_hash=get_password_hash(user_data.password),
        role=RoleEnum.ADMIN,
        account_status=AccountStatusEnum.ACTIVE,
    )

    db.add(new_user)
    await db.commit()

    return {"message": "Admin user created successfully"}


@router.post(
    "/request-password-reset",
    summary="Запрос сброса пароля",
    description="Инициирует процесс сброса пароля через email",
)
@limiter.limit("1/2 minute")
async def request_password_reset(
        request: Request,
        reset_request: PasswordResetRequest,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
):
    """Обрабатывает запрос на сброс пароля."""
    user = await db.execute(
        select(User).where(
            User.email == reset_request.email,
            User.first_name == reset_request.first_name,
            User.last_name == reset_request.last_name,
        )
    )
    user = user.scalars().first()

    if not user:
        time.sleep(2)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    existing_token = await db.get(PasswordResetToken, reset_request.email)
    if existing_token:
        if datetime.now(timezone.utc) < existing_token.expires_at:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=ERROR_MESSAGES["reset_limit"],
            )
        await db.delete(existing_token)
        await db.commit()

    reset_token = PasswordResetToken(
        email=reset_request.email,
        reset_code=generate_reset_code(),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=2),
        attempts=0,
    )

    db.add(reset_token)
    await db.commit()

    background_tasks.add_task(
        send_reset_code_email,
        email=reset_request.email,
        code=reset_token.reset_code,
    )

    return {"message": "Password reset code has been sent to your email"}


@router.post(
    "/verify-reset-code",
    summary="Проверка кода сброса",
    description="Валидирует код восстановления пароля",
)
@limiter.limit("1/10 second")
async def verify_reset_code(
        request: Request,
        code_data: PasswordResetCodeVerify,
        db: AsyncSession = Depends(get_db),
):
    """Проверяет валидность кода восстановления пароля."""
    token = await db.get(PasswordResetToken, code_data.email)

    if not token:
        time.sleep(10)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["invalid_code"],
        )

    if token.attempts >= 3:
        await db.delete(token)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ERROR_MESSAGES["too_many_attempts"],
        )

    token.attempts += 1
    await db.commit()

    if token.reset_code != code_data.code:
        time.sleep(10)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["invalid_code"],
        )

    if datetime.now(timezone.utc) > token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ERROR_MESSAGES["invalid_code"],
        )

    token.attempts = 0
    await db.commit()

    return {"message": "Code successfully verified"}


@router.post(
    "/reset-password",
    summary="Сброс пароля",
    description="Устанавливает новый пароль после проверки кода",
)
async def reset_password(
        password_data: PasswordResetNewPassword,
        db: AsyncSession = Depends(get_db),
):
    """Устанавливает новый пароль для пользователя."""
    user = await db.execute(select(User).where(User.email == password_data.email))
    user = user.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.password_hash = get_password_hash(password_data.new_password)
    await db.delete(await db.get(PasswordResetToken, password_data.email))
    await db.commit()

    return {"message": "Password has been successfully updated"}


def send_reset_code_email(email: str, code: str):
    """Отправляет email с кодом восстановления пароля."""
    msg = MIMEText(f"Ваш код восстановления пароля: {code}")
    msg["Subject"] = "Сброс пароля"
    msg["From"] = SMTP_CONFIG["FROM"]
    msg["To"] = email

    try:
        with smtplib.SMTP_SSL(SMTP_CONFIG["SERVER"], SMTP_CONFIG["PORT"]) as server:
            server.login(SMTP_CONFIG["USER"], SMTP_CONFIG["PASSWORD"])
            server.send_message(msg)
    except Exception as e:
        print(f"Ошибка отправки email: {e}")