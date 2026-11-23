---
type: Reference
title: Next.js — Monorepo JS + Rust
description: Monorepo Next.js com packages/, apps/, crates/, turbopack/, test/, examples/, docs/.
resource: examples/next.js
tags: [nextjs, monorepo, packages, rust, examples, docs]
sources:
  - id: nextjs
    resource: examples/next.js
    title: Next.js
    author: Vercel
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Monorepo Next.js: `packages/`, `apps/`, `crates/`, `turbopack/`, `test/`, `examples/`, `docs/`. É o modelo de monorepo que o usuário pediu para adotar: `packages/framework`, `packages/create-framework`, `examples/`, `benchmarks/`, `integration/`, `docs/`.

# Padrões relevantes

- `packages/next/` como pacote principal; `packages/create-next-app/`, `packages/font/`, etc. como auxiliares.
- `examples/` com apps de exemplo.
- `test/` com e2e, development, production, unit.
- `docs/` separado.
- `scripts/` para build e manutenção.
- `turbo.json` para orquestração.
- `packages/next/src/` com `server/`, `client/`, `build/`.
- AGENTS.md extenso com regras de desenvolvimento.

# O que evitar

- Complexidade de Rust/SWC e de build system pesado.
- Monorepo grande demais para um framework focado.
- Testes e2e pesados para o v1.

# Arquivos

- `packages/`, `examples/`, `test/`, `docs/`, `scripts/`, `turbo.json`.

# Aplicação no <framework>

Adotar a estrutura do monorepo: `packages/framework` (framework + batteries internas), `packages/create-framework` (scaffold), `examples/`, `benchmarks/`, `integration/`, `docs/`. Inspirar a separação de `test/` por tipo (unit, integration). Manter o build simples (Bun, sem Rust/Turbopack).