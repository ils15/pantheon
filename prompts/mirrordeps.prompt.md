---
name: mirrordeps
description: "Clone a dependency's source locally so agents can read its implementation directly instead of relying on docs or stale knowledge"
agent: apollo
tools: ['search', 'execute/runInTerminal', 'read/readFile']
---

# Mirror Deps — Clone Dependency Source (Apollo)

## Dependency

$input

---

## Protocol

1. **Resolve the source** — find the GitHub repo for the given package or URL.
2. **Check if already cloned** — look in `vendor/`, `.deps/`, or a `deps/` directory.
3. **Clone into `.deps/<package-name>/`** — shallow clone (depth 1) to save space.
4. **Index key files** — identify the entry point, main exports, and any internal modules relevant to the current task.
5. **Report findings** — return a structured summary:
   - Repo URL
   - Clone path
   - Key files to read
   - Relevant internal APIs or patterns found

---

## Clone Command

```bash
git clone --depth 1 <repo-url> .deps/<package-name>
```

---

## When to Use

- The package has behavior that isn't accurately documented
- You need to understand internal implementation (not just public API)
- Agents are hallucinating API shapes or missing undocumented patterns
- Debugging an integration issue that requires reading the source

## After Cloning

Point agents at the cloned source:
```
@hermes: Read .deps/<package-name>/src/ to understand how <X> works, then implement the integration
```
