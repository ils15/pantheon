# Repository Template

```python
# repositories/base_repository.py
from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Base

class BaseRepository:
    """Base repository with common CRUD operations"""
    
    def __init__(self, db: AsyncSession, model_class: type):
        self.db = db
        self.model = model_class
    
    async def create(self, data: Dict[str, Any]):
        """Create new entity"""
        entity = self.model(**data)
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity
    
    async def get_by_id(self, entity_id: int) -> Optional[Base]:
        """Get entity by ID"""
        result = await self.db.execute(
            select(self.model).where(self.model.id == entity_id)
        )
        return result.scalar_one_or_none()
    
    async def list(self, skip: int = 0, limit: int = 10, filters: Optional[Dict] = None) -> List[Base]:
        """List entities with pagination and filtering"""
        query = select(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update(self, entity_id: int, data: Dict[str, Any]) -> Optional[Base]:
        """Update entity"""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return None
        
        for key, value in data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        
        await self.db.commit()
        await self.db.refresh(entity)
        return entity
    
    async def delete(self, entity_id: int) -> bool:
        """Delete entity"""
        entity = await self.get_by_id(entity_id)
        if not entity:
            return False
        
        await self.db.delete(entity)
        await self.db.commit()
        return True
```

Use this template for new repositories:

1. Import `BaseRepository`
2. Create `YourRepository(BaseRepository)` extending it
3. Add specialized query methods
4. Keep data access logic isolated

**Common Methods**:
- `async def get_by_id()` - Get single entity
- `async def list()` - List with filters
- `async def search()` - Full-text search
- `async def count()` - Count total entities
- `async def exists()` - Check if entity exists
