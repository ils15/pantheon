# Optimize Database (Demeter)

Analyze and optimize database schema, queries, and performance.

**Target:** $ARGUMENTS

## Analysis Areas

### Query Optimization
- Identify N+1 queries
- Analyze query plans (EXPLAIN ANALYZE)
- Suggest strategic indexes
- Optimize JOINs and batch operations

### Index Strategy
- Indexes on WHERE, JOIN, ORDER BY columns
- Composite indexes where appropriate
- Remove unused indexes

### Schema Design
- Normalize tables (3NF)
- Appropriate data types and constraints
- Partition and archive strategies

### Migration Safety
- Forward + backward migrations
- Zero-downtime deployment
- Rollback procedure defined

## Output
- Performance baseline
- Optimization recommendations
- Migration scripts
- Estimated performance gains
