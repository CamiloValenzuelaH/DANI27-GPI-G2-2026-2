"""Merge Alembic heads

Revision ID: 20260701_003
Revises: 20260630_001, 20260701_002, b4e3f645376e
Create Date: 2026-07-01 00:00:00.000000
"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "20260701_003"
down_revision: Union[str, Sequence[str], None] = (
    "20260630_001",
    "20260701_002",
    "b4e3f645376e",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass