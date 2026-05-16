---
name: multi-model-routing
description: "Multi-model routing patterns for AI gateways - provider abstraction, cost-based and quality-based routing, fallback chains, retry logic, rate limiting, cost tracking, and observability across OpenAI, Anthropic, Google, AWS Bedrock, and local model providers"
context: fork
globs: ["**/providers/**", "**/models/**"]
alwaysApply: false
---

# Multi-Model Routing & AI Gateway Skill

## When to Use
- You need to route LLM requests across multiple providers (OpenAI, Anthropic, Google, AWS Bedrock, local)
- You want cost-optimized routing (cheaper model first, escalate on failure or complexity)
- You need fallback chains for high-availability LLM serving
- You're building an AI gateway abstraction layer for multi-tenant or multi-model deployments

## Routing Strategies

### Cost-Based Routing
```python
from enum import Enum
from dataclasses import dataclass
from typing import Optional


class ModelTier(Enum):
    CHEAP = "cheap"
    STANDARD = "standard"
    PREMIUM = "premium"


@dataclass
class ModelRoute:
    provider: str
    model: str
    tier: ModelTier
    cost_per_1k_input: float
    cost_per_1k_output: float
    priority: int


ROUTES: list[ModelRoute] = [
    ModelRoute("openai", "gpt-4o-mini", ModelTier.CHEAP, 0.00015, 0.0006, 3),
    ModelRoute("anthropic", "claude-3-haiku", ModelTier.CHEAP, 0.00025, 0.00125, 2),
    ModelRoute("openai", "gpt-4o", ModelTier.STANDARD, 0.0025, 0.01, 1),
    ModelRoute("anthropic", "claude-3-opus", ModelTier.PREMIUM, 0.015, 0.075, 0),
]


def select_cheapest(tokens: int, task_complexity: float = 0.0) -> ModelRoute:
    eligible = [
        r for r in ROUTES
        if (r.tier == ModelTier.CHEAP and task_complexity < 0.5)
        or (r.tier == ModelTier.STANDARD and task_complexity < 0.8)
        or r.tier == ModelTier.PREMIUM
    ]
    input_cost = tokens * min(r.cost_per_1k_input for r in eligible) / 1000
    return min(eligible, key=lambda r: r.cost_per_1k_input + r.cost_per_1k_output)
```

### Quality-Based Routing
```python
@dataclass
class QualityScore:
    model: str
    provider: str
    accuracy: float
    latency_p50: float
    hallucination_rate: float


def route_by_quality(task_type: str, input_text: str) -> ModelRoute:
    quality_scores = {
        "code_generation": QualityScore("claude-3-opus", "anthropic", 0.94, 2.1, 0.02),
        "summarization": QualityScore("gpt-4o-mini", "openai", 0.89, 0.8, 0.03),
        "reasoning": QualityScore("gemini-2.5-pro", "google", 0.92, 1.5, 0.015),
    }
    best = quality_scores.get(task_type)
    if not best:
        return ROUTES[0]
    return ModelRoute(best.provider, best.model, ModelTier.STANDARD, 0, 0, 0)
```

### Semantic Routing by Task Type
```python
class TaskClassifier:
    def __init__(self):
        self.rules = {
            "code": {"models": ["claude-3-opus", "gpt-4o"], "tier": ModelTier.PREMIUM},
            "creative_writing": {"models": ["claude-3-haiku", "gpt-4o-mini"], "tier": ModelTier.CHEAP},
            "math_reasoning": {"models": ["gemini-2.5-pro", "claude-3-opus"], "tier": ModelTier.PREMIUM},
            "classification": {"models": ["gpt-4o-mini"], "tier": ModelTier.CHEAP},
        }

    def classify(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if any(kw in prompt_lower for kw in ("def ", "class ", "function", "import")):
            return "code"
        if any(kw in prompt_lower for kw in ("calculate", "solve", "prove", "therefore")):
            return "math_reasoning"
        if any(kw in prompt_lower for kw in ("story", "poem", "creative", "write a")):
            return "creative_writing"
        return "classification"

    def route(self, prompt: str) -> ModelRoute:
        task = self.classify(prompt)
        config = self.rules.get(task, self.rules["classification"])
        return ModelRoute("openai", config["models"][0], config["tier"], 0, 0, 0)
```

