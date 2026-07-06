"""add file_path to report_jobs table

Revision ID: 20260630_001
Revises: 3f8b2c9a7d4e
Create Date: 2026-06-30 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260630_001'
down_revision: Union[str, Sequence[str], None] = '3f8b2c9a7d4e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('report_jobs', sa.Column('file_path', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('report_jobs', 'file_path')
