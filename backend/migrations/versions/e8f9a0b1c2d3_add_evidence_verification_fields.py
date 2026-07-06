"""add evidence verification fields to external_validation_jobs

Revision ID: e8f9a0b1c2d3
Revises: j1k2l3m4n5o6
Create Date: 2026-06-26 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e8f9a0b1c2d3"
down_revision = "j1k2l3m4n5o6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "external_validation_jobs",
        sa.Column("evidence_verified", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "external_validation_jobs",
        sa.Column(
            "evidence_gaps",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("external_validation_jobs", "evidence_gaps")
    op.drop_column("external_validation_jobs", "evidence_verified")
