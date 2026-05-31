"""Add evidence taxonomy table

Revision ID: f1a2b3c4d5e6
Revises: 68ad2a50c64c
Create Date: 2026-05-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "68ad2a50c64c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


EVIDENCE_TYPES = ("POLICY", "PROCEDURE", "INSTRUCTION", "CONTROL", "RECORD")


def upgrade() -> None:
    op.create_table(
        "evidence_taxonomy",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("control_id", sa.String(length=64), nullable=True),
        sa.Column("clause_ref", sa.String(length=32), nullable=True),
        sa.Column("validity_days", sa.Integer(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "type IN ('POLICY', 'PROCEDURE', 'INSTRUCTION', 'CONTROL', 'RECORD')",
            name="ck_evidence_taxonomy_type",
        ),
        sa.CheckConstraint("validity_days > 0", name="ck_evidence_taxonomy_validity_days_positive"),
    )
    op.create_index(op.f("ix_evidence_taxonomy_organization_id"), "evidence_taxonomy", ["organization_id"], unique=False)
    op.create_index("ix_evidence_taxonomy_org_type", "evidence_taxonomy", ["organization_id", "type"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_evidence_taxonomy_org_type", table_name="evidence_taxonomy")
    op.drop_index(op.f("ix_evidence_taxonomy_organization_id"), table_name="evidence_taxonomy")
    op.drop_table("evidence_taxonomy")