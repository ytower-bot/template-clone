## 1. Estrutura do Repositório (Monorepo)

O projeto utiliza uma arquitetura de monorepo focada em performance e separação de preocupações, centralizada pelo **Bun**.


```
/
├── .agents/                    # Prompts, Contextos e Skills de IA
├── AGENTS.md                   # Documentação de governança dos Agentes
├── back/                       # API (NestJS) - Dockerfile próprio
├── front/                      # Client (Next.js + Phaser) - Dockerfile próprio
├── Makefile                    # Abstração de comandos (DevOps local)
├── compose.development.yaml    # Orquestração Local / Dev
├── compose.production.yaml     # Orquestração Produção (Coolify)
└── package.json                # Workspace root (Bun)
```

---

## 2. Inteligência e Automação: Pasta `.agents/`

Para acelerar o desenvolvimento do MVP, utilizamos agentes de IA integrados ao workflow via **OpenCode**. A governança, permissões e o "quem é quem" dos nossos assistentes virtuais estão documentados no arquivo **`AGENTS.md`**.

### Skills Utilizadas

- **`phaser-gamedev`**: Regras para garantir que a integração entre o ciclo de vida do Phaser e o estado do React seja performática.
    
- **`vercel-react-best-practices`**: Foco em otimização de performance no Next.js (Server Components e Caching).
    

---

## 3. Estratégia de Desenvolvimento: Trunk-based

Eliminamos a complexidade de múltiplas branches para focar em velocidade total na `main`.

- **Main-only**: Todo o código converge para a branch principal.
    
- **Short-lived PRs**: Se houver revisão, o ciclo de vida da branch não deve passar de algumas horas.
    
- **Continuous Integration**: Cada push na `main` dispara a pipeline via Bun para validar build, lint e testes.
    
- PR merge sync
---

## 4. Stack Tecnológica e Ferramentas

- **Linguagem**: **TypeScript** (Fullstack).
    
- **Frontend**: **Next.js** (Framework) + **React** (UI) + **Phaser** (Game Engine).
    
- **Backend**: **NestJS** (Arquitetura modular).
    
- **Runtime**: **Bun** (Gerenciamento de pacotes e execução).
    
- **Qualidade de Código**: **Biome**. Utilizamos o Biome para **Lint** e **Format** por ser escrito em Rust e ser até 100x mais rápido que o ESLint/Prettier.
    

---

## 5. Automação e Comandos (Makefile)

O `Makefile` garante que o ambiente seja reprodutível em qualquer máquina sem decorar flags do Docker.

- **`make dev`**: Sobe o ambiente local com hot reload (`compose.development.yaml`).
    
- **`make lint`**: Roda o **Biome** para validar e formatar o código instantaneamente.
    
- **`make test`**: Roda testes unitários e de integração via Bun.
    
- **`make build-prod`**: Valida a construção das imagens para deploy real.
    

---

## 6. CI/CD e Integração OpenCode

Utilizamos a integração oficial documentada em [OpenCode - GitHub Integration](https://opencode.ai/docs/github/) para:

1. **Análise Proativa**: Agentes utilizam as skills em `.agents/` para revisar PRs automaticamente.
    
2. **PR Previews**: Fora de escopo neste bootstrap inicial para simplificar a operação em rede corporativa.
    
3. **Continuous Deployment**: Push na `main` dispara deploy para produção via webhook do Coolify.
    

---

## 7. Roadmap: Futuro e Qualidade

À medida que o MVP se estabiliza, implementaremos camadas adicionais de confiança:

- **Qualidade e Segurança**: Integração do **SonarQube** para análise de dívida técnica e **Snyk** para monitoramento de vulnerabilidades em bibliotecas.
    
- **Observabilidade**: Implementação de **OpenTelemetry** para instrumentação e tracing entre o frontend (Phaser) e o backend (NestJS), garantindo visibilidade total do fluxo de dados.