---
name: mcp-server-development
description: Build MCP (Model Context Protocol) servers with Python FastMCP and TypeScript SDK. Covers tool registration, resource exposure, prompt templates, transport configuration (stdio/HTTP/sse), input validation, error handling, and security best practices for production-grade MCP server implementations.
context: fork
globs: ["**/mcp/**", "**/*.mcp.*"]
alwaysApply: false
---

# MCP Server Development Skill

## When to Use

Use this skill when:
- Building new MCP servers (Python or TypeScript)
- Adding tools, resources, or prompt templates to an existing server
- Configuring transports (stdio, HTTP with SSE, streaming)
- Integrating MCP servers with LLM clients (VS Code Copilot, Claude Desktop, custom hosts)
- Implementing authentication, rate limiting, or security controls
- Testing and debugging MCP servers with the inspector
- Migrating between transport protocols

## MCP Architecture Overview

The Model Context Protocol (MCP) is an open standard that lets LLM applications expose capabilities to AI agents through a standardized server interface. An MCP server provides three primitives:

| Primitive | Purpose | Example |
|-----------|---------|---------|
| **Tools** | Actions the LLM can invoke (read/write) | `create_file`, `search_web`, `query_db` |
| **Resources** | Data the LLM can read (exposable URI scheme) | `file:///logs`, `db:///users`, `api:///weather` |
| **Prompts** | Pre-written templates the LLM can use | `summarize(text)`, `analyze_logs(level)` |
| **Transports** | Communication channel between client and server | stdio, HTTP+SSE, WebSocket |

Clients (like VS Code Copilot, Claude Desktop, or custom hosts) discover a server's capabilities at startup via an `initialize` handshake, then call tools, read resources, or retrieve prompts dynamically.

## Python MCP Server with FastMCP

FastMCP (`mcp[cli]`) is the recommended Python SDK. Install with:

```bash
pip install "mcp[cli]"
```

### Stdio Transport (Default)

```python
from mcp.server.fastmcp import FastMCP
import ast

# Create server — stdio transport by default
mcp = FastMCP("my-server")

@mcp.tool()
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression."""
    try:
        result = ast.literal_eval(expression)
        return str(result)
    except Exception as e:
        return f"Error: {e}"

@mcp.resource("config://app")
def get_config() -> str:
    """Return application configuration as a resource."""
    return '{"theme": "dark", "locale": "en-US"}'

@mcp.prompt()
def greet(name: str) -> str:
    """Create a greeting prompt."""
    return f"Please greet {name} warmly and professionally."

if __name__ == "__main__":
    mcp.run()  # runs on stdio by default
```

### HTTP Transport with SSE

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

# Same tool/resource/prompt decorators...

if __name__ == "__main__":
    # Run on HTTP with Server-Sent Events
    mcp.run(transport="sse")
```

Run with Uvicorn for production:

```bash
# Install uvicorn
pip install uvicorn

# FastMCP SSE servers are ASGI apps
mcp run server.py --transport sse --port 8000
```

### Tool Registration with Input Validation

```python
from typing import Annotated
from pydantic import Field
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("file-manager")

@mcp.tool(
    name="write_file",
    description="Write content to a file at the specified path."
)
def write_file(
    path: Annotated[str, Field(description="Absolute path to the file")],
    content: Annotated[str, Field(description="Content to write")],
    mode: Annotated[str, Field(description="Write mode: 'w' or 'a'")] = "w",
) -> str:
    allowed = {"w", "a"}
    if mode not in allowed:
        return f"Error: mode must be one of {allowed}"
    if ".." in path:
        return "Error: path traversal detected"
    try:
        with open(path, mode) as f:
            f.write(content)
        return f"Wrote {len(content)} bytes to {path}"
    except Exception as e:
        return f"Error: {e}"
```

### Resource Exposure Patterns

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("docs-server")

# Static resource — fixed URI, fixed content
@mcp.resource("docs://welcome")
def welcome() -> str:
    return "# Welcome\nThis is the documentation server."

# Dynamic resource — URI parameter maps to function argument
@mcp.resource("docs://{topic}")
def get_topic(topic: str) -> str:
    topics = {
        "mcp": "Model Context Protocol overview...",
        "tools": "Tools allow the LLM to perform actions...",
        "resources": "Resources expose data to the LLM...",
    }
    return topics.get(topic, f"Topic '{topic}' not found.")

# Resource with template subscription hint
@mcp.resource("logs://app/{level}")
def get_logs(level: str) -> str:
    """Returns recent logs at the given level (info, warn, error)."""
    # In production, read from a log file or database
    return f"[{level.upper()}] Server started at 2025-01-01T00:00:00Z"
```

