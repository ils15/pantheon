---
name: rag-pipelines
description: "RAG (Retrieval-Augmented Generation) pipeline design — chunking strategies, embedding model selection, document loaders, vector store configuration (Pinecone, Weaviate, pgvector, Chroma), retrieval strategies (similarity search, MMR, hybrid BM25, self-querying), evaluation with RAGAS/LangSmith, and Gradio/Streamlit demo patterns. Covers LangChain and LlamaIndex integration for production-grade RAG systems."
context: fork
argument-hint: "RAG pipeline design — describe document sources, retrieval use cases, chunking strategy, vector store preference, and evaluation criteria"
globs: ["**/rag/**", "**/retrieval/**", "**/embeddings/**"]
alwaysApply: false
---

# RAG Pipelines Skill

## When to Use

Use this skill when:
- Building a question-answering system over private documents
- Implementing a chat-with-PDF or chat-with-codebase feature
- Designing the retrieval pipeline for an LLM application
- Choosing between chunking strategies and embedding models
- Configuring a vector store (Pinecone, Weaviate, pgvector, Chroma)
- Evaluating RAG quality (faithfulness, answer relevancy, context precision)
- Prototyping a quick RAG demo with Gradio or Streamlit
- Tuning retrieval performance (hybrid search, MMR, reranking)

---

## 1. RAG Architecture Overview

A production RAG pipeline has three interconnected sub-systems:

```
┌─────────────────────────────────────────────────────────┐
│                   INDEX PIPELINE (offline)               │
│                                                         │
│  Documents → Loaders → Chunking → Embeddings → Vector DB│
│                                                         │
│  LLM-generated metadata (summaries, questions, keywords) │
│  stored alongside each chunk for self-querying retrieval │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                RETRIEVAL PIPELINE (online)               │
│                                                         │
│  Query → Query Rewriting → Embedding → Hybrid Search    │
│  ──› Vector DB (semantic) + BM25 (keyword) → Merge      │
│  ──› Reranker (cross-encoder) → Top-K chunks            │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                GENERATION PIPELINE (online)              │
│                                                         │
│  Prompt: System + Retrieved Chunks + Query → LLM        │
│  ──› Response with citations → Guardrails → Output      │
└─────────────────────────────────────────────────────────┘
```

### LangChain integration

```python
from operator import itemgetter
from langchain_core.runnables import RunnablePassthrough, RunnableParallel

# Standard LangChain RAG chain with source-citation
def build_rag_chain(retriever, llm, prompt):
    def format_docs(docs):
        return "\n\n".join(
            f"[{i+1}] {d.page_content}\nSource: {d.metadata.get('source', 'unknown')}"
            for i, d in enumerate(docs)
        )

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
    )
    return chain

# Streaming variant
async def build_streaming_rag_chain(retriever, llm, prompt):
    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
    )
    async for chunk in chain.astream(user_query):
        yield chunk
```

### LlamaIndex integration

```python
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI

Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = OpenAI(model="gpt-4o-mini", temperature=0)

# Build index from documents
index = VectorStoreIndex.from_documents(documents)

# Query engine with post-processors
query_engine = index.as_query_engine(
    similarity_top_k=5,
    node_postprocessors=[
        SimilarityPostprocessor(similarity_cutoff=0.7),
    ],
    response_mode="compact",
)

response = query_engine.query("What is the capital of France?")
print(response)
```

---

## 2. Chunking Strategies

Chunking is the most impactful hyperparameter in RAG. Bad chunking breaks retrieval regardless of embedding quality.

### 2.1 Recursive Character Text Splitter (LangChain)

The recommended default — splits by paragraph, then sentence, then character:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=128,
    separators=["\n\n", "\n", ".", " ", ""],
    length_function=len,
)

