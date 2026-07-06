"""add capa tracker module

Revision ID: zz_add_capa_tracker
Revises: zz_add_sync_interval_hours
Create Date: 2026-06-26 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'zz_add_capa_tracker'
down_revision = 'zz_add_sync_interval_hours'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'capas',
        sa.Column('organization_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('open', 'inProgress', 'resolved', 'closed', name='capa_status'), nullable=False, server_default='open'),
        sa.Column('priority', sa.Enum('critical', 'high', 'medium', 'low', name='capa_priority'), nullable=False),
        sa.Column('source', sa.Enum('internal_audit', 'external_audit', 'incident', 'management_review', name='capa_source'), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('assigned_to', sa.Uuid(), nullable=True),
        sa.Column('control_id', sa.String(length=36), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('progress BETWEEN 0 AND 100', name='ck_capas_progress_range'),
    )
    op.create_index(op.f('ix_capas_organization_id'), 'capas', ['organization_id'], unique=False)
    op.create_index('ix_capas_org_created_at', 'capas', ['organization_id', 'created_at'], unique=False)
    op.create_index('ix_capas_org_status', 'capas', ['organization_id', 'status'], unique=False)
    op.create_index('ix_capas_org_priority', 'capas', ['organization_id', 'priority'], unique=False)
    op.create_index('ix_capas_org_source', 'capas', ['organization_id', 'source'], unique=False)
    op.create_index(op.f('ix_capas_assigned_to'), 'capas', ['assigned_to'], unique=False)
    op.create_index(op.f('ix_capas_control_id'), 'capas', ['control_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_capas_control_id'), table_name='capas')
    op.drop_index(op.f('ix_capas_assigned_to'), table_name='capas')
    op.drop_index('ix_capas_org_source', table_name='capas')
    op.drop_index('ix_capas_org_priority', table_name='capas')
    op.drop_index('ix_capas_org_status', table_name='capas')
    op.drop_index('ix_capas_org_created_at', table_name='capas')
    op.drop_index(op.f('ix_capas_organization_id'), table_name='capas')
    op.drop_table('capas')
