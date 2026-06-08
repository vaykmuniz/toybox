"""add tries to toy

Revision ID: 20260608_0004
Revises: 20260607_0003
Create Date: 2026-06-08 00:04:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260608_0004"
down_revision: str | Sequence[str] | None = "20260607_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "toy",
        sa.Column("tries", sa.Integer(), server_default="1", nullable=False),
    )
    op.alter_column("toy", "tries", server_default=None)


def downgrade() -> None:
    op.drop_column("toy", "tries")
