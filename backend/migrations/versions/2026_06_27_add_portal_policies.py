"""add portal policies

Revision ID: 3c9e1f5c2ff0
Revises: 3f0c0efcc7f7
Create Date: 2026-06-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "3c9e1f5c2ff0"
down_revision = "e8f9a0b1c2d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "policies",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("document_version", sa.String(length=50), nullable=False),
        sa.Column("mandatory", sa.Boolean(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_policies_organization_id"), "policies", ["organization_id"], unique=False)
    op.create_index("ix_policies_org_status", "policies", ["organization_id", "status"], unique=False)

    op.create_table(
        "policy_acknowledgments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("policy_id", sa.String(length=36), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("document_version", sa.String(length=50), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["policy_id"], ["policies.id"], ),
    )
    op.create_index(op.f("ix_policy_acknowledgments_user_id"), "policy_acknowledgments", ["user_id"], unique=False)
    op.create_index(op.f("ix_policy_acknowledgments_policy_id"), "policy_acknowledgments", ["policy_id"], unique=False)
    op.create_index(op.f("ix_policy_acknowledgments_organization_id"), "policy_acknowledgments", ["organization_id"], unique=False)
    op.create_index("ix_policy_ack_user_version", "policy_acknowledgments", ["user_id", "policy_id", "document_version"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_policy_ack_user_version", table_name="policy_acknowledgments")
    op.drop_index(op.f("ix_policy_acknowledgments_organization_id"), table_name="policy_acknowledgments")
    op.drop_index(op.f("ix_policy_acknowledgments_policy_id"), table_name="policy_acknowledgments")
    op.drop_index(op.f("ix_policy_acknowledgments_user_id"), table_name="policy_acknowledgments")
    op.drop_table("policy_acknowledgments")
    op.drop_index("ix_policies_org_status", table_name="policies")
    op.drop_index(op.f("ix_policies_organization_id"), table_name="policies")
    op.drop_table("policies")
