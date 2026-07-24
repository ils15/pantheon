---
name: mcp-server-development
description: "Build MCP servers with Python FastMCP and TypeScript SDK — tools, resources, prompts, and transport configuration."
context: fork
globs: []
alwaysApply: false
---

# MCP Server Development

Build MCP (Model Context Protocol) servers with Python FastMCP and TypeScript SDK. Covers tools, resources, prompts, transport, and security.

---

## Python FastMCP

### Basic Server
```python
from fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
def calculate(expression: str) -> float:
    """Evaluate a mathematical expression."""
    return eval(expression)

@mcp.resource("config://settings")
def get_settings() -> str:
    """Return server configuration."""
    return '{"version": "1.0"}'

if __name__ == "__main__":
    mcp.run()
```

---

## TypeScript SDK

### Basic Server
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.tool("calculate", { expression: z.string() }, async ({ expression }) => ({
  content: [{ type: "text", text: String(eval(expression)) }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Tool Registration

```python
@mcp.tool()
def search_docs(query: str, limit: int = 5) -> list[dict]:
    """Search documentation for relevant information."""
    return vector_store.search(query, top_k=limit)
```

### Input Validation
```python
from pydantic import BaseModel, Field

class SearchParams(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=5, ge=1, le=20)
```

---

## Resource Exposure

```python
@mcp.resource("docs://{path}")
def read_doc(path: str) -> str:
    """Read a documentation file."""
    return Path(f"docs/{path}.md").read_text()
```

---

## Prompt Templates

```python
@mcp.prompt()
def analyze_code(file_path: str, issue: str) -> str:
    """Generate a prompt for code analysis."""
    return f"Analyze {file_path} for: {issue}"
```

---

## Transport Configuration

| Transport | Use Case | Setup |
|-----------|----------|-------|
| **stdio** | Local CLI tools | Default |
| **HTTP** | Web servers | `mcp.run(transport="http")` |
| **SSE** | Real-time streaming | `mcp.run(transport="sse")` |

```python
# HTTP transport
mcp.run(transport="http", host="0.0.0.0", port=8000)

# SSE transport
mcp.run(transport="sse", host="0.0.0.0", port=8000)
```

---

## Error Handling

```python
from fastmcp import ToolError

@mcp.tool()
def risky_operation(data: str) -> str:
    try:
        result = process(data)
        return result
    except ValueError as e:
        raise ToolError(f"Invalid input: {e}")
    except Exception as e:
        raise ToolError(f"Internal error: {e}")
```

---

## Security Best Practices

- **Validate all inputs** with Pydantic/Zod
- **Never expose secrets** in resources
- **Rate limit** tool calls if public
- **Sandbox** file system access
- **Log all tool calls** for audit
- **Use HTTPS** for HTTP/SSE transports

---

## Testing

```python
def test_calculate_tool():
    result = mcp.tools["calculate"].execute(expression="2 + 2")
    assert result == 4.0

def test_invalid_input():
    with pytest.raises(ToolError):
        mcp.tools["calculate"].execute(expression="invalid")
```