### Fallback Chains
```python
from typing import AsyncIterator


class FallbackChain:
    def __init__(self, routes: list[ModelRoute]):
        self.routes = sorted(routes, key=lambda r: r.priority, reverse=True)

    async def execute(self, prompt: str, **kwargs) -> tuple[str, ModelRoute]:
        last_error: Optional[Exception] = None
        for route in self.routes:
            try:
                provider = get_provider(route.provider)
                result = await provider.complete(route.model, prompt, **kwargs)
                return result, route
            except (RateLimitError, TimeoutError, ServiceUnavailableError) as e:
                last_error = e
                continue
        raise AllProvidersExhausted from last_error
```

## Provider Abstraction Layer

```python
from abc import ABC, abstractmethod
import json
from dataclasses import asdict


class LLMProvider(ABC):
    @abstractmethod
    async def complete(
        self, model: str, prompt: str, **kwargs
    ) -> str:
        ...

    @abstractmethod
    async def complete_stream(
        self, model: str, prompt: str, **kwargs
    ) -> AsyncIterator[str]:
        ...

    @abstractmethod
    async def count_tokens(self, model: str, text: str) -> int:
        ...


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, org_id: Optional[str] = None):
        import openai
        self.client = openai.AsyncOpenAI(api_key=api_key, organization=org_id)

    async def complete(self, model: str, prompt: str, **kwargs) -> str:
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            **kwargs,
        )
        return resp.choices[0].message.content

    async def complete_stream(self, model: str, prompt: str, **kwargs) -> AsyncIterator[str]:
        stream = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            **kwargs,
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def count_tokens(self, model: str, text: str) -> int:
        import tiktoken
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str):
        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(self, model: str, prompt: str, **kwargs) -> str:
        resp = await self.client.messages.create(
            model=model,
            max_tokens=kwargs.pop("max_tokens", 1024),
            messages=[{"role": "user", "content": prompt}],
            **kwargs,
        )
        return resp.content[0].text

    async def complete_stream(self, model: str, prompt: str, **kwargs) -> AsyncIterator[str]:
        async with self.client.messages.stream(
            model=model,
            max_tokens=kwargs.pop("max_tokens", 1024),
            messages=[{"role": "user", "content": prompt}],
            **kwargs,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def count_tokens(self, model: str, text: str) -> int:
        resp = await self.client.count_tokens(text)
        return resp.input_tokens


class GoogleProvider(LLMProvider):
    def __init__(self, api_key: str):
        from google import genai
        self.client = genai.Client(api_key=api_key)

    async def complete(self, model: str, prompt: str, **kwargs) -> str:
        resp = self.client.models.generate_content(model=model, contents=prompt)
        return resp.text

    async def complete_stream(self, model: str, prompt: str, **kwargs) -> AsyncIterator[str]:
        for chunk in self.client.models.generate_content_stream(model=model, contents=prompt):
            yield chunk.text

    async def count_tokens(self, model: str, text: str) -> int:
        resp = self.client.models.count_tokens(model=model, contents=text)
        return resp.total_tokens
```

## AWS Bedrock Integration

