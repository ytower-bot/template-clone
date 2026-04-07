# AGENTS Governance

Este repositorio usa agentes de IA como suporte ao desenvolvimento.  
O objetivo e acelerar tarefas operacionais sem substituir revisao humana.

## Escopo do repositorio

- Este projeto e um template inicial.
- `front` e `back` devem permanecer em estado base de bootstrap.
- Nao implementar dominio de produto neste momento.
- Nao configurar PR preview environments por enquanto.

## Principios de uso de agentes

- Agentes podem sugerir e aplicar mudancas tecnicas de baixo risco.
- Toda mudanca relevante deve passar por PR e revisao humana.
- Commits devem seguir Conventional Commits.
- Nao commitar segredos, tokens ou credenciais.

## Responsabilidades

- Humanos:
  - definir escopo
  - validar arquitetura
  - aprovar PRs
- Agentes:
  - scaffolding
  - ajustes de configuracao
  - automacao repetitiva
  - documentacao operacional

## Limites atuais

- Sem implementacao de regras de negocio do `docs/SPEC.md`.
- Sem configuracao de PR previews.
- Sem automacao OpenCode adicional alem do que ja existe no repositorio.

## Fluxo recomendado

1. Abrir issue com objetivo claro.
2. Criar branch curta a partir de `main`.
3. Executar mudancas pequenas e verificaveis.
4. Abrir PR com descricao objetiva.
5. Validar CI antes do merge.

## Seguranca e compliance

- Nunca expor secrets em codigo, logs ou documentacao.
- Manter variaveis sensiveis apenas em secrets do provedor (GitHub/Coolify).
- Evitar comandos destrutivos sem aprovacao explicita.

## Evolucao futura

Quando o bootstrap estiver estavel, este arquivo pode ser expandido com:

- papeis de agentes por area (`front`, `back`, `infra`, `docs`)
- politicas de aprovacao por tipo de mudanca
- checklist de release
