---
name: vector-search
description: "Vector search & semantic retrieval - embedding generation, vector database integration, similarity search, hybrid search, metadata filtering, reranking, index tuning, and batch indexing"
---

# Vector Search & Semantic Retrieval Skill

## When to Use
Vector search enables semantic similarity search over unstructured data (text, images, audio). Use it when keyword/full-text search fails — synonyms, paraphrases, conceptual matches, multilingual queries, or recommendation systems. Ideal for RAG pipelines, semantic deduplication, anomaly detection, and content-based recommenders. Latency-sensitive apps (<100ms) need ANN indexes; high-recall use cases (legal, medical) benefit from exact k-NN or reranking.

## Embedding Generation

### OpenAI ada-002
```python
import httpx

OPENAI_API_KEY = "sk-..."

async def embed_openai(texts: list[str], model: str = "text-embedding-ada-002") -> list[list[float]]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"input": texts, "model": model},
        )
        resp.raise_for_status()
        data = resp.json()
        return [d["embedding"] for d in data["data"]]
```

### Cohere Embed
```python
COHERE_API_KEY = "..."

async def embed_cohere(texts: list[str], model: str = "embed-english-v3.0") -> list[list[float]]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.cohere.com/v1/embed",
            headers={"Authorization": f"Bearer {COHERE_API_KEY}", "Content-Type": "application/json"},
            json={"texts": texts, "model": model, "input_type": "search_document"},
        )
        resp.raise_for_status()
        return resp.json()["embeddings"]
```

### Sentence-Transformers (local)
```python
import numpy as np
from numpy.typing import NDArray

# Load once at startup
from sentence_transformers import SentenceTransformer
_model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_local(texts: list[str]) -> NDArray[np.float32]:
    return _model.encode(texts, normalize_embeddings=True)  # (N, 384)

# Batch to avoid OOM
def embed_batched(texts: list[str], batch_size: int = 64) -> NDArray[np.float32]:
    return _model.encode(texts, batch_size=batch_size, normalize_embeddings=True)
```

### Local with ONNX Runtime (faster inference)
```python
import onnxruntime as ort
import numpy as np
from numpy.typing import NDArray
from transformers import AutoTokenizer

class ONNXEmbedder:
    def __init__(self, model_path: str, tokenizer_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.session = ort.InferenceSession(model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)

    def embed(self, texts: list[str]) -> NDArray[np.float32]:
        tokens = self.tokenizer(texts, padding=True, truncation=True, return_tensors="np")
        outputs = self.session.run(None, {
            "input_ids": tokens["input_ids"],
            "attention_mask": tokens["attention_mask"],
        })
        return outputs[0]  # (N, 384)
```

## Vector Database Integration

### pgvector (PostgreSQL)
```python
# Setup: CREATE EXTENSION vector;
# Or with Alembic: op.execute("CREATE EXTENSION IF NOT EXISTS vector")
from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY, REAL
from pgvector.sqlalchemy import Vector

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    content = Column(String, nullable=False)
    embedding = Column(Vector(384))  # dimension matches model

    __table_args__ = (
        Index("ix_documents_embedding", embedding, postgresql_using="hnsw"),
    )

# Index creation
# CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=200);
# CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
```

### Pinecone
```python
import os
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

# Create index
if "semantic-search" not in pc.list_indexes().names():
    pc.create_index(
        name="semantic-search",
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )

index = pc.Index("semantic-search")

# Upsert
async def upsert_vectors(vectors: list[tuple[str, list[float], dict]]):
    index.upsert(vectors=vectors)  # [(id, embedding, metadata), ...]

# Query
async def query_vectors(vector: list[float], top_k: int = 10):
    return index.query(vector=vector, top_k=top_k, include_metadata=True)
```

### Weaviate
```python
import weaviate
from weaviate.classes.init import Auth

client = weaviate.connect_to_wcs(
    cluster_url=os.environ["WEAVIATE_URL"],
    auth_credentials=Auth.api_key(os.environ["WEAVIATE_API_KEY"]),
)

# Collection with auto-schema
collection = client.collections.create(
    name="Document",
    vectorizer_config=None,  # provide your own vectors
    properties=[
        weaviate.classes.config.Property(name="content", data_type=weaviate.classes.config.DataType.TEXT),
    ],
)

# Insert
async def insert_doc(content: str, vector: list[float]):
    collection.data.insert(properties={"content": content}, vector=vector)

# Query
async def search_docs(vector: list[float], top_k: int = 10):
    return collection.query.near_vector(near_vector=vector, limit=top_k)
```

