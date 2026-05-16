---
name: performance-optimization
description: "Performance optimization - query analysis, N+1 detection, caching, indexing strategies"
globs: ["**/*.py", "**/*.ts"]
alwaysApply: false
---

# Performance Optimization Skill

## Query Optimization

### N+1 Query Problem
```python
# ❌ WRONG: N+1 queries
users = await db.query(User).all()
for user in users:
    posts = await db.query(Post).where(Post.user_id == user.id).all()
    # This runs 1 + N queries!

# ✅ RIGHT: Eager loading
users = await db.query(User).options(selectinload(User.posts)).all()
```

### Indexes Strategy
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)  # Indexed automatically
    email = Column(String, unique=True, index=True)  # Index for WHERE
    created_at = Column(DateTime, index=True)  # Index for ORDER BY
    
    # Composite index for common queries
    __table_args__ = (
        Index('ix_user_created_email', 'created_at', 'email'),
    )
```

### Query Optimization
```python
# EXPLAIN to see execution plan
@router.get("/users/search")
async def search_users(q: str):
    # Good query
    return await db.execute(
        select(User).where(User.email.ilike(f"%{q}%"))
    )
```

## Caching Strategy

```python
class CachingService:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def get_user(self, user_id: int):
        # Try cache first
        cached = await self.redis.get(f"user:{user_id}")
        if cached:
            return json.loads(cached)
        
        # Cache miss - fetch from DB
        user = await db.query(User).filter(User.id == user_id).first()
        
        # Cache for 1 hour
        await self.redis.setex(
            f"user:{user_id}",
            3600,
            json.dumps(user.dict())
        )
        return user

# Cache invalidation on update
async def update_user(user_id: int, data):
    user = await db.query(User).filter(User.id == user_id).first()
    user.update(data)
    await db.commit()
    
    # Invalidate cache
    await self.redis.delete(f"user:{user_id}")
```

## Monitoring Performance
```python
# Add timing middleware
@app.middleware("http")
async def add_timing_header(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    response.headers["X-Process-Time"] = str(duration)
    logger.info(f"{request.url.path} took {duration:.3f}s")
    return response
```

## Real-World Checklist
- [ ] Identified slow queries (with EXPLAIN ANALYZE)
- [ ] Indexes added on WHERE/JOIN/ORDER BY columns
- [ ] N+1 queries fixed (eager loading)
- [ ] Caching implemented for hot data
- [ ] Pagination added to list endpoints
- [ ] Batch operations where possible
- [ ] Connection pooling configured
- [ ] Monitoring/alerting in place
