---
name: multi-model-routing
description: "Multi-model routing with cost/quality selection and provider fallbacks. Use for AI gateway abstraction."
context: fork
globs: []
alwaysApply: false
---

# Multi-Model Routing

Route LLM requests to optimal providers based on cost, quality, and availability. Includes fallback chains and provider abstraction.

---

## Routing Strategy

| Task Type | Primary | Fallback | Cost Tier |
|-----------|---------|----------|-----------|
| **Complex reasoning** | Claude Sonnet | GPT-4o | $$ |
| **Code generation** | Claude Sonnet | GPT-4o | $$ |
| **Quick tasks** | Haiku | 4o-mini | $ |
| **Vision** | GPT-4o | Claude Vision | $$ |
| **Embeddings** | text-embedding-3-small | bge-large | $ |
| **Chat** | Haiku | 4o-mini | $ |

---

## Provider Abstraction

```python
from abc import ABC, abstractmethod

class ModelProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str: ...

class OpenAIProvider(ModelProvider): ...
class AnthropicProvider(ModelProvider): ...
class BedrockProvider(ModelProvider): ...
```

---

## Router Implementation

```python
class ModelRouter:
    def __init__(self, providers: dict):
        self.providers = providers
        self.routes = {
            'complex': ['anthropic', 'openai'],
            'quick': ['openai-mini', 'anthropic-haiku'],
            'vision': ['openai', 'anthropic'],
        }

    async def route(self, task_type: str, prompt: str):
        for provider_name in self.routes[task_type]:
            try:
                return await self.providers[provider_name].generate(prompt)
            except Exception:
                continue
        raise RuntimeError("All providers failed")
```

---

## Cost Optimization

```python
COST_PER_1K_TOKENS = {
    'gpt-4o': 0.010,
    'claude-sonnet': 0.008,
    'haiku': 0.001,
    '4o-mini': 0.0005,
}

def estimate_cost(model: str, tokens: int) -> float:
    return COST_PER_1K_TOKENS.get(model, 0) * (tokens / 1000)
```

---

## Fallback Patterns

### Retry with Backoff
```python
import asyncio

async def with_fallback(providers, prompt, max_retries=3):
    for provider in providers:
        for attempt in range(max_retries):
            try:
                return await provider.generate(prompt)
            except Exception:
                await asyncio.sleep(2 ** attempt)
    raise RuntimeError("All providers exhausted")
```

### Circuit Breaker
- Track failure rate per provider
- If >50% failures in last 10 requests → mark as degraded
- Route to next provider in chain
- Re-check degraded provider after 60s

---

## AWS Bedrock Integration

```python
import boto3

client = boto3.client('bedrock-runtime', region_name='us-east-1')

async def invoke_bedrock(model_id: str, prompt: str):
    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps({'prompt': prompt})
    )
    return json.loads(response['body'].read())['output']
```

---

## Monitoring

- Track cost per request
- Log provider failures
- Measure latency per model
- Alert on cost spikes
