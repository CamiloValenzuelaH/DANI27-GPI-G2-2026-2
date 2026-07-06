"""add sync_interval_hours to connectors

Revision ID: zz_add_sync_interval_hours
Revises: 2a90deb87d57
Create Date: 2026-06-23 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'zz_add_sync_interval_hours'
down_revision = '2a90deb87d57'
branch_labels = None
depends_on = None


def upgrade():
    # Check if table exists before modifying
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'connectors' in inspector.get_table_names():
        # Check if column already exists
        columns = [col['name'] for col in inspector.get_columns('connectors')]
        if 'sync_interval_hours' not in columns:
            # Add column with server default 24 to avoid NULLs for existing rows
            op.add_column('connectors', sa.Column('sync_interval_hours', sa.Integer(), nullable=False, server_default=sa.text('24')))
            # Remove server default to rely on application default going forward
            with op.get_context().autocommit_block():
                op.alter_column('connectors', 'sync_interval_hours', server_default=None)


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    
    if 'connectors' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('connectors')]
        if 'sync_interval_hours' in columns:
            op.drop_column('connectors', 'sync_interval_hours')
