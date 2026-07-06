"""Add section_type to iso_27001_chunks

Revision ID: z1a2b3c4d5e6
Revises: e7f8a9b0c1d2
Create Date: 2026-06-20 15:36:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "z1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e7f8a9b0c1d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add nullable column first
    op.add_column('iso_27001_chunks', sa.Column('section_type', sa.String(length=20), nullable=True))

    # Populate based on clause_ref: A.* -> annex_a, otherwise body
    op.execute(
        "UPDATE iso_27001_chunks SET section_type = CASE WHEN clause_ref LIKE 'A.%' THEN 'annex_a' ELSE 'body' END"
    )

    # Optionally set NOT NULL to enforce presence
    op.alter_column('iso_27001_chunks', 'section_type', nullable=False)


def downgrade() -> None:
    op.drop_column('iso_27001_chunks', 'section_type')