### Chroma
```python
import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(
    path="/data/chromadb",
    settings=Settings(anonymized_telemetry=False),
)

collection = client.get_or_create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"},
)

# Insert
async def insert_chroma(ids: list[str], embeddings: list[list[float]], metadatas: list[dict]):
    collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas)

# Query
async def query_chroma(vector: list[float], top_k: int = 10):
    return collection.query(query_embeddings=[vector], n_results=top_k, include=["metadatas", "distances"])
```

### Milvus
```python
from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType

connections.connect(host="localhost", port="19530")

schema = CollectionSchema([
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=384),
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
])

collection = Collection(name="documents", schema=schema)
collection.create_index("embedding", {"index_type": "HNSW", "metric_type": "COSINE", "params": {"M": 16, "efConstruction": 200}})
collection.load()

async def insert_milvus(ids: list[int], embeddings: list[list[float]], contents: list[str]):
    collection.insert([ids, embeddings, contents])

async def search_milvus(vector: list[float], top_k: int = 10):
    collection.load()
    return collection.search(
        data=[vector],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"ef": 64}},
        limit=top_k,
    )
```

## Similarity Search

### Distance Metrics

| Metric | Formula | Use Case | Range |
|--------|---------|----------|-------|
| Cosine | `1 - cos(θ)` | Text embeddings (normalized) | [0, 2] |
| Dot Product | `-A·B` | Unnormalized embeddings | unbounded |
| Euclidean (L2) | `||A-B||²` | Dense visual embeddings | [0, ∞) |

```python
import numpy as np
from numpy.typing import NDArray

def cosine_similarity(a: NDArray[np.float32], b: NDArray[np.float32]) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def cosine_distance(a: NDArray[np.float32], b: NDArray[np.float32]) -> float:
    return 1.0 - cosine_similarity(a, b)

# Batch pairwise similarity
def pairwise_similarity(matrix: NDArray[np.float32]) -> NDArray[np.float32]:
    norm = np.linalg.norm(matrix, axis=1, keepdims=True)
    matrix_norm = matrix / norm
    return matrix_norm @ matrix_norm.T
```

### Exact k-NN (pgvector)
```sql
-- Cosine similarity (default for vector_cosine_ops)
SELECT id, content, 1 - (embedding <=> :query_vector) AS similarity
FROM documents
ORDER BY embedding <=> :query_vector
LIMIT 20;

-- L2 distance
SELECT id, content, embedding <-> :query_vector AS distance
FROM documents
ORDER BY embedding <-> :query_vector
LIMIT 20;

-- Inner product (larger = more similar)
SELECT id, content, embedding <#> :query_vector AS similarity
FROM documents
ORDER BY embedding <#> :query_vector
LIMIT 20;
```

```python
# Using SQLAlchemy
from sqlalchemy import text

async def exact_search(query_vector: list[float], top_k: int = 20):
    stmt = text("""
        SELECT id, content, 1 - (embedding <=> :qv) AS similarity
        FROM documents
        ORDER BY embedding <=> :qv
        LIMIT :limit
    """)
    result = await db.execute(stmt, {"qv": query_vector, "limit": top_k})
    return result.fetchall()
```

### ANN Indexes

#### HNSW (Hierarchical Navigable Small World)
```sql
-- Best recall, moderate build time, high memory
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
    WITH (m=16, ef_construction=200);
-- m: 12-48 (connections per layer). Higher = better recall, more memory
-- ef_construction: 100-500. Higher = better recall, slower build
```

#### IVFFlat (Inverted File with Flat Compression)
```sql
-- Faster build, lower memory, lower recall (needs tuning)
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists=100);
-- lists: sqrt(n_rows) recommended. Higher = faster search, lower recall
```

```python
# Query-time parameters
async def ann_search(query_vector: list[float], top_k: int = 20, probes: int = 10):
    stmt = text("""
        SET ivfflat.probes = :probes;
        SELECT id, content, 1 - (embedding <=> :qv) AS similarity
        FROM documents
        ORDER BY embedding <=> :qv
        LIMIT :limit
    """)
    async with db.connect() as conn:
        result = await conn.execute(stmt, {"qv": query_vector, "probes": probes, "limit": top_k})
        return result.fetchall()
```

## Hybrid Search

