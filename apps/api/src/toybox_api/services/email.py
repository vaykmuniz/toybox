from html import escape
from urllib.parse import urlencode

import resend

from toybox_api.config import get_settings


class EmailDeliveryError(Exception):
    """Raised when an outbound email provider rejects a send request."""


class ResendEmailService:
    def send_registration_email(self, *, email: str, username: str, token: str) -> None:
        settings = get_settings()
        verification_url = self._verification_url(username=username, token=token)

        try:
            resend.api_key = settings.resend_api_key
            resend.Emails.send(
                {
                    "from": settings.resend_from_email,
                    "to": email,
                    "subject": "Verify your Toybox account",
                    "html": (
                        "<p>Welcome to Toybox.</p>"
                        "<p>Verify your account with this link:</p>"
                        f'<p><a href="{escape(verification_url, quote=True)}">'
                        "Verify account"
                        "</a></p>"
                    ),
                }
            )
        except Exception as error:
            raise EmailDeliveryError("Failed to send verification email.") from error

    def _verification_url(self, *, username: str, token: str) -> str:
        settings = get_settings()
        base_url = settings.api_public_url.rstrip("/")
        query = urlencode({"username": username, "token": token})

        return f"{base_url}/register/verify?{query}"