```python
import boto3
import json
from botocore.config import Config


class BedrockProvider(LLMProvider):
    def __init__(
        self,
        region: str = "us-east-1",
        cross_region: bool = False,
        provisioned_throughput_arn: Optional[str] = None,
    ):
        config = Config(
            retries={"max_attempts": 3, "mode": "adaptive"},
            connect_timeout=30,
            read_timeout=120,
        )
        if cross_region:
            self.runtime = boto3.client(
                "bedrock-runtime",
                region_name="us-east-1",
                config=config,
            )
            self.cross_region = True
        else:
            self.runtime = boto3.client(
                "bedrock-runtime",
                region_name=region,
                config=config,
            )
            self.cross_region = False
        self.provisioned_throughput_arn = provisioned_throughput_arn

    async def complete(self, model: str, prompt: str, **kwargs) -> str:
        model_id = self._resolve_model_id(model)
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": kwargs.get("max_tokens", 1024),
            "messages": [{"role": "user", "content": prompt}],
        }
        inference_config = {}
        if self.provisioned_throughput_arn:
            inference_config["provisionedThroughput"] = self.provisioned_throughput_arn

        resp = self.runtime.invoke_model(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body),
            **({"inferenceConfig": inference_config} if inference_config else {}),
        )
        result = json.loads(resp["body"].read())
        return result["content"][0]["text"]

    async def complete_stream(self, model: str, prompt: str, **kwargs) -> AsyncIterator[str]:
        model_id = self._resolve_model_id(model)
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": kwargs.get("max_tokens", 1024),
            "messages": [{"role": "user", "content": prompt}],
        }
        resp = self.runtime.invoke_model_with_response_stream(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body),
        )
        for event in resp["body"]:
            chunk = json.loads(event["chunk"]["bytes"])
            if chunk.get("type") == "content_block_delta":
                yield chunk["delta"]["text"]

    async def count_tokens(self, model: str, text: str) -> int:
        resp = self.runtime.invoke_model(
            modelId=self._resolve_model_id(model),
            contentType="application/json",
            accept="application/json",
            body=json.dumps({"anthropic_version": "bedrock-2023-05-31", "messages": [{"role": "user", "content": text}]}),
        )
        result = json.loads(resp["body"].read())
        return result.get("usage", {}).get("input_tokens", 0)

    def _resolve_model_id(self, model: str) -> str:
        mapping = {
            "claude-3-opus": "anthropic.claude-3-opus-20240229-v1:0",
            "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
            "claude-3-haiku": "anthropic.claude-3-haiku-20240307-v1:0",
            "claude-3.5-sonnet": "anthropic.claude-3-5-sonnet-20240620-v1:0",
            "llama-3-70b": "meta.llama3-70b-instruct-v1:0",
            "llama-3.1-405b": "meta.llama3-1-405b-instruct-v1:0",
        }
        return mapping.get(model, model)

    def list_available_models(self) -> list[dict]:
        client = boto3.client("bedrock", region_name=self.runtime.meta.region_name)
        models = client.list_foundation_models()
        return [
            {
                "id": m["modelId"],
                "provider": m["providerName"],
                "streaming": m.get("responseStreamingSupported", False),
            }
            for m in models["modelSummaries"]
        ]

    def get_provisioned_throughput(self) -> list[dict]:
        client = boto3.client("bedrock", region_name=self.runtime.meta.region_name)
        return client.list_provisioned_model_throughputs()["provisionedModelSummaries"]
```

## Local Model Serving

### Ollama Configuration
```python
class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434"):
        import httpx
        self.client = httpx.AsyncClient(base_url=base_url, timeout=300)

    async def complete(self, model: str, prompt: str, **kwargs) -> str:
        resp = await self.client.post(
            "/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": kwargs.get("temperature", 0.7),
                    "num_predict": kwargs.get("max_tokens", 1024),
                },
            },
        )
        return resp.json()["response"]

    async def complete_stream(self, model: str, prompt: str, **kwargs) -> AsyncIterator[str]:
        async with self.client.stream(
            "POST",
            "/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": kwargs.get("temperature", 0.7),
                    "num_predict": kwargs.get("max_tokens", 1024),
                },
            },
        ) as resp:
            async for line in resp.aiter_lines():
                if line:
                    data = json.loads(line)
                    if data.get("response"):
                        yield data["response"]

    async def count_tokens(self, model: str, text: str) -> int:
        resp = await self.client.post("/api/tokenize", json={"model": model, "input": text})
        return len(resp.json().get("tokens", []))

    async def list_models(self) -> list[dict]:
        resp = await self.client.get("/api/tags")
        return [
            {"name": m["name"], "size": m["size"], "modified": m["modified_at"]}
            for m in resp.json().get("models", [])
        ]
```

