"""Harden evidence taxonomy constraints

Revision ID: b7c8d9e0f1a2
Revises: f1a2b3c4d5e6
Create Date: 2026-05-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE evidence_taxonomy
        SET control_id = CASE type
            WHEN 'POLICY' THEN 'ISO 27001 A.5.1'
            WHEN 'PROCEDURE' THEN 'ISO 27001 A.5.37'
            WHEN 'INSTRUCTION' THEN 'ISO 27001 A.8.32'
            WHEN 'CONTROL' THEN 'ISO 27001 A.8.15'
            ELSE 'ISO 27001 A.8.33'
        END
        WHERE control_id IS NULL OR btrim(control_id) = ''
        """
    )

    op.execute(
        """
        UPDATE evidence_taxonomy
        SET clause_ref = substring(control_id from 'A\\.[0-9]+(\\.[0-9]+){0,2}')
        WHERE clause_ref IS NULL OR btrim(clause_ref) = ''
        """
    )

    op.alter_column("evidence_taxonomy", "control_id", existing_type=sa.String(length=64), nullable=False)
    op.alter_column("evidence_taxonomy", "clause_ref", existing_type=sa.String(length=32), nullable=False)

    op.create_check_constraint(
        "ck_evidence_taxonomy_control_id_format",
        "evidence_taxonomy",
        r"control_id ~ '^ISO 27001 A\.[5-8](\.[0-9]+){1,2}$'",
    )
    op.create_check_constraint(
        "ck_evidence_taxonomy_clause_ref_format",
        "evidence_taxonomy",
        r"clause_ref ~ '^(([4-9]|10)(\.[0-9]+){0,2}|A\.[5-8](\.[0-9]+){0,2})$'",
    )


def downgrade() -> None:
    op.drop_constraint("ck_evidence_taxonomy_clause_ref_format", "evidence_taxonomy", type_="check")
    op.drop_constraint("ck_evidence_taxonomy_control_id_format", "evidence_taxonomy", type_="check")

    op.alter_column("evidence_taxonomy", "clause_ref", existing_type=sa.String(length=32), nullable=True)
    op.alter_column("evidence_taxonomy", "control_id", existing_type=sa.String(length=64), nullable=True)
