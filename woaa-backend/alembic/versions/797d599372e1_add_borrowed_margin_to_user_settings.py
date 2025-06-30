"""add borrowed_margin to user_settings

Revision ID: 797d599372e1
Revises: 315fe8c741e7
Create Date: 2025-06-30 02:51:09.274595

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'your_new_revision_id'
down_revision = '315fe8c741e7'  # Replace with previous revision ID
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'user_settings',
        sa.Column('borrowed_margin', sa.Float(), nullable=False, server_default='0.0')
    )


def downgrade():
    op.drop_column('user_settings', 'borrowed_margin')
