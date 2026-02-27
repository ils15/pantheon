---
name: internet-search
description: "Web research and internet search — query construction, source selection, academic databases (Semantic Scholar, CrossRef, arXiv), GitHub search, official documentation lookup, result filtering and synthesis. Use when tasks require external knowledge, up-to-date docs, library references, scientific literature, or technology best practices not available in the codebase."
---

# Internet Search Skill

## When to Use

Use this skill when:
- Looking up library documentation, API references, or framework best practices
- Searching for scientific papers or technical literature
- Finding GitHub repos, issues, PRs, or community solutions
- Checking the latest version of a dependency or tool
- Validating an architectural approach against external references
- Fetching real-world data (LULC product specs, sensor band definitions, etc.)

---

## 1. Tool Available: `web/fetch`

VS Code agents use the `web/fetch` tool to retrieve web pages. It returns the page content as text (HTML stripped or Markdown).

```
web/fetch(url)    → returns page text
```

**Always prefer structured APIs** (returning JSON/XML) over raw HTML scraping — they are faster, more reliable, and need no parsing.

---

## 2. Search Strategies by Category

### 2.1 General Web Search

There is no direct Google/Bing API in VS Code agents. Use structured query URLs that return useful content:

```
# DuckDuckGo instant answers (text summaries)
https://api.duckduckgo.com/?q={QUERY}&format=json&no_html=1&skip_disambig=1

# Wikipedia summary
https://en.wikipedia.org/api/rest_v1/page/summary/{TOPIC}

# MDN Web Docs (JavaScript / Web APIs)
https://developer.mozilla.org/en-US/search?q={QUERY}
```

### 2.2 Academic / Scientific Literature

Best sources for peer-reviewed papers:

```yaml
# Semantic Scholar — returns papers, abstracts, citations (FREE, no key required)
semantic_scholar_search: "https://api.semanticscholar.org/graph/v1/paper/search?query={TERM}&fields=title,authors,year,abstract,citationCount,openAccessPdf&limit=10"
semantic_scholar_paper:  "https://api.semanticscholar.org/graph/v1/paper/{PAPER_ID}?fields=title,authors,year,abstract,references"

# CrossRef — DOI resolution, journal filtering, date ranges
crossref_search: "https://api.crossref.org/works?query={TERM}&filter=type:journal-article,from-pub-date:2020&rows=10&sort=relevance"

# arXiv — preprints (cs, physics, eess, q-bio)
arxiv_search: "https://export.arxiv.org/api/query?search_query=all:{TERM}&start=0&max_results=10&sortBy=relevance"

# EarthArXiv — geoscience and remote sensing preprints
eartharxiv: "https://eartharxiv.org/repository/search/?q={TERM}"

# MDPI Remote Sensing (open access)
mdpi_rs: "https://www.mdpi.com/search?q={TERM}&journal=remotesensing&article_type=research-article"

# Google Scholar (no official API — fetch HTML with caution; rate-limited)
# Prefer Semantic Scholar as equivalent
```

**Example — fetch top 5 papers on a topic:**
```
web/fetch("https://api.semanticscholar.org/graph/v1/paper/search?query=change+detection+SAR+deep+learning&fields=title,authors,year,abstract,citationCount&limit=5")
```

### 2.3 GitHub Search

```yaml
# Search repositories
github_repos: "https://api.github.com/search/repositories?q={QUERY}&sort=stars&order=desc"

# Search code
github_code: "https://api.github.com/search/code?q={QUERY}+language:python"

# Search issues
github_issues: "https://api.github.com/search/issues?q={QUERY}+repo:{OWNER}/{REPO}"

# Get README of a repo
github_readme: "https://raw.githubusercontent.com/{OWNER}/{REPO}/main/README.md"

# Get file from repo
github_file: "https://raw.githubusercontent.com/{OWNER}/{REPO}/main/{PATH}"
```

### 2.4 Software Documentation

