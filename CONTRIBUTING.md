# Contributing to SaaS Template

Thank you for your interest in contributing! This document outlines the development workflow, coding standards, and processes for this project.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Development Workflow](#development-workflow)
3. [Project Board Automation](#project-board-automation)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Testing](#testing)
7. [Code Style](#code-style)
8. [Branch Protection](#branch-protection)

---

## Development Setup

### Prerequisites

- **Bun** (latest version)
- **Docker** and **Docker Compose**
- **Git**

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/flpdorea/template.git
   cd template
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Copy environment files:
   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env
   ```

4. Start development environment:
   ```bash
   bun run dev
   ```

This starts:
- Frontend (Next.js) on port 3000
- Backend (NestJS) on port 3001
- PostgreSQL on port 5432
- Nginx reverse proxy on port 80

---

## Development Workflow

### Trunk-Based Development

This project follows a **trunk-based development** approach with short-lived feature branches.

### Branch Naming

Use descriptive branch names with issue numbers:

```
<type>/<issue-number>-<short-description>
```

Examples:
```
feat/42-add-password-reset
fix/103-fix-jwt-expiration
docs/87-update-readme
refactor/56-rename-user-entity
```

### Workflow Steps

1. **Create Issue** (if not exists)
   - Issue is automatically added to the project board
   - Status set to **Todo**

2. **Create Branch**
   ```bash
   git checkout -b feat/42-add-password-reset
   ```

3. **Make Changes**
   - Write code following the [Code Style](#code-style) guidelines
   - Add/update tests as needed
   - Update documentation if required

4. **Commit Changes**
   - Follow [Commit Guidelines](#commit-guidelines)
   - Pre-commit hooks run automatically

5. **Push and Open PR**
   ```bash
   git push origin feat/42-add-password-reset
   ```
   - Open PR via GitHub UI or CLI
   - Reference the issue in PR body: `Closes #42`

6. **Code Review**
   - Request review from CODEOWNER
   - Address feedback
   - Ensure CI passes

7. **Merge**
   - Squash and merge to `main`
   - Delete feature branch

---

## Project Board Automation

### Project URL

https://github.com/users/flpdorea/projects/6

### Status Columns

| Status | Color | Description |
|--------|-------|-------------|
| **Todo** | Gray | New items awaiting triage |
| **Developing** | Blue | Currently being worked on |
| **Waiting for review** | Yellow | PR opened, awaiting reviewer assignment |
| **In review** | Purple | Under active review |
| **Changes requested** | Red | Needs updates based on review feedback |
| **Done** | Green | Completed and merged |

### Automation Triggers

The project board is automatically updated via `.github/workflows/project-automation.yml`:

| Trigger | From | To |
|---------|------|-----|
| Issue created | - | **Todo** |
| PR opened | **Todo** / **Developing** | **Waiting for review** |
| Review requested | **Waiting for review** | **In review** |
| Changes requested (review) | **In review** | **Changes requested** |
| New commits pushed (after changes) | **Changes requested** | **Waiting for review** |
| PR merged | Any | **Done** |

### Linking Issues to PRs

For the automation to work correctly, **PRs must reference their linked issue** in the PR body:

```
Closes #42
Fixes #103
Resolves #87
```

### Automation Workflow Details

#### Job: `new-issue`
- **Trigger:** Issue opened
- **Action:** Adds issue to project board with status **Todo**

#### Job: `pr-opened`
- **Trigger:** PR opened
- **Action:** Finds linked issue via PR body keywords, updates status to **Waiting for review**

#### Job: `review-requested`
- **Trigger:** Review requested on PR
- **Action:** Updates status to **In review**

#### Job: `changes-requested`
- **Trigger:** Review submitted with `changes_requested` state
- **Action:** Updates status to **Changes requested**

#### Job: `push-after-changes`
- **Trigger:** Push to branch that has an open PR
- **Action:** If status is **Changes requested**, moves back to **Waiting for review**

#### Job: `pr-merged`
- **Trigger:** PR merged to `main`
- **Action:** Updates status to **Done**

### Required Setup

The automation requires a Personal Access Token (PAT) with the following scopes:

- `repo` - Full control of private repositories
- `project` - Full control of projects
- `read:org` - Read org and team membership

Store the token as a repository secret named `PROJECT_TOKEN`.

---

## Commit Guidelines

### Commit Message Format

All commits must follow the **Conventional Commits** specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, semicolons) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |
| `ci` | CI/CD changes |
| `build` | Build system changes |

### Examples

```
feat(auth): add JWT login endpoint
fix(api): correct user validation logic
docs(readme): update installation instructions
test(todos): add integration tests for CRUD operations
refactor(users): rename User entity fields
ci(cd): add Coolify deployment webhook
```

### Commit Hooks

Pre-commit hooks automatically run:

1. **Biome lint + format** on staged files
2. **TypeScript type check** across monorepo
3. **Unit tests** (backend + frontend)

If any check fails, the commit is aborted. Fix the issues and try again.

---

## Pull Request Process

### PR Requirements

1. **Linked Issue**: Reference the issue in PR body (`Closes #123`)
2. **Description**: Explain what changes were made and why
3. **Tests**: Add/update tests for new functionality
4. **Documentation**: Update docs if API/behavior changes
5. **CI Pass**: All CI checks must pass

### PR Template

When creating a PR, use the template at `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing approach

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Lint passes
- [ ] Type check passes
```

### CI Checks

Every PR runs the following checks:

| Job | Description |
|-----|-------------|
| `lint` | Biome lint + format check |
| `test` | Jest, Vitest, Playwright tests |
| `build` | Docker image builds |

### Review Process

1. **Automated Review**: Opencode AI reviews PR on open
2. **Code Review**: Request from CODEOWNER (defined in `.github/CODEOWNERS`)
3. **Approval**: 1 approval required
4. **Merge**: Squash and merge to `main`

### Handling Changes Requested

When a reviewer requests changes:

1. Project board updates to **Changes requested**
2. Make necessary changes
3. Push new commits
4. Board automatically updates to **Waiting for review**
5. Request re-review

---

## Testing

### Test Structure

```
apps/api/test/
├── unit/           # Jest unit tests
│   ├── auth/
│   ├── users/
│   └── todos/
└── integration/    # Supertest integration tests
    ├── auth.e2e-spec.ts
    ├── users.e2e-spec.ts
    └── todos.e2e-spec.ts

apps/web/tests/
├── unit/           # Vitest unit tests
│   ├── components/
│   └── lib/
└── e2e/            # Playwright E2E tests
    ├── auth.spec.ts
    ├── todos.spec.ts
    └── admin.spec.ts
```

### Running Tests

```bash
# Run all tests
bun run test

# Run backend unit tests
cd apps/api && bun test

# Run frontend unit tests
cd apps/web && bun test

# Run E2E tests
cd apps/web && bun run test:e2e
```

### Test Database

Integration and E2E tests use a separate database: `template_test`

This database is:
- Automatically created when tests run
- Isolated from development database
- Reset between test runs

### Writing Tests

**Backend Unit Test:**
```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user', async () => {
      // ...
    });

    it('should throw if email already exists', async () => {
      // ...
    });
  });
});
```

**Frontend Component Test:**
```typescript
describe('LoginForm', () => {
  it('should submit with valid credentials', async () => {
    // ...
  });

  it('should show error for invalid email', async () => {
    // ...
  });
});
```

---

## Code Style

### Linting & Formatting

This project uses **Biome** for linting and formatting.

### Running Linter

```bash
# Check all files
bun run lint

# Fix issues
bun run lint:fix
```

### TypeScript

- **Strict mode** enabled
- **No `any` types** without explicit justification
- **Explicit return types** for functions
- Use **path aliases** (`@/*`, `@shared/*`)

### React/Next.js

- **Functional components** with hooks
- **Server Components** by default (App Router)
- **Client Components** only when needed (`'use client'`)
- **Shadcn/ui** for UI components

### NestJS

- **Module-based architecture**
- **Dependency injection**
- **DTOs** with `class-validator`
- **Guards** for authorization

---

## Branch Protection

### Protected Branch: `main`

| Rule | Setting |
|------|---------|
| Direct pushes | **Blocked** |
| Force pushes | **Blocked** |
| Deletion | **Blocked** |
| Require PR | **Yes** |

### PR Merge Requirements

1. **1 approval** from CODEOWNER
2. **All CI checks** must pass
3. **Branch up-to-date** with `main`
4. **No conflicts**

### CODEOWNERS

Defined in `.github/CODEOWNERS`:

```
* @flpdorea
```

---

## Questions?

If you have questions about contributing:

1. Check the [SPEC.md](docs/SPEC.md) for detailed specifications
2. Review existing issues and PRs
3. Open a new issue with the `question` label

---

Thank you for contributing!
