---
name: tdd-with-agents
description: "Comprehensive TDD enforcement guide for the 9-agent system - RED→GREEN→REFACTOR cycle across backend, frontend, and database agents"
---

# TDD Enforcement Across All Implementation Agents

Comprehensive guide to Test-Driven Development (TDD) workflow as implemented by Hermes (backend), Aphrodite (frontend), and Maat (database) agents. This ensures consistent RED → GREEN → REFACTOR cycle across the entire 9-agent system.

---

## ⚠️ Non-Interactive Testing Rule

**CRITICAL:** Agents must ALWAYS run tests in a non-interactive mode. Never use watch modes, debuggers, or commands that require user input (e.g. `q` to quit).
- **Frontend:** Use `npx vitest run` instead of `vitest` (which defaults to watch mode).
- **Backend/Database:** Use `pytest` but NEVER append `--pdb` or start interactive shells.

---

## Core TDD Philosophy

**TDD = Write Tests First, Not After**

Traditional approach ❌:
```
Write code → Write tests → Discover problems → Fix code
Risk: Tests written AFTER might not catch edge cases
```

TDD approach ✅:
```
Write failing test (RED) → Write minimal code to pass (GREEN) → Improve code (REFACTOR)
Benefit: Tests drive design, all paths covered by definition
```

---

## The RED → GREEN → REFACTOR Cycle

Every implementation agent follows this religiously:

### 🔴 Phase 1: RED (Test Fails)

**What:** Write test FIRST, before any implementation code
**Why:** Test defines the requirement
**Outcome:** Test FAILS (RED)

**Example - Backend (Hermes):**
```python
# tests/test_user_service.py
import pytest
from app.models import User
from app.services import UserService

def test_user_password_hashing():
    """User password must be bcrypt hashed, not plaintext."""
    service = UserService()
    user = service.create_user(
        email="alice@example.com",
        password="SecurePassword123"
    )
    
    # RED: This test FAILS right now
    assert user.password != "SecurePassword123"  # Password should NOT be plaintext
    assert user.verify_password("SecurePassword123")  # But verify should work
    assert not user.verify_password("WrongPassword")  # Wrong password should fail

# Run: pytest tests/test_user_service.py::test_user_password_hashing
# Result: ❌ FAILED - UserService doesn't exist yet
```

**Example - Frontend (Athena):**
```javascript
// src/components/__tests__/LoginForm.test.tsx
import { render, screen, userEvent } from "@testing-library/react";
import { LoginForm } from "../LoginForm";

test("submits form with email and password", async () => {
    const mockSubmit = vi.fn();
    
    render(<LoginForm onSubmit={mockSubmit} />);
    
    // RED: This test FAILS right now
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const passwordInput = screen.getByLabelText("password");
    const submitButton = screen.getByRole("button", { name: /login/i });
    
    await userEvent.type(emailInput, "alice@example.com");
    await userEvent.type(passwordInput, "SecurePassword123");
    await userEvent.click(submitButton);
    
    expect(mockSubmit).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "SecurePassword123"
    });
});

// Run: npx vitest run LoginForm.test.tsx
// Result: ❌ FAILED - LoginForm doesn't exist yet
```

**Example - Database (Maat):**
```python
# tests/test_user_migration.py
import pytest
from sqlalchemy import inspect, MetaData

def test_user_table_has_email_column():
    """User table must have email column, unique and non-null."""
    metadata = MetaData()
    metadata.reflect(bind=engine)
    user_table = metadata.tables.get("user")
    
    # RED: This test FAILS because table doesn't exist
    assert user_table is not None
    assert "email" in user_table.columns
    
    email_col = user_table.columns["email"]
    assert email_col.nullable is False
    assert email_col.unique is True

# Run: pytest tests/test_user_migration.py::test_user_table_has_email_column
# Result: ❌ FAILED - user table doesn't exist yet
```

**RED Checklist:**
- ✅ Test is FAILING (not passing)
- ✅ Test clearly states requirement (readable)
- ✅ Test catches both happy path AND edge cases
- ✅ No implementation code exists yet
- ✅ Error message is clear (helps drive implementation)

---

### 🟢 Phase 2: GREEN (Test Passes - Minimal Implementation)

**What:** Write MINIMAL code to make test PASS
**Why:** Minimal code = no unnecessary complexity
**Outcome:** Test PASSES (GREEN)
**Rule:** Write just enough to pass the test, nothing more