### vLLM Configuration
```python
class VLLMProvider(LLMProvider):
    def __init__(self, base_url: str = "http://localhost:8000"):
        import httpx
        self.client = httpx.AsyncClient(base_url=base_url, timeout=300)

    async def complete(self, model: str, prompt: str, **kwargs) -> str:
        resp = await self.client.post(
            "/v1/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens", 1024),
                "stream": False,
            },
        )
        return resp.json()["choices"][0]["message"]["content"]

    async def complete_stream(self, model: str, prompt: str, **kwargs) -> AsyncIterator[str]:
        async with self.client.stream(
            "POST",
            "/v1/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens", 1024),
                "stream": True,
            },
        ) as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data: ") and line != "data: [DONE]":
                    chunk = json.loads(line[6:])
                    delta = chunk["choices"][0].get("delta", {})
                    if delta.get("content"):
                        yield delta["content"]

    async def count_tokens(self, model: str, text: str) -> int:
        resp = await self.client.post(
            "/v1/tokenize",
            json={"model": model, "input": text},
        )
        return len(resp.json().get("tokens", []))
```

```json
# docker-compose.yml for local serving
{
  "version": "3.8",
  "services": {
    "vllm": {
      "image": "vllm/vllm-openai:latest",
      "command": [
        "--model", "mistralai/Mistral-7B-Instruct-v0.3",
        "--tensor-parallel-size", "1",
        "--max-model-len", "8192",
        "--gpu-memory-utilization", "0.90"
      ],
      "ports": ["8000:8000"],
      "volumes": ["~/.cache/huggingface:/root/.cache/huggingface"],
      "deploy": {
        "resources": {
          "reservations": { "devices": [{ "capabilities": ["gpu"] }] }
        }
      }
    },
    "ollama": {
      "image": "ollama/ollama:latest",
      "ports": ["11434:11434"],
      "volumes": ["ollama_data:/root/.ollama"],
      "deploy": {
        "resources": {
          "reservations": { "devices": [{ "capabilities": ["gpu"] }] }
        }
      }
    }
  },
  "volumes": { "ollama_data": {} }
}
```

## Fallback & Retry Logic

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
import asyncio
import time


class RateLimitError(Exception):
    pass


class ServiceUnavailableError(Exception):
    pass


class AllProvidersExhausted(Exception):
    pass


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=60),
    retry=retry_if_exception_type((RateLimitError, TimeoutError)),
    before_sleep=lambda retry_state: logger.warning(
        "Retrying after %s (attempt %d/5)",
        retry_state.next_action.sleep, retry_state.attempt_number,
    ),
)
async def call_with_retry(provider: LLMProvider, model: str, prompt: str) -> str:
    return await provider.complete(model, prompt)


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures: dict[str, int] = {}
        self.last_failure: dict[str, float] = {}
        self.state: dict[str, str] = {}  # "closed" | "open" | "half-open"

    def call(self, provider_name: str, func, *args, **kwargs):
        state = self.state.get(provider_name, "closed")

        if state == "open":
            elapsed = time.monotonic() - self.last_failure.get(provider_name, 0)
            if elapsed >= self.recovery_timeout:
                self.state[provider_name] = "half-open"
            else:
                raise ServiceUnavailableError(f"Circuit breaker open for {provider_name}")

        try:
            result = func(*args, **kwargs)
            self.failures[provider_name] = 0
            self.state[provider_name] = "closed"
            return result
        except Exception as e:
            self.failures[provider_name] = self.failures.get(provider_name, 0) + 1
            self.last_failure[provider_name] = time.monotonic()
            if self.failures[provider_name] >= self.failure_threshold:
                self.state[provider_name] = "open"
                logger.error("Circuit breaker tripped for %s", provider_name)
            raise e


