"""add iso threat catalog

Revision ID: g3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Create Date: 2026-05-27 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "g3b4c5d6e7f8"
down_revision: Union[str, Sequence[str], None] = "f2a3b4c5d6e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "iso_threat_catalog",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("affected_controls", sa.ARRAY(sa.String(length=20)), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_iso_threat_catalog_code"),
    )
    op.create_index("ix_iso_threat_catalog_code", "iso_threat_catalog", ["code"], unique=False)
    op.create_index("ix_iso_threat_catalog_category", "iso_threat_catalog", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_iso_threat_catalog_category", table_name="iso_threat_catalog")
    op.drop_index("ix_iso_threat_catalog_code", table_name="iso_threat_catalog")
    op.drop_table("iso_threat_catalog")