### Keyword BM25 + Vector
```python
import numpy as np
from np.typing import NDArray
from rank_bm25 import BM25Okapi

class HybridSearcher:
    def __init__(self, alpha: float = 0.5):
        self.alpha = alpha  # 0 = pure BM25, 1 = pure vector

    async def search(
        self,
        query: str,
        query_vector: list[float],
        bm25_corpus: list[str],
        vector_results: list[tuple[int, str, float]],
        top_k: int = 20,
    ) -> list[tuple[int, str, float]]:
        # BM25 scores
        tokenized_corpus = [doc.split() for doc in bm25_corpus]
        bm25 = BM25Okapi(tokenized_corpus)
        bm25_scores = bm25.get_scores(query.split())

        # Normalize both score sets to [0, 1]
        bm25_norm = self._normalize(bm25_scores)
        vec_scores = np.array([s[2] for s in vector_results])
        vec_norm = self._normalize(vec_scores)

        # Combined score
        combined = self.alpha * vec_norm + (1 - self.alpha) * bm25_norm

        # Rerank
        ranked = sorted(
            zip(vector_results, combined),
            key=lambda x: x[1], reverse=True,
        )
        return ranked

    def _normalize(self, scores: NDArray[np.float32]) -> NDArray[np.float32]:
        mn, mx = scores.min(), scores.max()
        if mx == mn:
            return np.zeros_like(scores)
        return (scores - mn) / (mx - mn)
```

### Reciprocal Rank Fusion (RRF)
```python
async def rrf(
    bm25_results: list[int],
    vector_results: list[int],
    k: int = 60,
    top_k: int = 20,
) -> list[int]:
    scores: dict[int, float] = {}

    for rank, doc_id in enumerate(bm25_results):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)

    for rank, doc_id in enumerate(vector_results):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)

    return sorted(scores, key=scores.get, reverse=True)[:top_k]

# Usage
async def hybrid_search(query: str, query_vector: list[float], top_k: int = 20):
    bm25_results = await bm25_search(query, top_k=top_k * 2)
    vector_results = await vector_search(query_vector, top_k=top_k * 2)
    return await rrf(bm25_results, vector_results, top_k=top_k)
```

### pgvector + Full-Text Search (PostgreSQL)
```python
async def pg_hybrid_search(query_text: str, query_vector: list[float], alpha: float = 0.5, top_k: int = 20):
    stmt = text("""
        WITH vector_matches AS (
            SELECT id, content, 1 - (embedding <=> :qv) AS vec_score
            FROM documents
            ORDER BY embedding <=> :qv
            LIMIT :limit
        ),
        text_matches AS (
            SELECT id, content, ts_rank(to_tsvector('english', content), plainto_tsquery('english', :qt)) AS txt_score
            FROM documents
            WHERE to_tsvector('english', content) @@ plainto_tsquery('english', :qt)
            ORDER BY txt_score DESC
            LIMIT :limit
        )
        SELECT
            COALESCE(v.id, t.id) AS id,
            COALESCE(v.content, t.content) AS content,
            (COALESCE(v.vec_score, 0) * :alpha + COALESCE(t.txt_score, 0) * (1 - :alpha)) AS combined_score
        FROM vector_matches v
        FULL OUTER JOIN text_matches t ON v.id = t.id
        ORDER BY combined_score DESC
        LIMIT :limit
    """)
    result = await db.execute(stmt, {
        "qv": query_vector, "qt": query_text,
        "alpha": alpha, "limit": top_k,
    })
    return result.fetchall()
```

## Metadata Filtering

### Pre-Filtering (filter before ANN search)
```python
# pgvector: WHERE clause + ANN
async def pre_filter(query_vector: list[float], author: str, top_k: int = 20):
    stmt = text("""
        SELECT id, content, 1 - (embedding <=> :qv) AS similarity
        FROM documents
        WHERE author = :author
        ORDER BY embedding <=> :qv
        LIMIT :limit
    """)
    return await db.execute(stmt, {"qv": query_vector, "author": author, "limit": top_k})

# Pinecone metadata filter
index.query(
    vector=query_vector,
    filter={"author": {"$eq": "alice"}, "date": {"$gte": "2024-01-01"}},
    top_k=20,
)

# Weaviate where filter
collection.query.near_vector(
    near_vector=query_vector,
    limit=20,
    filters=weaviate.classes.query.Filter.by_property("author").equal("alice"),
)

# Chroma where filter
collection.query(
    query_embeddings=[query_vector],
    n_results=20,
    where={"author": "alice"},
)
```

