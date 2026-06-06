# Mobile/API Integrations

Use this guide when adding or changing integrations between `apps/mobile` and
`apps/api`.

This file is the shared contract guide for the mobile app and API. Update it
whenever an integration introduces a new endpoint pattern, response shape, error
behavior, environment requirement, asset convention, or test convention.

## Current Pattern

- `apps/api` owns integrated mock data through repositories and static assets.
- API controllers should map repository records into explicit Pydantic response
  models.
- Media fields returned to mobile should be absolute URLs, usually generated with
  FastAPI's `request.url_for("static", path=...)`.
- `apps/mobile` should call API endpoints through service modules in
  `src/services`.
- Hooks should wrap service modules only when the UI needs state such as loading,
  error, cached data, or refetch behavior.
- Route files in `apps/mobile/src/app` should stay focused on data loading,
  screen-level layout, and composing view components.
- Once a screen has an API endpoint, avoid embedding screen mock data in mobile
  with local `require()` calls.

## Adding An Integration

1. Add or update API response models in `apps/api/src/toybox_api/models`.
2. Put mock records and data access behavior in an API repository under
   `apps/api/src/toybox_api/repositories`.
3. Add a controller under `apps/api/src/toybox_api/controllers` that maps
   repository records to response models.
4. Register the controller router in `apps/api/src/toybox_api/main.py`.
5. Add static mock assets under `apps/api/src/toybox_api/static` when the
   response includes media.
6. Add API tests for endpoint status, payload metadata, response shape, and
   representative static asset URLs.
7. Add a mobile service module under `apps/mobile/src/services` with endpoint
   helpers, exported TypeScript types, timeout handling, HTTP error handling, and
   network error handling.
8. Add a mobile hook only if the integration needs loading/error/refetch state.
9. Update mobile screens and view components to consume typed service or hook
   data.
10. Add mobile unit tests for endpoint resolution, successful fetches, setup
    errors, HTTP errors, network failures, and timeouts.
11. Update this guide if the integration adds or changes a reusable pattern.

## API Best Practices

- Keep mock data in repositories, not controllers.
- Keep response models explicit and stable; do not leak repository dataclasses as
  response contracts.
- Return absolute URLs for image and media fields consumed by mobile.
- Keep controller mapping small and readable.
- Prefer one focused controller per feature area, such as `feed` or `profile`.
- Test that the endpoint omits fields the mobile contract should not expose.
- Use `httpx.AsyncClient` with `httpx.ASGITransport(app=app)` for in-process
  FastAPI endpoint tests.
- Test generated static URLs by asserting the URL path maps to a real file under
  `apps/api/src/toybox_api/static`. The local in-process static file streaming
  path may hang with the current test stack.

## Mobile Best Practices

- Centralize API URL resolution in service modules instead of building endpoint
  strings in screens or components.
- Preserve the local development behavior used by existing services:
  `EXPO_PUBLIC_API_URL`, localhost-to-LAN replacement for physical devices, Expo
  tunnel setup errors, trailing slash trimming, and request timeouts.
- Include the endpoint URL in network failure messages so local API setup issues
  are easy to diagnose.
- Keep reusable rendering logic in `components/views` or `components/ui`, not in
  route files.
- Export response types from the service module and re-export from hooks when
  components already import hook-level types.
- Prefer remote API data over local mobile asset mocks for integrated screens.
- Keep local `require()` assets only for app chrome, icons, placeholders, or
  screens that do not yet have an API-backed integration.

## Verification

Run the checks that match the changed integration:

```bash
uv run --project apps/api pytest
pnpm --filter @toybox/mobile test
pnpm --filter @toybox/mobile lint
```

For documentation-only changes, runtime tests are not required. Still verify
that referenced paths and commands match the current repo.
