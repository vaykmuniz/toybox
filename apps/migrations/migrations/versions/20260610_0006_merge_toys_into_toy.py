"""merge toys into toy

Revision ID: 20260610_0006
Revises: 20260610_0005
Create Date: 2026-06-10 00:06:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260610_0006"
down_revision: str | Sequence[str] | None = "20260610_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("toy", sa.Column("user_id", sa.CHAR(length=36), nullable=True))
    op.execute(
        """
        update toy
        set user_id = (select id from users order by created_at asc limit 1)
        where user_id is null
          and (select count(*) from users) = 1
        """
    )
    op.execute(
        """
        do $$
        begin
            if exists (select 1 from toy where user_id is null) then
                raise exception
                    'Cannot add required toy.user_id while ownerless toy rows exist.';
            end if;
        end $$;
        """
    )
    op.alter_column("toy", "user_id", nullable=False)
    op.create_foreign_key(
        "fk_toy_user",
        "toy",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_table("toys")


def downgrade() -> None:
    op.create_table(
        "toys",
        sa.Column("id", sa.CHAR(length=36), primary_key=True),
        sa.Column("user_id", sa.CHAR(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.current_timestamp()),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_toys_user",
            ondelete="CASCADE",
        ),
    )
    op.drop_constraint("fk_toy_user", "toy", type_="foreignkey")
    op.drop_column("toy", "user_id")
