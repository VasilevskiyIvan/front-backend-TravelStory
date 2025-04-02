"""
Модуль для работы с отчетами пользователей.

Предоставляет API-эндпоинты для создания и получения отчетов,
включая загрузку изображений и управление видимостью контента.
"""

from datetime import date
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Report, ReportStatusEnum, User, VisibilityOptionEnum
from app.schemas import ReportResponse
from app.security import get_current_user
from app.utils import save_upload_file

router = APIRouter(prefix="/report", tags=["Report"])
UPLOAD_DIR = Path(r"C:\Users\Иван\Desktop\MainApp\react-vite-project\public\uploads")

@router.post(
    "/",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создание нового отчета",
    description="Создает новый отчет с возможностью загрузки изображений и настройками видимости",
)
async def create_report(
        # Основные поля
        title: str = Form(..., description="Заголовок отчета"),
        description: str = Form(..., description="Описание отчета"),
        start_date: date = Form(..., description="Дата начала периода отчета"),
        end_date: date = Form(..., description="Дата окончания периода отчета"),
        status: ReportStatusEnum = Form(..., description="Статус отчета"),

        # Файлы
        main_image: UploadFile = File(..., description="Главное изображение"),
        side_image: UploadFile = File(..., description="Дополнительное изображение"),

        # Технические поля
        html_path: str = Form(..., description="Путь к HTML-файлу"),
        text_content: str = Form(..., description="Текстовое содержимое"),

        # Настройки видимости
        likes_status: VisibilityOptionEnum = Form(
            VisibilityOptionEnum.PUBLIC,
            description="Видимость лайков",
        ),
        comment_status: VisibilityOptionEnum = Form(
            VisibilityOptionEnum.PUBLIC,
            description="Видимость комментариев",
        ),
        addit_file_status: VisibilityOptionEnum = Form(
            VisibilityOptionEnum.PUBLIC,
            description="Видимость дополнительных файлов",
        ),

        # Зависимости
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Создает новый отчет с прикрепленными файлами и настройками видимости.

    Возвращает:
        ReportResponse: Созданный отчет
    """
    main_image_path = None
    side_image_path = None

    try:
        main_image_path = await save_upload_file(main_image)
        side_image_path = await save_upload_file(side_image)

        new_report = Report(
            user_id=current_user.user_id,
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date,
            main_image=main_image_path,
            side_image=side_image_path,
            html_path=html_path,
            text_content=text_content,
            status=status,
            likes_status=likes_status,
            comment_status=comment_status,
            addit_file_status=addit_file_status,
        )

        db.add(new_report)
        await db.commit()
        await db.refresh(new_report)

        return new_report

    except Exception as e:
        for path in [main_image_path, side_image_path]:
            if path and (UPLOAD_DIR / path.split("/")[-1]).exists():
                (UPLOAD_DIR / path.split("/")[-1]).unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании отчета: {str(e)}",
        )


@router.get(
    "/reports_card",
    summary="Получение карточек отчетов",
    description="Возвращает список публичных отчетов с информацией об авторах",
)
async def get_all_reports(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """
    Получает список всех публичных отчетов с дополнительной информацией об авторе.

    Возвращает:
        dict: Словарь с ключом 'reports' и списком отчетов
    """
    try:
        query = text("""
            SELECT 
                r.*,
                u.username as author_username,
                r.user_id = :current_user_id as is_owner
            FROM reports r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.status != 'PRIVATE'
            ORDER BY r.created_at DESC
        """)
        result = await db.execute(query, {"current_user_id": current_user.user_id})
        return {"reports": result.mappings().all()}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении отчетов: {str(e)}",
        )