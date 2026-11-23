---
type: Reference
title: Nuxt — Monorepo com Playground
description: Framework Vue em monorepo com packages/, playground/, test/, docs/, bench/.
resource: examples/nuxt
tags: [nuxt, monorepo, packages, playground, vue]
sources:
  - id: nuxt
    resource: examples/nuxt
    title: Nuxt
    author: Nuxt
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework Vue em monorepo: `packages/`, `playground/`, `test/`, `docs/`, `bench/`. É referência de separação entre core e playground e de organização de bench.

# Padrões relevantes

- `packages/` com pacotes independentes.
- `playground/` para desenvolvimento e demos.
- `test/` separado.
- `docs/` e `bench/` separados.
- `AGENTS.md` e `ARCHITECTURE.md` na raiz.
- `pnpm-workspace.yaml` para workspaces.

# O que evitar

- Acoplamento a Vue e ao frontend.
- Complexidade do playground para um framework backend.

# Arquivos

- `packages/`, `playground/`, `test/`, `docs/`, `bench/`, `pnpm-workspace.yaml`.

# Aplicação no <framework>

Usar como referência de separação de `playground/` (ou `examples/`) e `bench/`. Inspirar a estrutura `docs/` e `AGENTS.md` na raiz. Manter o framework focado em backend.