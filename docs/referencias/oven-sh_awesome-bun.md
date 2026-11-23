---
type: Reference
title: oven-sh/awesome-bun — Mapa do Ecossistema Bun
description: Lista curada oficial do ecossistema Bun, útil como mapa de dependências e padrões.
resource: examples/oven-sh_awesome-bun
tags: [awesome-bun, bun, ecosystem, catalog]
sources:
  - id: oven-sh_awesome-bun
    resource: examples/oven-sh_awesome-bun
    title: oven-sh/awesome-bun
    author: oven-sh
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Lista curada oficial do ecossistema Bun (README + CONTRIBUTING). Serve como mapa para identificar capacidades existentes e padrões de uso do Bun.

# Padrões relevantes

- Categorias de HTTP, ORM, auth, queues, cache, testes, CLI.
- Referência de como a comunidade usa as APIs do Bun.
- Permite verificar se uma capability já existe.

# O que evitar

- Copiar código de terceiros.
- Depender de bibliotecas externas (zero deps de runtime).

# Arquivos

- `README.md`, `CONTRIBUTING.md`.

# Aplicação no <framework>

Consultar antes de implementar uma battery. Priorizar Bun APIs nativas e documentar o que foi adotado. Registrar achados em `docs/referencias/`.