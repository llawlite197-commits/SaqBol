# SaqBol.kz MVP

SaqBol.kz is a monorepo MVP for a public anti-fraud portal and an employee workspace.

## Apps

```text
apps/public-web       Next.js public portal
apps/workspace-web    Next.js employee workspace
apps/api              NestJS API, Prisma, AI module
apps/ai-service       Optional future standalone AI service
packages/db           Prisma schema, generated client, seed
```

## Requirements

- Docker Desktop
- Node.js 20+ if running without Docker
- Corepack / pnpm 9.15.4

## First Run With Docker

```powershell
cd D:\Проекты\SaqBol
Copy-Item .env.example .env -Force
docker compose up --build -d postgres redis
docker compose --profile ops run --rm migrate
docker compose --profile ops run --rm seed
docker compose up --build
```

Open:

- Public Web: http://localhost:3000
- Workspace Web direct: http://localhost:3001/workspace/login
- Nginx Public: http://localhost
- Nginx Workspace: http://localhost/workspace/login
- API health: http://localhost:4000/api/v1/health
- API Swagger: http://localhost:4000/api/docs

## Daily Docker Commands

```powershell
docker compose up --build
docker compose down
docker compose logs -f api
docker compose ps
```

## Prisma Commands

Docker:

```powershell
docker compose --profile ops run --rm migrate
docker compose --profile ops run --rm seed
```

Local Windows:

```powershell
corepack pnpm install
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm db:studio
```

For local Windows without Docker, set `DATABASE_URL` in `.env` to:

```text
postgresql://saqbol_app:saqbol_password@localhost:5432/saqbol?schema=public
```

## Test Logins

Citizen:

```text
citizen@saqbol.local
Citizen123!Secure
```

Operator:

```text
operator@saqbol.local
Operator123!Secure
```

Admin:

```text
admin@saqbol.local
Admin123!Secure
```

Staff login uses mock 2FA in MVP. The code is returned by the API and auto-filled by the workspace UI.

## Local Without Docker

```powershell
corepack pnpm install
corepack pnpm db:generate
corepack pnpm dev:api
corepack pnpm dev:public
corepack pnpm dev:workspace
```

URLs:

- Public: http://localhost:3000
- Workspace: http://localhost:3001
- API: http://localhost:4000/api/v1/health

## Volumes

- `postgres_data`: PostgreSQL data
- `redis_data`: Redis data
- `uploads_data`: complaint files
- `exports_data`: CSV/XLSX exports

## AI Mode

If `OPENAI_API_KEY` is empty, the API uses safe mock mode. To enable real AI:

```text
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```
