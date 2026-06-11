"""rename avatar path to avatar url

Revision ID: 20260611_0008
Revises: 20260610_0007
Create Date: 2026-06-11 00:08:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260611_0008"
down_revision: str | Sequence[str] | None = "20260610_0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("users", "avatar_path", new_column_name="avatar_url")


def downgrade() -> None:
    op.alter_column("users", "avatar_url", new_column_name="avatar_path")