chunks = splitter.split_documents(documents)
# Each chunk: Document(page_content="...", metadata={"source": "file.pdf", "chunk": 0})
```

**Tuning guide**:
| Content type | chunk_size | chunk_overlap | Rationale |
|---|---|---|---|
| Code | 256–512 | 64–128 | Respect function boundaries |
| Articles | 512–1024 | 128–256 | Paragraph-level context |
| Books | 1024–2048 | 256–512 | Chapter-level coherence |
| Conversational | 256–512 | 64 | Short-turn utterances |

### 2.2 Semantic Chunking (LlamaIndex)

Chunks split at natural topic boundaries using embedding similarity:

```python
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.openai import OpenAIEmbedding

splitter = SemanticSplitterNodeParser(
    embed_model=OpenAIEmbedding(model="text-embedding-3-small"),
    buffer_size=1,       # sentences to look ahead for topic shift
    breakpoint_percentile_threshold=95,  # percentile of similarity drop
)

nodes = splitter.get_nodes_from_documents(documents)
```

### 2.3 Fixed-Size with Overlap (manual, no framework)

Useful when you need full control or the content is uniform:

```python
def fixed_size_chunks(text: str, chunk_size: int = 512, overlap: int = 128) -> list[str]:
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap

    return chunks

# Usage
text = document.page_content
chunks = fixed_size_chunks(text, chunk_size=512, overlap=128)
```

### 2.4 Code-Aware Chunking

Preserves function and class boundaries for code documents:

```python
from langchain.text_splitter import (
    PythonCodeTextSplitter,
    RecursiveCharacterTextSplitter,
)

# Python-specific — splits at function/class boundaries
py_splitter = PythonCodeTextSplitter(chunk_size=256, chunk_overlap=32)

# General-purpose language-aware (JS, TS, Go, Java, etc.)
code_splitter = RecursiveCharacterTextSplitter.from_language(
    language="JS",
    chunk_size=256,
    chunk_overlap=32,
)
```

### Chunk metadata enrichment

```python
from langchain_core.documents import Document

def enrich_chunks(chunks: list[Document], llm) -> list[Document]:
    enriched = []
    for chunk in chunks:
        summary = llm.invoke(f"Summarize in 10 words: {chunk.page_content}")
        questions = llm.invoke(
            f"Generate 3 questions this text answers:\n{chunk.page_content}"
        )
        enriched.append(Document(
            page_content=chunk.page_content,
            metadata={
                **chunk.metadata,
                "summary": summary.content,
                "generated_questions": questions.content.split("\n"),
            },
        ))
    return enriched
```

---

## 3. Embedding Model Selection

### 3.1 OpenAI Embeddings

```python
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",  # 1536 dims, $0.02/1M tokens
    # model="text-embedding-3-large",  # 3072 dims, $0.13/1M tokens
    dimensions=768,  # truncate to 768 for cheaper storage + ok quality
)

# Dimension tradeoffs
OPENAI_DIMS = {
    "text-embedding-3-small": 1536,   # default — good balance
    "text-embedding-3-small:512": 512, # clamped — cheapest
    "text-embedding-3-large": 3072,   # best quality
}
```

### 3.2 Cohere Embeddings

```python
from langchain_cohere import CohereEmbeddings

embeddings = CohereEmbeddings(
    model="embed-english-v3.0",  # 1024 dims
    cohere_api_key="COHERE_API_KEY",
)

# Cohere supports explicit input_type for retrieval quality
# Options: "search_document", "search_query", "classification", "clustering"
query_embedding = embeddings.embed_query("What is RAG?", input_type="search_query")
doc_embedding = embeddings.embed_documents(docs, input_type="search_document")
```

### 3.3 Sentence-Transformers (local, free)

```python
from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-en-v1.5",  # 1024 dims, best open-source
    # model_name="intfloat/e5-mistral-7b-instruct",  # 4096 dims, heavy
    # model_name="thenlper/gte-large",  # 1024 dims, strong retrieval
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},  # cosine similarity
)