```yaml
# PyPI package info
pypi: "https://pypi.org/pypi/{PACKAGE}/json"

# npm package info
npm: "https://registry.npmjs.org/{PACKAGE}"

# Read the Docs / Sphinx sites — fetch directly
# e.g. rasterio docs: https://rasterio.readthedocs.io/en/stable/
# e.g. FastAPI docs:  https://fastapi.tiangolo.com/

# Python standard library
python_docs: "https://docs.python.org/3/library/{MODULE}.html"
```

### 2.5 Remote Sensing & Geospatial Data Sources

```yaml
# Earth Engine dataset catalog
gee_catalog: "https://developers.google.com/earth-engine/datasets/catalog/{DATASET_ID}"

# STAC browser — search spatiotemporal assets
stac_planetary: "https://planetarycomputer.microsoft.com/api/stac/v1/search"
stac_element84: "https://earth-search.aws.element84.com/v1/collections"

# USGS Landsat product specifications
usgs_landsat: "https://www.usgs.gov/landsat-missions/landsat-collection-2"

# Copernicus / Sentinel product specs
sentinel_docs: "https://sentinel.esa.int/web/sentinel/technical-guides"

# MapBiomas collection docs
mapbiomas_docs: "https://mapbiomas.org/en/colecoes-mapbiomas-1"
```

---

## 3. Query Construction Best Practices

### Use Specific, Targeted Queries

```
❌ Too broad:  "machine learning remote sensing"
✅ Specific:   "U-Net semantic segmentation Sentinel-2 deforestation 2022"

❌ Too broad:  "Python async"
✅ Specific:   "FastAPI background tasks SQLAlchemy async session 2024"
```

### Add Filters When Available

```
# Date filter (CrossRef)
&filter=from-pub-date:2021

# Language filter (GitHub)
+language:python

# Journal filter (MDPI)
&journal=remotesensing

# Document type (CrossRef)
&filter=type:journal-article
```

### Encode Spaces and Special Characters

```python
# URL-encode the query before passing
import urllib.parse
query = urllib.parse.quote("change detection SAR backscatter")
url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit=5"
```

---

## 4. Parallel Search Strategy

When researching a topic, launch multiple searches simultaneously:

```
PARALLEL:
  1. web/fetch(semantic_scholar: "conceptual overview paper")
  2. web/fetch(github_repos: "reference implementation")
  3. web/fetch(pypi: "relevant library")
  4. web/fetch(official docs: "API reference")

→ Synthesise all results before responding
→ Cite sources with title + URL + year
```

---

## 5. Result Synthesis Template

After fetching, always return structured findings:

```markdown
## Research Findings: {TOPIC}

### Key Papers
| Title | Authors | Year | Key Finding |
|-------|---------|------|-------------|
| [Paper Title](url) | Smith et al. | 2023 | ... |

### Reference Implementations
| Repo | Stars | Notes |
|------|-------|-------|
| [repo/name](url) | 1.2k | FastAPI + SQLAlchemy pattern |

### Official Docs
- [Library Name Docs](url) — relevant section: ...

### Recommendation
Based on the above: [concise recommendation with justification]
```

---

## 6. Quality Guidelines

- **Prefer primary sources**: official docs > tutorials > blog posts
- **Check recency**: flag papers or libraries older than 5 years if the field moves fast
- **Verify open access**: for academic papers, prefer PDFs available via `openAccessPdf` in Semantic Scholar
- **Avoid hallucinating URLs**: only use URLs from fetch results or known stable patterns above
- **Cite everything**: always include author/year/URL so the user can verify independently
- **Stop at 3-5 sources**: do not over-fetch. Synthesise quickly and offer to dig deeper on request.

---

## 7. Rate Limits & Etiquette

| API | Limit | Notes |
|-----|-------|-------|
| Semantic Scholar | 100 req/5 min (unauthenticated) | Add API key via header for higher limits |
| CrossRef | 50 req/s | Use `mailto=` param for polite pool |
| arXiv | ~3 req/s | Add delay between calls if batching |
| GitHub (unauthenticated) | 10 req/min search, 60 req/hr general | Prefer authenticated for heavy use |
| PyPI | No official limit | Very permissive |

```
# CrossRef polite pool (faster, prioritised)
https://api.crossref.org/works?query={TERM}&mailto=your@email.com
```
