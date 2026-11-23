---
type: Concept
title: Princípios de Prompt Engineering
description: Sete princípios para escrever especificações dirigidas a agentes de IA, derivados da análise do prompt do Abyssal Garden.
tags: [prompt-engineering, spec-driven, ia, processo]
sources:
  - id: prompt-abyssal-garden
    resource: https://raw.githubusercontent.com/Noniv/abyssal-garden/refs/heads/main/prompt.txt
    title: prompt.txt do Abyssal Garden
    author: Noniv
  - id: video-viktorkav
    resource: https://www.youtube.com/watch?v=zxnhLHFzBhg
    title: O Claude entrega Gráficos AAA em Menos de 100KB
    author: ViktorKav
    last_modified: 2026-11-20T00:00:00Z
generated:
  by: agent:opencode/v2
  at: 2026-11-22T00:00:00Z
status: stable
---

# Princípios

| Princípio | O que é | Efeito |
|---|---|---|
| Prioridades ordenadas | Liste o que importa em ordem de desempate. | Resolve conflitos sem o agente adivinhar. |
| Restrições negativas | Proíba caminhos fáceis (engines, assets, bibliotecas). | Força a solução real. |
| Números no lugar de adjetivos | Troque "rápido/leve/bonito" por métricas. | Torna o alvo verificável. |
| Inventário como checklist | Liste os itens de escopo explicitamente. | Evita esquecimento e diluição. |
| Crítico independente | Um avaliador que só vê o resultado, nunca o processo. | Impede autoavaliação complacente. |
| Definição de término | Escreva a condição de saída. | Evita loop infinito de ajustes. |
| Molde reutilizável | Separe o método do pedido. | Permite aplicar a outro domínio. |

# Aplicação

1. Comece pelas prioridades e restrições, antes de descrever o resultado.
2. Quantifique tudo que for mensurável (tempo, tamanho, resolução, cobertura).
3. Defina o que o avaliador pode e não pode ver.
4. Termine com "Done when" e um gate por dimensão (estética, performance, funcional).

# Referências

- [Abyssal Garden — Estudo de Caso](estudo-de-caso-abyssal-garden.md)
- [Fragilidades e Lacunas do Formato](fragilidades-e-lacunas.md)