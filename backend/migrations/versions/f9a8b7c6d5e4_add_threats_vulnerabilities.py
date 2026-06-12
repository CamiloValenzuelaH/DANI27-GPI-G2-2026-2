"""add threats, vulnerabilities, and risk-threat associations

Revision ID: f9a8b7c6d5e4
Revises: 7b6a5c4d3e2f
Create Date: 2026-05-27 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9a8b7c6d5e4"
down_revision: Union[str, Sequence[str], None] = "3c2b1a0f9e8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "threats",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("likelihood", sa.Integer(), nullable=False),
        sa.Column("impact", sa.Integer(), nullable=False),
        sa.Column("risk_reduction_factor", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("likelihood BETWEEN 1 AND 5", name="ck_threats_likelihood_range"),
        sa.CheckConstraint("impact BETWEEN 1 AND 5", name="ck_threats_impact_range"),
    )
    op.create_index(op.f("ix_threats_organization_id"), "threats", ["organization_id"], unique=False)
    op.create_index("ix_threats_org_category", "threats", ["organization_id", "category"], unique=False)

    op.create_table(
        "vulnerabilities",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("likelihood", sa.Integer(), nullable=False),
        sa.Column("impact", sa.Integer(), nullable=False),
        sa.Column("remediation_plan", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("likelihood BETWEEN 1 AND 5", name="ck_vulnerabilities_likelihood_range"),
        sa.CheckConstraint("impact BETWEEN 1 AND 5", name="ck_vulnerabilities_impact_range"),
    )
    op.create_index(op.f("ix_vulnerabilities_asset_id"), "vulnerabilities", ["asset_id"], unique=False)
    op.create_index(op.f("ix_vulnerabilities_organization_id"), "vulnerabilities", ["organization_id"], unique=False)
    op.create_index("ix_vulnerabilities_org_severity", "vulnerabilities", ["organization_id", "severity"], unique=False)

    op.create_table(
        "risk_threats",
        sa.Column("risk_id", sa.Uuid(), nullable=False),
        sa.Column("threat_id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["risk_id"], ["risks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["threat_id"], ["threats.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_risk_threats_risk_id"), "risk_threats", ["risk_id"], unique=False)
    op.create_index(op.f("ix_risk_threats_threat_id"), "risk_threats", ["threat_id"], unique=False)
    op.create_index(op.f("ix_risk_threats_organization_id"), "risk_threats", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_risk_threats_organization_id"), table_name="risk_threats")
    op.drop_index(op.f("ix_risk_threats_threat_id"), table_name="risk_threats")
    op.drop_index(op.f("ix_risk_threats_risk_id"), table_name="risk_threats")
    op.drop_table("risk_threats")

    op.drop_index("ix_vulnerabilities_org_severity", table_name="vulnerabilities")
    op.drop_index(op.f("ix_vulnerabilities_organization_id"), table_name="vulnerabilities")
    op.drop_index(op.f("ix_vulnerabilities_asset_id"), table_name="vulnerabilities")
    op.drop_table("vulnerabilities")

    op.drop_index("ix_threats_org_category", table_name="threats")
    op.drop_index(op.f("ix_threats_organization_id"), table_name="threats")
    op.drop_table("threats")
