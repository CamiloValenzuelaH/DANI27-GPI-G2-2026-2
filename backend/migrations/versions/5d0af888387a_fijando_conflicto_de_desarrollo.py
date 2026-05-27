"""Fijando conflicto de desarrollo

Revision ID: 5d0af888387a
Revises: 5d4c3b2a1f0e, f9a8b7c6d5e4
Create Date: 2026-05-27 00:41:21.223256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d0af888387a'
down_revision: Union[str, Sequence[str], None] = ('5d4c3b2a1f0e', 'f9a8b7c6d5e4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
