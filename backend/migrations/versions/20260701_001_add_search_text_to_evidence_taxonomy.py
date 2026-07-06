"""Add search_text to evidence_taxonomy for richer search

Revision ID: 20260701_001
Revises: j1k2l3m4n5o6, feff6ed97204
Create Date: 2026-07-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260701_001"
down_revision: Union[str, Sequence[str], None] = ("j1k2l3m4n5o6", "feff6ed97204")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("evidence_taxonomy", sa.Column("search_text", sa.String(length=4000), nullable=True))


def downgrade() -> None:
    op.drop_column("evidence_taxonomy", "search_text")
