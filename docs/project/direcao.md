---
type: Concept
title: Direção do Projeto
description: Diretrizes e prioridades que orientam as decisões técnicas e de processo do projeto.
tags: [projeto, direção, processo]
sources:
  - id: prompt-abyssal-garden
    resource: https://raw.githubusercontent.com/Noniv/abyssal-garden/refs/heads/main/prompt.txt
    title: prompt.txt do Abyssal Garden
    author: Noniv
generated:
  by: agent:opencode/v2
  at: 2026-11-22T00:00:00Z
status: stable
---

# Diretrizes

1. **Especificação antes de implementação.** Todo trabalho relevante começa com uma especificação curta: prioridades ordenadas, restrições, alvo numérico e critério de término.
2. **Aceite por evidência.** Nada é considerado pronto sem evidência: render, log de performance, teste ou revisão independente.
3. **Crítico independente.** Avaliações de qualidade devem ser feitas por quem não participou da implementação e não vê o código.
4. **Quantificar o que importa.** Substitua adjetivos por números sempre que possível.
5. **Conhecimento versionado.** Toda decisão e aprendizado entra no bundle `docs` e é atualizado quando muda.
6. **Escopo explícito.** O que não está na especificação não está no escopo; extras precisam ser registrados.

# Prioridades

1. Correção e verificação.
2. Clareza e manutenibilidade.
3. Performance dentro do alvo.
4. Tamanho e simplicidade.

# Referências

- [Princípios de Prompt Engineering](/prompt-engineering/principios.md)
- [Gestão do Banco de Conhecimento](/project/gestao-do-conhecimento.md)