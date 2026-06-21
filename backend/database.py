"""Async database engine factory and session management for FastAPI."""

from collections.abc import AsyncGenerator

from pydantic_settings import BaseSettings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.models import Base


class DatabaseSettings(BaseSettings):
    """Pydantic-backed database configuration from environment variables.

    Override any setting via environment variable prefix (no prefix used here):

        DATABASE_URL=postgresql+asyncpg://user:pass@host/db
        DB_POOL_SIZE=10
        DB_MAX_OVERFLOW=5
    """

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pantheon"
    db_pool_size: int = 20
    db_max_overflow: int = 10

    model_config = {"env_prefix": ""}  # Read DATABASE_URL, DB_POOL_SIZE, etc. directly


def create_engine(database_url: str | None = None) -> AsyncEngine:
    """Create an async SQLAlchemy engine with sensible pool defaults.

    Args:
        database_url: Full async database URL (e.g. postgresql+asyncpg://user:pass@host/db).
                      Falls back to the DATABASE_URL env var (or default) when ``None``.

    Returns:
        Configured AsyncEngine instance.
    """
    settings = DatabaseSettings()
    url = database_url or settings.database_url

    return create_async_engine(
        url,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_pre_ping=True,
        echo=False,
    )


def create_session_factory(
    engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    """Create an async session factory bound to the given engine.

    Args:
        engine: AsyncEngine instance.

    Returns:
        Configured async_sessionmaker.
    """
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,  # Prevents lazy-loading after commit — avoids
        # "DetachedInstanceError" when accessing model
        # attributes outside a session.
    )


async def get_db(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency generator that yields an async DB session.

    Usage in router::

        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...

    Args:
        session_factory: The async sessionmaker to use.

    Yields:
        An AsyncSession that is committed/rolled back and closed when the
        request completes.
    """
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_db_health(
    session_factory: async_sessionmaker[AsyncSession],
) -> bool:
    """Verify the database is reachable by executing a simple ``SELECT 1``.

    Args:
        session_factory: The async sessionmaker to use.

    Returns:
        ``True`` if the query succeeds, ``False`` otherwise.
    """
    try:
        async with session_factory() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