# BGE models require prefix for optimal retrieval
query = "Represent this sentence for searching relevant passages: What is RAG?"
documents = [f"{doc}" for doc in raw_docs]  # no prefix for documents
```

### Embedding model comparison

| Model | Dimensions | Quality | Cost | Latency |
|---|---|---|---|---|
| `text-embedding-3-small` | 1536 | Good | $0.02/1M | Fast API |
| `text-embedding-3-large` | 3072 | Best | $0.13/1M | Fast API |
| `embed-english-v3.0` | 1024 | Very good | $0.10/1M | Fast API |
| `BAAI/bge-large-en-v1.5` | 1024 | Very good | Free (local) | GPU recommended |
| `intfloat/e5-mistral-7b` | 4096 | SOTA (open) | Free (local) | GPU required |

---

## 4. Document Loaders

### 4.1 PDF

```python
from langchain_community.document_loaders import PyMuPDFLoader, PyPDFLoader

# PyMuPDFLoader — fastest, preserves structure
loader = PyMuPDFLoader("document.pdf")
docs = loader.load()  # one Document per page

# PyPDFLoader — fallback
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# For extracting tables + text
from langchain_community.document_loaders import PDFPlumberLoader
loader = PDFPlumberLoader("document.pdf")
docs = loader.load()
```

### 4.2 HTML

```python
from langchain_community.document_loaders import SeleniumURLLoader
from langchain_community.document_loaders import UnstructuredHTMLLoader

# From a file
loader = UnstructuredHTMLLoader("page.html")
docs = loader.load()

# From URLs (with JS rendering)
urls = ["https://example.com/docs/1", "https://example.com/docs/2"]
loader = SeleniumURLLoader(urls=urls, browser="firefox")
docs = loader.load()
```

### 4.3 Code Files

```python
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser

# Recursive loader for a codebase
loader = GenericLoader.from_filesystem(
    path="./src/",
    glob="**/*.py",
    suffixes=[".py"],
    parser=LanguageParser(language="python", parser_threshold=500),
)
docs = loader.load()
# Each Document: page_content=function/class body, metadata={"source": "src/main.py", "content_type": "function"}
```

### 4.4 Databases

```python
from langchain_community.document_loaders import SQLDatabaseLoader
from sqlalchemy import create_engine

engine = create_engine("postgresql://user:pass@host:5432/db")

loader = SQLDatabaseLoader(
    query="SELECT id, title, body, created_at FROM articles WHERE created_at > '2024-01-01'",
    engine=engine,
    content_columns=["title", "body"],      # columns to embed
    metadata_columns=["id", "created_at"],  # metadata
)
docs = loader.load()
```

### 4.5 Unstructured (catch-all)

```python
from langchain_community.document_loaders import UnstructuredFileLoader

# Auto-detects file type: .pdf, .docx, .html, .eml, .txt, .csv, .md
loader = UnstructuredFileLoader("document.docx", mode="elements")
docs = loader.load()
# mode="elements" returns granular chunks (titles, paragraphs, tables, list items)
```

---

## 5. Vector Store Configuration

### 5.1 Chroma (local, no external service)

```python
from langchain_chroma import Chroma

vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",
    collection_name="my_docs",
    collection_metadata={"hnsw:space": "cosine"},  # or "l2" or "ip"
)

# Reload from disk
vector_store = Chroma(
    embedding_function=embeddings,
    persist_directory="./chroma_db",
    collection_name="my_docs",
)

# Direct collection access for metadata filtering
collection = vector_store.get()
```

### 5.2 pgvector (PostgreSQL)

```python
from langchain_postgres import PGVector
from langchain_postgres.vectorstores import PGVector

connection = "postgresql+psycopg://user:pass@localhost:5432/ragdb"

vector_store = PGVector.from_documents(
    documents=chunks,
    embedding=embeddings,
    connection=connection,
    collection_name="my_docs",
    pre_delete_collection=False,
    use_jsonb=True,  # JSONB metadata for advanced filtering
)

# SQL-side: create HNSW index for fast ANN search
# CREATE INDEX ON my_docs USING hnsw (embedding vector_cosine_ops);
```

### 5.3 Pinecone (managed)

```python
from langchain_pinecone import PineconeVectorStore
import pinecone

