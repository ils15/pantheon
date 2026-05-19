---
name: test-architecture
description: "Advanced testing patterns — E2E with Playwright, load testing with k6/locust, mutation testing, contract testing with Pact, visual regression. Complements tdd-with-agents."
context: fork
globs: ["**/test_*.py", "**/*.test.ts", "**/*.spec.ts", "**/e2e/**", "**/tests/e2e/**"]
alwaysApply: false
---

# Test Architecture — Advanced Testing Patterns

Use this skill for advanced testing beyond unit tests. Covers E2E, load testing, mutation testing, contract testing, and visual regression. Complements `tdd-with-agents` (which covers unit tests).

---

## Relationship with tdd-with-agents

| Skill | Scope | When to Use |
|-------|-------|-------------|
| `tdd-with-agents` | Unit tests (RED→GREEN→REFACTOR) | Every implementation |
| `test-architecture` | E2E, load, mutation, contract, visual | Complex features, production-ready code |

---

## 1. E2E Testing (Playwright)

### Setup

```python
# tests/e2e/conftest.py
import pytest
from playwright.async_api import async_playwright

@pytest.fixture
async def browser():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()

@pytest.fixture
async def page(browser):
    context = await browser.new_context()
    page = await context.new_page()
    yield page
    await context.close()
```

### Test Pattern

```python
# tests/e2e/test_user_flow.py
import pytest

@pytest.mark.asyncio
async def test_user_login_flow(page):
    """E2E: User can log in and see dashboard."""
    await page.goto("http://localhost:8000/login")
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "password123")
    await page.click('button[type="submit"]')
    
    # Verify redirect to dashboard
    await page.wait_for_url("**/dashboard")
    assert await page.title() == "Dashboard"
    
    # Verify user info displayed
    await page.wait_for_selector(".user-name")
    user_name = await page.text_content(".user-name")
    assert "Test User" in user_name
```

### Running E2E Tests

```bash
# Start app first
uvicorn app.main:app --reload &

# Run E2E tests
pytest tests/e2e/ -v --asyncio-mode=auto
```

---

## 2. Load Testing (k6)

### k6 Script

```javascript
// tests/load/api_load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 50 },   // Spike to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const res = http.get('http://localhost:8000/api/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Running Load Tests

```bash
# Install k6
# See https://k6.io/docs/getting-started/installation/

# Run load test
k6 run tests/load/api_load_test.js

# Run with cloud reporting
k6 cloud tests/load/api_load_test.js
```

### Locust Alternative (Python)

```python
# tests/load/locustfile.py
from locust import HttpUser, task, between

class APIUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def get_products(self):
        self.client.get("/api/products?page=1&limit=20")
    
    @task(1)
    def create_product(self):
        self.client.post("/api/products", json={
            "name": "Test Product",
            "price": 9.99
        })
```

```bash
# Run Locust
locust -f tests/load/locustfile.py --host=http://localhost:8000
```

---

## 3. Mutation Testing

Mutation testing verifies that your tests actually test something by mutating the code and checking if tests catch the mutations.

### Setup (Python)

```bash
pip install mutmut
```

### Running

```bash
# Run mutation testing
mutmut run --paths-to-mutate=src/services/

# Show mutations that survived (tests didn't catch)
mutmut results
```

### Interpreting Results

```
mutmut results

- Killed mutants: 85 (tests caught the mutation)
- Survived mutants: 15 (tests didn't catch the mutation)
- Total mutants: 100

Survived mutants indicate gaps in test coverage.
Review each survived mutant and add tests.
```

---

## 4. Contract Testing (Pact)

Contract testing ensures that API consumers and providers agree on the contract.

### Consumer Test (Python)

```python
# tests/contract/test_review_consumer.py
import pytest
from pact import Consumer, Provider

pact = Consumer('ReviewFrontend').has_pact_with(Provider('ReviewAPI'))

def test_get_reviews_contract():
    expected = {
        'reviews': each_like({
            'id': like(1),
            'product_id': like(100),
            'rating': like(5),
            'comment': like('Great product!')
        })
    }
    
    (pact.given("reviews exist")
     .upon_receiving("a request for reviews")
     .with_request("GET", "/api/reviews", query={"product_id": "100"})
     .will_respond_with(200, body=expected))
    
    with pact:
        result = requests.get(f"{pact.uri}/api/reviews", params={"product_id": "100"})
    
    assert result.json()['reviews'][0]['rating'] == 5
```

### Running Contract Tests

```bash
# Generate pact file
pytest tests/contract/ -v

# Verify pact file against provider
pact-verifier --provider-base-url=http://localhost:8000 \
  --pact-url=pacts/ReviewFrontend-ReviewAPI.json
```

---

## 5. Visual Regression Testing

### Setup (Playwright)

```python
# tests/visual/test_review_card.py
import pytest

@pytest.mark.asyncio
async def test_review_card_visual(page):
    """Visual regression: ReviewCard renders correctly."""
    await page.goto("http://localhost:3000/reviews")
    
    # Take screenshot and compare with baseline
    await page.screenshot(
        path="tests/visual/baseline/review-card.png",
        full_page=True
    )
    
    # Compare with baseline (using pixelmatch or similar)
    # This is typically done in CI with a visual diff tool
```

### Running Visual Tests

```bash
# Run visual tests
pytest tests/visual/ -v

# In CI, use Percy, Chromatic, or Playwright's built-in comparison
npx playwright test --update-snapshots  # Update baselines
```

---

## Test Strategy Matrix

| Test Type | When to Use | Frequency | Cost |
|-----------|-------------|-----------|------|
| Unit | Every feature | Every commit | Low |
| E2E | Critical user flows | Every commit | Medium |
| Load | Before production deploy | Per release | High |
| Mutation | Periodically | Weekly/Monthly | Medium |
| Contract | API changes | Every API change | Medium |
| Visual | UI changes | Every UI change | Low |

---

## Integration with Hermes and Themis

**Hermes** uses this skill during implementation to write advanced tests.
**Themis** uses this skill during review to validate test quality beyond unit coverage.
