---
name: optimize-database
description: "Analyze and optimize database schema, queries, and performance"
argument-hint: "[Query or table name to analyze]"
agent: demeter
tools: ['search', 'usages']
---

# Optimize Database (Demeter)

## Performance Analysis

### Query Optimization
- Identify N+1 queries
- Analyse query plans (EXPLAIN)
- Suggest strategic indexes
- Optimise JOINs
- Batch operations when possible

### Index Strategy
- Indexes on WHERE columns
- Indexes on JOIN columns
- Indexes on ORDER BY columns
- Composite indexes when appropriate
- Remove unused indexes

### Schema Design
- Normalise tables (3NF)
- Appropriate data types
- Constraints and defaults
- Partition strategies
- Archive old data

### Migration Safety
- Forward + backward migrations
- Test on production-like data
- Zero-downtime deployment
- Rollback procedure defined
- Document breaking changes

### Monitoring
- Slow query monitoring
- Index usage metrics
- Table size tracking
- Connection pool health
- Replication lag (if applicable)

## Output
- 📊 Performance baseline
- 📈 Optimization recommendations
- 🔧 Migration scripts
- ⏱️ Estimated performance gains
- 📋 Monitoring dashboard setup

## When to Use
- Query is slow
- Table has grown significantly
- Multiple queries can be consolidated
- Design review before production
