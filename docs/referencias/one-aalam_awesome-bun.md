---
type: Reference
title: one-aalam/awesome-bun — Mapa do Ecossistema Bun
description: Lista curada de bibliotecas e ferramentas do ecossistema Bun, útil como mapa de dependências e padrões.
resource: examples/one-aalam_awesome-bun
tags: [awesome-bun, bun, ecosystem, catalog]
sources:
  - id: one-aalam_awesome-bun
    resource: examples/one-aalam_awesome-bun
    title: one-aalam/awesome-bun
    author: one-aalam
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Lista curada de bibliotecas e ferramentas do ecossistema Bun (README only). Serve como mapa para identificar o que o Bun já oferece e o que precisamos implementar.

# Padrões relevantes

- Categorias: HTTP servers, ORMs, auth, queues, testing, CLI, etc.
- Permite verificar se uma capability já existe no ecossistema Bun.
- Útil para evitar reimplementar o que já existe.

# O que evitar

- Copiar código de terceiros.
- Depender de bibliotecas externas (zero deps de runtime).

# Arquivos

- `README.md`.

# Aplicação no <framework>

Consultar antes de implementar uma battery: se o Bun ou o ecossistema já oferece, usar ou adaptar. Registrar achados em `docs/referencias/`. Priorizar Bun APIs nativas.