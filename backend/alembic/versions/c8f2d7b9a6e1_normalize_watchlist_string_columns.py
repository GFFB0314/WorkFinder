"""normalize_watchlist_string_columns

Revision ID: c8f2d7b9a6e1
Revises: b1f7d0a1c4e2
Create Date: 2026-06-25 13:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c8f2d7b9a6e1"
down_revision: Union[str, Sequence[str], None] = "b1f7d0a1c4e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Normalize watchlist text filter columns to String."""
    with op.batch_alter_table("watchlists") as batch_op:
        batch_op.alter_column(
            "location",
            existing_type=sa.Text(),
            type_=sa.String(),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "experience_level",
            existing_type=sa.Text(),
            type_=sa.String(),
            existing_nullable=True,
        )


def downgrade() -> None:
    """Restore watchlist text filter columns to Text."""
    with op.batch_alter_table("watchlists") as batch_op:
        batch_op.alter_column(
            "experience_level",
            existing_type=sa.String(),
            type_=sa.Text(),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "location",
            existing_type=sa.String(),
            type_=sa.Text(),
            existing_nullable=True,
        )