pinecone.init(api_key="PINECONE_API_KEY")

# Create index (via SDK)
if "rag-index" not in pinecone.list_indexes():
    pinecone.create_index(
        name="rag-index",
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )

vector_store = PineconeVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_name="rag-index",
    namespace="default",
)
```

### 5.4 Weaviate (self-hosted or Cloud)

```python
import weaviate
from langchain_weaviate import WeaviateVectorStore

client = weaviate.connect_to_local(
    host="localhost",
    port=8080,
    grpc_port=50051,
)

vector_store = WeaviateVectorStore.from_documents(
    documents=chunks,
    embedding=embeddings,
    client=client,
    index_name="DocumentChunk",
    text_key="content",
)

# Weaviate hybrid search config
vector_store = WeaviateVectorStore(
    client=client,
    index_name="DocumentChunk",
    text_key="content",
    attributes=["source", "chunk_id"],
)
```

### Vector store comparison

| Store | Scaling | Cost | Speed | Hybrid | Free Tier |
|---|---|---|---|---|---|
| Chroma | Local only | Free | Fast | No | Unlimited |
| pgvector | Postgres scale | DB cost | Fast with HNSW | Yes (tsvector) | Unlimited |
| Pinecone | Automatic | $70+/month | Very fast | Yes | 1 pod free |
| Weaviate | Self/Cloud | Free/ paid | Fast | Yes | 100k vectors |

---

## 6. Retrieval Strategies

### 6.1 Basic Similarity Search

```python
# LangChain
docs = vector_store.similarity_search(
    query="What is the capital of France?",
    k=5,
    filter={"source": "geography.pdf"},  # metadata filter
)

# With scores
docs_with_scores = vector_store.similarity_search_with_score(
    "What is the capital of France?",
    k=5,
)
# Returns [(Document, score)] — lower score = more similar (cosine distance)
```

### 6.2 Maximum Marginal Relevance (MMR)

Diversifies results by penalizing redundancy:

```python
docs = vector_store.max_marginal_relevance_search(
    query="What is the capital of France?",
    k=5,
    fetch_k=20,  # fetch 20 candidates, then select 5 diverse ones
    lambda_mult=0.5,  # 0 = pure diversity, 1 = pure relevance
)

# MMR as retriever (LangChain LCEL)
retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.5},
)
```

### 6.3 Hybrid Search (semantic + BM25)

Combine dense (embedding) and sparse (keyword) retrieval:

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# BM25 retriever (keyword)
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 5

# Dense retriever (semantic)
semantic_retriever = vector_store.as_retriever(
    search_kwargs={"k": 5},
)

# Ensemble with weighted scores
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, semantic_retriever],
    weights=[0.3, 0.7],  # tune based on content type
)
docs = ensemble_retriever.invoke("What is the capital of France?")
```

### 6.4 Self-Querying Retriever

Extracts metadata filters from natural language questions:

```python
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain_community.query_constructors.chroma import ChromaTranslator
from langchain_openai import ChatOpenAI

metadata_field_info = [
    {"name": "source", "description": "Source filename", "type": "string"},
    {"name": "year", "description": "Publication year", "type": "int"},
    {"name": "author", "description": "Document author", "type": "string"},
]

document_content_description = "Government policy documents"

retriever = SelfQueryRetriever.from_llm(
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
    vector_store=vector_store,
    document_content_description=document_content_description,
    metadata_field_info=metadata_field_info,
    enable_limit=True,
)

# Query: "What policies were published in 2023 by Smith?"
# Automatically: vector search + filter year=2023 AND author=Smith
docs = retriever.invoke("Policies from 2023 by Smith")
```

### 6.5 Reranking with Cross-Encoder

Improves top-K quality by reranking with a cross-encoder model:

