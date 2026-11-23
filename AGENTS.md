# AGENTS.md

Este projeto usa o bundle `docs/` como banco de conhecimentos central. Ele orienta a direção do projeto e deve ser a primeira fonte de contexto para qualquer agente ou pessoa.

## Regra principal

Todo novo conhecimento deve ser incluído no bundle `docs/`. Informações existentes devem ser atualizadas quando mudarem. Não deixe conhecimento relevante apenas em conversas, issues ou código.

## Como adicionar conhecimento

1. Identifique a seção: `docs/prompt-engineering` ou `docs/project` (crie outra se necessário).
2. Crie ou edite o concept `.md` com frontmatter YAML válido e campo `type`.
3. Conecte concepts com links relativos.
4. Atualize o `index.md` da seção e `docs/index.md`.
5. Registre a mudança em `docs/log.md`.

Veja o procedimento completo em [docs/project/gestao-do-conhecimento.md](docs/project/gestao-do-conhecimento.md).

## Convenções OKF

- Todo `.md` (exceto `index.md` e `log.md`) começa e termina com `---` contendo YAML válido.
- Todo frontmatter tem `type` não vazio.
- `index.md` e `log.md` são reservados e não são concepts.
- `log.md` registra mudanças em ordem cronológica decrescente.

## Direção do projeto

Consulte [docs/project/direcao.md](docs/project/direcao.md). Resumo:

- Especificação antes de implementação.
- Aceite por evidência.
- Crítico independente.
- Quantificar o que importa.
- Conhecimento versionado.
- Escopo explícito.

## Referências

- [docs/index.md](docs/index.md)
- [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)