"""add evidence metadata to evidence_taxonomy

Revision ID: feff6ed97204
Revises: 3f8b2c9a7d4e
Create Date: 2026-06-28 19:17:27.020455

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'feff6ed97204'
down_revision = '3f8b2c9a7d4e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('evidence_taxonomy', sa.Column('original_file_name', sa.String(length=255), nullable=True))
    op.add_column('evidence_taxonomy', sa.Column('file_path', sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column('evidence_taxonomy', 'file_path')
    op.drop_column('evidence_taxonomy', 'original_file_name')
