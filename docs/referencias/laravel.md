---
type: Reference
title: Laravel — Skeleton de Aplicação
description: Skeleton de aplicação Laravel com estrutura convencional (app, routes, config, database, tests) e convenção sobre configuração.
resource: examples/laravel
tags: [laravel, app, skeleton, conventions]
sources:
  - id: laravel
    resource: examples/laravel
    title: Laravel
    author: Laravel
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Skeleton de aplicação Laravel: `app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`. Serve de modelo para o app de exemplo do framework e para convenções de layout.

# Padrões relevantes

- Estrutura previsível por convenção (routes, controllers, models, migrations).
- `bootstrap/` para inicialização.
- `config/` centralizado e publicável.
- `routes/` com arquivos por domínio (web, api, console).
- `tests/` com PHPUnit.
- `artisan` CLI na raiz.

# O que evitar

- Layout rígido imposto ao consumidor (o framework não deve exigir estrutura).
- Acoplamento a PHP e ao ciclo de vida do Laravel.

# Arquivos

- `app/`, `routes/`, `config/`, `database/`, `storage/`, `tests/`, `artisan`.

# Aplicação no <framework>

Usar como referência para o app de exemplo e para a CLI de scaffold (`create`). A convenção de "routes por domínio" pode inspirar o router, mas a estrutura do app deve ser opcional.