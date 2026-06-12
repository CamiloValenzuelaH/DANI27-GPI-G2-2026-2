"""add connectors table

Revision ID: 2a90deb87d57
Revises: a1b2c3d4e5f6
Create Date: 2026-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2a90deb87d57'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'connectors',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(32), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='disconnected'),
        sa.Column('encrypted_access_token', sa.Text(), nullable=True),
        sa.Column('encrypted_refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('oauth_scopes', sa.String(1024), nullable=True),
        sa.Column('encrypted_aws_access_key_id', sa.Text(), nullable=True),
        sa.Column('encrypted_aws_secret_access_key', sa.Text(), nullable=True),
        sa.Column('aws_region', sa.String(32), nullable=True),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_sync_error', sa.Text(), nullable=True),
        sa.Column('auto_sync_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint(
            "type IN ('google_workspace', 'microsoft_365', 'aws', 'github')",
            name='ck_connector_type'
        ),
        sa.CheckConstraint(
            "status IN ('connected', 'disconnected', 'error', 'syncing')",
            name='ck_connector_status'
        ),
    )
    op.create_index('ix_connector_org_id', 'connectors', ['organization_id'])
    op.create_index(
        'uq_connector_org_type',
        'connectors',
        ['organization_id', 'type'],
        unique=True
    )


def downgrade() -> None:
    op.drop_index('uq_connector_org_type', table_name='connectors')
    op.drop_index('ix_connector_org_id', table_name='connectors')
    op.drop_table('connectors')