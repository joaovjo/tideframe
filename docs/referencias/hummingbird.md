---
type: Reference
title: Hummingbird — Swift Package Multi-Target
description: Framework Swift server-side com Sources/, Tests/, Benchmarks/, docs/, docker/.
resource: examples/hummingbird
tags: [hummingbird, swift, multi-target, benchmarks, docker]
sources:
  - id: hummingbird
    resource: examples/hummingbird
    title: Hummingbird
    author: Hummingbird
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework Swift server-side com `Sources/`, `Tests/`, `Benchmarks/`, `docs/`, `docker/`. É referência de multi-target e de separação de benchmarks e docs.

# Padrões relevantes

- `Sources/` com targets por módulo.
- `Tests/` e `Benchmarks/` separados.
- `docs/` e `docker/` na raiz.
- `.hummingbird-project-template.yml` para templates de projeto.
- `AI_POLICY.md` e `CONTRIBUTING.md`.

# O que evitar

- Acoplamento a Swift e ao ecossistema SwiftPM.
- Multi-target excessivo para um framework TS.

# Arquivos

- `Sources/`, `Tests/`, `Benchmarks/`, `docs/`, `docker/`, `.hummingbird-project-template.yml`.

# Aplicação no <framework>

Usar como referência de separação de `Benchmarks/` e `docs/`. Inspirar a criação de templates de projeto (`create-framework`). Manter simplicidade: um único pacote, não multi-target.