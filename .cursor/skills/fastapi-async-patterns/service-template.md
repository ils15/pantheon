# Service Layer Template

```python
# services/base_service.py
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base_repository import BaseRepository

class BaseService:
    """Base service class with common CRUD operations"""
    
    def __init__(self, db: AsyncSession, repository_class):
        self.db = db
        self.repository = repository_class(db)
    
    async def create(self, data: Dict[str, Any]):
        """Create new entity"""
        return await self.repository.create(data)
    
    async def get(self, entity_id: int):
        """Get entity by ID"""
        return await self.repository.get_by_id(entity_id)
    
    async def list(self, skip: int = 0, limit: int = 10, filters: Optional[Dict] = None):
        """List entities with filtering"""
        return await self.repository.list(skip=skip, limit=limit, filters=filters)
    
    async def update(self, entity_id: int, data: Dict[str, Any]):
        """Update entity"""
        return await self.repository.update(entity_id, data)
    
    async def delete(self, entity_id: int) -> bool:
        """Delete entity"""
        return await self.repository.delete(entity_id)
```

Use this template for new service classes:

1. Import `BaseService`
2. Create `YourService(BaseService)` extending it
3. Add business logic methods
4. Use dependency injection in routers

**Key Methods**:
- `async def create()` - Create new entity with validation
- `async def list()` - List with pagination and filters
- `async def search()` - Full-text search
- `async def validate()` - Pre-operation validation
- `async def enrich()` - Add Gemini data if applicable
