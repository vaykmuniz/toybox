import sentry_sdk

from toybox_api.config import Settings, get_settings


def initialize_sentry(settings: Settings | None = None) -> bool:
    settings = settings or get_settings()

    if not settings.sentry_dsn:
        return False

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        send_default_pii=settings.sentry_send_default_pii,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        enable_logs=settings.sentry_enable_logs,
    )
    return True
