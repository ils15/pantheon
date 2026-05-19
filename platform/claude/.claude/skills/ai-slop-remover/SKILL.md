---
name: ai-slop-remover
description: "Detect and remove AI-generated code smells — verbose comments, redundant error handling, over-engineered patterns, generic AI phrasing. Runs post-edit via comment-checker hook."
context: fork
globs: ["**/*.py", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
alwaysApply: false
---

# AI Slop Remover — Clean Code Comments

Use this skill to detect and eliminate AI-generated code smells from files while preserving functionality. Identifies and removes verbose comments, redundant error handling, over-engineered patterns, and generic AI phrasing.

---

## The Core Principle

> **Code should read like a senior wrote it, not an AI.**

AI-generated code tends to over-explain, over-handle, and over-engineer. This skill catches those patterns and replaces them with clean, concise alternatives.

---

## AI Slop Patterns to Detect

### 1. Verbose Comments ❌

Comments that explain what the code already says:

```python
# ❌ AI Slop
# This function hashes the user's password using bcrypt
# and returns the hashed password for storage in the database
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# ✅ Clean
def hash_password(password: str) -> str:
    """Hash password with bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

### 2. Redundant Error Handling Comments ❌

Comments that describe obvious error paths:

```python
# ❌ AI Slop
# Try to fetch the user from the database
# If the user is not found, raise a 404 error
# If there is a database error, raise a 500 error
async def get_user(user_id: str):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404)

# ✅ Clean
async def get_user(user_id: str):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
```

### 3. AI Filler Phrases ❌

Generic phrases that add no value:

```python
# ❌ AI Slop
# In this implementation, we handle the user authentication
# by checking the provided credentials against the database
# and returning a JWT token if successful

# ✅ Clean
# Authenticate user and return JWT token.
```

### 4. Over-Engineered Patterns ❌

Unnecessary abstraction for simple tasks:

```python
# ❌ AI Slop — Factory pattern for a simple dict
class UserResponseFactory:
    @staticmethod
    def create(user: User) -> dict:
        return {"id": user.id, "email": user.email}

# ✅ Clean — Just a function
def user_response(user: User) -> dict:
    return {"id": user.id, "email": user.email}
```

### 5. Self-Congratulatory Comments ❌

Comments that praise the implementation:

```python
# ❌ AI Slop
# This robust implementation ensures secure password handling
# with industry-standard bcrypt hashing

# ✅ Clean
# Bcrypt password hashing.
```

---

## Detection Rules

### Comment Analysis

A comment is flagged as AI slop if it matches ANY of these patterns:

| Pattern | Example | Severity |
|---------|---------|----------|
| Starts with "This function/method/class" | "This function handles..." | High |
| Explains what code already says | "Check if user exists" before `if user:` | High |
| Uses "In this implementation" | "In this implementation, we..." | High |
| Uses "robust/comprehensive/elegant" | "This robust solution..." | Medium |
| Multi-line explanation of simple code | 3+ lines explaining 1-line code | Medium |
| Repeats function name in comment | "hash_password: hashes the password" | Low |

### Code Analysis

Code is flagged as over-engineered if:

| Pattern | Example | Severity |
|---------|---------|----------|
| Factory/Builder for simple data | Factory class for dict creation | High |
| Abstract base class for single impl | ABC with one subclass | Medium |
| Strategy pattern for 2 options | Strategy class for if/else | Medium |
| Decorator for single-use logic | Decorator used once | Low |

---

## Bypass Mechanisms

### Line-Level Bypass

Add `# @allow` at the end of a comment to skip checking:

```python
# This complex logic handles edge cases in the billing system @allow
def calculate_billing():
    ...
```

### File-Level Bypass

Add `# comment-checker-disable-file` at the top of a file:

```python
# comment-checker-disable-file
# This file contains generated code that should not be checked
...
```

---

## Hook Integration

The `comment-checker` hook runs after every edit/write operation:

```
Agent edits file → adds comments
  ↓
PostToolUse hook triggers
  ↓
Analyzes comments against AI slop patterns
  ├─ CLEAN → allows edit
  └─ SLOP DETECTED → injects warning:
      "⚠️ Comment flagged as AI slop: 'This function handles...'
       Replace with: 'Hash and verify user password.'"
```

---

## Replacement Guidelines

When AI slop is detected, replace with:

| AI Slop | Replace With |
|---------|-------------|
| "This function does X" | Docstring: `"""Do X."""` |
| Multi-line explanation | Single-line comment or docstring |
| "In this implementation..." | Remove entirely |
| Self-congratulatory language | Remove entirely |
| Redundant error comments | Keep only non-obvious context |

---

## Examples: Before and After

### Before (AI Slop):
```python
# This class provides a comprehensive user management service
# that handles all CRUD operations for the User model
# with proper error handling and validation
class UserService:
    """User service for CRUD operations."""

    def __init__(self, db: AsyncSession):
        # Initialize the service with a database session
        # This allows us to perform database operations
        self.db = db

    async def create_user(self, email: str, password: str) -> User:
        # Create a new user with the provided email and password
        # First, we hash the password for security
        # Then, we create the user object and save it to the database
        # Finally, we return the created user
        hashed_pw = hash_password(password)
        user = User(email=email, password=hashed_pw)
        self.db.add(user)
        await self.db.flush()
        return user
```

### After (Clean):
```python
class UserService:
    """User CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, email: str, password: str) -> User:
        """Create user with hashed password."""
        user = User(email=email, password=hash_password(password))
        self.db.add(user)
        await self.db.flush()
        return user
```

**Lines reduced:** 18 → 9 (50% reduction)
**Readability:** Significantly improved
