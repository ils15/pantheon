# Playwright Test Templates

```python
# tests/conftest.py - Copy this for new projects
import pytest
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

BASE_URL = "http://localhost:3000"

@pytest.fixture(scope="session")
async def browser() -> Browser:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()

@pytest.fixture
async def page(browser: Browser) -> Page:
    context = await browser.new_context()
    page = await context.new_page()
    yield page
    await context.close()

# Test template for new test files
class TestFeatureName:
    
    @pytest.mark.asyncio
    async def test_happy_path(self, page: Page):
        """Test successful scenario"""
        await page.goto(BASE_URL)
        
        # Action
        await page.fill('input[name="search"]', "test query")
        await page.click('button[type="submit"]')
        
        # Wait and assert
        await page.wait_for_load_state("networkidle")
        
        assert "results" in await page.content()
    
    @pytest.mark.asyncio
    async def test_error_handling(self, page: Page):
        """Test error scenario"""
        await page.goto(BASE_URL)
        
        # Invalid input
        await page.fill('input[name="search"]', "")
        await page.click('button[type="submit"]')
        
        # Check error message
        error = await page.locator('.error-message').text_content()
        assert "required" in error.lower()
    
    @pytest.mark.asyncio
    async def test_mobile_responsive(self, browser: Browser):
        """Test on mobile viewport"""
        context = await browser.new_context(
            viewport={"width": 375, "height": 667}
        )
        page = await context.new_page()
        
        await page.goto(BASE_URL)
        
        # Verify responsive elements
        await page.locator('nav').wait_for()
        
        await context.close()
```

## Quick Start Commands

```bash
# Run all tests
pytest tests/e2e/

# Run with verbose output
pytest -v tests/e2e/

# Run in headed mode (see browser)
pytest --headed tests/e2e/

# Run single test
pytest tests/e2e/test_file.py::TestClass::test_method

# Generate report
pytest --html=report.html tests/e2e/
```

## Common Assertions

```python
# Visibility
await expect(page.locator('.element')).to_be_visible()

# Text content
await expect(page.locator('h1')).to_contain_text("Welcome")

# Attribute values
await expect(page.locator('input')).to_have_value("expected")

# Count
assert await page.locator('.item').count() == 5
```
