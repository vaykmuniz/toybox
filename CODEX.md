# Codex Context

This repo is a fresh full-stack sandbox. Treat `mise` as the main interface for setup, local development, and checks.

## Stack

- Mobile: Expo React Native app in `apps/mobile`, generated from `create-expo-app` using SDK 56.
- API: FastAPI app in `apps/api`, managed by `uv`.
- Migrations: standalone Alembic project in `apps/migrations`, managed by `uv`.
- Database: local Postgres from `docker-compose.yml`.
- Orchestration: root `.mise.toml` tasks.

## Commands

- `mise install`: install declared tools.
- `mise run install`: install Node and Python dependencies.
- `mise run db:up`: start local Postgres.
- `mise run dev:api`: run FastAPI on `localhost:8000`.
- `mise run dev:mobile`: run Expo.
- `mise run dev`: run the local stack after starting Postgres.
- `MESSAGE="describe change" mise run db:revision`: create a manual Alembic revision.
- `mise run db:migrate`: apply Alembic migrations.
- `mise run db:current`: show the current migration revision.
- `mise run test`: run starter tests.
- `mise run lint`: run starter linters.

## Conventions

- Keep app code under `apps/mobile`, API code under `apps/api`, and database migrations under `apps/migrations`.
- Do not add Alembic as an API dependency unless the API starts managing migrations at runtime.
- Use manual Alembic revisions until shared database models are introduced.
- Prefer adding new local service dependencies to Docker Compose and exposing them through mise tasks.
- Keep environment defaults in `.mise.toml`; document copyable values in `.env.example`.
- Do not commit real secrets. Local credentials in this repo are development-only.
- If a task needs dependencies, add them to the owning package manager instead of shelling out to globally installed tools.