```python
from sentence_transformers import CrossEncoder
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker

reranker = CrossEncoderReranker(
    model=CrossEncoder("BAAI/bge-reranker-v2-m3"),  # or "cross-encoder/ms-marco-MiniLM-L-6-v2"
    top_n=3,
)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=semantic_retriever,
)

# Fetches 10 from semantic, reranks to 3 best
docs = compression_retriever.invoke("What is the capital of France?")
```

### 6.6 Query Rewriting

Transform the user query before retrieval to improve results:

```python
from langchain_core.prompts import ChatPromptTemplate

rewrite_prompt = ChatPromptTemplate.from_messages([
    ("system", "Rewrite the following query for better search results. "
     "Expand acronyms, fix typos, add context."),
    ("human", "{query}"),
])

def rewrite_query(query: str, llm) -> str:
    return llm.invoke(rewrite_prompt.format(query=query)).content

# Usage
raw_query = "RAG eval metrics?"
improved = rewrite_query(raw_query, llm)
# → "What are the evaluation metrics for Retrieval-Augmented Generation systems?"
docs = retriever.invoke(improved)
```

### Multi-Query Retrieval

Generate multiple query variants and merge results:

```python
from langchain.retrievers import MultiQueryRetriever

retriever = MultiQueryRetriever.from_llm(
    retriever=semantic_retriever,
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0.7),
    include_original=True,
)

# Internally: generates 3 query variants, retrieves for each, deduplicates
docs = retriever.invoke("Explain RAG architecture")
```

---

## 7. RAG Evaluation

### 7.1 RAGAS Metrics

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from datasets import Dataset

# Prepare evaluation data
eval_data = {
    "question": ["What is the capital of France?", "Explain RAG architecture"],
    "answer": ["The capital of France is Paris.", "RAG has retrieval and generation..."],
    "contexts": [
        ["Paris is the capital and most populous city of France."],
        ["RAG pipelines consist of a retriever and a generator component."],
    ],
    "ground_truth": [
        "Paris",
        "RAG stands for Retrieval-Augmented Generation, a pipeline with retrieval and generation.",
    ],
}

dataset = Dataset.from_dict(eval_data)

# Compute RAGAS scores
result = evaluate(
    dataset=dataset,
    metrics=[
        faithfulness,           # is the answer grounded in context? (0-1)
        answer_relevancy,       # how relevant is the answer to the question? (0-1)
        context_precision,      # are retrieved docs relevant? (0-1)
        context_recall,         # are all relevant docs retrieved? (0-1)
    ],
    llm=ChatOpenAI(model="gpt-4o", temperature=0),
    embeddings=OpenAIEmbeddings(),
)

print(result)
# {
#   "faithfulness": 0.95,
#   "answer_relevancy": 0.88,
#   "context_precision": 0.73,
#   "context_recall": 0.81,
# }
```

### 7.2 Custom Evaluation with LangSmith

```python
from langsmith import Client
from langsmith.evaluation import evaluate as langsmith_evaluate

client = Client()

# Define custom evaluator
def context_relevancy(run, example):
    contexts = run.outputs.get("contexts", [])
    question = example.inputs["question"]
    if not contexts:
        return {"score": 0, "key": "context_relevancy"}
    # Simple heuristic: fraction of contexts containing question tokens
    tokens = set(question.lower().split())
    matches = sum(
        1 for ctx in contexts if any(t in ctx.lower() for t in tokens)
    )
    return {"score": matches / len(contexts), "key": "context_relevancy"}

# Run evaluation on test dataset
results = langsmith_evaluate(
    lambda inputs: rag_chain.invoke(inputs["question"]),
    data="my-rag-testset",  # dataset name in LangSmith
    evaluators=[context_relevancy],
)
```

### 7.3 A/B Testing Retrieval Configurations

```python
import time
from collections import defaultdict

