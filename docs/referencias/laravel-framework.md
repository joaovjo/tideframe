---
type: Reference
title: Laravel Framework — Componentes Independentes
description: Framework PHP batteries-included com componentes independentes sob src/Illuminate/*, config e testes próprios.
resource: examples/laravel-framework
tags: [laravel, framework, php, batteries-included, components]
sources:
  - id: laravel-framework
    resource: examples/laravel-framework
    title: Laravel Framework
    author: Laravel
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework backend completo em PHP, batteries-included, com cada componente (Routing, Eloquent, Queue, Auth, Cache, Mail, etc.) em `src/Illuminate/*` e `config-stubs/`. É o modelo de "batteries-included" que inspira o inventário do nosso framework.

# Padrões relevantes

- Componentes independentes com namespaces próprios (`Illuminate\Routing`, `Illuminate\Database`, ...), cada um com sua config e testes.
- `config/` e `config-stubs/` fornecem configuração padrão versionada.
- `bin/` e `commands/` expõem CLI (artisan).
- `tests/` e `types/` separados do `src/`.
- Stubs para geração de código (`stubs/`).
- Providers (`providers/`) registram serviços no container.

# O que evitar

- Componentes PHP acoplados ao ciclo de vida do Laravel; adaptar, não copiar.
- Uso de facades estáticos (anti-padrão para um framework TS tipado).

# Arquivos

- `src/` — implementação de cada componente.
- `config-stubs/` — configurações padrão.
- `tests/` — testes por componente.
- `bin/`, `commands/` — CLI.
- `types/` — definições de tipos.

# Aplicação no <framework>

Usar como inventário de batteries e como modelo de "componentes independentes dentro de um repositório". Cada módulo em `src/<modulo>` espelha um `Illuminate/*`. Copiar a ideia de `config-stubs/` para defaults versionados.