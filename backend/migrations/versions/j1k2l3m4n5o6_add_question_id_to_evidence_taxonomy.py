"""Add question_id to evidence_taxonomy to persist question linkage.

Revision ID: j1k2l3m4n5o6
Revises: 8h9i0j1k2l3
Create Date: 2026-06-23 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'j1k2l3m4n5o6'
down_revision = '8h9i0j1k2l3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('evidence_taxonomy', sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_evidence_taxonomy_question_id',
        'evidence_taxonomy',
        'assessment_questions',
        ['question_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.create_index('ix_evidence_taxonomy_question_id', 'evidence_taxonomy', ['question_id'])


def downgrade() -> None:
    op.drop_index('ix_evidence_taxonomy_question_id', table_name='evidence_taxonomy')
    op.drop_constraint('fk_evidence_taxonomy_question_id', 'evidence_taxonomy', type_='foreignkey')
    op.drop_column('evidence_taxonomy', 'question_id')
