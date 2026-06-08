"""legacy baseline

Revision ID: 20260607_0002
Revises:
Create Date: 2026-06-07 00:02:00.000000
"""

from collections.abc import Sequence

revision: str = "20260607_0002"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
