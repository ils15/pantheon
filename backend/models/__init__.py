"""SQLAlchemy 2.0 declarative base with common mixins."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, func
from sqlalchemy.ext.asyncio import AsyncAttrs as _AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase, _AsyncAttrs):
    """SQLAlchemy 2.0 declarative base with async support."""


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamp columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UUIDPrimaryKeyMixin:
    """Mixin that adds a UUID primary key column.

    Uses uuid.uuid7() as the default value when available (Python 3.14+),
    falling back to uuid.uuid4().
    """

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        sort_order=-1,  # Keep PK first in column order
    )


class IntegerPrimaryKeyMixin:
    """Mixin that adds an auto-increment integer primary key column."""

    id: Mapped[int] = mapped_column(
        primary_key=True,
        sort_order=-1,
    )


class SoftDeleteMixin:
    """Mixin that adds a ``deleted_at`` column for soft-delete support.

    Provides a :meth:`active` classmethod that returns a query filter
    excluding soft-deleted rows.
    """

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    @classmethod
    def active(cls) -> bool:
        """Return filter expression to exclude soft-deleted rows.

        Usage::

            select(Model).where(Model.active())
        """
        return cls.deleted_at.is_(None)  # type: ignore[attr-defined]


class ActivatableMixin:
    """Mixin that adds an ``is_active`` boolean column.

    Defaults to ``True``.
    """

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
