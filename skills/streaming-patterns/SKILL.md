---
name: streaming-patterns
description: Implement server-sent events, WebSocket connections, LLM token streaming, real-time broadcasting, chunked transfer encoding, and streaming error handling in FastAPI. Covers Redis Pub/Sub, backpressure management, throughput monitoring, and frontend SSE/WebSocket clients.
context: fork
globs: ["**/*.py", "**/stream/**"]
alwaysApply: false
---

# Streaming & Real-Time Patterns Skill

## When to Use

Use this skill when:
- Building real-time updates via Server-Sent Events or WebSockets
- Streaming LLM token responses from OpenAI/Anthropic/LangChain
- Broadcasting events to multiple connected clients
- Implementing chunked transfer for large file or report generation
- Handling partial stream failures with graceful degradation
- Monitoring streaming throughput, latency, and dropped connections
- Building cancelable long-running operations with progress reporting

## Key Patterns

### 1. Server-Sent Events (SSE) with FastAPI

```python
# streaming/sse_handler.py
import json
import asyncio
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/events", tags=["streaming"])

def format_sse(event: str, data: object, event_id: Optional[str] = None) -> str:
    """Format data as SSE protocol message"""
    lines = []
    if event_id:
        lines.append(f"id: {event_id}")
    lines.append(f"event: {event}")
    lines.append(f"data: {json.dumps(data)}")
    return "\n".join(lines) + "\n\n"

async def event_generator(request: Request) -> AsyncGenerator[bytes, None]:
    """Generate SSE events with connection health checks"""
    client_id = id(request)
    event_id = 0
    try:
        while True:
            if await request.is_disconnected():
                break
            event_id += 1
            payload = {
                "timestamp": asyncio.get_event_loop().time(),
                "message": f"heartbeat-{event_id}",
                "client": client_id,
            }
            yield format_sse("heartbeat", payload, str(event_id)).encode()
            await asyncio.sleep(5)
    except asyncio.CancelledError:
        pass

@router.get("/stream")
async def sse_endpoint(request: Request):
    """Subscribe to server-sent events"""
    return StreamingResponse(
        event_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

**Frontend SSE Client (TypeScript):**

```typescript
// clients/sse-client.ts
export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  connect(url: string, onEvent: (event: string, data: unknown) => void): void {
    this.disconnect();
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.reconnectDelay = 1000;
    };

    this.eventSource.addEventListener("heartbeat", (event: MessageEvent) => {
      onEvent("heartbeat", JSON.parse(event.data));
    });

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      setTimeout(() => this.connect(url, onEvent), this.reconnectDelay);
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    };
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
```

### 2. WebSocket Integration

```python
# streaming/websocket_handler.py
import json
import asyncio
import logging
from typing import Set, Dict
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, Set[WebSocket]] = {}
        self._pulse_interval = 30

    async def connect(self, websocket: WebSocket, room: str = "global"):
        await websocket.accept()
        if room not in self.active:
            self.active[room] = set()
        self.active[room].add(websocket)

    def disconnect(self, websocket: WebSocket, room: str = "global"):
        self.active.get(room, set()).discard(websocket)
        if room in self.active and not self.active[room]:
            del self.active[room]

    async def broadcast(self, message: dict, room: str = "global"):
        dead = set()
        for ws in self.active.get(room, set()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.disconnect(ws, room)

    async def send_personal(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    async def heartbeat(self, websocket: WebSocket):
        """Send periodic ping to detect stale connections"""
        try:
            while True:
                await asyncio.sleep(self._pulse_interval)
                await websocket.send_json({"type": "ping", "timestamp": datetime.utcnow().isoformat()})
        except Exception:
            pass

manager = ConnectionManager()

@router.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await manager.connect(websocket, room)
    heartbeat_task = asyncio.create_task(manager.heartbeat(websocket))
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            response = {
                "type": message.get("type", "message"),
                "data": message.get("data", {}),
                "room": room,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await manager.broadcast(response, room)
    except WebSocketDisconnect:
        logger.info(f"Client disconnected from room: {room}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        heartbeat_task.cancel()
        manager.disconnect(websocket, room)
```

**Frontend WebSocket Client (TypeScript):**

```typescript
// clients/websocket-client.ts
export class WSClient {
  private ws: WebSocket | null = null;
  private room: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(room: string) {
    this.room = room;
  }

  connect(
    baseUrl: string,
    onMessage: (data: unknown) => void,
    onStatus?: (connected: boolean) => void
  ): void {
    const url = `${baseUrl}/ws/${this.room}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      onStatus?.(true);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "ping") {
        this.ws?.send(JSON.stringify({ type: "pong" }));
        return;
      }
      onMessage(data);
    };

    this.ws.onclose = () => {
      onStatus?.(false);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(baseUrl, onMessage, onStatus), delay);
      }
    };

    this.ws.onerror = () => this.ws?.close();
  }

  send(type: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  disconnect(): void {
    this.maxReconnectAttempts = 0;
    this.ws?.close();
    this.ws = null;
  }
}
```

### 3. LLM Token Streaming

```python
# streaming/llm_streaming.py
import json
import asyncio
from typing import AsyncGenerator, Optional, Callable
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/llm", tags=["llm-streaming"])

class StreamRequest(BaseModel):
    prompt: str
    model: str = "gpt-4"
    max_tokens: int = 1024
    temperature: float = 0.7

class TokenEvent(BaseModel):
    token: str
    index: int
    finish_reason: Optional[str] = None

async def openai_stream(prompt: str) -> AsyncGenerator[str, None]:
    """Stream tokens from OpenAI API"""
    import openai
    client = openai.AsyncOpenAI()
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
        max_tokens=1024,
    )
    async for chunk in response:
        delta = chunk.choices[0].delta if chunk.choices else None
        if delta and delta.content:
            yield delta.content

async def anthropic_stream(prompt: str) -> AsyncGenerator[str, None]:
    """Stream tokens from Anthropic"""
    import anthropic
    client = anthropic.AsyncAnthropic()
    async with client.messages.stream(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text

class CompositeLLMStreamer:
    """Aggregate multiple LLM providers with fallback"""

    def __init__(self):
        self.providers = {
            "openai": openai_stream,
            "anthropic": anthropic_stream,
        }

    async def stream_tokens(
        self,
        provider: str,
        prompt: str,
    ) -> AsyncGenerator[str, None]:
        stream_fn = self.providers.get(provider)
        if not stream_fn:
            raise ValueError(f"Unknown provider: {provider}")
        async for token in stream_fn(prompt):
            yield token

    async def stream_with_fallback(
        self,
        providers: list[str],
        prompt: str,
    ) -> AsyncGenerator[str, None]:
        """Try providers in order, fallback on failure"""
        for provider in providers:
            try:
                async for token in self.stream_tokens(provider, prompt):
                    yield token
                return
            except Exception as e:
                yield f"\n[Fallback from {provider}: {e}]\n"
                continue
        yield "\n[All providers failed]"

@router.post("/stream")
async def llm_stream_endpoint(request: StreamRequest):
    """Stream LLM response as SSE events"""
    streamer = CompositeLLMStreamer()

    async def generate():
        index = 0
        async for token in streamer.stream_tokens("openai", request.prompt):
            event = TokenEvent(token=token, index=index)
            yield f"data: {json.dumps(event.dict())}\n\n"
            index += 1
        yield f"data: {json.dumps(TokenEvent(token="", index=index, finish_reason="stop").dict())}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/stream/langchain")
async def langchain_stream_endpoint(request: StreamRequest):
    """Stream using LangChain's async streaming"""
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage

    llm = ChatOpenAI(
        model=request.model,
        temperature=request.temperature,
        streaming=True,
    )

    async def generate():
        async for chunk in llm.astream([HumanMessage(content=request.prompt)]):
            if chunk.content:
                yield f"data: {json.dumps({'token': chunk.content})}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 4. Streaming Response Aggregation

```python
# streaming/aggregator.py
import asyncio
import json
from typing import AsyncGenerator, Any, Optional
from collections import deque
from dataclasses import dataclass, field

@dataclass
class StreamBuffer:
    buffer: deque = field(default_factory=deque)
    flush_interval: float = 0.5
    max_batch_size: int = 20
    _flush_event: asyncio.Event = field(default_factory=asyncio.Event)
    _done: bool = False

    async def append(self, item: Any):
        self.buffer.append(item)
        if len(self.buffer) >= self.max_batch_size:
            self._flush_event.set()

    async def flush(self) -> list[Any]:
        items = list(self.buffer)
        self.buffer.clear()
        self._flush_event.clear()
        return items

    async def aggregated_stream(self) -> AsyncGenerator[list[Any], None]:
        """Yield batches of items at configured intervals"""
        while not self._done or self.buffer:
            try:
                await asyncio.wait_for(
                    self._flush_event.wait(),
                    timeout=self.flush_interval,
                )
            except asyncio.TimeoutError:
                pass
            if self.buffer:
                yield await self.flush()

    def mark_done(self):
        self._done = True
        self._flush_event.set()

class BackpressureController:
    """Control stream flow to prevent overwhelming downstream"""

    def __init__(self, max_queue: int = 100):
        self.semaphore = asyncio.Semaphore(max_queue)

    async def push(self, item: Any):
        async with self.semaphore:
            return item

    async def throttled_generator(
        self,
        source: AsyncGenerator[Any, None],
        max_items_per_second: int = 10,
    ) -> AsyncGenerator[Any, None]:
        """Rate-limit a source generator"""
        interval = 1.0 / max_items_per_second
        async for item in source:
            yield item
            await asyncio.sleep(interval)

@router.post("/aggregate")
async def aggregated_stream_endpoint():
    """Endpoint demonstrating aggregated streaming"""
    buffer = StreamBuffer(flush_interval=1.0, max_batch_size=5)

    async def produce():
        for i in range(100):
            await buffer.append({"index": i, "value": i * i})
            if i % 10 == 0:
                await asyncio.sleep(0.1)
        buffer.mark_done()

    async def generate():
        asyncio.create_task(produce())
        async for batch in buffer.aggregated_stream():
            yield f"data: {json.dumps({'batch': batch, 'count': len(batch)})}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 5. Real-Time Updates (Broadcasting with Redis Pub/Sub)

```python
# streaming/broadcaster.py
import json
import asyncio
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import aioredis

router = APIRouter(prefix="/api/realtime", tags=["realtime"])

class RedisPubSubBroadcaster:
    """Broadcast messages across multiple server instances via Redis"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis: Optional[aioredis.Redis] = None
        self.pubsub: Optional[aioredis.client.PubSub] = None

    async def connect(self):
        self.redis = await aioredis.from_url(self.redis_url)
        self.pubsub = self.redis.pubsub()

    async def publish(self, channel: str, message: dict):
        if self.redis:
            await self.redis.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str) -> AsyncGenerator[dict, None]:
        if not self.pubsub:
            await self.connect()
        await self.pubsub.subscribe(channel)
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    yield json.loads(message["data"])
        finally:
            await self.pubsub.unsubscribe(channel)

    async def close(self):
        if self.pubsub:
            await self.pubsub.close()
        if self.redis:
            await self.redis.close()

broadcaster = RedisPubSubBroadcaster()

class RoomManager:
    """Room-based subscription management"""
    def __init__(self):
        self.rooms: dict[str, set[asyncio.Queue]] = {}

    def join(self, room: str) -> asyncio.Queue:
        if room not in self.rooms:
            self.rooms[room] = set()
        queue: asyncio.Queue = asyncio.Queue()
        self.rooms[room].add(queue)
        return queue

    def leave(self, room: str, queue: asyncio.Queue):
        self.rooms.get(room, set()).discard(queue)
        if room in self.rooms and not self.rooms[room]:
            del self.rooms[room]

    async def broadcast(self, room: str, message: dict):
        for queue in self.rooms.get(room, set()):
            await queue.put(message)

    async def room_stream(self, room: str, timeout: float = 30.0) -> AsyncGenerator[dict, None]:
        """Stream messages for a specific room"""
        queue = self.join(room)
        try:
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=timeout)
                    yield message
                except asyncio.TimeoutError:
                    yield {"type": "keepalive", "timestamp": asyncio.get_event_loop().time()}
        finally:
            self.leave(room, queue)

room_manager = RoomManager()

@router.post("/publish/{room}")
async def publish_to_room(room: str, message: dict):
    """Publish a message to all subscribers in a room"""
    await broadcaster.publish(f"room:{room}", message)
    await room_manager.broadcast(room, message)
    return {"published": True, "room": room}

@router.get("/subscribe/{room}")
async def subscribe_room(request: Request, room: str):
    """Subscribe to real-time updates for a room"""
    async def generate():
        async for message in room_manager.room_stream(room):
            if await request.is_disconnected():
                break
            yield f"data: {json.dumps(message)}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 6. Chunked Transfer Encoding for Large Responses

```python
# streaming/chunked_transfer.py
import asyncio
import json
import uuid
from typing import AsyncGenerator, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/chunked", tags=["chunked-transfer"])

class JobProgress(BaseModel):
    job_id: str
    status: str
    progress: float
    message: str
    result: Optional[dict] = None

# In-memory job store (use Redis in production)
job_store: dict[str, JobProgress] = {}

async def report_progress(job_id: str, queue: asyncio.Queue):
    """Background progress reporter"""
    for i in range(1, 101):
        await asyncio.sleep(0.2)
        progress = JobProgress(
            job_id=job_id,
            status="running",
            progress=i / 100,
            message=f"Processing chunk {i}/100",
        )
        job_store[job_id] = progress
        await queue.put(progress.dict())
        if i == 100:
            progress.status = "completed"
            progress.result = {"summary": f"Processed {i} chunks", "job_id": job_id}
            job_store[job_id] = progress
            await queue.put(progress.dict())

    await queue.put(None)  # sentinel

@router.post("/large-report")
async def generate_large_report(background_tasks: BackgroundTasks):
    """Generate large report with chunked streaming and progress"""
    job_id = str(uuid.uuid4())
    queue: asyncio.Queue = asyncio.Queue()

    background_tasks.add_task(report_progress, job_id, queue)

    async def generate():
        while True:
            item = await queue.get()
            if item is None:
                break
            yield json.dumps(item) + "\n"
            await asyncio.sleep(0.1)

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={
            "X-Job-Id": job_id,
            "Content-Disposition": "attachment; filename=report.jsonl",
        },
    )

@router.get("/progress/{job_id}")
async def get_job_progress(job_id: str):
    """Poll job progress"""
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# Cancelable operation

class CancelableStream:
    def __init__(self):
        self._cancel_events: dict[str, asyncio.Event] = {}

    def create_cancel_event(self, stream_id: str) -> asyncio.Event:
        event = asyncio.Event()
        self._cancel_events[stream_id] = event
        return event

    def cancel(self, stream_id: str):
        if stream_id in self._cancel_events:
            self._cancel_events[stream_id].set()

    async def is_cancelled(self, stream_id: str) -> bool:
        event = self._cancel_events.get(stream_id)
        return event is not None and event.is_set()

cancelable = CancelableStream()

@router.post("/stream-cancelable")
async def cancelable_stream():
    """Stream that can be canceled via API"""
    stream_id = str(uuid.uuid4())
    cancel_event = cancelable.create_cancel_event(stream_id)

    async def generate():
        for i in range(1000):
            if cancel_event.is_set():
                yield json.dumps({"status": "cancelled", "progress": i / 1000}) + "\n"
                return
            yield json.dumps({"chunk": i, "data": "x" * 4096}) + "\n"
            await asyncio.sleep(0.01)

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={"X-Stream-Id": stream_id},
    )

@router.post("/cancel/{stream_id}")
async def cancel_stream(stream_id: str):
    """Cancel a running stream"""
    cancelable.cancel(stream_id)
    return {"cancelled": True, "stream_id": stream_id}
```

### 7. Error Handling in Streams

```python
# streaming/error_handling.py
import asyncio
import json
import logging
from typing import AsyncGenerator, Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stream-errors", tags=["stream-error-handling"])

class ResilientStreamProcessor:
    """Handle partial failures within a stream without breaking the connection"""

    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries

    async def process_with_retry(self, item: dict) -> dict:
        """Process a single item with retry logic"""
        last_error = None
        for attempt in range(self.max_retries):
            try:
                return await self._process_item(item)
            except Exception as e:
                last_error = e
                await asyncio.sleep(0.5 * (attempt + 1))
                logger.warning(f"Retry {attempt + 1}/{self.max_retries} for item {item.get('id')}: {e}")
        raise last_error

    async def _process_item(self, item: dict) -> dict:
        """Simulate item processing - replace with real logic"""
        if item.get("fail"):
            raise ValueError(f"Simulated failure for item {item.get('id')}")
        return {"id": item["id"], "result": item["value"] * 2}

    async def resilient_stream(
        self,
        items: list[dict],
    ) -> AsyncGenerator[dict, None]:
        """Stream with per-item error handling and graceful degradation"""
        results = []
        errors = []

        async def process_one(item: dict):
            try:
                result = await self.process_with_retry(item)
                results.append(result)
            except Exception as e:
                errors.append({"item": item, "error": str(e)})

        tasks = [process_one(item) for item in items]
        await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            yield {"type": "success", "data": r}
            await asyncio.sleep(0.05)

        if errors:
            yield {
                "type": "error_summary",
                "total_errors": len(errors),
                "errors": [
                    {"id": e["item"].get("id"), "error": e["error"]}
                    for e in errors[:10]
                ],
            }

    async def graceful_stream(
        self,
        source: AsyncGenerator[dict, None],
    ) -> AsyncGenerator[dict, None]:
        """Gracefully handle generator failures - skip bad items, continue stream"""
        async for item in source:
            try:
                result = await self._process_item(item)
                yield {"type": "success", "data": result}
            except Exception as e:
                yield {
                    "type": "skip",
                    "item_id": item.get("id"),
                    "reason": str(e),
                }
                continue

class DegradationPolicy:
    """Define degradation behavior for different error types"""

    def __init__(self):
        self.policies = {
            "timeout": {"action": "retry", "max_retries": 3, "backoff": 1.0},
            "rate_limit": {"action": "backoff", "wait": 5.0, "max_wait": 60.0},
            "auth": {"action": "fail_fast", "message": "Authentication required"},
            "not_found": {"action": "skip", "default": None},
        }

    async def handle(
        self,
        error: Exception,
        context: dict,
    ) -> Optional[dict]:
        """Apply degradation policy based on error type"""
        error_type = context.get("error_type", "unknown")
        policy = self.policies.get(error_type, {"action": "skip"})

        if policy["action"] == "skip":
            return None
        elif policy["action"] == "fail_fast":
            raise error
        elif policy["action"] == "backoff":
            wait = min(policy.get("wait", 1.0), policy.get("max_wait", 60.0))
            await asyncio.sleep(wait)
            return {"retry": True}
        return None

degradation = DegradationPolicy()

@router.post("/resilient")
async def resilient_stream_endpoint():
    """Stream with per-item error handling and retry"""

    async def generate():
        processor = ResilientStreamProcessor()
        items = [
            {"id": i, "value": i, "fail": i % 5 == 0}
            for i in range(20)
        ]
        async for event in processor.resilient_stream(items):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/graceful")
async def graceful_stream_endpoint():
    """Skip errors and continue streaming"""

    async def source():
        for i in range(20):
            yield {"id": i, "value": i, "fail": i == 7}
            await asyncio.sleep(0.1)

    async def generate():
        processor = ResilientStreamProcessor()
        async for event in processor.graceful_stream(source()):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 8. Monitoring Streaming

```python
# streaming/monitoring.py
import time
import json
import asyncio
import logging
from typing import AsyncGenerator, Optional
from collections import defaultdict
from dataclasses import dataclass, field
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/monitor", tags=["stream-monitoring"])

@dataclass
class StreamMetrics:
    active_connections: int = 0
    total_connections: int = 0
    total_bytes_sent: int = 0
    total_messages_sent: int = 0
    dropped_connections: int = 0
    reconnect_attempts: int = 0
    latency_p50: float = 0.0
    latency_p99: float = 0.0
    _latencies: list[float] = field(default_factory=list)
    _start_time: float = field(default_factory=time.time)
    throughput_bytes_per_sec: float = 0.0

    def record_message(self, bytes_count: int, latency: float):
        self.total_messages_sent += 1
        self.total_bytes_sent += bytes_count
        self._latencies.append(latency)
        elapsed = time.time() - self._start_time
        self.throughput_bytes_per_sec = self.total_bytes_sent / elapsed if elapsed > 0 else 0

    def record_disconnect(self):
        self.dropped_connections += 1
        self.active_connections = max(0, self.active_connections - 1)

    def record_connect(self):
        self.active_connections += 1
        self.total_connections += 1

    def compute_latency_percentiles(self):
        if not self._latencies:
            return
        sorted_lat = sorted(self._latencies)
        n = len(sorted_lat)
        self.latency_p50 = sorted_lat[n // 2]
        self.latency_p99 = sorted_lat[int(n * 0.99)]

stream_metrics = StreamMetrics()

class MonitoredStream:
    """Wrapper that tracks metrics for any async generator"""

    def __init__(self, source: AsyncGenerator[bytes, None], stream_id: str = "default"):
        self.source = source
        self.stream_id = stream_id
        self._start = 0.0

    async def monitored_generator(self) -> AsyncGenerator[bytes, None]:
        stream_metrics.record_connect()
        self._start = time.time()
        try:
            async for chunk in self.source:
                latency = time.time() - self._start
                stream_metrics.record_message(len(chunk), latency)
                yield chunk
        except Exception as e:
            stream_metrics.record_disconnect()
            logger.error(f"Stream {self.stream_id} failed: {e}")
            raise
        finally:
            stream_metrics.record_disconnect()

class ConnectionTracker:
    """Track individual connection health"""

    def __init__(self):
        self.connections: dict[str, dict] = {}
        self._lock = asyncio.Lock()

    async def register(self, connection_id: str):
        async with self._lock:
            self.connections[connection_id] = {
                "connected_at": time.time(),
                "last_activity": time.time(),
                "bytes_received": 0,
                "bytes_sent": 0,
                "messages_received": 0,
                "messages_sent": 0,
            }

    async def update_activity(self, connection_id: str, sent: int = 0, received: int = 0):
        async with self._lock:
            conn = self.connections.get(connection_id)
            if conn:
                conn["last_activity"] = time.time()
                conn["bytes_sent"] += sent
                conn["bytes_received"] += received
                conn["messages_sent"] += 1 if sent else 0
                conn["messages_received"] += 1 if received else 0

    async def unregister(self, connection_id: str):
        async with self._lock:
            self.connections.pop(connection_id, None)

    async def detect_stale(self, idle_timeout: float = 60.0) -> list[str]:
        now = time.time()
        stale = []
        async with self._lock:
            for cid, info in self.connections.items():
                if now - info["last_activity"] > idle_timeout:
                    stale.append(cid)
        return stale

connection_tracker = ConnectionTracker()

@router.get("/stream")
async def monitored_stream(request: Request):
    """Stream with throughput and latency tracking"""

    async def generate():
        connection_id = f"conn-{id(request)}"
        await connection_tracker.register(connection_id)
        try:
            for i in range(100):
                if await request.is_disconnected():
                    break
                payload = json.dumps({"index": i, "data": "x" * 100, "timestamp": time.time()})
                yield f"data: {payload}\n\n"
                await connection_tracker.update_activity(connection_id, sent=len(payload))
                await asyncio.sleep(0.1)
        finally:
            await connection_tracker.unregister(connection_id)

    monitored = MonitoredStream(generate(), stream_id=f"stream-{id(request)}")
    return StreamingResponse(
        monitored.monitored_generator(),
        media_type="text/event-stream",
    )

@router.get("/metrics")
async def get_stream_metrics():
    """Get current streaming metrics"""
    stream_metrics.compute_latency_percentiles()
    stale = await connection_tracker.detect_stale()
    return {
        "active_connections": stream_metrics.active_connections,
        "total_connections": stream_metrics.total_connections,
        "total_bytes_sent": stream_metrics.total_bytes_sent,
        "total_messages_sent": stream_metrics.total_messages_sent,
        "dropped_connections": stream_metrics.dropped_connections,
        "reconnect_attempts": stream_metrics.reconnect_attempts,
        "latency_p50_ms": stream_metrics.latency_p50 * 1000,
        "latency_p99_ms": stream_metrics.latency_p99 * 1000,
        "throughput_kbps": stream_metrics.throughput_bytes_per_sec / 1024,
        "stale_connections": len(stale),
        "uptime_seconds": time.time() - stream_metrics._start_time,
    }

@router.get("/connections")
async def list_connections():
    """List all tracked connections"""
    return {
        cid: {
            "connected_seconds": time.time() - info["connected_at"],
            "idle_seconds": time.time() - info["last_activity"],
            "bytes_sent": info["bytes_sent"],
            "bytes_received": info["bytes_received"],
            "messages_sent": info["messages_sent"],
            "messages_received": info["messages_received"],
        }
        for cid, info in connection_tracker.connections.items()
    }
```

## Best Practices

✅ **Always handle client disconnection** - Check `request.is_disconnected()` or catch `WebSocketDisconnect`  
✅ **Implement heartbeat/ping** to detect stale connections and clean up resources  
✅ **Use exponential backoff** for client reconnection to avoid server thundering herd  
✅ **Buffer with backpressure** - Use `asyncio.Queue` with max size to prevent OOM  
✅ **Format SSE correctly** - `data:` lines must end with `\n\n`, use `event:` for named events  
✅ **Set `X-Accel-Buffering: no`** when behind nginx to disable proxy buffering  
✅ **Track stream metrics** - Monitor throughput, latency, and drop rates in production  
✅ **Graceful degradation** - Skip bad items, don't kill the entire stream  
✅ **Cancelable operations** - Provide API endpoints to terminate long-running streams  
✅ **Use Redis Pub/Sub** for cross-instance broadcasting in horizontally scaled deployments  
✅ **NdJSON for chunked downloads** - One JSON object per line, easy to parse client-side  
✅ **Set explicit timeouts** on both server and client to prevent zombie connections  

## Related Files in Skill

- [sse-handler.py](./sse-handler.py) - Server-Sent Events implementation template
- [websocket-handler.py](./websocket-handler.py) - WebSocket connection manager template
- [llm-streaming.py](./llm-streaming.py) - LLM token streaming with provider fallback
- [aggregator.py](./aggregator.py) - Stream buffering and backpressure controller
- [broadcaster.py](./broadcaster.py) - Redis Pub/Sub room-based broadcaster
- [chunked-transfer.py](./chunked-transfer.py) - Chunked transfer with progress and cancellation
- [error-handling.py](./error-handling.py) - Resilient stream processing with retry
- [monitoring.py](./monitoring.py) - Stream metrics and connection tracking

## References

- FastAPI StreamingResponse: https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse
- FastAPI WebSockets: https://fastapi.tiangolo.com/advanced/websockets/
- Server-Sent Events Spec: https://html.spec.whatwg.org/multipage/server-sent-events.html
- OpenAI Streaming: https://platform.openai.com/docs/api-reference/streaming
- Anthropic Streaming: https://docs.anthropic.com/en/api/messages-streaming
- LangChain Streaming: https://python.langchain.com/docs/expression_language/streaming
- Redis Pub/Sub: https://redis.io/docs/interact/pubsub/
- aioredis: https://aioredis.readthedocs.io/