### Prompt Templates

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("prompt-server")

@mcp.prompt(
    name="summarize",
    description="Summarize a given text at the specified detail level."
)
def summarize(text: str, detail: str = "brief") -> str:
    levels = {"brief": "in 2-3 sentences", "detailed": "with key points and examples"}
    level_desc = levels.get(detail, levels["brief"])
    return f"""Please summarize the following text {level_desc}:

{text}

Summary:"""

@mcp.prompt()
def analyze_error(log_entry: str) -> str:
    """Analyze a log entry and suggest root cause."""
    return f"""You are a senior SRE. Analyze this log entry:

{log_entry}

Identify: (1) error type, (2) probable root cause, (3) recommended fix."""
```

## TypeScript/Node.js MCP Server

Install the SDK:

```bash
npm install @modelcontextprotocol/sdk
```

### Stdio Transport

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

// Tool discovery and execution
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "calculate",
      description: "Evaluate a mathematical expression",
      inputSchema: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Math expression to evaluate",
          },
        },
        required: ["expression"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "calculate") {
    const { expression } = request.params.arguments as { expression: string };
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return { content: [{ type: "text", text: String(result) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "config://app",
      name: "App Configuration",
      description: "Current application configuration",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri === "config://app") {
    return {
      contents: [
        { uri, mimeType: "application/json", text: '{"theme":"dark"}' },
      ],
    };
  }
  throw new Error(`Unknown resource: ${uri}`);
});

// Prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "greet",
      description: "Generate a professional greeting",
      arguments: [
        {
          name: "name",
          description: "Person to greet",
          required: true,
        },
      ],
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "greet") {
    const name = request.params.arguments?.name as string;
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please greet ${name} warmly and professionally.`,
          },
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${request.params.name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### HTTP Transport with SSE

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define tools (same as stdio example)…

const app = express();
let transport: SSEServerTransport | null = null;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  }
});

app.listen(3000, () => {
  console.log("MCP server running on http://localhost:3000/sse");
});
```

## Tool Definition Patterns

### Input Schema Best Practices

```python
from typing import Annotated, Optional
from pydantic import Field
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("data-tools")

@mcp.tool()
def query_users(
    department: Annotated[
        Optional[str],
        Field(description="Filter by department name (case-insensitive)"),
    ] = None,
    min_age: Annotated[
        Optional[int],
        Field(description="Minimum age filter", ge=0, le=150),
    ] = None,
    limit: Annotated[
        int,
        Field(description="Maximum results to return", ge=1, le=100),
    ] = 20,
) -> str:
    """Query users with optional filters. Returns JSON array of matching users."""
    # Implementation…
    return '[]'
```

### Error Handling

```python
import traceback
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("robust-server")

@mcp.tool()
def safe_operation(path: str) -> str:
    """Perform an operation with comprehensive error handling."""
    try:
        # Attempt the operation
        if not path:
            return "Error: path must not be empty"
        if not path.startswith("/data/"):
            return "Error: path must be under /data/"
        # … actual logic …
        return "Success"
    except PermissionError:
        return "Error: permission denied — check file permissions"
    except FileNotFoundError:
        return "Error: file not found at specified path"
    except Exception as e:
        # Log full traceback server-side, return sanitized message
        traceback.print_exc()
        return f"Error: unexpected error — {type(e).__name__}"
```

### Progress Reporting

```python
import time
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("progress-server")

@mcp.tool()
def process_items(count: int = 5) -> str:
    """Process multiple items with simulated progress.
    
    Note: Progress reporting works with clients that support the
    'progress' notification mechanism (e.g., Claude Desktop).
    """
    results = []
    for i in range(count):
        time.sleep(0.5)  # Simulate work
        results.append(f"Item {i + 1}: processed")
    return "\n".join(results)
```

## Resource Patterns

### Resource Templates with URI Parameters

```python
from typing import Annotated
from pydantic import Field
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("data-warehouse")

# Template: db://{table}/{record_id}
@mcp.resource("db://{table}/{record_id}")
def get_record(
    table: Annotated[str, Field(description="Table name (users, orders, products)")],
    record_id: Annotated[int, Field(description="Primary key value")],
) -> str:
    """Fetch a single record from a database table."""
    allowed_tables = {"users", "orders", "products"}
    if table not in allowed_tables:
        return f"Error: table must be one of {allowed_tables}"
    # In production, query your database
    return f'{{"table": "{table}", "id": {record_id}, "data": "…"}}'

