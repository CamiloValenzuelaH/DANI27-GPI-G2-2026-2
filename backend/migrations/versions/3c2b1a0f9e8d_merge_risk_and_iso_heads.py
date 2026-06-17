"""merge risk and iso heads

Revision ID: 3c2b1a0f9e8d
Revises: 7b6a5c4d3e2f, f2a3b4c5d6e7
Create Date: 2026-05-25 20:10:00.000000
"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "3c2b1a0f9e8d"
down_revision: Union[str, Sequence[str], None] = ("7b6a5c4d3e2f", "f2a3b4c5d6e7")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass