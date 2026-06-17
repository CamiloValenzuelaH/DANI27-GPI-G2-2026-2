"""add risk assets linkage

Revision ID: 5d4c3b2a1f0e
Revises: 3c2b1a0f9e8d
Create Date: 2026-05-25 20:25:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5d4c3b2a1f0e"
down_revision: Union[str, Sequence[str], None] = "3c2b1a0f9e8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "risk_assets",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("risk_id", sa.Uuid(), nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["risk_id"], ["risks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("organization_id", "risk_id", "asset_id"),
    )
    op.create_index("ix_risk_assets_org_risk", "risk_assets", ["organization_id", "risk_id"], unique=False)
    op.create_index("ix_risk_assets_org_asset", "risk_assets", ["organization_id", "asset_id"], unique=False)

    op.execute(
        sa.text(
            """
            INSERT INTO risk_assets (organization_id, risk_id, asset_id)
            SELECT DISTINCT organization_id, id, asset_id
            FROM risks
            WHERE asset_id IS NOT NULL
            """
        )
    )


def downgrade() -> None:
    op.drop_index("ix_risk_assets_org_asset", table_name="risk_assets")
    op.drop_index("ix_risk_assets_org_risk", table_name="risk_assets")
    op.drop_table("risk_assets")