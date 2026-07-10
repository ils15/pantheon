# Contributing to Pantheon

## Git Flow

```
feature/* ──PR──→ develop (staging)
                      │
                      ▼  PR ← release gate
                     main (produção)
                      │
                      ▼ (auto)
              GitHub Release + tag
```

### Rules
1. **Features** → branch `feature/*` → PR **para `develop`**
2. **Integração** → PRs de `develop` para `main` apenas com bump de versão
3. **Releases** → automáticas no merge para `main`
4. **Branches** — apenas `main` e `develop` são mantidas. Feature branches são deletadas após merge

### Branch Protection
- `main`: requer PR + CI passando
- `develop`: requer PR + CI passando

### Versionamento
- `package.json`, `plugin.json`, `.github/plugin/plugin.json` — sempre sincronizados
- CHANGELOG.md segue formato `## [vX.Y.Z]`
- Release gate valida consistência antes do merge

### Releases
- Toda feature mergeada em `develop` aparece na próxima release
- Quando `develop` estiver pronto, bump de versão + PR para `main`
- Auto-release no merge para `main`: tag + GitHub Release
