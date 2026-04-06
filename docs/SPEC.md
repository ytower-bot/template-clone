# SaaS Template Specification

> **Complete Mutual Understanding Document**
> Last Updated: 2026-04-05

This document represents the complete, unambiguous specification for the SaaS template. All implementation decisions are captured here to ensure zero interpretation during development.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Authentication & Security](#authentication--security)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Pages](#frontend-pages)
6. [Docker Configuration](#docker-configuration)
7. [Nginx Configuration](#nginx-configuration)
8. [CI/CD Workflows](#cicd-workflows)
9. [Development Workflow](#development-workflow)
10. [Environment Variables](#environment-variables)
11. [Project Structure](#project-structure)
12. [Testing Strategy](#testing-strategy)
13. [TypeScript Configuration](#typescript-configuration)
14. [Documentation](#documentation)
15. [Domain & Deployment](#domain--deployment)

---

## Technology Stack

| Layer | Technology | Version/Config |
|-------|------------|----------------|
| **Runtime** | Bun | Latest version |
| **Package Manager** | Bun | Workspaces |
| **Monorepo Tool** | Turborepo | Tasks: build, dev, lint, test, typecheck |
| **Frontend** | Next.js 15 | App Router, React 19 |
| **Backend** | NestJS | TypeORM, class-validator |
| **Database** | PostgreSQL | Docker Compose (dev & prod) |
| **Styling** | Tailwind CSS | Shadcn/ui (default theme) |
| **Testing (Frontend)** | Vitest + Playwright | Chromium only |
| **Testing (Backend)** | Jest + Supertest | Default NestJS setup |
| **Linting** | Biome | Lint + format |
| **Container Registry** | GHCR | Short names (web, api) |

---

## Authentication & Security

### JWT Strategy
- **Access + Refresh tokens** with rotation
- Access token: 15 minutes, stored in memory/context
- Refresh token: 7 days, HTTP-only cookie
- Refresh token rotates on each use (prevents token reuse attacks)

### Password Security
- **Hashing Algorithm:** Argon2id
- Argon2id is the winner of Password Hashing Competition 2015
- Most secure against GPU/ASIC attacks

### Cookie Configuration
- **Storage:** HTTP-only cookie for refresh token
- **Security Settings:**
  - `Secure` (HTTPS only in production)
  - `HttpOnly` (not accessible via JavaScript)
  - `SameSite=Strict` (prevents CSRF)

### Token Expiration
| Token Type | Expiration | Storage |
|------------|------------|---------|
| Access Token | 15 minutes | Memory/Context |
| Refresh Token | 7 days | HTTP-only cookie |

### 401 Unauthorized Handling
- Frontend automatically attempts to refresh token
- Retries original request after successful refresh
- Redirects to login only if refresh fails

### Logout Flow
1. Call backend `/auth/logout` to invalidate refresh token
2. Clear cookies on frontend
3. Redirect to login page

### User Roles
- **Two-tier RBAC:** User and Admin
- User: Can manage own resources
- Admin: Can access admin endpoints and manage all users

### Admin User Creation
- **Method:** Environment variables
- Variables: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Created during database seeding on startup

### Forgot Password (No Email Service)
- Endpoint generates reset token
- Returns token in API response (for development)
- Can integrate email service later

---

## Database Schema

### Configuration
- **ORM:** TypeORM
- **Migrations:** Manual migrations (version-controlled)
- **Seeding:** Auto-seed on startup (admin user + sample data)
- **ID Strategy:** UUID v4 for all primary keys
- **Timestamps:** Auto-managed `createdAt`, `updatedAt` on all entities
- **Soft Delete:** Supported via `deletedAt` field

### PostgreSQL Setup
- **Development:** Persistent volume (data survives restarts)
- **Production:** Docker Compose PostgreSQL
- **Connection Pooling:** Default TypeORM settings

### Entity: User

```typescript
{
  // Basic Fields
  id: UUID v4 (primary key)
  email: string (unique, not null)
  password: string (hashed, not null)
  role: 'USER' | 'ADMIN' (default: 'USER')
  
  // Profile Fields
  firstName: string (nullable)
  lastName: string (nullable)
  avatar: string (nullable, URL)
  bio: string (nullable)
  
  // Auth Tracking Fields
  isActive: boolean (default: true)
  lastLoginAt: Date (nullable)
  emailVerified: boolean (default: false)
  passwordChangedAt: Date (nullable)
  
  // Soft Delete
  deletedAt: Date (nullable)
  
  // Auto-managed Timestamps
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
  
  // Relations
  todos: Todo[] (one-to-many)
}
```

### Entity: Todo

```typescript
{
  id: UUID v4 (primary key)
  title: string (not null)
  completed: boolean (default: false)
  
  // Relations
  userId: UUID (foreign key to User)
  user: User (many-to-one)
  
  // Auto-managed Timestamps
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-updated)
}
```

### Entity: RefreshToken (for rotation)

```typescript
{
  id: UUID v4 (primary key)
  token: string (hashed, unique)
  userId: UUID (foreign key to User)
  expiresAt: Date
  revoked: boolean (default: false)
  
  // Auto-managed Timestamps
  createdAt: Date (auto-generated)
  
  // Relations
  user: User (many-to-one)
}
```

---

## API Endpoints

### Base URL
- **Prefix:** `/api/v1`
- **Documentation:** Swagger UI at `/api/v1/docs`

### Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/auth/register` | Create new user | `{ email, password, firstName?, lastName? }` | `{ user, accessToken }` + refresh cookie |
| POST | `/auth/login` | Authenticate user | `{ email, password }` | `{ user, accessToken }` + refresh cookie |
| POST | `/auth/logout` | Invalidate session | - | `{ success: true }` + clear cookie |
| POST | `/auth/refresh` | Refresh access token | - | `{ accessToken }` + new refresh cookie |
| GET | `/auth/me` | Get current user | - | `{ user }` |
| POST | `/auth/forgot-password` | Request reset | `{ email }` | `{ resetToken }` (dev only) |
| POST | `/auth/reset-password` | Reset password | `{ token, newPassword }` | `{ success: true }` |

### User Endpoints

| Method | Endpoint | Description | Auth | Request Body |
|--------|----------|-------------|------|--------------|
| GET | `/users` | List all users | Admin only | - |
| GET | `/users/:id` | Get user by ID | Authenticated (owner or admin) | - |
| PATCH | `/users/:id` | Update user | Authenticated (owner or admin) | `{ firstName?, lastName?, avatar?, bio? }` |
| DELETE | `/users/:id` | Soft delete user | Authenticated (owner or admin) | - |

### Todo Endpoints

| Method | Endpoint | Description | Auth | Request Body |
|--------|----------|-------------|------|--------------|
| GET | `/todos` | List user's todos | Authenticated | - |
| POST | `/todos` | Create todo | Authenticated | `{ title }` |
| GET | `/todos/:id` | Get todo by ID | Authenticated (owner) | - |
| PATCH | `/todos/:id` | Update todo | Authenticated (owner) | `{ title?, completed? }` |
| DELETE | `/todos/:id` | Delete todo | Authenticated (owner) | - |

### Health Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/health` | Health check | `{ status: 'ok', database: 'connected', memory: {...}, disk: {...} }` |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Frontend Pages

### Routing Structure

| Route | Access | Description | Key Features |
|-------|--------|-------------|--------------|
| `/` | Public | Landing page | Redirect to `/dashboard` if authenticated |
| `/login` | Public | Login form | Email + password, remember me |
| `/register` | Public | Registration form | Email + password + profile fields |
| `/forgot-password` | Public | Forgot password form | Email input |
| `/reset-password` | Public | Reset password form | Token from URL + new password |
| `/dashboard` | Protected | User's todo list | CRUD operations for todos |
| `/profile` | Protected | User profile editor | Edit name, avatar, change password |
| `/admin` | Admin only | Admin dashboard | Overview, stats |
| `/admin/users` | Admin only | User management | List, edit, delete users |
| `*` | - | Custom 404 | Styled error page |
| Error | - | Error boundary | Catches runtime errors |

### Page Components

#### Public Pages
- **Landing (`/`):** Hero section, features, CTA buttons
- **Login (`/login`):** Form with email, password, forgot password link
- **Register (`/register`):** Form with email, password, confirm password, optional name fields
- **Forgot Password (`/forgot-password`):** Email input, submit button
- **Reset Password (`/reset-password`):** New password, confirm password

#### Protected Pages
- **Dashboard (`/dashboard`):** Todo list with add/edit/delete functionality, filter by status
- **Profile (`/profile`):** Edit profile fields, change password section

#### Admin Pages
- **Admin Dashboard (`/admin`):** Stats overview, quick actions
- **User Management (`/admin/users`):** Table with users, edit/delete actions

### Authentication Flow

1. **Login/Register:** Server Action calls API, receives tokens
2. **Tokens Stored:** Access token in context, refresh token in HTTP-only cookie
3. **Protected Routes:** Middleware validates cookie existence, redirects if missing
4. **API Calls:** Fetch wrapper auto-includes cookies
5. **401 Handling:** Auto-refresh middleware retries with refresh token
6. **Logout:** Server Action calls logout API, clears cookies, redirects

### State Management

- **Global Auth State:** React Context (user, loading, error)
- **Server State:** React Query not used - direct fetch with Server Actions
- **Form State:** React Hook Form + Zod validation
- **Todo State:** Client-side state in component (fetched on mount)

### Theme Support

- **Modes:** Light + Dark
- **Toggle:** Theme switcher in header
- **Persistence:** localStorage + system preference detection
- **Implementation:** next-themes package

### Responsive Design

- **Approach:** Mobile-first
- **Breakpoints:** Tailwind default (sm, md, lg, xl, 2xl)
- **All Pages:** Fully responsive across mobile, tablet, desktop

---

## Docker Configuration

### Ports (Development)

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (NestJS) | 3001 |
| PostgreSQL | 5432 |
| Nginx | 80 |

### Resource Limits (Production)

| Service | Memory | CPU |
|---------|--------|-----|
| Web (Next.js) | 512MB | 1 |
| API (NestJS) | 512MB | 1 |
| PostgreSQL | 1GB | 1 |
| Nginx | 128MB | 0.5 |
| Cloudflare Tunnel | 128MB | 0.5 |

### Image Naming

```
ghcr.io/owner/repo/web:latest
ghcr.io/owner/repo/api:latest
```

### Base Images

- **Web & API:** `oven/bun:alpine` (Bun Alpine)
- **Nginx:** `nginx:alpine`
- **PostgreSQL:** `postgres:16-alpine`

### Build Optimizations

- **Next.js:** Standalone output enabled
- **Bundler:** SWC minification
- **Source Maps:** Disabled in production
- **Multi-staged Builds:** Build stage + runtime stage

### Docker Compose Files

#### compose.development.yml
- Source code mounted as volumes
- Hot reload enabled (Next.js Fast Refresh, NestJS watch mode)
- PostgreSQL with persistent volume
- No resource limits
- Environment: `.env` file

#### compose.production.yml
- Uses pre-built images from GHCR
- No volume mounts for code
- Resource limits enforced
- Cloudflare Tunnel service included
- Environment: Coolify-managed `.env`

### Volume Configuration

| Volume | Purpose | Persistence |
|--------|---------|-------------|
| `postgres_data` | Database storage | Persistent (dev), external (prod) |
| `node_modules_web` | Frontend dependencies | Anonymous (dev) |
| `node_modules_api` | Backend dependencies | Anonymous (dev) |

---

## Nginx Configuration

### Routing Rules

```
Location                Target
--------                ------
/api/v1/*              → api:3001
/*                     → web:3000
/health                → api:3001/health (direct)
```

### Features

#### Rate Limiting & Timeouts
- Request body size limit: 10MB
- Connection timeout: 60s
- Keep-alive timeout: 65s
- Rate limit: 100 requests/second per IP

#### Security Headers
```nginx
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

#### Gzip Compression
- Enabled for: text/plain, text/css, application/json, application/javascript, text/xml
- Min length: 1000 bytes
- Compression level: 6

#### Structured Logging
- Format: JSON
- Fields: timestamp, request_id, method, path, status, response_time, client_ip

### SSL/TLS

- **Handled by:** Coolify/Cloudflare Tunnel
- **Nginx:** No SSL configuration needed
- **Cloudflare:** Terminates SSL, forwards HTTP to Nginx

---

## CI/CD Workflows

### Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI | PR open/sync (non-draft) | Build, test, lint |
| CD | Push to `main` | Deploy to production |
| Opencode | PR open, PR comment `/oc` | AI code review, task handling |

### CI Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Pull request opened
- Pull request synchronized
- **Exclude:** Draft PRs

**Jobs:**

#### Job 1: lint
- Runs Biome check across monorepo
- Command: `bun run lint`
- Fail fast: Yes

#### Job 2: test
- Runs all test suites sequentially
- Steps:
  1. Jest (backend unit + integration)
  2. Vitest (frontend unit)
  3. Playwright (E2E, Docker container)
- Test database: Separate `template_test`
- Coverage: Reported but not enforced

#### Job 3: build
- Builds Docker images for web and api
- Pushes to GHCR with `latest` tag
- Uses GitHub Actions cache for layers
- Depends on: lint, test

**Configuration:**
- Fail fast: Yes (stop on first failure)
- Docker layer cache: Enabled
- Test parallelism: Sequential in one container
- Coverage requirement: None

### CD Workflow

**File:** `.github/workflows/cd.yml`

**Triggers:**
- Push to `main` branch
- After PR merge

**Steps:**

1. **Checkout code**
2. **Build production images** (multi-staged)
3. **Push to GHCR** with `latest` tag
4. **Trigger Coolify deployment** via webhook

**Secrets Required:**

| Secret | Source | Usage |
|--------|--------|-------|
| `GITHUB_TOKEN` | Auto-provided | Push to GHCR |
| `COOLIFY_WEBHOOK_URL` | Configure in repo settings | Trigger deployment |

### Opencode Workflow

**File:** `.github/workflows/opencode.yml`

**Triggers:**
- Pull request opened
- Pull request comment containing `/oc`

**Actions:**
- **PR Open:** Automatic code review by Opencode AI
- **PR Comment `/oc`:** AI responds to task mentioned in comment

**Documentation:** https://opencode.ai/docs/github/

---

## Development Workflow

### Git Hooks (Husky)

#### pre-commit
Runs on every commit before message prompt:
1. **Biome lint + format check** on staged files
2. **Type check** (`turbo typecheck`)
3. **Unit tests** (backend + frontend)

#### pre-push
Runs on every push before sending to remote:
1. **All tests** (unit, integration, frontend unit)
2. **Type check** (`turbo typecheck`)

#### commit-msg
Validates commit message format with commitlint.

### Commit Convention

**Format:** `type(scope): description`

**Enforcement:** `@commitlint/config-conventional`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
```
feat(auth): add JWT login endpoint
fix(api): correct user validation logic
docs(readme): update installation instructions
test(todos): add integration tests for CRUD operations
```

### Branch Protection

**Protected Branch:** `main`

**Rules:**
- Direct pushes: **Blocked**
- Force pushes: **Blocked**
- Deletion: **Blocked**

**PR Merge Requirements:**
1. **Approval:** 1 approval required (via CODEOWNERS)
2. **CI Status:** All CI jobs must pass
3. **Up-to-date:** Branch must be up-to-date with base

**CODEOWNERS File:**
```
* @your-github-username
```
(Replace with actual GitHub username/team)

### Development Process (Trunk-Based)

1. Create feature branch from `main`
2. Make changes, commit with conventional messages
3. Push branch, open PR
4. CI runs automatically (lint, test, build)
5. Opencode reviews PR
6. Request review from CODEOWNER
7. Address feedback, ensure CI passes
8. Squash and merge to `main`
9. CD deploys to production automatically

---

## Environment Variables

### Root `.env.example`

```env
# ====================
# Database Configuration
# ====================
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/template
DATABASE_TEST_URL=postgresql://postgres:postgres@postgres:5432/template_test

# ====================
# JWT Configuration
# ====================
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ====================
# Admin User (for seeding)
# ====================
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme123

# ====================
# Application Configuration
# ====================
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001

# ====================
# CORS Configuration
# ====================
CORS_ORIGIN=http://localhost:3000
```

### Frontend `.env.example` (apps/web/.env.example)

```env
# ====================
# API Configuration
# ====================
NEXT_PUBLIC_API_URL=/api/v1
```

### Coolify Environment

**Storage:** Single `.env` file in Coolify dashboard

**Variables:** All variables from root `.env.example` plus:
- Production URLs for `FRONTEND_URL`, `API_URL`, `CORS_ORIGIN`
- Production `JWT_SECRET` (generate strong random string)
- Production admin credentials

### Environment Validation

**Library:** Zod

**Validation:** At application startup (both frontend and backend)

**Behavior:** Application fails to start with clear error message if required env vars are missing or invalid

### .gitignore

```
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
apps/*/.env
apps/*/.env.local
apps/*/.env.development.local
apps/*/.env.test.local
apps/*/.env.production.local
```

---

## Project Structure

```
template/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # PR checks: build, test, lint
│   │   ├── cd.yml                    # Deploy to Coolify on main
│   │   └── opencode.yml              # AI code review & /oc commands
│   ├── CODEOWNERS                    # Require 1 approval for main
│   └── pull_request_template.md      # PR description template
│
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── (auth)/           # Auth route group
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── reset-password/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (protected)/      # Protected route group
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── profile/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── admin/            # Admin routes
│   │   │   │   │   ├── page.tsx      # Admin dashboard
│   │   │   │   │   └── users/
│   │   │   │   │       └── page.tsx  # User management
│   │   │   │   ├── layout.tsx        # Root layout
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   ├── not-found.tsx     # 404 page
│   │   │   │   ├── error.tsx         # Error boundary
│   │   │   │   └── globals.css       # Global styles + Tailwind
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Shadcn/ui components
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── Sidebar.tsx
│   │   │   │   └── forms/            # Form components
│   │   │   ├── lib/
│   │   │   │   ├── api/              # API client
│   │   │   │   │   ├── client.ts     # Fetch wrapper
│   │   │   │   │   └── auth.ts       # Auth API calls
│   │   │   │   ├── auth/
│   │   │   │   │   ├── context.tsx   # Auth context
│   │   │   │   │   ├── hooks.ts      # Auth hooks
│   │   │   │   │   └── actions.ts    # Server actions
│   │   │   │   ├── utils.ts          # Utility functions
│   │   │   │   └── env.ts            # Env validation
│   │   │   └── middleware.ts         # Next.js middleware (auth check)
│   │   ├── tests/
│   │   │   ├── unit/                 # Vitest unit tests
│   │   │   │   ├── components/
│   │   │   │   └── lib/
│   │   │   └── e2e/                  # Playwright E2E tests
│   │   │       ├── auth.spec.ts
│   │   │       ├── todos.spec.ts
│   │   │       └── admin.spec.ts
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── Dockerfile                # Multi-staged production build
│   │   ├── .env.example
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── components.json           # Shadcn/ui config
│   │   ├── vitest.config.ts
│   │   ├── playwright.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # NestJS backend
│       ├── src/
│       │   ├── auth/                 # Auth module
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── strategies/
│       │   │   │   └── jwt.strategy.ts
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   └── roles.guard.ts
│       │   │   └── decorators/
│       │   │       ├── current-user.decorator.ts
│       │   │       └── roles.decorator.ts
│       │   ├── users/                # Users module
│       │   │   ├── users.module.ts
│       │   │   ├── users.controller.ts
│       │   │   ├── users.service.ts
│       │   │   ├── entities/
│       │   │   │   └── user.entity.ts
│       │   │   └── dto/
│       │   │       ├── create-user.dto.ts
│       │   │       └── update-user.dto.ts
│       │   ├── todos/                # Todos module
│       │   │   ├── todos.module.ts
│       │   │   ├── todos.controller.ts
│       │   │   ├── todos.service.ts
│       │   │   ├── entities/
│       │   │   │   └── todo.entity.ts
│       │   │   └── dto/
│       │   │       ├── create-todo.dto.ts
│       │   │       └── update-todo.dto.ts
│       │   ├── database/             # Database config
│       │   │   ├── database.module.ts
│       │   │   ├── data-source.ts    # TypeORM config
│       │   │   └── migrations/       # Migration files
│       │   │       └── .gitkeep
│       │   ├── health/               # Health module
│       │   │   ├── health.module.ts
│       │   │   └── health.controller.ts
│       │   ├── common/               # Common utilities
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts
│       │   │   ├── interceptors/
│       │   │   │   └── logging.interceptor.ts
│       │   │   └── decorators/
│       │   │       └── api-response.decorator.ts
│       │   ├── config/               # App configuration
│       │   │   ├── app.config.ts
│       │   │   ├── database.config.ts
│       │   │   └── jwt.config.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       │   ├── unit/                 # Jest unit tests
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   └── todos/
│       │   └── integration/          # Supertest integration tests
│       │       ├── auth.e2e-spec.ts
│       │       ├── users.e2e-spec.ts
│       │       └── todos.e2e-spec.ts
│       ├── seeds/                    # Database seeding
│       │   └── seed.ts
│       ├── Dockerfile                # Multi-staged production build
│       ├── .env.example
│       ├── nest-cli.json
│       ├── jest.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared types & utilities
│       ├── src/
│       │   ├── types/
│       │   │   ├── api.ts            # API request/response types
│       │   │   ├── auth.ts           # Auth types (JWT payload, roles)
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   ├── nginx/
│   │   ├── nginx.conf                # Nginx reverse proxy config
│   │   └── Dockerfile
│   └── postgres/
│       └── init.sql                  # Initial schema/seed
│
├── .husky/                           # Git hooks
│   ├── pre-commit
│   ├── pre-push
│   └── commit-msg
│
├── compose.development.yml           # Local development
├── compose.production.yml            # Production deployment
├── turbo.json                        # Turborepo config
├── biome.json                        # Biome lint/format config
├── commitlint.config.js              # Commitlint config
├── tsconfig.json                     # Base TypeScript config
├── package.json                      # Root package.json (workspaces)
├── .env.example                      # Environment template
├── .gitignore
├── bunfig.toml                       # Bun configuration
└── README.md                         # Comprehensive documentation
```

---

## Testing Strategy

### Overview

| Test Type | Tool | Scope | Location |
|-----------|------|-------|----------|
| Backend Unit | Jest | Individual functions, services | `apps/api/test/unit/` |
| Backend Integration | Jest + Supertest | API endpoints, database | `apps/api/test/integration/` |
| Frontend Unit | Vitest + React Testing Library | Components, hooks, utils | `apps/web/tests/unit/` |
| E2E | Playwright | Full user flows | `apps/web/tests/e2e/` |

### Backend Testing (NestJS)

#### Configuration
- **Framework:** Jest
- **Setup:** Default NestJS Jest configuration
- **Coverage:** Reported but not enforced

#### Unit Tests
- **Location:** `apps/api/test/unit/`
- **Scope:**
  - Service methods (auth, users, todos)
  - Utility functions
  - Guards and decorators
- **Mocking:** Jest mocks for dependencies

#### Integration Tests
- **Location:** `apps/api/test/integration/`
- **Scope:**
  - API endpoints (auth, users, todos)
  - Database operations
  - Full request/response cycle
- **Database:** Separate test database (`template_test`)
- **Setup:**
  - Initialize test database before all tests
  - Clear tables between tests
  - Close connection after all tests
- **Tool:** Supertest for HTTP assertions

#### Test Structure
```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user', async () => {});
    it('should throw if email already exists', async () => {});
  });
});

describe('AuthController (e2e)', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', () => {});
  });
});
```

### Frontend Testing (Next.js)

#### Unit Tests
- **Framework:** Vitest + React Testing Library
- **Location:** `apps/web/tests/unit/`
- **Scope:**
  - React components
  - Custom hooks (auth hooks)
  - Utility functions
  - Form validation
- **Setup:**
  - jsdom environment
  - @testing-library/react
  - @testing-library/jest-dom

#### E2E Tests
- **Framework:** Playwright
- **Location:** `apps/web/tests/e2e/`
- **Browser:** Chromium only
- **Scope:**
  - Authentication flow (register, login, logout)
  - Todo CRUD operations
  - Admin user management
  - Error states
- **CI:** Runs in Docker container

#### Test Structure
```typescript
// Unit test
describe('LoginForm', () => {
  it('should submit with valid credentials', async () => {});
  it('should show error for invalid email', async () => {});
});

// E2E test
test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### CI Test Execution

**Sequence:**
1. Backend unit tests (Jest)
2. Backend integration tests (Jest + Supertest)
3. Frontend unit tests (Vitest)
4. E2E tests (Playwright)

**Database for Integration Tests:**
- Separate `template_test` database
- Reset before each test run
- Isolated from development database

**E2E Test Environment:**
- Docker container with Playwright
- Starts full application stack
- Runs against `http://localhost:3000`

---

## TypeScript Configuration

### Base Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### App-Specific Configs

Each app extends the base config:

**Frontend (apps/web/tsconfig.json):**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../packages/shared/src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Backend (apps/api/tsconfig.json):**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../../packages/shared/src/*"]
    },
    "outDir": "./dist",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### Strict Mode Features

All strict checks enabled:
- `strict: true` (enables all strict mode options)
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

### Path Aliases

| Alias | Resolves To | Usage |
|-------|-------------|-------|
| `@/*` | `./src/*` | Within each app |
| `@shared/*` | `packages/shared/src/*` | For shared types |

**Example Usage:**
```typescript
// In apps/web
import { Button } from '@/components/ui/button';
import { AuthResponse } from '@shared/types/auth';

// In apps/api
import { UserService } from '@/users/users.service';
import { JwtPayload } from '@shared/types/auth';
```

---

## Documentation

### README.md Structure

**Comprehensive README with table of contents:**

```markdown
# SaaS Template

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Project Structure](#project-structure)
7. [Development Guide](#development-guide)
   - [Running Locally](#running-locally)
   - [Hot Reload](#hot-reload)
   - [Database Migrations](#database-migrations)
   - [Seeding](#seeding)
8. [Testing Guide](#testing-guide)
   - [Backend Tests](#backend-tests)
   - [Frontend Tests](#frontend-tests)
   - [E2E Tests](#e2e-tests)
9. [Deployment Guide](#deployment-guide)
   - [Coolify Setup](#coolify-setup)
   - [Cloudflare Tunnel](#cloudflare-tunnel)
   - [PR Previews](#pr-previews)
10. [Environment Variables](#environment-variables)
11. [API Documentation](#api-documentation)
12. [Contributing Guidelines](#contributing-guidelines)
13. [Branch Protection](#branch-protection)
14. [License](#license)
```

### Documentation Level

**Comprehensive** - Include all sections listed above.

### Additional Files

- **CODEOWNERS:** Define who can approve PRs
- **pull_request_template.md:** PR description template
- **.env.example:** Environment variable template with comments
- **Swagger UI:** Auto-generated API docs at `/api/v1/docs`

---

## Domain & Deployment

### Domain Structure

**Strategy:** Single domain with path routing

| URL | Target |
|-----|--------|
| `yourdomain.com` | Frontend (Next.js) |
| `yourdomain.com/api/v1` | Backend (NestJS) |
| `pr-42.yourdomain.com` | PR preview (full stack) |

### Routing Flow

```
Client Request
    ↓
Cloudflare Tunnel
    ↓
Nginx (port 80)
    ↓
    ├─ /api/v1/* → Backend (port 3001)
    └─ /*        → Frontend (port 3000)
```

### SSL/TLS Configuration

- **Termination:** Cloudflare Tunnel
- **Certificate:** Managed by Cloudflare
- **Nginx:** Receives HTTP only (from Cloudflare)
- **Force HTTPS:** Cloudflare setting

### Coolify Setup

#### Application Configuration

1. **Create Resource:** Docker Compose
2. **Source:** GitHub repository
3. **Branch:** `main`
4. **Compose Path:** `compose.production.yml`

#### Environment Variables

Single `.env` file configured in Coolify dashboard:
- All variables from `.env.example`
- Production values for URLs, secrets
- Database credentials

#### Deployment Trigger

- **Method:** Webhook from CI
- **URL:** Configured as `COOLIFY_WEBHOOK_URL` in GitHub secrets
- **Trigger:** After successful CI build on `main`

### Cloudflare Tunnel

#### Configuration

- **Mode:** Docker Compose service
- **Image:** `cloudflare/cloudflared:latest`
- **Tunnel Token:** Configured in environment variables

#### compose.production.yml Addition

```yaml
cloudflare-tunnel:
  image: cloudflare/cloudflared:latest
  command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
  restart: unless-stopped
  depends_on:
    - nginx
  networks:
    - app-network
```

### PR Previews

#### Configuration

- **Enabled in Coolify:** Yes
- **Pattern:** `pr-{number}.yourdomain.com`
- **Lifecycle:**
  - Created when PR opens
  - Updated on new commits
  - Destroyed when PR closes

#### CI Integration

CI builds PR images with tag `pr-{number}`. Coolify automatically deploys to preview URL.

---

## Quality Checklist

### Code Quality
- [x] Biome for linting and formatting
- [x] TypeScript strict mode enabled
- [x] No `any` types without explicit justification
- [x] Consistent code style across monorepo

### Security
- [x] JWT tokens with rotation
- [x] Argon2id password hashing
- [x] HTTP-only cookies for refresh tokens
- [x] CORS configured per environment
- [x] Branch protection on main
- [x] No secrets in repository
- [x] Environment validation at startup

### Testing
- [x] Unit tests for backend services
- [x] Integration tests for API endpoints
- [x] Unit tests for frontend components
- [x] E2E tests for critical flows
- [x] Separate test database

### CI/CD
- [x] Automated lint, test, build on PRs
- [x] Automated deployment on merge
- [x] Docker layer caching
- [x] Fail-fast configuration
- [x] Non-draft PR filtering

### Documentation
- [x] Comprehensive README
- [x] API documentation (Swagger)
- [x] Environment variable examples
- [x] Contributing guidelines

### Docker
- [x] Multi-staged builds
- [x] Resource limits defined
- [x] Health checks configured
- [x] Persistent volumes for database
- [x] Hot reload in development

---

## Implementation Notes

### Priority Order

1. **Foundation:** Root configs, Biome, Husky, commitlint, TypeScript, Turbo
2. **Infrastructure:** Dockerfiles, compose files, Nginx, PostgreSQL
3. **Backend:** NestJS setup, TypeORM, auth module, users module, todos module, health check
4. **Frontend:** Next.js setup, Shadcn/ui, Tailwind, auth pages, dashboard, admin
5. **Shared:** Types package
6. **Testing:** Backend tests, frontend tests, E2E tests
7. **GitHub Actions:** CI workflow, CD workflow, Opencode workflow
8. **Documentation:** README, API docs, deployment guide

### Key Dependencies

**Backend:**
- @nestjs/core, @nestjs/common
- @nestjs/typeorm, typeorm
- @nestjs/jwt, @nestjs/passport, passport-jwt
- argon2
- class-validator, class-transformer
- @nestjs/swagger

**Frontend:**
- next, react, react-dom
- tailwindcss, postcss, autoprefixer
- react-hook-form, @hookform/resolvers, zod
- next-themes
- @radix-ui/react-* (Shadcn/ui dependencies)

**Development:**
- turborepo
- @biomejs/biome
- husky, @commitlint/cli, @commitlint/config-conventional
- tsx (for running seed scripts)
- jest, @nestjs/testing, supertest
- vitest, @testing-library/react, @testing-library/jest-dom
- @playwright/test

---

**End of Specification Document**

This document serves as the complete, unambiguous source of truth for the SaaS template implementation. All decisions have been mutually agreed upon with zero room for interpretation.
