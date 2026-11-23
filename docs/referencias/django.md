---
type: Reference
title: Django — Batteries-Included Monolítico
description: Framework Python batteries-included com core monolítico, ORM, migrations, admin, auth, cache, signals, middleware, docs rigorosas, testes por área e scripts de release.
resource: examples/django
tags: [django, python, batteries-included, monolito, orm, migrations, admin, docs]
sources:
  - id: django
    resource: examples/django
    title: Django
    author: Django Software Foundation
generated:
  by: agent:opencode/deepseek-v4.1-flash-free
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework Python batteries-included há duas décadas: ORM, migrations, admin, auth, cache, signals, middleware, forms, templates e testes vivem no mesmo pacote `django/`. A raiz separa o produto (`django/`), a documentação (`docs/`) e a validação (`tests/`, `js_tests/`), com `extras/` e `scripts/` para o processo de desenvolvimento. É a referência mais completa do repositório para "o framework já traz o essencial", mas também o exemplo do custo de um core monolítico.

# Padrões relevantes

- **Batteries no core, opcionais isolados.** `django/contrib/` agrupa admin, auth, sessions, messages, staticfiles, contenttypes, sites, sitemaps, redirects, postgres e gis; `pyproject.toml` deixa argon2/bcrypt como `optional-dependencies`.
- **Registro de apps explícito.** `django/apps/config.py` e `registry.py` dão identidade, ordem de inicialização e `ready()` a cada app — ponto de extensão sem modificar o core.
- **Migrations como subsistema próprio.** `django/db/migrations/` separa `autodetector`, `graph`, `state`, `optimizer`, `executor`, `recorder` e `writer`; mudanças de schema são detectadas, ordenadas por grafo e aplicadas com histórico.
- **Pipeline de request em camadas.** `django/core/handlers/`, `django/middleware/` e `django/urls/` mantêm HTTP, middleware e roteamento independentes das batteries.
- **Sinais desacoplados.** `django/dispatch/` + `django/core/signals.py` e `signals.py` por app (ex.: `contrib/auth/signals.py`, `django/test/signals.py`) permitem extensão sem herança.
- **Configuração e checagem.** `django/conf/` centraliza settings; `django/core/checks/` valida o projeto em tempo de boot (`manage.py check`), antes de falhar em runtime.
- **Docs como produto.** `docs/` é Sphinx com divisão estável: `intro/`, `topics/`, `howto/`, `ref/`, `faq/`, `internals/`, `releases/` (`docs/contents.txt`), além de `lint.py` e `spelling_wordlist`.
- **Testes por área, não por arquivo.** `tests/` tem ~220 diretórios nomeados pelo comportamento (`migrations`, `signals`, `middleware`, `cache`, `auth_tests`, `admin_views`), rodados por `tests/runtests.py`.
- **Processo automatizado.** `scripts/check_migrations.py`, `verify_release.sh`, `do_django_release.py`, `manage_translations.py` e `scripts/pr_quality/` tornam release e revisão repetíveis.

# O que evitar

- Monolito que impede adoção incremental: no Django, usar ORM obriga a aceitar settings, apps e migrations juntos.
- Acoplamento a templates/forms no core — fora do nosso escopo frontend-agnóstico.
- Configuração global mutável (`settings` como singleton) em vez de opções explícitas por instância.
- Mágica implícita de metaclasses e convenções que exigem conhecer o framework para ler o código.
- ORM completo com lazy querysets e identidade de objetos no v1: alto custo, pouca evidência de necessidade.
- Admin como produto separado e grande: no nosso caso, uma superfície mínima de inspeção.

# Arquivos

- `django/db/models/`, `django/db/migrations/` — ORM e evolução de schema.
- `django/contrib/{admin,auth,sessions,messages,staticfiles}/` — batteries canônicas.
- `django/core/{cache,checks,handlers,management,signals}.py` — infraestrutura do core.
- `django/apps/`, `django/conf/`, `django/dispatch/`, `django/middleware/`, `django/test/`.
- `docs/{intro,topics,howto,ref,internals}/`, `tests/`, `scripts/`, `extras/`, `pyproject.toml`.

# Aplicação no <framework>

Copiar o **inventário**, não o acoplamento: ORM + migrations, auth, cache, signals, middleware e testes entram como módulos opt-in registrados por um registry leve (modelo de `AppConfig`), com imports só quando habilitados. Migrations seguem a decomposição do Django (`autodetector` → `graph` → `executor` → `recorder`) reduzida a um caso SQLite-first. Auth nasce de primeira classe (sessões, hashing, validação de senha) porque é o que mais se reimplementa; admin fica como CLI de inspeção, não como UI. Adotar `check`/doctor e `scripts/check_migrations` no CI, e espelhar a divisão de docs (`intro/topics/howto/ref`) para manter documentação rigorosa e versionada. Alinhado às prioridades de [Direção do Projeto](../project/direcao.md): escopo explícito, evidência por teste e zero dependências externas.
