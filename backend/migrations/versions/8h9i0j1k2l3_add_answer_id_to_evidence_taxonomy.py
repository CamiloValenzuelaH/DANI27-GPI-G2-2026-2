"""Add answer_id to evidence_taxonomy to link evidences with assessment answers.

Revision ID: 8h9i0j1k2l3
Revises: a7b8c9d0e1f2
Create Date: 2026-06-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8h9i0j1k2l3'
down_revision = 'a7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add answer_id column to evidence_taxonomy
    op.add_column('evidence_taxonomy', sa.Column('answer_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_evidence_taxonomy_answer_id',
        'evidence_taxonomy',
        'assessment_answers',
        ['answer_id'],
        ['id'],
        ondelete='CASCADE'
    )
    
    # Create index for faster lookups
    op.create_index('ix_evidence_taxonomy_answer_id', 'evidence_taxonomy', ['answer_id'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_evidence_taxonomy_answer_id', table_name='evidence_taxonomy')
    
    # Drop foreign key
    op.drop_constraint('fk_evidence_taxonomy_answer_id', 'evidence_taxonomy', type_='foreignkey')
    
    # Drop column
    op.drop_column('evidence_taxonomy', 'answer_id')
