"""add audit_schedule table

Revision ID: 4d5e6f7a8b90
Revises: 3c9e1f5c2ff0
Create Date: 2026-06-28 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "4d5e6f7a8b90"
down_revision: str | None = "3c9e1f5c2ff0"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "audit_schedule",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("cycle_frequency", sa.String(length=20), nullable=False, server_default="monthly"),
        sa.Column("next_audit_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_audit_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("organization_id", name="uq_audit_schedule_organization"),
    )
    op.create_index(op.f("ix_audit_schedule_organization_id"), "audit_schedule", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_schedule_organization_id"), table_name="audit_schedule")
    op.drop_table("audit_schedule")
