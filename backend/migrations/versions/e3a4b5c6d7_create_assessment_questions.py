<<<<<<< HEAD
"""create assessment phases and questions

Revision ID: e3a4b5c6d7
Revises: c8f1d2a9b7e4
Create Date: 2026-05-13 00:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "c8f1d2a9b7e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assessment_phases",
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "assessment_questions",
        sa.Column("phase_id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("clause_ref", sa.String(length=50), nullable=False),
        sa.Column("is_critical", sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column("evidence_hint", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["phase_id"], ["assessment_phases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_assessment_questions_code"),
    )
    op.create_index(op.f("ix_assessment_questions_phase_id"), "assessment_questions", ["phase_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_assessment_questions_phase_id"), table_name="assessment_questions")
    op.drop_table("assessment_questions")
    op.drop_table("assessment_phases")
=======
"""create assessment phases and questions

Revision ID: e3a4b5c6d7
Revises: c8f1d2a9b7e4
Create Date: 2026-05-13 00:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3a4b5c6d7"
down_revision: Union[str, Sequence[str], None] = "c8f1d2a9b7e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assessment_phases",
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "assessment_questions",
        sa.Column("phase_id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("clause_ref", sa.String(length=50), nullable=False),
        sa.Column("is_critical", sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column("evidence_hint", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["phase_id"], ["assessment_phases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_assessment_questions_code"),
    )
    op.create_index(op.f("ix_assessment_questions_phase_id"), "assessment_questions", ["phase_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_assessment_questions_phase_id"), table_name="assessment_questions")
    op.drop_table("assessment_questions")
    op.drop_table("assessment_phases")
>>>>>>> Chat-bot
