# Architecture

Toybox is a small monorepo with a mobile client, a FastAPI service, standalone
database migrations, and local Postgres.

## Workspace Layout

- `apps/mobile`: Expo React Native app.
- `apps/api`: FastAPI app.
- `apps/migrations`: standalone Alembic project for database migrations.
- `docker-compose.yml`: local Postgres service.
- `.mise.toml`: shared tools, environment defaults, and project tasks.

## FastAPI API Pattern

The API uses a model/controller/repository structure under
`apps/api/src/toybox_api`.

- `main.py`: application composition only. It creates the FastAPI app, configures
  middleware/static assets, and includes routers.
- `controllers/`: FastAPI routers and request-level orchestration. Controllers
  read request context, call repositories, and return response models.
- `models/`: Pydantic API models for request and response contracts.
- `repositories/`: data access boundaries. Repositories return internal records
  and hide whether data comes from mocks, raw SQL, or another source.
- `db.py`: low-level database helpers shared by repositories or health checks.
- `config.py`: settings loaded from environment variables and `.env`.

Keep HTTP concerns in controllers, API contract definitions in models, and data
lookup logic in repositories. Avoid building response URLs or reading request
state in repositories.

## Database Access

The API should use raw SQL through `asyncpg` for runtime database access. Do not
add an ORM to the API unless the architecture decision changes.

Alembic remains isolated in `apps/migrations`; the API should not manage
migrations at runtime. When a repository moves from mock data to persisted data,
add the database schema through a migration in `apps/migrations` and keep the API
repository responsible only for querying or mutating that schema.

## Endpoint Contracts

Controllers should preserve public endpoint shapes unless a change is planned
with matching mobile-client updates and tests. Current API endpoints include:

- `GET /health`
- `GET /health/db`
- `GET /feed`
- `/static/*`