**Example - Backend (Hermes):**
```python
# app/services.py - MINIMAL implementation
import bcrypt
from app.models import User

class UserService:
    def create_user(self, email: str, password: str) -> User:
        # GREEN: Minimal code to pass test
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        user = User(email=email, password=hashed)
        return user
        # That's it! Don't add validation, logging, etc yet

# app/models.py
import bcrypt

class User:
    def __init__(self, email: str, password: bytes):
        self.email = email
        self.password = password  # Already hashed
    
    def verify_password(self, plaintext: str) -> bool:
        # GREEN: Minimal verification
        return bcrypt.checkpw(plaintext.encode(), self.password)

# Run: pytest tests/test_user_service.py::test_user_password_hashing
# Result: ✅ PASSED - Test is green!
```

**Example - Frontend (Athena):**
```javascript
// src/components/LoginForm.tsx - MINIMAL implementation
export function LoginForm({ onSubmit }) {
    // GREEN: Minimal component to pass test
    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSubmit({
                email: formData.get("email"),
                password: formData.get("password")
            });
        }}>
            <input name="email" placeholder="Email" />
            <input name="password" type="password" placeholder="Password" />
            <button type="submit">Login</button>
        </form>
    );
}

// Run: npx vitest run LoginForm.test.tsx
// Result: ✅ PASSED - Test is green!
```

**Example - Database (Maat):**
```python
# migrations/001_create_user_table.py - MINIMAL schema
from alembic import op
import sqlalchemy as sa

def upgrade():
    # GREEN: Minimal table schema to pass test
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password', sa.LargeBinary(), nullable=False),
    )

def downgrade():
    op.drop_table('user')

# Run: alembic upgrade head
# Run: pytest tests/test_user_migration.py::test_user_table_has_email_column
# Result: ✅ PASSED - Test is green!
```

