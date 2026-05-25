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

## Backward Compatibility
- Migrations must be backward compatible
- Support rollback without data loss
- Be careful with column/table drops
