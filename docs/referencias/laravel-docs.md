---
type: Reference
title: Laravel Docs — Mapa de Features
description: Documentação do Laravel organizada por feature, útil como inventário de batteries.
resource: examples/laravel-docs
tags: [laravel, docs, features, batteries]
sources:
  - id: laravel-docs
    resource: examples/laravel-docs
    title: Laravel Docs
    author: Laravel
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Documentação do Laravel em um `.md` por feature: routing, middleware, controllers, requests, responses, views, blade, session, validation, errors, logging, artisan, eloquent, migrations, seeding, redis, cache, queues, mail, notifications, events, broadcasting, filesystem, hashing, encryption, etc. Serve como mapa de batteries para o inventário do framework.

# Padrões relevantes

- Um documento por feature, com conceitos, API e exemplos.
- Cobertura de "batteries": HTTP, validação, sessão, cache, filas, mail, events, filesystem, hashing, encryption.
- Documentação versionada e rigorosamente mantida.

# O que evitar

- Copiar a API do Laravel; adaptar nomes e convenções ao Bun/TS.
- Incluir features que exigem infraestrutura pesada (ex.: broadcasting completo) no v1 sem necessidade.

# Arquivos

- `docs/*.md` — um por feature.

# Aplicação no <framework>

Usar como inventário de batteries e como checklist de features. Cada battery do framework deve ter documentação equivalente. Priorizar as batteries mais usadas (routing, validation, ORM, auth, cache, queue) para o v1.