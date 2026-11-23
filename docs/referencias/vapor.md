---
type: Reference
title: Vapor — Multi-Target Swift
description: Framework Swift server-side com Sources/<Target>, Tests/, Benchmarks/ e multi-target por Package.swift.
resource: examples/vapor
tags: [vapor, swift, multi-target, benchmarks]
sources:
  - id: vapor
    resource: examples/vapor
    title: Vapor
    author: Vapor
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework Swift server-side com `Sources/<Target>`, `Tests/`, `Benchmarks/`, `Performance/`, `Package.swift`. É referência de multi-target e de separação de benchmarks.

# Padrões relevantes

- `Sources/<Target>` com um target por camada (Core, HTTP, Routing, ...).
- `Tests/` e `Benchmarks/` separados.
- `Package.swift` define os targets e dependências.
- `security/` e `Performance/` para análise.
- `.spi.yml` para Swift Package Index.

# O que evitar

- Acoplamento a Swift e ao ecossistema SwiftPM.
- Multi-target excessivo para um framework TS.

# Arquivos

- `Sources/`, `Tests/`, `Benchmarks/`, `Performance/`, `security/`, `Package.swift`.

# Aplicação no <framework>

Usar como referência de separação de benchmarks e de multi-target. Inspirar a separação `benchmarks/` e `integration/` no repositório. Manter simplicidade: um único pacote, não multi-target.