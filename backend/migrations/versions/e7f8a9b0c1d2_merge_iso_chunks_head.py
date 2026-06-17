"""merge iso chunks migration head

Revision ID: e7f8a9b0c1d2
Revises: c9d0e1f2a3b4, d4e5f6a7b8c9
Create Date: 2026-05-20 00:30:00.000000
"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, Sequence[str], None] = ("c9d0e1f2a3b4", "d4e5f6a7b8c9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
