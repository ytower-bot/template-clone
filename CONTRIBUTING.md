# Contributing

## Setup

```bash
cp .env.example .env
bun install
make dev
```

Serviços: `front` (3000), `back` (3001), `postgres` (5432)

## Workflow

1. Branch curta: `feat/42-auth-login`
2. Commit: `type(scope): descrição`
3. PR para `main` → CI verde → merge

## Commits

Formato: `type(scope): descrição`

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `build`, `chore`

## Comandos

- `make dev` - ambiente local
- `make lint` - lint/format
- `make test` - testes
- `make build-prod` - validação produção
