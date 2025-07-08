"""rename margin_rate to margin_limit and remove margin_type

Revision ID: 2aa85d6fa51d
Revises: your_new_revision_id
Create Date: 2025-06-30 17:16:23.127699

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2aa85d6fa51d'
down_revision: Union[str, Sequence[str], None] = 'your_new_revision_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Rename margin_rate to margin_limit
    op.alter_column(
        "user_settings",
        "margin_rate",
        new_column_name="margin_limit",
        existing_type=sa.Float(),
    )

    # Drop margin_type
    op.drop_column("user_settings", "margin_type")


def downgrade():
    # Rename margin_limit back to margin_rate
    op.alter_column(
        "user_settings",
        "margin_limit",
        new_column_name="margin_rate",
        existing_type=sa.Float(),
    )

    # Re-add margin_type as an Enum
    setting_type = sa.Enum("real", "sim", name="settingtype")
    setting_type.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "user_settings",
        sa.Column("margin_type", setting_type, nullable=True, server_default="sim"),
    )