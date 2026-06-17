"""add report_jobs table

Revision ID: 3f8b2c9a7d4e
Revises: cdc63d67aa41
Create Date: 2026-06-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f8b2c9a7d4e'
down_revision: Union[str, Sequence[str], None] = 'cdc63d67aa41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'report_jobs',
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False),
        sa.Column('message', sa.String(length=1024), nullable=True),
        sa.Column('report_title', sa.String(length=255), nullable=True),
        sa.Column('report_template', sa.String(length=64), nullable=True),
        sa.Column('report_format', sa.String(length=10), nullable=True),
        sa.Column('created_date', sa.String(length=10), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('job_id', name='uq_report_jobs_job_id')
    )
    op.create_index(op.f('ix_report_jobs_org_created_at'), 'report_jobs', ['organization_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_report_jobs_org_created_at'), table_name='report_jobs')
    op.drop_table('report_jobs')
