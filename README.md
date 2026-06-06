# Toybox

Full-stack local development sandbox with Expo React Native, FastAPI, Postgres, Docker Compose, and mise.

## Structure

- `apps/mobile`: Expo React Native app.
- `apps/api`: FastAPI app.
- `apps/migrations`: standalone Alembic migration project.
- `docker-compose.yml`: local Postgres service.
- `.mise.toml`: shared tools, env defaults, and runnable tasks.
- `CODEX.md`: agent-facing project context and conventions.

## Prerequisites

- mise
- Docker with Docker Compose

The pinned Node, pnpm, Python, and uv versions are managed through mise.

## Setup

```bash
mise install
mise run install
```

Copy `.env.example` to `.env` only when you need to override defaults. The mise defaults are enough for local development.

## Run Locally

Start Postgres:

```bash
mise run db:up
```

Run the API:

```bash
mise run dev:api
```

Run the mobile app:

```bash
mise run dev:mobile
```

Run the mobile app from Expo Go on a physical phone over LAN:

```bash
EXPO_LAN_IP=192.168.1.20 mise run dev:mobile:lan
```

Replace `192.168.1.20` with your computer's LAN IP. In WSL, use the Windows host
LAN IP that your phone can reach, not `localhost` and usually not the WSL-only IP.
The LAN task also sets `EXPO_PUBLIC_API_URL` to `http://$EXPO_LAN_IP:8000`, so
mobile API requests do not point at the phone's own `localhost`. It starts Expo
in LAN mode, so the QR code should show a LAN URL instead of an `exp.direct`
tunnel URL.

Before opening the app on the phone, confirm the API is reachable from the phone
browser:

```bash
http://192.168.1.20:8000/health
```

If that URL does not return JSON on the phone, fix the LAN IP, firewall, router,
or WSL port forwarding first; the app cannot load the feed until the phone can
reach the API.

Do not use the Expo tunnel host, such as `*.exp.direct`, as the API host. The
tunnel points the phone at Metro on port `8081`; it does not expose FastAPI on
port `8000`.

For Android emulator networking, use the emulator host alias instead:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 mise run dev:mobile
```

Or run the stack together:

```bash
mise run dev
```

For the full stack with a physical phone, use the LAN task instead:

```bash
EXPO_LAN_IP=192.168.1.20 mise run dev:lan
```

If React Native DevTools fails in WSL with a missing `libnspr4.so`, install the
Ubuntu libraries needed by the bundled Electron/Chromium shell:

```bash
sudo apt update
sudo apt install -y libnss3 libasound2
```

After installing, restart Expo. If API requests fail with `Unexpected token '<'`,
open `http://<your-computer-lan-ip>:8000/health` from the phone browser; it should
return JSON.

## Checks

```bash
mise run test
mise run lint
```

## Local URLs

- FastAPI: `http://localhost:8000`
- API health: `http://localhost:8000/health`
- API database health: `http://localhost:8000/health/db`
- Postgres: `localhost:5432`

## Database

Default local credentials:

- database: `toybox`
- user: `toybox`
- password: `toybox`

Reset local data:

```bash
mise run db:reset
```

## Migrations

Alembic lives in its own monorepo project at `apps/migrations`; keep migration dependencies and files there instead of mixing them into the FastAPI app.

Create a migration:

```bash
MESSAGE="create users" mise run db:revision
```

Apply migrations:

```bash
mise run db:migrate
```

Show the current database revision:

```bash
mise run db:current
```
