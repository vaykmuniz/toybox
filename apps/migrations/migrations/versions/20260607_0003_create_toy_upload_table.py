"""create toy upload table

Revision ID: 20260607_0003
Revises: 20260607_0002
Create Date: 2026-06-07 00:03:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260607_0003"
down_revision: str | Sequence[str] | None = "20260607_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "toy",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("object_key"),
    )


def downgrade() -> None:
    op.drop_table("toy")