def benchmark_retrieval(
    queries: list[str],
    retrievers: dict[str, callable],
    relevant_docs: dict[str, list[str]],
) -> dict:
    results = defaultdict(dict)
    for name, retriever_fn in retrievers.items():
        latencies = []
        precisions = []
        for query in queries:
            start = time.perf_counter()
            docs = retriever_fn(query)
            latencies.append(time.perf_counter() - start)

            retrieved_ids = {d.metadata.get("id") for d in docs}
            relevant_ids = set(relevant_docs.get(query, []))
            hits = len(retrieved_ids & relevant_ids)
            precisions.append(hits / max(len(retrieved_ids), 1))

        results[name] = {
            "avg_latency_ms": sum(latencies) / len(latencies) * 1000,
            "avg_precision": sum(precisions) / len(precisions),
        }
    return dict(results)

# Usage
import json
print(json.dumps(benchmark_retrieval(test_queries, retrievers, gold), indent=2))
# {
#   "semantic": {"avg_latency_ms": 45.2, "avg_precision": 0.67},
#   "hybrid":   {"avg_latency_ms": 82.1, "avg_precision": 0.84},
#   "reranked": {"avg_latency_ms": 215.0, "avg_precision": 0.91},
# }
```

---

## 8. Quick Demo Patterns

### 8.1 Gradio

```python
import gradio as gr

def answer_question(question: str, history: list) -> str:
    docs = retriever.invoke(question)
    context = "\n\n".join(d.page_content for d in docs)
    response = llm.invoke(prompt.format(context=context, question=question))
    return response.content

with gr.Blocks(title="RAG Demo", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 📚 RAG Question Answering")

    with gr.Row():
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(label="Conversation", height=500)
            msg = gr.Textbox(
                label="Ask a question",
                placeholder="What is the capital of France?",
                lines=1,
            )
            clear = gr.ClearButton([msg, chatbot])

        with gr.Column(scale=1):
            source_display = gr.JSON(label="Retrieved Sources")

    def respond(message: str, chat_history: list):
        docs = retriever.invoke(message)
        context = "\n\n".join(d.page_content for d in docs)
        response = llm.invoke(prompt.format(context=context, question=message))
        sources = [
            {"content": d.page_content[:200], "source": d.metadata.get("source", "?")}
            for d in docs
        ]
        chat_history.append((message, response.content))
        return "", chat_history, sources

    msg.submit(respond, [msg, chatbot], [msg, chatbot, source_display])

demo.launch(share=False, server_port=7860)
```

### 8.2 Streamlit

```python
import streamlit as st

st.set_page_config(page_title="RAG Q&A", layout="wide")
st.title("📚 RAG Question Answering")

if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if "sources" in msg:
            with st.expander("Sources"):
                for s in msg["sources"]:
                    st.code(s["content"], line_limit=5)
                    st.caption(f"Source: {s['source']}")

if prompt := st.chat_input("Ask a question about your documents"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Searching documents..."):
            docs = retriever.invoke(prompt)
            context = "\n\n".join(d.page_content for d in docs)
            stream = llm.stream(prompt.format(context=context, question=prompt))
            response = st.write_stream(stream)

        sources = [
            {"content": d.page_content[:300], "source": d.metadata.get("source", "?")}
            for d in docs[:3]
        ]
        with st.expander("View source chunks"):
            for s in sources:
                st.markdown(f"**{s['source']}**")
                st.text(s["content"])

    st.session_state.messages.append({
        "role": "assistant", "content": response, "sources": sources,
    })
```

---

## 9. Production Checklist

- [ ] Chunk size and overlap chosen based on content type (not random defaults)
- [ ] Metadata enrichment applied (summaries, generated questions, keywords)
- [ ] Embedding dimensions match vector store config
- [ ] Vector store index type supports ANN (HNSW/IVF) — never brute-force
- [ ] Hybrid search configured (semantic + BM25 weights tuned)
- [ ] Reranker applied as second-stage filter
- [ ] Query rewriting improves retrieval — tested with real queries
- [ ] RAGAS metrics measured and above thresholds (faithfulness >0.9, context precision >0.7)
- [ ] Latency budget met (retrieval <200ms, generation <5s for typical query)
- [ ] Pagination/document deduplication in retrieval results
- [ ] Streaming generation enabled for UX
- [ ] Citation/source tracking in every response
