import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from app.models import Base  # Убедись, что путь правильный!

# Загружаем конфигурацию Alembic
config = context.config

# Подключаем конфиг логирования
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Метаданные моделей
target_metadata = Base.metadata

# Асинхронный движок для Alembic
DATABASE_URL = config.get_main_option("sqlalchemy.url")
engine = create_async_engine(DATABASE_URL, poolclass=NullPool)


def run_migrations_offline() -> None:
    """Запуск миграций в оффлайн-режиме."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Запуск миграций в онлайн-режиме."""
    async with engine.connect() as connection:
        await connection.run_sync(do_migrations)


def do_migrations(connection):
    """Функция для корректного вызова run_migrations."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations() -> None:
    """Определяем режим работы (онлайн или оффлайн)."""
    if context.is_offline_mode():
        run_migrations_offline()
    else:
        asyncio.run(run_migrations_online())  # Запускаем асинхронную функцию


run_migrations()
