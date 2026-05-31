"""add iso 27001 chunks

Revision ID: d4e5f6a7b8c9
Revises: e3a4b5c6d7
Create Date: 2026-05-20 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "e3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "iso_27001_chunks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("clause_ref", sa.String(length=50), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute("ALTER TABLE iso_27001_chunks ADD COLUMN embedding vector(1536) NOT NULL")
    op.create_index(
        "ix_iso_27001_chunks_clause_ref",
        "iso_27001_chunks",
        ["clause_ref"],
        unique=False,
    )
    op.execute(
        "CREATE INDEX ix_iso_27001_chunks_embedding "
        "ON iso_27001_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_iso_27001_chunks_embedding")
    op.drop_index("ix_iso_27001_chunks_clause_ref", table_name="iso_27001_chunks")
    op.drop_table("iso_27001_chunks")
