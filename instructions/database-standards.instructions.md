---
description: "Database development standards for SQLAlchemy/Alembic"
name: "Database Development Standards"
applyTo: "**/{*migration*.py,models/*.py}"
---

# Database Development Standards (Demeter)

## Migrations
- Create forward migration script
- Create rollback (downgrade) script
- Test both (upgrade + downgrade)
- Never edit old migrations

### Migration Lifecycle
```mermaid
flowchart LR
    A[Code Change] --> B[alembic revision --autogenerate]
    B --> C[Review migration script]
    C --> D{alembic upgrade head}
    D -->|Fails| E[Fix migration]
    E --> D
    D -->|Succeeds| F[Verify schema + data]
    F --> G{alembic downgrade -1}
    G -->|Fails| H[Fix downgrade]
    H --> G
    G -->|Succeeds| I[✅ Both ways tested!]
```

## Async SQLAlchemy 2.0 Patterns

### Engine & Session Configuration
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/dbname",
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

### Async Session Lifecycle
Always use async context managers for session management:

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

### Query Patterns
- Use `await session.execute(select(Model).where(...))` — always `await`
- Use `result.scalars().all()` for list results, `result.scalar_one_or_none()` for single
- Use `selectinload()` for to-many relationships, `joinedload()` for to-one
- Never chain `.all()` after `scalars()` inside async — use `result.scalars().all()`

### Connection Pooling
| Parameter | Default | Description |
|-----------|---------|-------------|
| `pool_size` | 20 | Maximum connections in pool |
| `max_overflow` | 10 | Extra connections beyond pool_size |
| `pool_pre_ping` | True | Verify connection before use |
| `pool_recycle` | 3600 | Recycle connections after N seconds |

## Migration Testing

Always test both upgrade AND downgrade:

```bash
alembic upgrade head           # Apply migration
python -m pytest tests/        # Verify app still works
alembic downgrade -1           # Rollback
python -m pytest tests/        # Verify app still works after rollback
```

### Migration Pre-flight Checklist
- [ ] Migration script reviewed for correctness
- [ ] Downgrade script tested and reversible
- [ ] No data loss on downgrade path
- [ ] Migration is backward-compatible (old code still runs)
- [ ] Index creation is CONCURRENTLY where possible (avoid table locks)

## Entities & Relationships
- Always add created_at, updated_at timestamps
- Use UUID or auto-increment primary keys
- Foreign key constraints
- Indexes on: PK, FK, search columns, sort columns

## Data Integrity
- NOT NULL constraints where required
- UNIQUE constraints for identifiers
- CHECK constraints for validation
- Appropriate foreign key cascades

## Query Optimization
- Avoid N+1 queries (use eager loading)
- Indexes on WHERE, JOIN, ORDER BY columns
- Analyze query plans with EXPLAIN
- Batch operations when possible

### N+1 Query Detection Flow
```mermaid
flowchart TD
    A[Query parent rows] --> B[Loop through results]
    B --> C{Each iteration queries related data?}
    C -->|Yes| D[🚨 N+1 detected]
    D --> E[Add eager loading]
    E --> F[selectinload for to-many]
    E --> G[joinedload for to-one]
    F --> H[Verify single query]
    G --> H
    H --> I[✅ N+1 resolved]
    C -->|No| J[✅ No N+1 issue]
```

## Backward Compatibility
- Migrations must be backward compatible
- Support rollback without data loss
- Be careful with column/table drops

## Disaster Recovery & Rollback Strategy

### Rollback First
1. `alembic downgrade -1` — Immediate rollback of last migration
2. Verify data integrity with `SELECT` queries
3. Fix migration code, re-test, re-deploy

### When to Restore from Backup (instead of rollback)
- Migration dropped a column or table (irreversible)
- Rollback fails due to data conflicts
- Migration ran multiple steps and a partial rollback is risky

### Pre-deployment Safety
- Always take a database backup before deploying migrations
- Use feature flags for backward-incompatible schema changes
- Use canary deployments for risky migrations (apply to read-replica first)
