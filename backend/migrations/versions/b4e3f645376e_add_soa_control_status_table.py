"""Add SOAControlStatus table for Statement of Applicability.

Revision ID: b4e3f645376e
Revises: a3d2f534265d
Create Date: 2026-06-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b4e3f645376e'
down_revision = 'a3d2f534265d'
branch_labels = None
depends_on = None


def upgrade():
    # Create ENUM for implementation_status
    impl_status_enum = postgresql.ENUM(
        'no_implementado', 'parcial', 'implementado',
        name='implementationstatus',
        create_type=False
    )
    impl_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Create table
    op.create_table(
        'soa_control_status',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.Column('organization_id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('applicable', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('implementation_status', impl_status_enum, nullable=False, server_default='no_implementado'),
        sa.Column('exclusion_justification', sa.Text(), nullable=True),
        sa.Column('policy_reference', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['assessment_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'question_id', name='uq_soa_control_status_org_question'),
    )
    
    # Create indexes
    op.create_index(op.f('ix_soa_control_status_organization_id'), 'soa_control_status', ['organization_id'], unique=False)
    op.create_index(op.f('ix_soa_control_status_question_id'), 'soa_control_status', ['question_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_soa_control_status_question_id'), table_name='soa_control_status')
    op.drop_index(op.f('ix_soa_control_status_organization_id'), table_name='soa_control_status')
    op.drop_table('soa_control_status')
    
    # Drop ENUM
    sa.Enum(name='implementationstatus').drop(op.get_bind(), checkfirst=True)
