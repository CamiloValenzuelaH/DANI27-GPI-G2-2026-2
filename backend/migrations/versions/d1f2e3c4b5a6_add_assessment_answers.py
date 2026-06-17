<<<<<<< HEAD
"""add assessment answers table

Revision ID: d1f2e3c4b5a6
Revises: c8f1d2a9b7e4
Create Date: 2026-05-13 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1f2e3c4b5a6"
down_revision: Union[str, Sequence[str], None] = "e3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assessment_answers",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("answer", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["assessment_questions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assessment_answers_organization_id"), "assessment_answers", ["organization_id"], unique=False)
    op.create_index(op.f("ix_assessment_answers_question_id"), "assessment_answers", ["question_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_assessment_answers_question_id"), table_name="assessment_answers")
    op.drop_index(op.f("ix_assessment_answers_organization_id"), table_name="assessment_answers")
    op.drop_table("assessment_answers")
=======
"""add assessment answers table

Revision ID: d1f2e3c4b5a6
Revises: c8f1d2a9b7e4
Create Date: 2026-05-13 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1f2e3c4b5a6"
down_revision: Union[str, Sequence[str], None] = "e3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assessment_answers",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("answer", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["assessment_questions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assessment_answers_organization_id"), "assessment_answers", ["organization_id"], unique=False)
    op.create_index(op.f("ix_assessment_answers_question_id"), "assessment_answers", ["question_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_assessment_answers_question_id"), table_name="assessment_answers")
    op.drop_index(op.f("ix_assessment_answers_organization_id"), table_name="assessment_answers")
    op.drop_table("assessment_answers")
>>>>>>> Chat-bot
