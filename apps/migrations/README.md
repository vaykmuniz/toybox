# Toybox Migrations

Standalone Alembic project for the Toybox database.

## Commands

Create a manual revision from the repo root:

```bash
MESSAGE="describe change" mise run db:revision
```

Apply all migrations:

```bash
mise run db:migrate
```

Show the current database revision:

```bash
mise run db:current
```