class ProviderFailover:
    def __init__(self, providers: dict[str, LLMProvider], order: list[str]):
        self.providers = providers
        self.order = order

    async def execute_with_failover(
        self, model: str, prompt: str, **kwargs
    ) -> tuple[str, str]:
        for provider_name in self.order:
            try:
                provider = self.providers[provider_name]
                result = await provider.complete(model, prompt, **kwargs)
                logger.info("Succeeded with %s/%s", provider_name, model)
                return result, provider_name
            except (RateLimitError, TimeoutError, ServiceUnavailableError) as e:
                logger.warning("Failover from %s: %s", provider_name, e)
                continue
        raise AllProvidersExhausted("All providers in failover chain failed")
```

## Cost Management

```python
from decimal import Decimal
from datetime import datetime, timedelta


@dataclass
class CostEntry:
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    cost: Decimal
    timestamp: datetime
    user_id: Optional[str] = None
    request_id: Optional[str] = None


class CostTracker:
    def __init__(self):
        self.rates: dict[str, dict[str, tuple[Decimal, Decimal]]] = {
            "openai": {
                "gpt-4o-mini": (Decimal("0.00015"), Decimal("0.0006")),
                "gpt-4o": (Decimal("0.0025"), Decimal("0.01")),
            },
            "anthropic": {
                "claude-3-haiku": (Decimal("0.00025"), Decimal("0.00125")),
                "claude-3.5-sonnet": (Decimal("0.003"), Decimal("0.015")),
                "claude-3-opus": (Decimal("0.015"), Decimal("0.075")),
            },
            "bedrock": {
                "claude-3-sonnet": (Decimal("0.003"), Decimal("0.015")),
            },
            "local": {
                "mistral-7b": (Decimal("0"), Decimal("0")),
            },
        }
        self.entries: list[CostEntry] = []
        self.budgets: dict[str, Decimal] = {}

    def set_budget(self, user_id: str, monthly_limit: Decimal) -> None:
        self.budgets[user_id] = monthly_limit

    def record(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        user_id: Optional[str] = None,
    ) -> CostEntry:
        rates = self.rates.get(provider, {}).get(model, (Decimal("0"), Decimal("0")))
        input_cost = Decimal(input_tokens) / 1000 * rates[0]
        output_cost = Decimal(output_tokens) / 1000 * rates[1]
        total = input_cost + output_cost
        entry = CostEntry(
            provider=provider,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost=total,
            timestamp=datetime.utcnow(),
            user_id=user_id,
        )
        self.entries.append(entry)

        if user_id and user_id in self.budgets:
            monthly_spend = self.get_user_spent(user_id)
            if monthly_spend > self.budgets[user_id]:
                logger.warning("Budget exceeded for user %s: %s > %s", user_id, monthly_spend, self.budgets[user_id])
        return entry

    def get_user_spent(self, user_id: str, days: int = 30) -> Decimal:
        cutoff = datetime.utcnow() - timedelta(days=days)
        return sum(
            entry.cost for entry in self.entries
            if entry.user_id == user_id and entry.timestamp >= cutoff
        )

    def get_provider_cost_breakdown(self, provider: str) -> Decimal:
        return sum(entry.cost for entry in self.entries if entry.provider == provider)

    def get_model_cost_breakdown(self, model: str) -> Decimal:
        return sum(entry.cost for entry in self.entries if entry.model == model)

    def tier_for_task(self, prompt: str, token_count: int) -> tuple[str, str]:
        if token_count > 8000:
            return "anthropic", "claude-3-opus"
        if any(kw in prompt.lower() for kw in ("code", "def ", "class ")):
            return "anthropic", "claude-3.5-sonnet"
        if token_count < 500:
            return "openai", "gpt-4o-mini"
        return "openai", "gpt-4o"