### Post-Filtering (search first, then filter)
```python
async def post_filter(vector_results: list[dict], field: str, value: str) -> list[dict]:
    return [r for r in vector_results if r.get(field) == value]

# Pros: Higher recall for sparse filters
# Cons: May return fewer than top_k results if filter is selective
```

### Hybrid Filter Strategy
```python
async def hybrid_filter(
    query_vector: list[float],
    filters: dict,
    top_k: int = 20,
    oversample_factor: int = 3,
) -> list[dict]:
    # Oversample to compensate for post-filter losses
    results = pre_filter(query_vector, filters, top_k=top_k * oversample_factor)
    return results[:top_k]
```

## Reranking Strategies

### Cross-Encoder Reranking
```python
from sentence_transformers import CrossEncoder

# Load once
_reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

async def rerank(query: str, candidates: list[tuple[int, str]], top_k: int = 10) -> list[tuple[int, str, float]]:
    pairs = [(query, doc) for _, doc in candidates]
    scores = _reranker.predict(pairs)
    ranked = sorted(
        zip([c[0] for c in candidates], [c[1] for c in candidates], scores.tolist()),
        key=lambda x: x[2], reverse=True,
    )
    return ranked[:top_k]

# Usage in a RAG pipeline
async def search_and_rerank(query: str, query_vector: list[float], top_k: int = 10):
    candidates = await vector_search(query_vector, top_k=top_k * 3)
    return await rerank(query, candidates, top_k=top_k)
```

### Cohere Rerank
```python
COHERE_API_KEY = "..."

async def cohere_rerank(query: str, documents: list[str], top_k: int = 10) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.cohere.com/v1/rerank",
            headers={
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "rerank-english-v3.0",
                "query": query,
                "documents": documents,
                "top_n": top_k,
            },
        )
        resp.raise_for_status()
        return resp.json()["results"]  # [{index: int, relevance_score: float}, ...]
```

### Two-Stage Pipeline
```python
async def two_stage_search(query: str, query_vector: list[float], top_k: int = 10):
    # Stage 1: Fast ANN retrieval (oversample)
    candidates = await vector_search(query_vector, top_k=top_k * 5)
    # Stage 2: Expensive reranking
    return await rerank(query, candidates, top_k=top_k)

# With timing
import time

async def timed_two_stage(query: str, query_vector: list[float], top_k: int = 10):
    t0 = time.perf_counter()
    candidates = await vector_search(query_vector, top_k=top_k * 5)
    t1 = time.perf_counter()
    results = await rerank(query, candidates, top_k=top_k)
    t2 = time.perf_counter()
    logger.info(f"ANN: {t1-t0:.3f}s | Rerank: {t2-t1:.3f}s | Total: {t2-t0:.3f}s")
    return results
```

## Index Tuning

### HNSW Parameters
| Parameter | Range | Effect | Trade-off |
|-----------|-------|--------|-----------|
| `m` | 12-48 | Connections per layer | Higher = better recall, more memory, slower build |
| `ef_construction` | 100-500 | Build-time search width | Higher = better recall, slower build |
| `ef_search` | 1-1000 | Query-time search width | Higher = better recall, slower query |

```python
# pgvector HNSW
class HNSWConfig:
    def __init__(self, m: int = 16, ef_construction: int = 200, ef_search: int = 64):
        self.m = m
        self.ef_construction = ef_construction
        self.ef_search = ef_search

    def create_index_sql(self) -> str:
        return f"""
            CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
            WITH (m={self.m}, ef_construction={self.ef_construction})
        """

    def set_query_params(self, top_k: int = 20) -> str:
        return f"""
            SET hnsw.ef_search = {max(self.ef_search, top_k)}
        """
```

### IVFFlat Parameters
| Parameter | Range | Effect | Trade-off |
|-----------|-------|--------|-----------|
| `lists` | 1-5000 | Number of centroids | Higher = finer granularity, slower build |
| `probes` | 1-100 | Clusters to search | Higher = better recall, slower query |

```python
class IVFFlatConfig:
    def __init__(self, n_rows: int, lists: int | None = None, probes: int = 10):
        self.lists = lists or max(100, int(n_rows ** 0.5))
        self.probes = probes

    def create_index_sql(self) -> str:
        return f"""
            CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
            WITH (lists={self.lists})
        """

    def set_query_params(self) -> str:
        return f"SET ivfflat.probes = {self.probes}"
```

