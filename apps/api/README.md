# Toybox API

FastAPI service for the local Toybox stack.

## Run

```bash
mise run dev:api
```

## Endpoints

- `GET /health`: process health.
- `GET /health/db`: verifies a Postgres connection with `select 1`.