# List multiple resources dynamically
@mcp.resource("search://{query}")
def search(query: str) -> str:
    """Search across indexed content."""
    # Implementation…
    return f'{{"query": "{query}", "results": []}}'
```

### Resource Subscriptions (when content changes)

```python
# FastMCP does not yet expose a direct subscription API in the decorator.
# For clients that support resource subscriptions (like Claude Desktop),
# ensure your resource URIs are stable and documented:
@mcp.resource("live://status")
def server_status() -> str:
    """Server health and uptime. Clients may poll this URI periodically."""
    import datetime
    return f'{{"status": "healthy", "uptime": "24h", "checked_at": "{datetime.datetime.utcnow().isoformat()}"}}'
```

## Prompt Templates

### Argument Interpolation

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("writing-assistant")

@mcp.prompt(
    name="blog_post",
    description="Generate a blog post outline given a topic and target audience."
)
def blog_post(topic: str, audience: str = "general") -> str:
    return f"""You are a professional blog writer. Write a comprehensive blog post about:

**Topic:** {topic}
**Audience:** {audience}

Include:
1. An engaging title and hook
2. 3-5 main sections with subheadings
3. Key takeaways or action items
4. A compelling conclusion

Format in markdown."""

@mcp.prompt()
def code_review(diff: str, language: str = "python") -> str:
    """Review a code diff and provide feedback."""
    return f"""Review the following {language} code diff:

```diff
{diff}
```

Check for:
1. Security vulnerabilities (injection, XSS, auth bypass)
2. Performance issues (N+1 queries, memory leaks)
3. Style violations (naming, formatting)
4. Error handling gaps

Rate: ✅ APPROVED | ⚠️ MINOR_ISSUES | ❌ NEEDS_REVISION"""
```

### Multi-Turn Prompt Patterns

```python
@mcp.prompt()
def interview(candidate_name: str, role: str) -> str:
    """Simulate a structured technical interview."""
    return f"""You are interviewing {candidate_name} for the role of {role}.

First round: Ask 3 technical questions one at a time. Wait for each answer before proceeding.
After all answers, provide a summary assessment with:
- Strengths (2-3 points)
- Areas to probe further (1-2 points)
- Recommended next step: ADVANCE / HOLD / REJECT

Begin with an introduction, then ask your first question."""
```

## Transport Configuration

### Stdio Transport

Best for local tooling, VS Code Copilot Agents, and CLI integrations.

```python
# FastMCP default — no configuration needed
mcp.run()  # stdio

# Or explicit:
mcp.run(transport="stdio")
```

```bash
# Client launches the server as a subprocess
node my-server.js
# Communication happens over stdin/stdout as JSON-RPC messages
```

**Use when:** Tightly coupled agent-server (same process tree), CLI tools, local-only deployments.

### HTTP Transport with SSE

Best for remote servers, multi-client access, and production deployments.

```python
# FastMCP SSE server
mcp.run(transport="sse")
# Serves at http://localhost:8000/sse by default with FastMCP
```

```typescript
// TypeScript — SSE transport with Express
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new Server(
  { name: "remote-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const app = express();
let transport: SSEServerTransport;

app.get("/sse", (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  server.connect(transport);
});

app.post("/messages", (req, res) => {
  transport.handlePostMessage(req, res);
});

app.listen(3000);
```

**Use when:** Remote agents, shared service, cloud-hosted, multi-client.

### Security Considerations by Transport

| Concern | Stdio | HTTP/SSE |
|---------|-------|----------|
| **Network exposure** | None (local process) | Requires firewall, TLS |
| **Authentication** | Inherits parent process identity | Must implement (API key, JWT, OAuth) |
| **Rate limiting** | Not needed (1:1) | Required (per-client throttling) |
| **Secrets** | Environment variables | Environment variables or secret store |

### Authentication Middleware (HTTP)

```python
import os
from mcp.server.fastmcp import FastMCP
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

mcp = FastMCP("secure-server")

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth = request.headers.get("Authorization", "")
        expected = f"Bearer {os.environ['MCP_API_KEY']}"
        if not auth.startswith("Bearer ") or auth != expected:
            from starlette.responses import JSONResponse
            return JSONResponse({"error": "Unauthorized"}, status_code=401)
        return await call_next(request)

# Attach middleware when running with ASGI
# In production, add: mcp.app.add_middleware(AuthMiddleware)
```

## MCP Client Integration

### How Agents Discover and Call MCP Tools

