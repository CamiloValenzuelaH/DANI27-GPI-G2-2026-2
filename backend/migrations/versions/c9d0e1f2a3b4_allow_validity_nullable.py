"""Allow NULL validity_days on evidence_taxonomy

Revision ID: c9d0e1f2a3b4
Revises: b7c8d9e0f1a2
Create Date: 2026-05-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, Sequence[str], None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # drop existing strict constraint and allow NULL
    try:
        op.drop_constraint("ck_evidence_taxonomy_validity_days_positive", "evidence_taxonomy", type_="check")
    except Exception:
        # constraint may not exist in some environments
        pass

    op.alter_column("evidence_taxonomy", "validity_days", existing_type=sa.Integer(), nullable=True)

    op.create_check_constraint(
        "ck_evidence_taxonomy_validity_days_positive",
        "evidence_taxonomy",
        "(validity_days IS NULL) OR (validity_days > 0)",
    )


def downgrade() -> None:
    # revert to non-nullable with strict >0 constraint
    try:
        op.drop_constraint("ck_evidence_taxonomy_validity_days_positive", "evidence_taxonomy", type_="check")
    except Exception:
        pass

    op.alter_column("evidence_taxonomy", "validity_days", existing_type=sa.Integer(), nullable=False)

    op.create_check_constraint(
        "ck_evidence_taxonomy_validity_days_positive",
        "evidence_taxonomy",
        "validity_days > 0",
    )
