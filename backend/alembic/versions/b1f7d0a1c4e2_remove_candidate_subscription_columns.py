"""remove_user_and_recruiter_subscription_columns

Revision ID: b1f7d0a1c4e2
Revises: 462dfb7ad80e
Create Date: 2026-06-25 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1f7d0a1c4e2"
down_revision: Union[str, Sequence[str], None] = "462dfb7ad80e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove subscription fields from non-paying account/profile tables."""
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("subscription_expires_at")
        batch_op.drop_column("subscription_status")

    with op.batch_alter_table("company_profiles") as batch_op:
        batch_op.drop_column("subscription_plan")


def downgrade() -> None:
    """Restore subscription fields on non-paying account/profile tables."""
    with op.batch_alter_table("company_profiles") as batch_op:
        batch_op.add_column(sa.Column("subscription_plan", sa.String(), nullable=True))

    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("subscription_status", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("subscription_expires_at", sa.TIMESTAMP(), nullable=True))
