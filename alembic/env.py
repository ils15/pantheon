"""Alembic async migration environment.

Supports both synchronous (offline) and asynchronous (online) migration contexts.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from backend.models import Base

# Alembic Config object
config = context.config

# Set up logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# MetaData for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL and not an Engine. Skips
    Engine creation and DB calls. Scripts can be emitted as SQL files.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations against the given connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode using AsyncEngine."""
    config_section = config.get_section(config.config_ini_section, {})
    url = config_section.get("sqlalchemy.url")

    if url is None:
        raise ValueError(
            "sqlalchemy.url must be configured in alembic.ini or "
            "set via the DATABASE_URL environment variable"
        )

    connectable = create_async_engine(url, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Uses async runner for the async engine.
    """
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
