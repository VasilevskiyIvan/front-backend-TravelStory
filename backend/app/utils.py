import uuid
from pathlib import Path

from fastapi import (
    File,
    HTTPException,
    UploadFile,
    status,
)

UPLOAD_DIR = Path(r"C:\Users\Иван\Desktop\MainApp\react-vite-project\public\uploads")
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg"]
MAX_AVATAR_SIZE = 5 * 1024 * 1024


async def save_upload_file(upload_file: UploadFile, max_size: int = None) -> str:
    """
    Сохраняет загруженный файл на сервер с проверкой типа и размера.

    Параметры:
        upload_file: Загруженный файл
        max_size: Максимальный допустимый размер файла в байтах (опционально)

    Возвращает:
        str: Относительный путь к сохраненному файлу

    Исключения:
        HTTPException: При ошибках валидации или сохранения файла
    """
    try:
        # Проверка типа файла
        if upload_file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неподдерживаемый тип файла",
            )

        # Проверка размера файла
        content = await upload_file.read()
        if max_size and len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Превышен максимальный размер файла",
            )

        # Генерация уникального имени файла
        file_ext = upload_file.filename.split(".")[-1] if "." in upload_file.filename else ""
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else f"{uuid.uuid4()}"
        file_path = UPLOAD_DIR / unique_filename

        # Сохранение файла
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        return f"/uploads/{unique_filename}"

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при сохранении файла: {str(e)}",
        )
    finally:
        await upload_file.close()