**GREEN Checklist:**
- ✅ All tests PASS (not just one)
- ✅ Implementation is MINIMAL (no extra features)
- ✅ Code is straightforward (not clever)
- ✅ No validation yet (just the core logic)
- ✅ Coverage might be low still (that's okay for now)

---

### 🔄 Phase 3: REFACTOR (Improve Without Breaking Tests)

**What:** Improve code quality, add validation, add documentation
**Why:** Tests guarantee behavior stays the same
**Outcome:** Tests STILL PASS + code is better
**Rule:** If any test fails, rollback refactoring

**Example - Backend (Hermes):**
```python
# app/services.py - REFACTORED
import bcrypt
import logging
from typing import Optional
from app.models import User
from app.exceptions import InvalidEmailError, WeakPasswordError

logger = logging.getLogger(__name__)

class UserService:
    """Service for user account management with secure password handling."""
    
    MIN_PASSWORD_LENGTH = 12
    ALLOWED_DOMAINS = ["example.com", "example.org"]
    
    def create_user(self, email: str, password: str) -> User:
        """
        Create a new user with secure password hashing.
        
        Args:
            email: User email (must be valid format)
            password: User password (min 12 chars, mixed case + numbers)
            
        Returns:
            User instance with hashed password
            
        Raises:
            InvalidEmailError: If email format invalid
            WeakPasswordError: If password doesn't meet requirements
        """
        # Validate email format
        if not self._is_valid_email(email):
            raise InvalidEmailError(f"Invalid email: {email}")
        
        # Validate password strength
        if not self._is_strong_password(password):
            raise WeakPasswordError(
                "Password must be 12+ chars with uppercase, lowercase, numbers"
            )
        
        # Hash password with bcrypt
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
        
        # Create user
        user = User(email=email, password=hashed)
        logger.info(f"Created user: {email}")
        
        return user
    
    @staticmethod
    def _is_valid_email(email: str) -> bool:
        """Validate email format."""
        if "@" not in email or "." not in email:
            return False
        domain = email.split("@")[-1]
        # Can add domain whitelist if needed
        return True
    
    @staticmethod
    def _is_strong_password(password: str) -> bool:
        """Validate password meets minimum strength requirements."""
        if len(password) < UserService.MIN_PASSWORD_LENGTH:
            return False
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        
        return has_upper and has_lower and has_digit

# app/models.py - REFACTORED
import bcrypt
from datetime import datetime
from typing import Optional

class User:
    """User model with secure password handling."""
    
    def __init__(self, email: str, password: bytes):
        """
        Initialize user.
        
        Args:
            email: User email address
            password: Bcrypt hashed password (bytes)
        """
        if not email or not password:
            raise ValueError("Email and password are required")
        
        self.email = email
        self.password = password
        self.created_at = datetime.utcnow()
    
    def verify_password(self, plaintext: str) -> bool:
        """
        Verify plaintext password against bcrypt hash.
        
        Args:
            plaintext: Plain text password to verify
            
        Returns:
            True if password matches, False otherwise
        """
        if not plaintext:
            return False
        
        return bcrypt.checkpw(plaintext.encode(), self.password)
    
    def __repr__(self) -> str:
        return f"User(email={self.email}, created_at={self.created_at})"

# Run tests: pytest tests/test_user_service.py -v
# Result: ✅ ALL TESTS PASS (including new edge case tests)
```

**Example - Frontend (Athena):**
```javascript
// src/components/LoginForm.tsx - REFACTORED
import { useState, useCallback, FC, FormEvent } from "react";
import { validateEmail, validatePassword } from "../utils/validation";
import { LoginCredentials } from "../types";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
    onSubmit: (credentials: LoginCredentials) => void;
    isLoading?: boolean;
    onError?: (error: string) => void;
}

export const LoginForm: FC<LoginFormProps> = ({
    onSubmit,
    isLoading = false,
    onError
}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Validate inputs
        const newErrors: Record<string, string> = {};
        
        if (!validateEmail(email)) {
            newErrors.email = "Invalid email format";
        }
        
        if (!validatePassword(password)) {
            newErrors.password = "Password must be 12+ chars with uppercase, lowercase, numbers";
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        // Submit valid credentials
        setErrors({});
        onSubmit({ email, password });
    }, [email, password, onSubmit]);
    
    return (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    disabled={isLoading}
                    required
                />
                {errors.email && (
                    <span id="email-error" className={styles.error}>
                        {errors.email}
                    </span>
                )}
            </div>
            
            <div className={styles.fieldGroup}>
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    disabled={isLoading}
                    required
                />
                {errors.password && (
                    <span id="password-error" className={styles.error}>
                        {errors.password}
                    </span>
                )}
            </div>
            
            <button
                type="submit"
                disabled={isLoading}
                className={styles.submitButton}
            >
                {isLoading ? "Logging in..." : "Login"}
            </button>
        </form>
    );
};

// Run tests: npx vitest run LoginForm.test.tsx
// Result: ✅ ALL TESTS PASS (including accessibility checks)
```

**Example - Database (Maat):**
```python
# migrations/001_create_user_table.py - REFACTORED
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    """Create user table with proper indexes and constraints."""
    
    # Create table with comprehensive schema
    op.create_table(
        'user',
        sa.Column('id', postgresql.UUID(as_uuid=True), 
                  primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password', sa.LargeBinary(), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), 
                  nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  nullable=False, default=sa.func.now(),
                  onupdate=sa.func.now()),
        sa.UniqueConstraint('email', name='uq_user_email'),
    )
    
    # Add indexes for performance
    op.create_index('ix_user_email', 'user', ['email'])
    op.create_index('ix_user_created_at', 'user', ['created_at'])

def downgrade():
    """Drop user table."""
    op.drop_table('user')

# Run migration: alembic upgrade head
# Run tests: pytest tests/test_user_migration.py -v
# Result: ✅ ALL TESTS PASS (including performance tests)
```

**REFACTOR Checklist:**
- ✅ All tests STILL PASS (zero regressions)
- ✅ Code quality improved (validation, error handling, docs)
- ✅ Logging added where appropriate
- ✅ Type hints added (Python + TypeScript)
- ✅ Edge cases handled
- ✅ Documentation strings complete
- ✅ Performance optimized (indexes for DB, memoization for React)
- ✅ No API changes (backward compatible)

---

## Coverage Requirements

**Minimum Coverage:** >80% (non-negotiable, Temis enforces)
**Target Coverage:** 92-95% (stretch goal)
**Coverage Includes:**
- Line coverage (every line executed?)
- Branch coverage (every if/else taken?)
- Function coverage (every function tested?)

**Measurement (Backend - Hermes):**
```bash
# Generate coverage report
pytest tests/ --cov=app --cov-report=html

# Open report
open htmlcov/index.html

# Require minimum
pytest tests/ --cov=app --cov-fail-under=80
```

**Measurement (Frontend - Athena):**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts{,x}',
        '**/index.ts'
      ],
      lines: 80,        // Minimum 80%
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
});

