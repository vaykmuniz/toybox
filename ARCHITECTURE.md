# Architecture

Toybox is a small monorepo with a mobile client, a FastAPI service, standalone
database migrations, local Postgres, S3-compatible object storage integrations,
Resend email verification, JWT authentication, and Sentry observability.

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
  middleware/static assets, initializes observability, and includes routers.
- `controllers/`: FastAPI routers. Controllers read request context, call
  services, and return response models.
- `services/`: application orchestration. Services call repositories, generate
  JWTs, send verification email, create presigned object storage URLs, and build
  API response models.
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

## Object Storage, Email, And Auth

Toy and avatar media use an S3-compatible object storage flow. The API creates
short-lived presigned upload URLs, mobile uploads files directly to object
storage, and then mobile calls the API to persist the object key or public URL.
Read URLs returned for profile and odds media may also be presigned and
short-lived.

Account verification email is sent through Resend during registration. If email
delivery fails, registration fails and the pending account is not kept. Verified
users log in with username and password, receive a bearer token, and pass it to
authenticated endpoints through the `Authorization` header.

Sentry is optional and controlled by environment variables. The API initializes
Sentry at startup when configured, and the mobile app initializes Sentry from the
Expo public DSN.

## Endpoint Contracts

Controllers should preserve public endpoint shapes unless a change is planned
with matching mobile-client updates and tests. Current API endpoints include:

- `GET /health`
- `GET /health/db`
- `POST /register`
- `POST /register/verify`
- `GET /register/verify`
- `POST /login`
- `GET /profile`
- `POST /profile/avatar/upload-url`
- `PUT /profile/avatar`
- `POST /toys/upload-url`
- `POST /toys`
- `GET /odds/recent-catches`
- `/static/*`
- `GET /sentry-debug`

`GET /profile`, `/profile/avatar/*`, `POST /toys`, and
`GET /odds/recent-catches` require bearer authentication. Upload URL endpoints
return `upload_url`, `object_url`, and `object_key`.

## Mobile Import Conventions

Do not create or use barrel export files for mobile components, such as
`components/views/odds/index.ts` or files that only re-export sibling components:

```ts
export { OddsErrorState, OddsLoadingState } from './odds-empty-state.component';
export { OddsProfileCard } from './odds-profile-card.component';
export { OddsView } from './odds-view.component';
```

Import components directly from their implementation files instead. This keeps
component ownership explicit and avoids hidden dependency edges.
