"""dashboard metrics indexes

Revision ID: 9f7c2b1a8e44
Revises: af8da8d134ad
Create Date: 2026-05-06 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9f7c2b1a8e44"
down_revision: Union[str, Sequence[str], None] = "af8da8d134ad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_assets_org_created_at",
        "assets",
        ["organization_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_assets_org_owner_status",
        "assets",
        ["organization_id", "owner_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_assets_org_updated_at",
        "assets",
        ["organization_id", "updated_at"],
        unique=False,
    )
    op.create_index(
        "ix_users_org_active",
        "users",
        ["organization_id", "is_active"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_users_org_active", table_name="users")
    op.drop_index("ix_assets_org_updated_at", table_name="assets")
    op.drop_index("ix_assets_org_owner_status", table_name="assets")
    op.drop_index("ix_assets_org_created_at", table_name="assets")
