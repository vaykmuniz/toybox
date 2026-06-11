"""make user avatar nullable

Revision ID: 20260610_0007
Revises: 20260610_0006
Create Date: 2026-06-10 00:07:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260610_0007"
down_revision: str | Sequence[str] | None = "20260610_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("update users set avatar_path = null where avatar_path = 'mocks/avatar.png'")
    op.alter_column("users", "avatar_path", nullable=True)


def downgrade() -> None:
    op.execute("update users set avatar_path = 'mocks/avatar.png' where avatar_path is null")
    op.alter_column("users", "avatar_path", nullable=False)
