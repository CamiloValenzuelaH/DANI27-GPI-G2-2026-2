<<<<<<< HEAD
"""add audit checklist persistence

Revision ID: b2c1d4e5f6a7
Revises: 9f7c2b1a8e44
Create Date: 2026-05-10 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c1d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "9f7c2b1a8e44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_checklists",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("updated_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("checklist_data", sa.JSON(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", name="uq_audit_checklists_organization"),
    )
    op.create_index(op.f("ix_audit_checklists_organization_id"), "audit_checklists", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_checklists_organization_id"), table_name="audit_checklists")
    op.drop_table("audit_checklists")
=======
"""add audit checklist persistence

Revision ID: b2c1d4e5f6a7
Revises: 9f7c2b1a8e44
Create Date: 2026-05-10 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c1d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "9f7c2b1a8e44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_checklists",
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("updated_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("checklist_data", sa.JSON(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", name="uq_audit_checklists_organization"),
    )
    op.create_index(op.f("ix_audit_checklists_organization_id"), "audit_checklists", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_checklists_organization_id"), table_name="audit_checklists")
    op.drop_table("audit_checklists")
>>>>>>> Chat-bot
