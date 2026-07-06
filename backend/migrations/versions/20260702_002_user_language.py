"""add language to users

Revision ID: 20260702_002_user_language
Revises: 20260702_001_threat_vuln_link
Create Date: 2026-07-02 00:02:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260702_002_user_language"
down_revision: Union[str, Sequence[str], None] = "20260702_001_threat_vuln_link"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("language", sa.String(length=5), nullable=False, server_default="es"),
    )


def downgrade() -> None:
    op.drop_column("users", "language")