### Latency vs Recall Trade-off
```python
async def benchmark_indexes(query_vectors: list[list[float]], ground_truth: list[list[int]]):
    """Benchmark recall@10 and latency for different index configs."""
    configs = [
        ("exact", None, None),
        ("hnsw_m16_ef200_ef64", 16, 200, 64),
        ("hnsw_m32_ef400_ef128", 32, 400, 128),
        ("ivfflat_l100_p10", 100, 10),
        ("ivfflat_l500_p50", 500, 50),
    ]

    results = {}
    for config in configs:
        t0 = time.perf_counter()
        matches = []  # simulated
        for qv in query_vectors:
            res = await vector_search(qv, top_k=10)
            matches.append([r.id for r in res])
        elapsed = time.perf_counter() - t0

        recall = np.mean([
            len(set(pred) & set(gt)) / len(gt)
            for pred, gt in zip(matches, ground_truth)
        ])
        results[config[0]] = {"recall": recall, "latency_ms": elapsed / len(query_vectors) * 1000}

    return results
```

## Batch Indexing

### Async Batch Processing
```python
import asyncio
from dataclasses import dataclass

@dataclass
class BatchConfig:
    batch_size: int = 64
    max_concurrent: int = 4
    max_retries: int = 3
    retry_delay: float = 1.0

class BatchIndexer:
    def __init__(self, embed_fn, index_fn, config: BatchConfig | None = None):
        self.embed_fn = embed_fn
        self.index_fn = index_fn
        self.config = config or BatchConfig()

    async def index_all(self, documents: list[dict]) -> int:
        total = 0
        sem = asyncio.Semaphore(self.config.max_concurrent)

        async def process_batch(batch: list[dict]):
            async with sem:
                texts = [d["text"] for d in batch]
                for attempt in range(self.config.max_retries):
                    try:
                        embeddings = await self.embed_fn(texts)
                        ids = [d["id"] for d in batch]
                        metadatas = [d.get("metadata", {}) for d in batch]
                        await self.index_fn(ids, embeddings, metadatas)
                        return len(batch)
                    except Exception as e:
                        if attempt == self.config.max_retries - 1:
                            logger.error(f"Batch failed after {self.config.max_retries} retries: {e}")
                            return 0
                        await asyncio.sleep(self.config.retry_delay * (2 ** attempt))

        tasks = []
        for i in range(0, len(documents), self.config.batch_size):
            batch = documents[i:i + self.config.batch_size]
            tasks.append(process_batch(batch))

        results = await asyncio.gather(*tasks)
        return sum(results)
```

### Retry with Exponential Backoff
```python
import random

async def with_retry(fn, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return await fn()
        except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
            if attempt == max_retries - 1:
                raise
            delay = (2 ** attempt) + random.uniform(0, 1)
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {delay:.1f}s: {e}")
            await asyncio.sleep(delay)
```

### Progress Tracking
```python
from tqdm.asyncio import tqdm as async_tqdm

async def index_with_progress(documents: list[dict], batch_size: int = 64):
    indexer = BatchIndexer(embed_openai, upsert_vectors)
    total = len(documents)
    processed = 0

    with async_tqdm(total=total, desc="Indexing", unit="doc") as pbar:
        for i in range(0, total, batch_size):
            batch = documents[i:i + batch_size]
            count = await indexer.process_batch(batch)
            processed += count
            pbar.update(len(batch))
            pbar.set_postfix(processed=processed, total=total)

    logger.info(f"Indexed {processed}/{total} documents")
    return processed
```

## Real-World Checklist
- [ ] Embedding model chosen (dimensions, cost, latency trade-offs evaluated)
- [ ] Vector database selected (pgvector for tight Postgres integration; Pinecone/Weaviate for managed)
- [ ] Distance metric matches embedding normalization (cosine for normalized, dot for unnormalized)
- [ ] ANN index type chosen (HNSW for recall, IVFFlat for fast build)
- [ ] Index parameters tuned (ef_search vs ef_construction, lists vs probes trade-off)
- [ ] Hybrid search implemented (BM25 + vector with RRF or weighted fusion)
- [ ] Metadata filtering strategy decided (pre-filter vs post-filter vs hybrid)
- [ ] Reranking stage added for production (cross-encoder or Cohere rerank)
- [ ] Batch indexing with retry and error handling
- [ ] Latency monitored (p95 < 100ms for ANN, reranking adds 50-200ms)
- [ ] Recall monitored (monthly ground-truth eval against exact k-NN)
- [ ] Index maintenance (rebuild schedule for IVFFlat as data grows)
