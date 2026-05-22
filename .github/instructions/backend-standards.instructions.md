---
description: "Backend development standards for FastAPI/Python APIs"
name: "Backend Development Standards"
applyTo: "**/*.py"
---

# Backend Development Standards (Hermes)

## Async/Await
- Use async/await for ALL I/O operations (database, external APIs, file operations)
- Never block on async operations
- Use `asyncio.gather()` for parallel operations

## Test-Driven Development
- RED: Write a failing test
- GREEN: Write minimal code to pass
- REFACTOR: Improve without breaking tests

## Type Safety
- Type hints on all function parameters
- Type hints on all return types
- Use Pydantic for request/response validation

## Code Organization
- Maximum 300 lines per file
- Separate: routes → services → models
- Docstrings on public functions (Google format)

## Error Handling
- Never silent failures (catch and log)
- Use appropriate HTTP status codes
- Return friendly error messages (no stack traces)
- Implement retry logic with exponential backoff

## Performance
- Avoid N+1 queries (use eager loading/joins)
- Implement pagination for list endpoints
- Cache frequently accessed data
- Monitor for async deadlocks

## Security
- Input validation on all endpoints
- CSRF protection
- Rate limiting for sensitive endpoints
- Sanitize logs (never log passwords/tokens)
