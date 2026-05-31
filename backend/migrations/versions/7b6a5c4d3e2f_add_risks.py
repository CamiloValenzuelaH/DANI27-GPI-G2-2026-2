"""add risks and risk evaluations

Revision ID: 7b6a5c4d3e2f
Revises: 9f7c2b1a8e44
Create Date: 2026-05-23 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7b6a5c4d3e2f"
down_revision: Union[str, Sequence[str], None] = "9f7c2b1a8e44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "risks",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("probability", sa.Integer(), nullable=False),
        sa.Column("impact", sa.Integer(), nullable=False),
        sa.Column("inherent_risk", sa.Integer(), nullable=False),
        sa.Column("inherent_risk_level", sa.String(length=20), nullable=False),
        sa.Column("inherent_risk_color", sa.String(length=20), nullable=False),
        sa.Column("treatment_probability", sa.Integer(), nullable=True),
        sa.Column("treatment_impact", sa.Integer(), nullable=True),
        sa.Column("residual_risk", sa.Integer(), nullable=False),
        sa.Column("residual_risk_level", sa.String(length=20), nullable=False),
        sa.Column("residual_risk_color", sa.String(length=20), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("probability BETWEEN 1 AND 5", name="ck_risks_probability_range"),
        sa.CheckConstraint("impact BETWEEN 1 AND 5", name="ck_risks_impact_range"),
    )
    op.create_index(op.f("ix_risks_asset_id"), "risks", ["asset_id"], unique=False)
    op.create_index(op.f("ix_risks_organization_id"), "risks", ["organization_id"], unique=False)
    op.create_index("ix_risks_org_created_at", "risks", ["organization_id", "created_at"], unique=False)
    op.create_index("ix_risks_org_inherent_level", "risks", ["organization_id", "inherent_risk_level"], unique=False)
    op.create_index("ix_risks_org_residual_level", "risks", ["organization_id", "residual_risk_level"], unique=False)

    op.create_table(
        "risk_evaluations",
        sa.Column("risk_id", sa.Uuid(), nullable=True),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("operation", sa.String(length=20), nullable=False),
        sa.Column("probability", sa.Integer(), nullable=False),
        sa.Column("impact", sa.Integer(), nullable=False),
        sa.Column("inherent_risk", sa.Integer(), nullable=False),
        sa.Column("inherent_risk_level", sa.String(length=20), nullable=False),
        sa.Column("inherent_risk_color", sa.String(length=20), nullable=False),
        sa.Column("treatment_probability", sa.Integer(), nullable=True),
        sa.Column("treatment_impact", sa.Integer(), nullable=True),
        sa.Column("residual_risk", sa.Integer(), nullable=False),
        sa.Column("residual_risk_level", sa.String(length=20), nullable=False),
        sa.Column("residual_risk_color", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("evaluated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["risk_id"], ["risks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("probability BETWEEN 1 AND 5", name="ck_risk_evaluations_probability_range"),
        sa.CheckConstraint("impact BETWEEN 1 AND 5", name="ck_risk_evaluations_impact_range"),
    )
    op.create_index(op.f("ix_risk_evaluations_organization_id"), "risk_evaluations", ["organization_id"], unique=False)
    op.create_index(op.f("ix_risk_evaluations_risk_id"), "risk_evaluations", ["risk_id"], unique=False)
    op.create_index("ix_risk_evaluations_org_evaluated_at", "risk_evaluations", ["organization_id", "evaluated_at"], unique=False)
    op.create_index("ix_risk_evaluations_risk_id_evaluated_at", "risk_evaluations", ["risk_id", "evaluated_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_risk_evaluations_risk_id_evaluated_at", table_name="risk_evaluations")
    op.drop_index("ix_risk_evaluations_org_evaluated_at", table_name="risk_evaluations")
    op.drop_index(op.f("ix_risk_evaluations_risk_id"), table_name="risk_evaluations")
    op.drop_index(op.f("ix_risk_evaluations_organization_id"), table_name="risk_evaluations")
    op.drop_table("risk_evaluations")
    op.drop_index("ix_risks_org_residual_level", table_name="risks")
    op.drop_index("ix_risks_org_inherent_level", table_name="risks")
    op.drop_index("ix_risks_org_created_at", table_name="risks")
    op.drop_index(op.f("ix_risks_organization_id"), table_name="risks")
    op.drop_index(op.f("ix_risks_asset_id"), table_name="risks")
    op.drop_table("risks")