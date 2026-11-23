---
type: Case Study
title: Abyssal Garden — Estudo de Caso
description: Análise do projeto Abyssal Garden e do prompt que o originou, usado como referência de especificação guiada por aceitação.
resource: https://github.com/Noniv/abyssal-garden
tags: [estudo-de-caso, webgpu, procedural, performance, prompt-engineering]
sources:
  - id: repo-abyssal-garden
    resource: https://github.com/Noniv/abyssal-garden
    title: Repositório Abyssal Garden
    author: Noniv
    last_modified: 2026-11-20T00:00:00Z
  - id: prompt-raw
    resource: https://raw.githubusercontent.com/Noniv/abyssal-garden/refs/heads/main/prompt.txt
    title: prompt.txt
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

# Resumo

Abyssal Garden é uma cena 3D subaquática procedural que roda no navegador em WebGPU puro, sem engine, sem arquivos de textura ou modelo. O entregável é um único `index.html` de ~97 KB. O prompt que o originou é uma especificação de produto com prioridades ordenadas, restrições, alvo numérico, inventário de cena, verificação independente e critério de término.

# O prompt

| Bloco | Função |
|---|---|
| `PRIORITIES` | Qualidade visual > pacing > tamanho. |
| `CONSTRAINTS` | Sem engines, WebGPU, tudo procedural, arquivo único, zero alocação por frame. |
| `TARGET` | Windows 11 25H2, Chrome 157, RTX 5070 Ti, Ryzen 7800X3D, 180 Hz, 2560×1440, GPU ≤ 11 ms, nenhum frame > 16.7 ms em voo de 60 s. |
| `SCENE` | Inventário: kelp, fog, god rays, caustics, superfície, cânions, fauna, nave, fluke de baleia, mundo limitado. |
| `CONTROLS` | WASD, mouse (pointer lock), Q/E, Shift. |
| `VERIFICATION` | Crítico cego com 6 poses + vídeo; GPU timestamps + log de frame time. |
| `DONE WHEN` | Dois gates: visual e performance. |

# Como o prompt foi cumprido

- **97 KB, sem engine, WebGPU direto.** Código legível em `source/` (`world.js`, `shaders.js`, `main.js`, `audio.js`, `quality.js`, `math.js`, `dev.js`, `template.html`).
- **Terreno SDF em compute.** `shaders.js` constrói o campo de densidade com fbm/worley, cânions, arcos e túneis.
- **Zero alocação por frame.** Kelp, peixes, mantas, bolhas e partículas são animados no vertex shader a partir de um único tempo (`g.cam.w`) e de atributos por instância.
- **God rays e caustics.** Raymarching em meia resolução com blur dependente de profundidade; textura animada de caustics; superfície com refração (IOR 1.33) e *Snell's window*.
- **Fronteira invisível.** Anel de terreno em ~156–172 m e fog que satura antes; o mundo é limitado, mas o limite não aparece da área inicial.
- **Extras não pedidos:** níveis Low/Medium/High, escala de resolução, áudio sintetizado, menu e suporte a toque.

# Métricas

| Métrica | Valor |
|---|---|
| Tamanho do `index.html` | ~97 KB |
| Folhas de kelp e plantas | ~2 milhões |
| FPS a 2560×1440 (RTX 5070 Ti) | ~180 fps (~5.5 ms) |
| Alvo do prompt | ≤ 11 ms médio, ≤ 16.7 ms máximo |

# Limitações

O prompt é forte, mas deixa lacunas: "small bundle size" sem teto numérico, tensão entre 180 Hz e o teto de 16.7 ms, "zero per-frame JS allocations" fora do `DONE WHEN`, crítico que vê só 6 poses, ausência de gate funcional (console, controles, carregamento, memória) e direção de arte delegada ao modelo. Ver [Fragilidades e Lacunas do Formato](fragilidades-e-lacunas.md).