Clients connect to MCP servers during initialization, enumerate tools, then call them dynamically:

```python
# Example: Python client connecting to an MCP server
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    # Launch and connect to MCP server as subprocess
    server_params = StdioServerParameters(
        command="python",
        args=["-m", "my_server"],
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize handshake — discovers capabilities
            await session.initialize()
            
            # List all available tools
            tools = await session.list_tools()
            for tool in tools.tools:
                print(f"  {tool.name}: {tool.description}")
            
            # Call a tool
            result = await session.call_tool(
                "calculate",
                arguments={"expression": "2 + 2"},
            )
            print(result.content[0].text)  # "4"

asyncio.run(main())
```

### Error Handling on the Client Side

```python
from mcp import ClientSession
from mcp.types import ErrorData

async def safe_call(session: ClientSession, tool: str, args: dict):
    try:
        result = await session.call_tool(tool, arguments=args)
        if result.isError:
            text = result.content[0].text if result.content else "Unknown error"
            print(f"Tool returned error: {text}")
            return None
        return result
    except Exception as e:
        print(f"Failed to call tool '{tool}': {e}")
        return None
```

### MCP Client in TypeScript

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "python",
  args: ["-m", "my_server"],
});

const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools.tools.map((t) => t.name));

// Call tool
const result = await client.callTool({
  name: "calculate",
  arguments: { expression: "2 + 2" },
});
console.log(result.content[0].text);

await client.close();
```

## Testing MCP Servers

### Unit Tests (Python)

```python
import pytest
from my_server import mcp

@pytest.mark.anyio
async def test_calculate_tool():
    result = await mcp.call_tool("calculate", {"expression": "2 + 2"})
    assert result[0].text == "4"

@pytest.mark.anyio
async def test_calculate_invalid():
    result = await mcp.call_tool("calculate", {"expression": "1/0"})
    assert "Error" in result[0].text

@pytest.mark.anyio
async def test_resource():
    result = await mcp.read_resource("config://app")
    assert '"dark"' in result[0].text

@pytest.mark.anyio
async def test_prompt():
    result = await mcp.get_prompt("greet", {"name": "Alice"})
    assert "Alice" in result[0].text
```

### Integration Tests (Full Client-Server)

```python
import pytest
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

@pytest.mark.anyio
async def test_end_to_end():
    server_params = StdioServerParameters(
        command="python",
        args=["-m", "my_server"],
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            tools = await session.list_tools()
            assert any(t.name == "calculate" for t in tools.tools)
            
            result = await session.call_tool(
                "calculate",
                arguments={"expression": "2 * 3"},
            )
            assert result.content[0].text == "6"
```

### Using the MCP Inspector

The MCP Inspector provides a web UI for testing and debugging servers:

```bash
# Start the inspector with your server
npx @modelcontextprotocol/inspector python my_server.py

# Or for a running HTTP server
npx @modelcontextprotocol/inspector http://localhost:8000/sse
```

The inspector shows:
- Tools, resources, and prompts discovered during initialization
- Raw JSON-RPC messages exchanged
- Tool call inputs and outputs with timing
- Resource content preview
- Error responses and full stack traces

### Testing Tips

```
✅ Testing checklist:
1. Unit test each tool with valid and invalid inputs
2. Test resource URIs (static and template) return correct MIME types
3. Test prompt arguments interpolate correctly
4. Test error paths: missing args, bad types, runtime errors
5. Test transport-level behavior: reconnection, timeout
6. Run full integration test with a real client session
7. Use inspector to validate JSON-RPC protocol compliance
```

## Security Best Practices

### Input Validation

```python
import re
from pathlib import Path

def sanitize_path(user_path: str, allowed_root: str = "/data") -> str:
    """Prevent path traversal attacks."""
    if ".." in user_path or user_path.startswith("/"):
        raise ValueError("Invalid path")
    full = Path(allowed_root) / user_path
    if not str(full).startswith(allowed_root):
        raise ValueError("Path traversal detected")
    return str(full)

def sanitize_sql_identifier(name: str) -> str:
    """Allow only safe SQL identifiers."""
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name):
        raise ValueError(f"Invalid identifier: {name}")
    return name
```

### Rate Limiting

```python
import time
from collections import defaultdict
from functools import wraps

rate_limits: dict[str, list[float]] = defaultdict(list)

