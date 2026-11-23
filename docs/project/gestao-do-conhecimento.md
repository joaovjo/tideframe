---
type: Playbook
title: Gestão do Banco de Conhecimento
description: Procedimento para adicionar, atualizar e revisar conhecimento no bundle docs.
tags: [okf, conhecimento, processo, documentação]
sources:
  - id: okf-spec
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
    title: Open Knowledge Format Specification
    author: Google Cloud Platform
generated:
  by: agent:opencode/v2
  at: 2026-11-22T00:00:00Z
status: stable
---

# Trigger

Este procedimento é executado sempre que:
- uma decisão técnica ou de processo for tomada;
- um aprendizado relevante for produzido;
- uma informação existente ficar desatualizada.

# Steps

1. Identifique a seção do bundle: `prompt-engineering` ou `project` (crie outra se necessário).
2. Crie ou edite o concept `.md` com frontmatter YAML válido e campo `type` não vazio.
3. Use links relativos para conectar concepts relacionados.
4. Atualize o `index.md` da seção e o `docs/index.md`.
5. Registre a mudança em `docs/log.md` com data e ação (`Create`, `Update`, `Deprecate`).
6. Se o concept mudar de estado, atualize `status` e `stale_after`.

# Verificação

- Todo `.md` (exceto `index.md` e `log.md`) tem frontmatter e `type`.
- `index.md` e `log.md` não são usados como concepts.
- Links quebrados são tolerados, mas devem ser resolvidos assim que o documento existir.