```

## Rate Limiting & Quotas

```python
import asyncio
from collections import defaultdict


class TokenBucket:
    def __init__(self, rate: float, burst: int):
        self.rate = rate
        self.burst = burst
        self.tokens = burst
        self.last_refill = time.monotonic()

    async def acquire(self) -> bool:
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.burst, self.tokens + elapsed * self.rate)
        self.last_refill = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False


class RateLimiter:
    def __init__(self):
        self.buckets: dict[str, TokenBucket] = {
            "openai": TokenBucket(rate=10, burst=50),
            "anthropic": TokenBucket(rate=5, burst=20),
            "google": TokenBucket(rate=15, burst=60),
            "bedrock": TokenBucket(rate=20, burst=80),
            "local": TokenBucket(rate=100, burst=200),
        }

    async def wait_for_capacity(self, provider: str, timeout: float = 10.0) -> bool:
        bucket = self.buckets.get(provider)
        if not bucket:
            return True
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if await bucket.acquire():
                return True
            await asyncio.sleep(0.05)
        return False


class UserQuotaManager:
    def __init__(self):
        self.quotas: dict[str, int] = {}
        self.usage: dict[str, list[tuple[datetime, int]]] = defaultdict(list)

    def set_quota(self, user_id: str, daily_limit: int) -> None:
        self.quotas[user_id] = daily_limit

    def check_quota(self, user_id: str, tokens: int) -> bool:
        today = datetime.utcnow().date()
        self.usage[user_id] = [
            (ts, t) for ts, t in self.usage[user_id]
            if ts.date() == today
        ]
        daily_used = sum(t for _, t in self.usage[user_id])
        daily_limit = self.quotas.get(user_id, 100000)
        if daily_used + tokens > daily_limit:
            return False
        self.usage[user_id].append((datetime.utcnow(), tokens))
        return True


class QueueManager:
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.queue: asyncio.Queue = asyncio.Queue()
        self.processing = False

    async def enqueue(self, request):
        await self.queue.put(request)

    async def process_loop(self):
        self.processing = True
        while self.processing:
            request = await self.queue.get()
            async with self.semaphore:
                result = await request.handler(request.prompt)
            request.future.set_result(result)

    async def submit(self, prompt: str, handler) -> any:
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        await self.enqueue(Request(prompt=prompt, handler=handler, future=future))
        return await future
```

## Observability for Routing

```python
import structlog
from uuid import uuid4


logger = structlog.get_logger()


@dataclass
class RoutingDecision:
    request_id: str
    task_type: str
    prompt_length: int
    selected_provider: str
    selected_model: str
    routing_reason: str
    alternatives_considered: list[str]
    fallback_used: bool
    latency_ms: float
    cost: Decimal
    input_tokens: int
    output_tokens: int
    success: bool
    error: Optional[str] = None


