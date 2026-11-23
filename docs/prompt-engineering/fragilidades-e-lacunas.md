---
type: Concept
title: Fragilidades e Lacunas do Formato
description: Pontos cegos do formato de especificação guiada por aceitação e como mitigá-los em prompts futuros.
tags: [prompt-engineering, lacunas, verificação]
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

# Fragilidades

| Fragilidade | Problema | Mitigação |
|---|---|---|
| Adjetivo sem número | "Small bundle size" não tem teto. | Defina limite explícito (ex.: ≤ 128 KB). |
| Alvo interno frouxo | 180 Hz sugere 5.5 ms, mas o teto é 16.7 ms. | Escreva a meta real: "90 fps médios, 60 fps mínimo". |
| Restrição não verificada | "Zero per-frame JS allocations" não está no `DONE WHEN`. | Adicione gate de alocação (heap snapshot ou contador). |
| Crítico com visão parcial | 6 poses não cobrem controles, mundo limitado, carga, extras. | Inclua poses de fronteira e um gate funcional. |
| "Minor" subjetivo | O nível de rigor do crítico varia. | Defina rubrica com exemplos e exija evidência. |
| Sem gate funcional | Console, carregamento, controles e memória ficam de fora. | Adicione "sem erros no console", "carrega em X s", "controles funcionam". |
| Sem orçamento de carga/memória | A experiência de abertura não é medida. | Defina orçamento de tempo de build e uso de memória. |
| Direção de arte delegada | A paleta fica por conta do modelo. | Forneça paleta/referências ou aceite variabilidade explicitamente. |

# Como mitigar

1. Quantifique todo adjetivo que puder.
2. Escreva o alvo real de frame time, não só o teto.
3. Inclua as restrições fortes no `DONE WHEN`.
4. Amplie o protocolo do crítico (poses, rubrica, evidência).
5. Adicione um gate funcional mínimo.
6. Defina orçamento de carga e memória.
7. Dê direção de arte ou declare a variabilidade aceitável.

# Referências

- [Princípios de Prompt Engineering](principios.md)
- [Abyssal Garden — Estudo de Caso](estudo-de-caso-abyssal-garden.md)