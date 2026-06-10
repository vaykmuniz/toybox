"""add avatar path to users

Revision ID: 20260610_0005
Revises: 20260608_0004
Create Date: 2026-06-10 00:05:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260610_0005"
down_revision: str | Sequence[str] | None = "20260608_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "avatar_path",
            sa.Text(),
            nullable=False,
            server_default="mocks/avatar.png",
        ),
    )
    op.alter_column("users", "avatar_path", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "avatar_path")