# Run tests with coverage
npx vitest run --coverage
```

**Measurement (Database - Maat):**
```bash
# Migrations are covered by:
# 1. Upgrade tests (can you apply migration?)
# 2. Downgrade tests (can you revert migration?)
# 3. Schema tests (does schema match expectations?)

pytest tests/test_migrations.py --cov=migrations --cov-fail-under=80
```

---

## Anti-Patterns (What NOT to Do)

❌ **Don't write tests after code:**
```python
# WRONG:
class User:
    def hash_password(self, pwd):
        return pwd  # Oops, forgot to hash!

def test_hash():  # Written after code - misses the bug
    assert User().hash_password("secret") != "secret"
# Test will catch it, but too late - already in code
```

✅ **Do write tests before code:**
```python
# RIGHT:
def test_hash():  # Red - test fails
    assert User().hash_password("secret") != "secret"

class User:
    def hash_password(self, pwd):  # Green - code passes test
        return bcrypt.hash(pwd)  # Forced to hash!
```

---

❌ **Don't test after full implementation:**
```javascript
// WRONG:
function LoginForm() {
    return (
        <form>
            <input />
            <button>Login</button>
        </form>
    );
}

// Test written 2 weeks later - might miss requirements
test("form submits data", () => { ... });
```

✅ **Do test before starting component:**
```javascript
// RIGHT:
test("submits form with email and password", () => {
    // This test drives the component design
    expect(mockSubmit).toHaveBeenCalledWith({
        email, password
    });
});

// Now implement component to pass test
function LoginForm() {
    // Implementation guided by test
}
```

---

❌ **Don't skip edge cases:**
```python
# WRONG:
def test_user_creation():
    user = create_user("alice@example.com", "Password123")
    assert user.email == "alice@example.com"  # Only happy path!

# Missing edge cases:
# - Invalid email format?
# - Weak password?
# - Duplicate email?
# - SQL injection?
```

✅ **Do test happy path + edge cases:**
```python
# RIGHT:
def test_user_creation_happy_path():
    user = create_user("alice@example.com", "StrongPassword123")
    assert user.email == "alice@example.com"

def test_user_creation_invalid_email():
    with pytest.raises(InvalidEmailError):
        create_user("not-an-email", "StrongPassword123")

def test_user_creation_weak_password():
    with pytest.raises(WeakPasswordError):
        create_user("alice@example.com", "weak")

def test_user_creation_duplicate_email():
    create_user("alice@example.com", "StrongPassword123")
    with pytest.raises(DuplicateEmailError):
        create_user("alice@example.com", "DifferentPassword456")

def test_user_creation_sql_injection():
    with pytest.raises(InvalidEmailError):
        create_user("alice@example.com'); DROP TABLE users; --", "Password123")
```

---

## TDD Metrics to Track

| Metric | Target | Minimum | Notes |
|--------|--------|---------|-------|
| Code Coverage | 95% | 80% | Temis enforces minimum |
| Tests per 100 LOC | 15-20 | 10 | Indicates test density |
| Red→Green→Refactor Cycle Time | 5-10 min | - | Per feature |
| Bug Escape Rate | 0-1% | <5% | Bugs caught in QA? |
| Production Bugs | 0 | - | Ideal state (TDD goal) |

---

## Examples by Use Case

### Use Case 1: Complex Algorithm (Backend)

```python
# Test 1: RED - Algorithm not implemented
def test_calculate_shipping_cost():
    calculator = ShippingCalculator()
    cost = calculator.calculate(weight_kg=5, distance_km=100, zone="urban")
    assert cost == 25.50  # Specific expected cost

# Test 1: GREEN - Minimal algorithm
class ShippingCalculator:
    def calculate(self, weight_kg, distance_km, zone):
        return 25.50  # Hardcoded to pass test

