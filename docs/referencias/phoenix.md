---
type: Reference
title: Phoenix — Submódulos e Realtime
description: Framework Elixir batteries-included com submódulos por domínio, canais, presence e guias para agentes.
resource: examples/phoenix
tags: [phoenix, elixir, realtime, channels, guides]
sources:
  - id: phoenix
    resource: examples/phoenix
    title: Phoenix
    author: Phoenix
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework Elixir batteries-included: `lib/phoenix/*`, `priv/`, `test/`, `guides/`, `usage-rules/`. Referência de submódulos por domínio, realtime (canais/presence) e documentação para agentes.

# Padrões relevantes

- `lib/phoenix/*` com submódulos por domínio (Router, Channel, Presence, Endpoint, ...).
- `guides/` e `usage-rules/` para agentes e documentação.
- `installer/` com `phx.new` para scaffold.
- `priv/` com assets e templates.
- `integration_test/` separado.
- Realtime via canais e presence.

# O que evitar

- Acoplamento a Elixir/Erlang e ao modelo de atores.
- Complexidade de realtime completa no v1 (adotar WebSockets básicos).

# Arquivos

- `lib/phoenix/`, `guides/`, `usage-rules/`, `installer/`, `priv/`, `test/`, `integration_test/`.

# Aplicação no <framework>

Usar como modelo de submódulos por domínio e de `guides/` + `usage-rules/` para agentes. Inspirar a CLI de scaffold (`create`) e o realtime básico via WebSockets. Adotar a ideia de documentação para agentes.