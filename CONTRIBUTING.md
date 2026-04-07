# Contributing Guide

Este guia descreve como contribuir no estado atual do repositorio.

## Estado atual do projeto

- Estrutura principal: `front` (Next.js) e `back` (NestJS).
- Orquestracao local: `compose.development.yaml`.
- Orquestracao de producao: `compose.production.yaml`.
- CI: `.github/workflows/ci.yml`.
- CD: `.github/workflows/cd.yml`.
- Automacao de board: `.github/workflows/project-automation.yml`.

## Requisitos

- Bun (versao atual)
- Docker + Docker Compose
- Git

## Setup local

1. Clone o repositorio.
2. Copie as variaveis de ambiente:
   - `cp .env.example .env`
3. Instale dependencias:
   - `bun install`
4. Suba o ambiente:
   - `make dev`

Servicos esperados:
- `front`: `http://localhost:3000`
- `back`: `http://localhost:3001`
- `postgres`: `localhost:5432`

## Workflow de desenvolvimento

- Use branch curta a partir de `main`.
- Faça commits pequenos e frequentes.
- Abra PR para `main`.
- Aguarde CI verde antes de merge.

Exemplos de branch:
- `feat/42-auth-login`
- `fix/103-compose-dev`
- `docs/120-update-contributing`

## Padrão de commit

Use Conventional Commits:

```text
type(scope): descricao
```

Tipos mais usados:
- `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `build`, `chore`

Exemplos:
- `feat(api): add health endpoint`
- `fix(dev): isolate node_modules in compose`
- `docs(contributing): rewrite guide for current repo`

## Hooks de commit (estado atual)

- `pre-commit`: roda Biome (com fallback caso deps nao estejam instaladas).
- `commit-msg`: valida formato do commit com commitlint (com fallback).

Observacao:
- Os hooks estao configurados para nao bloquear bootstrap inicial sem dependencias locais.
- Depois de estabilizar, o ideal e endurecer esses gates.

## CI/CD

### CI (`ci.yml`)

Trigger:
- PR aberta/sincronizada/reaberta/ready_for_review (nao draft).

Etapas:
1. Checkout
2. Setup Bun
3. `bun install`
4. `bun run lint`
5. `bun run build`
6. `bun run test`

### CD (`cd.yml`)

Trigger:
- Push em `main`.

Etapa:
- Chama webhook de deploy via `COOLIFY_WEBHOOK_URL`.

Secrets necessarios:
- `COOLIFY_WEBHOOK_URL`
- `PROJECT_TOKEN` (para automacao de board)

## Automacao do project board

Arquivo: `.github/workflows/project-automation.yml`

Fluxos cobertos:
- issue aberta -> Todo
- PR aberta -> Waiting for review
- review solicitada -> In review
- changes requested -> Changes requested
- push apos changes requested -> Waiting for review
- PR mergeada -> Done

Importante:
- Referencie issue no corpo da PR (`Closes #123`, `Fixes #123`, `Resolves #123`).

## Comandos uteis

- `make dev`
- `make lint`
- `make test`
- `make build-prod`

## O que ainda nao esta completo

- Dominio de negocio real (auth/users/todos completos).
- Suite de testes real (atualmente scripts de teste sao placeholders).
- Hardening final de qualidade (config final de Biome e hooks mais estritos).
- Validacao ponta a ponta do deploy em ambiente alvo.
