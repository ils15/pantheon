# Mirror Deps — Clone Dependency Source

Clone a dependency's source locally so you can read its implementation directly instead of relying on docs or stale training data.

**Dependency:** $ARGUMENTS

## Protocol

1. Resolve the GitHub repo for the given package name or URL.
2. Check if already cloned in `.deps/`.
3. Clone into `.deps/<package-name>/` (shallow, depth 1).
4. Index key files — entry point, main exports, relevant internals.
5. Report findings:
   - Repo URL
   - Clone path
   - Key files to read
   - Relevant internal APIs or patterns

## Clone Command

```bash
git clone --depth 1 <repo-url> .deps/<package-name>
```

## When to Use

- Package behavior isn't accurately documented
- Agents are hallucinating API shapes or missing undocumented patterns
- Debugging an integration issue that requires reading the source

## After Cloning

```
Read .deps/<package-name>/src/ to understand how <X> works, then implement the integration.
```