def rate_limit(max_calls: int = 60, window: int = 60):
    """Decorator to rate-limit tool calls per session or API key."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Use caller identity if available, else IP
            caller = kwargs.get("caller_id", "default")
            now = time.time()
            window_start = now - window
            
            # Prune old entries
            rate_limits[caller] = [
                t for t in rate_limits[caller] if t > window_start
            ]
            
            if len(rate_limits[caller]) >= max_calls:
                return f"Error: rate limit exceeded — {max_calls} calls per {window}s"
            
            rate_limits[caller].append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Usage
@mcp.tool()
@rate_limit(max_calls=30, window=60)
def expensive_operation(data: str) -> str:
    """Rate-limited to 30 calls per minute."""
    return f"Processed: {data[:100]}"
```

### Tool Permissions (Principle of Least Privilege)

```python
import os

ALLOWED_COMMANDS = {"ls", "cat", "head"}
ALLOWED_PATHS = {"/data", "/tmp/output"}
BLOCKED_PATTERNS = {"rm", "sudo", ">"}

@mcp.tool()
def run_safe_command(command: str, path: str) -> str:
    """Run a pre-approved command in a restricted directory."""
    # 1. Validate command whitelist
    parts = command.strip().split()
    if parts[0] not in ALLOWED_COMMANDS:
        return f"Error: command '{parts[0]}' not allowed. Allowed: {ALLOWED_COMMANDS}"
    
    # 2. Validate path
    resolved = os.path.realpath(os.path.join("/data", path))
    if not any(resolved.startswith(p) for p in ALLOWED_PATHS):
        return f"Error: path outside allowed directories"
    
    # 3. Check for blocked patterns
    for blocked in BLOCKED_PATTERNS:
        if blocked in command:
            return f"Error: command contains blocked pattern '{blocked}'"
    
    # Execute…
    return f"Would run: {command} on {resolved}"
```

### Secret Handling

```python
import os

# ✅ Good: Read from environment
API_KEY = os.environ.get("MCP_API_KEY")
if not API_KEY:
    raise RuntimeError("MCP_API_KEY environment variable required")

# ❌ Bad: Hardcoded secrets
API_KEY = "sk-abc123..."  # NEVER do this

# ✅ Good: Use secret manager in production
# import boto3
# secrets = boto3.client("secretsmanager")
# API_KEY = secrets.get_secret_value(SecretId="mcp/api-key")["SecretString"]

@mcp.tool()
def get_redacted_config() -> str:
    """Return config with secrets masked."""
    config = {
        "host": "db.example.com",
        "port": 5432,
        "username": "app_user",
        "password": "****",  # Never expose real secrets
    }
    import json
    return json.dumps(config)
```

### Security Checklist

```
✅ MCP Server Security Checklist:
1. Input validation on ALL tool arguments (type, range, allowed values)
2. Path traversal prevention (sanitize and resolve paths server-side)
3. Command injection prevention (whitelist not blacklist)
4. No hardcoded secrets (env vars or secret store)
5. Rate limiting on expensive or authenticated tools
6. TLS for all HTTP/sse transports
7. Authentication (API key / JWT) for remote servers
8. Minimum permissions (server should not run as root)
9. No eval() or exec() with user input
10. Log sanitization (no secrets in logs or error messages)
```

## Output Format

```markdown
## MCP Server Analysis Report

### Server Overview
- Name: my-server (v1.0.0)
- Transport: sse (http://localhost:8000/sse)
- Language: Python (FastMCP)
- Tools: 4 (calculate, write_file, query_users, process_items)
- Resources: 3 (static: 1, template: 2)
- Prompts: 2 (greet, summarize)

### Tool Review
- ✅ Input validation present on all tools
- ✅ Error handling returns descriptive messages
- ✅ calculate uses ast.literal_eval() (safe)
- ❌ write_file has no rate limiting

### Security Findings
- ✅ Path traversal prevention on write_file
- ✅ No hardcoded secrets
- ⚠️ No authentication on HTTP transport
- ❌ No rate limiting on expensive tools

### Test Coverage
- ✅ Unit tests: 4/4 passing
- ✅ Integration: 1/1 passing
- ✅ Inspector validates JSON-RPC protocol
```

## Example Usage

```
@mcp Create a Python MCP server with file system tools and resource exposure
@mcp Add authentication and rate limiting to my HTTP MCP server
@mcp Create a TypeScript MCP server that wraps a REST API as tools
@mcp Review my MCP server for security vulnerabilities
@mcp Help me test my MCP server with the inspector tool
@mcp Migrate my stdio-based server to HTTP/sse transport
```

## References

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Python SDK (FastMCP)](https://github.com/modelcontextprotocol/python-sdk)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [MCP Servers Directory](https://github.com/modelcontextprotocol/servers)
