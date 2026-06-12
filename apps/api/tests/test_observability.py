import httpx

from toybox_api.config import Settings
from toybox_api.main import app
from toybox_api.observability import initialize_sentry


def capture_sentry_init(init_calls: list[dict[str, object]]):
    def capture(**kwargs) -> None:
        init_calls.append(kwargs)

    return capture


def test_sentry_settings_defaults() -> None:
    settings = Settings(_env_file=None)

    assert settings.sentry_dsn == ""
    assert settings.sentry_send_default_pii is False
    assert settings.sentry_traces_sample_rate == 1.0
    assert settings.sentry_enable_logs is True


def test_initialize_sentry_skips_without_dsn(monkeypatch) -> None:
    init_calls: list[dict[str, object]] = []
    monkeypatch.setattr("toybox_api.observability.sentry_sdk.init", capture_sentry_init(init_calls))

    initialized = initialize_sentry(Settings(sentry_dsn="", _env_file=None))

    assert initialized is False
    assert init_calls == []


def test_initialize_sentry_uses_settings(monkeypatch) -> None:
    init_calls: list[dict[str, object]] = []
    monkeypatch.setattr("toybox_api.observability.sentry_sdk.init", capture_sentry_init(init_calls))

    initialized = initialize_sentry(
        Settings(
            sentry_dsn="https://examplePublicKey@example.ingest.sentry.io/1",
            sentry_send_default_pii=True,
            sentry_traces_sample_rate=0.25,
            sentry_enable_logs=False,
            _env_file=None,
        )
    )

    assert initialized is True
    assert init_calls == [
        {
            "dsn": "https://examplePublicKey@example.ingest.sentry.io/1",
            "send_default_pii": True,
            "traces_sample_rate": 0.25,
            "enable_logs": False,
        }
    ]


async def test_sentry_debug_route_raises_server_error() -> None:
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/sentry-debug")

    assert response.status_code == 500
