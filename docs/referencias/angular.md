---
type: Reference
title: Angular — Monorepo Grande com Bazel
description: Framework frontend em monorepo grande com packages/, modules/, integration/, Bazel e fronteiras de pacotes.
resource: examples/angular
tags: [angular, monorepo, bazel, packages, frontend]
sources:
  - id: angular
    resource: examples/angular
    title: Angular
    author: Angular
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework frontend em monorepo grande: `packages/`, `modules/`, `adev/`, `devtools/`, `integration/`, `pnpm-workspace.yaml`, Bazel. É referência de organização de monorepo grande e fronteiras de pacotes.

# Padrões relevantes

- `packages/` com pacotes independentes.
- `modules/` com submódulos por domínio.
- `integration/` separado do core.
- `adev/` e `devtools/` para documentação e ferramentas.
- `pnpm-workspace.yaml` + Bazel para builds.
- `packages/private/testing/` para utilitários de teste.

# O que evitar

- Complexidade de Bazel e build system pesado.
- Frontend não é o foco (sem templates, sem DI por decorators).
- Monorepo grande demais para um framework backend focado.

# Arquivos

- `packages/`, `modules/`, `integration/`, `adev/`, `devtools/`, `pnpm-workspace.yaml`.

# Aplicação no <framework>

Usar como referência de fronteiras de pacotes e de separação de `integration/` e `devtools/`. Manter o build simples (Bun, sem Bazel). Inspirar a separação de `examples/` e `integration/`. Evitar a complexidade de um monorepo grande.