class RoutingObservability:
    def __init__(self):
        self.decisions: list[RoutingDecision] = []
        self.model_metrics: dict[str, list[float]] = defaultdict(list)
        self.provider_success: dict[str, list[bool]] = defaultdict(list)

    def record_decision(self, decision: RoutingDecision) -> None:
        self.decisions.append(decision)
        self.model_metrics[decision.selected_model].append(decision.latency_ms)
        self.provider_success[decision.selected_provider].append(decision.success)

        logger.info(
            "routing_decision",
            request_id=decision.request_id,
            provider=decision.selected_provider,
            model=decision.selected_model,
            reason=decision.routing_reason,
            latency_ms=decision.latency_ms,
            cost=str(decision.cost),
            success=decision.success,
            fallback=decision.fallback_used,
        )

    def log_routing_decision(
        self,
        task_type: str,
        prompt: str,
        provider: str,
        model: str,
        reason: str,
        alternatives: list[str],
        fallback: bool,
        latency_ms: float,
        cost: Decimal,
        input_tokens: int,
        output_tokens: int,
        success: bool,
        error: Optional[str] = None,
    ) -> None:
        decision = RoutingDecision(
            request_id=str(uuid4()),
            task_type=task_type,
            prompt_length=len(prompt),
            selected_provider=provider,
            selected_model=model,
            routing_reason=reason,
            alternatives_considered=alternatives,
            fallback_used=fallback,
            latency_ms=latency_ms,
            cost=cost,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            success=success,
            error=error,
        )
        self.record_decision(decision)

    def get_model_performance_report(self) -> dict:
        return {
            model: {
                "avg_latency_ms": sum(times) / len(times),
                "p95_latency_ms": sorted(times)[int(len(times) * 0.95)],
                "total_calls": len(times),
                "success_rate": sum(self.provider_success.get(model.split("/")[0], [])) / max(len(self.provider_success.get(model.split("/")[0], [])), 1),
            }
            for model, times in self.model_metrics.items()
        }

    def get_routing_summary(self) -> dict:
        total = len(self.decisions)
        if total == 0:
            return {}
        provider_counts = defaultdict(int)
        model_counts = defaultdict(int)
        for d in self.decisions:
            provider_counts[d.selected_provider] += 1
            model_counts[d.selected_model] += 1
        return {
            "total_requests": total,
            "provider_distribution": dict(provider_counts),
            "model_distribution": dict(model_counts),
            "fallback_rate": sum(1 for d in self.decisions if d.fallback_used) / total,
            "success_rate": sum(1 for d in self.decisions if d.success) / total,
            "avg_latency_ms": sum(d.latency_ms for d in self.decisions) / total,
            "total_cost": str(sum(d.cost for d in self.decisions)),
        }

    def ab_test_report(self, model_a: str, model_b: str) -> dict:
        a = [d for d in self.decisions if d.selected_model == model_a]
        b = [d for d in self.decisions if d.selected_model == model_b]
        return {
            model_a: {
                "count": len(a),
                "avg_latency": sum(d.latency_ms for d in a) / len(a) if a else 0,
                "success_rate": sum(1 for d in a if d.success) / len(a) if a else 0,
            },
            model_b: {
                "count": len(b),
                "avg_latency": sum(d.latency_ms for d in b) / len(b) if b else 0,
                "success_rate": sum(1 for d in b if d.success) / len(b) if b else 0,
            },
        }
```

## Gateway Class Implementation

```python
@dataclass
class GatewayConfig:
    default_provider: str = "openai"
    default_model: str = "gpt-4o-mini"
    enable_fallback: bool = True
    enable_circuit_breaker: bool = True
    max_retries: int = 3
    request_timeout: float = 30.0
    max_concurrent: int = 20