# Test 1: REFACTOR - Real algorithm
class ShippingCalculator:
    RATE_PER_KG = 2.0
    RATE_PER_KM = 0.1
    ZONE_MULTIPLIERS = {
        "urban": 1.0,
        "suburban": 1.2,
        "rural": 1.5
    }
    
    def calculate(self, weight_kg, distance_km, zone):
        base_cost = (weight_kg * self.RATE_PER_KG) + (distance_km * self.RATE_PER_KM)
        multiplier = self.ZONE_MULTIPLIERS.get(zone, 1.0)
        return round(base_cost * multiplier, 2)

# Tests: All pass including edge cases
def test_calculate_shipping_cost_urban():
    calc = ShippingCalculator()
    assert calc.calculate(5, 100, "urban") == 25.00

def test_calculate_shipping_cost_rural():
    calc = ShippingCalculator()
    assert calc.calculate(5, 100, "rural") == 37.50

def test_calculate_shipping_cost_invalid_zone():
    calc = ShippingCalculator()
    # Should use default multiplier
    assert calc.calculate(5, 100, "invalid") == 25.00
```

---

### Use Case 2: React Component State

```javascript
// Test 1: RED - Component not implemented
test("increments counter when button clicked", async () => {
    render(<Counter />);
    const button = screen.getByRole("button", { name: /increment/i });
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
    
    await userEvent.click(button);
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
});

// Test 1: GREEN - Minimal component
export function Counter() {
    const [count, setCount] = useState(0);
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
    );
}

// Test 1: REFACTOR - Better component
export function Counter() {
    const [count, setCount] = useState(0);
    
    const increment = useCallback(() => {
        setCount(prev => prev + 1);
    }, []);
    
    return (
        <div>
            <p aria-live="polite">Count: {count}</p>
            <button onClick={increment} aria-label="Increment counter">
                Increment
            </button>
        </div>
    );
}

// Additional tests for edge cases
test("resets counter when reset button clicked", async () => {
    render(<Counter />);
    await userEvent.click(screen.getByRole("button", { name: /increment/i }));
    await userEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByText("Count: 0")).toBeInTheDocument();
});
```

---

## When Temis Blocks Coverage

```
Scenario: Your code has 76% coverage, minimum is 80%

Output from Temis ❌:
"Coverage 76% below minimum 80%
Missing coverage in:
  - app/services.py lines 45-52 (error handling)
  - app/services.py lines 60-65 (edge case)

Action Required:
1. Add tests for error scenarios
2. Add tests for edge cases
3. Re-run coverage"

Response (Hermes):
"Adding tests for missing coverage:"

# New test for error handling
def test_create_user_database_error():
    with patch("app.db.execute") as mock_execute:
        mock_execute.side_effect = DatabaseError("Connection lost")
        with pytest.raises(UserServiceError):
            service.create_user("alice@example.com", "Password123")

# New test for edge case
def test_create_user_email_already_exists():
    service.create_user("alice@example.com", "Password123")
    with pytest.raises(DuplicateEmailError):
        service.create_user("alice@example.com", "DifferentPassword456")

# Re-run coverage: pytest --cov
# Result: 94% coverage ✅
```

---

## Final Checklist for Agents

Before marking phase complete, all agents verify:

```
TDD Phase Completion Checklist:

RED ✅
  [ ] Test written first (before code)
  [ ] Test is failing
  [ ] Test clearly states requirement
  [ ] Test covers happy path + edge cases
  [ ] Error message in RED is clear

GREEN ✅
  [ ] Test now passes
  [ ] Implementation is minimal (no extra features)
  [ ] All related tests pass
  [ ] No broken existing tests

REFACTOR ✅
  [ ] Code quality improved
  [ ] All tests still pass
  [ ] Type hints added (if applicable)
  [ ] Documentation strings complete
  [ ] Error handling robust
  [ ] Edge cases handled
  [ ] Performance acceptable

COVERAGE ✅
  [ ] Coverage >80% minimum
  [ ] Coverage report reviewed
  [ ] Missing coverage identified and addressed
  [ ] Target: 92-95% coverage

READY FOR PRODUCTION ✅
  [ ] Zero test failures
  [ ] Coverage >80%
  [ ] Temis review passed
  [ ] Commit message clear
  [ ] Ready to merge
```

---

**Version:** 1.0  
**Standard:** Enforced by Hermes, Athena, Maat  
**Checkpoints:** Temis enforces coverage >80%  
**Status:** Mandatory for all implementation agents

Remember: RED first, then GREEN, then REFACTOR. Coverage >80%. Always.
