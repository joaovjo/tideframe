---
type: Reference
title: AdonisJS Core — Separação por Responsabilidade
description: Core do AdonisJS em TS/Node com IoC container, routing, middleware, providers, services, commands e stubs.
resource: examples/adonisjs-core
tags: [adonisjs, core, typescript, ioc, commands, stubs]
sources:
  - id: adonisjs-core
    resource: examples/adonisjs-core
    title: AdonisJS Core
    author: AdonisJS
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Core do AdonisJS em TypeScript: `src/`, `modules/`, `providers/`, `services/`, `commands/`, `stubs/`, `toolkit/`, `factories/`, `types/`. É o modelo mais próximo do nosso stack (TS) para IoC, routing, middleware, config e CLI.

# Padrões relevantes

- `providers/` registram serviços no container (IoC).
- `services/` contêm lógica reutilizável.
- `commands/` expõem comandos CLI; `stubs/` são templates de geração.
- `modules/` agrupam por domínio.
- `toolkit/` com helpers de desenvolvimento.
- `types/` com definições públicas.
- `package.json` + `tsconfig.json` + `index.ts` como entry point.

# O que evitar

- Acoplamento a Node.js e ao ecossistema AdonisJS (Lucid, etc.).
- Over-abstraction em providers para um framework mais simples.

# Arquivos

- `src/`, `modules/`, `providers/`, `services/`, `commands/`, `stubs/`, `toolkit/`, `types/`, `index.ts`.

# Aplicação no <framework>

Usar como modelo de estrutura de um framework TS: separação por responsabilidade, providers/services, commands + stubs para CLI, types públicos. Adotar a ideia de `modules/` por domínio, mas manter simplicidade.<|end|>