"""add attempt fields to toy

Revision ID: 20260612_0009
Revises: 20260611_0008
Create Date: 2026-06-12 00:09:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260612_0009"
down_revision: str | Sequence[str] | None = "20260611_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("toy", "name", new_column_name="description")
    op.add_column(
        "toy",
        sa.Column("caught", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.add_column(
        "toy",
        sa.Column("cost_per_try", sa.Integer(), server_default="0", nullable=False),
    )
    op.alter_column("toy", "caught", server_default=None)
    op.alter_column("toy", "cost_per_try", server_default=None)
    op.alter_column("toy", "image_url", nullable=True)
    op.alter_column("toy", "object_key", nullable=True)


def downgrade() -> None:
    op.execute(
        """
        update toy
        set
            image_url = coalesce(image_url, ''),
            object_key = coalesce(object_key, 'missing-' || id::text)
        where image_url is null
           or object_key is null
        """
    )
    op.alter_column("toy", "object_key", nullable=False)
    op.alter_column("toy", "image_url", nullable=False)
    op.drop_column("toy", "cost_per_try")
    op.drop_column("toy", "caught")
    op.alter_column("toy", "description", new_column_name="name")
