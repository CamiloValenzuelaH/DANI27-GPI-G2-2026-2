"""add two factor auth

Revision ID: a1b2c3d4e5f6
Revises: 101963065b54
Create Date: 2026-06-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "101963065b54"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone_number", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("two_factor_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("two_factor_secret_encrypted", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("two_factor_pending_secret_encrypted", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("two_factor_verified_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "two_factor_backup_codes",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code_hash"),
    )
    op.create_index(op.f("ix_two_factor_backup_codes_user_id"), "two_factor_backup_codes", ["user_id"], unique=False)
    op.create_index("ix_two_factor_backup_codes_user_used", "two_factor_backup_codes", ["user_id", "used_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_two_factor_backup_codes_user_used", table_name="two_factor_backup_codes")
    op.drop_index(op.f("ix_two_factor_backup_codes_user_id"), table_name="two_factor_backup_codes")
    op.drop_table("two_factor_backup_codes")

    op.drop_column("users", "two_factor_verified_at")
    op.drop_column("users", "two_factor_pending_secret_encrypted")
    op.drop_column("users", "two_factor_secret_encrypted")
    op.drop_column("users", "two_factor_enabled")
    op.drop_column("users", "phone_number")
