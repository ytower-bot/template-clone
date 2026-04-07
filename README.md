# Template Clone MVP

Bootstrap monorepo para MVP com `front` (Next.js) e `back` (NestJS), usando Bun.

## Requisitos

- Bun
- Docker e Docker Compose

## Estrutura

- `front`: aplicação Next.js
- `back`: API NestJS
- `compose.development.yaml`: stack local
- `compose.production.yaml`: stack de produção
- `.github/workflows/ci.yml`: pipeline de PR
- `.github/workflows/cd.yml`: deploy em `main`

## Quickstart

1. Copie o arquivo de ambiente:
   - `cp .env.example .env`
2. Instale dependências:
   - `bun install`
3. Rode local:
   - `make dev`

## Comandos úteis

- `make lint`
- `make test`
- `make build-prod`

## Fluxo de contribuição

- Crie branch curta a partir de `main`
- Use commits convencionais (`feat(scope): ...`)
- Abra PR para `main`
- CI valida lint/build/test
- Merge em `main` dispara CD