class AIGateway:
    def __init__(self, config: Optional[GatewayConfig] = None):
        self.config = config or GatewayConfig()
        self.providers: dict[str, LLMProvider] = {}
        self.classifier = TaskClassifier()
        self.cost_tracker = CostTracker()
        self.failover = ProviderFailover({}, [])
        self.circuit_breaker = CircuitBreaker()
        self.rate_limiter = RateLimiter()
        self.observability = RoutingObservability()
        self.queue = QueueManager(self.config.max_concurrent)

    def register_provider(self, name: str, provider: LLMProvider) -> None:
        self.providers[name] = provider

    def set_failover_order(self, order: list[str]) -> None:
        self.failover = ProviderFailover(self.providers, order)

    async def route(
        self,
        prompt: str,
        *,
        task_type: Optional[str] = None,
        user_id: Optional[str] = None,
        preferred_model: Optional[str] = None,
        **kwargs,
    ) -> str:
        start = time.monotonic()

        if preferred_model:
            provider_name, model = self._resolve_model(preferred_model)
            reason = "user_preference"
        elif task_type:
            route = self.classifier.route(prompt)
            provider_name = route.provider
            model = route.model
            reason = f"task_type:{task_type}"
        else:
            provider_name = self.config.default_provider
            model = self.config.default_model
            reason = "default"

        alternatives = []
        fallback_used = False
        last_error = None
        input_tokens = await self._count_tokens(provider_name, model, prompt)

        has_capacity = await self.rate_limiter.wait_for_capacity(provider_name)
        if not has_capacity:
            alternatives = [p for p in self.failover.order if p != provider_name]
            provider_name = alternatives[0] if alternatives else provider_name
            model = self.config.default_model
            reason = f"rate_limited_failover:{provider_name}"
            fallback_used = True

        if self.config.enable_circuit_breaker:
            try:
                self.circuit_breaker.call(provider_name, lambda: None)
            except ServiceUnavailableError:
                alternatives = [p for p in self.failover.order if p != provider_name]
                if alternatives:
                    provider_name = alternatives[0]
                    fallback_used = True
                    reason = f"circuit_breaker_failover:{provider_name}"

        try:
            if self.config.enable_fallback and len(self.failover.order) > 1:
                result, used_provider = await self.failover.execute_with_failover(
                    model, prompt, **kwargs
                )
                if used_provider != provider_name:
                    fallback_used = True
                    reason = f"fallback:{used_provider}"
                provider_name = used_provider
            else:
                provider = self.providers.get(provider_name)
                result = await provider.complete(model, prompt, **kwargs)
        except Exception as e:
            end = time.monotonic()
            self.observability.log_routing_decision(
                task_type=task_type or "unknown",
                prompt=prompt,
                provider=provider_name,
                model=model,
                reason=reason,
                alternatives=alternatives,
                fallback=fallback_used,
                latency_ms=(end - start) * 1000,
                cost=Decimal("0"),
                input_tokens=input_tokens,
                output_tokens=0,
                success=False,
                error=str(e),
            )
            raise

        end = time.monotonic()
        output_tokens = await self._count_tokens(provider_name, model, result)
        cost = self.cost_tracker.record(provider_name, model, input_tokens, output_tokens, user_id)

        self.observability.log_routing_decision(
            task_type=task_type or "unknown",
            prompt=prompt,
            provider=provider_name,
            model=model,
            reason=reason,
            alternatives=alternatives,
            fallback=fallback_used,
            latency_ms=(end - start) * 1000,
            cost=cost.cost,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            success=True,
        )
        return result

    def _resolve_model(self, model_id: str) -> tuple[str, str]:
        provider_map = {
            "gpt": "openai",
            "claude": "anthropic",
            "gemini": "google",
            "llama": "bedrock",
            "mistral": "local",
        }
        prefix = model_id.split("-")[0]
        provider = next((v for k, v in provider_map.items() if prefix.startswith(k)), self.config.default_provider)
        return provider, model_id

    async def _count_tokens(self, provider: str, model: str, text: str) -> int:
        p = self.providers.get(provider)
        if not p:
            return len(text) // 4
        return await p.count_tokens(model, text)
```

## Real-World Checklist
- [ ] Provider credentials stored securely (env vars / secrets manager)
- [ ] Fallback chain configured with at least 2 providers
- [ ] Rate limiters tuned per provider (RPM, TPM limits)
- [ ] Circuit breaker thresholds calibrated (failure count + recovery window)
- [ ] Cost tracking with per-user/team budgets enforced
- [ ] Observability pipeline emitting routing decisions as structured logs
- [ ] Retry policy uses exponential backoff (1s, 2s, 4s, 8s, 16s)
- [ ] Models mapped to task types with semantic classifier rules
- [ ] A/B test framework ready for comparing model quality
- [ ] Local fallback ready (Ollama/vLLM) for offline resilience
