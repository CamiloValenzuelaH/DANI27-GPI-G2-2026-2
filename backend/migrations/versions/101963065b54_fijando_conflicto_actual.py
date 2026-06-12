"""Fijando conflicto actual

Revision ID: 101963065b54
Revises: 5d0af888387a, g3b4c5d6e7f8
Create Date: 2026-05-27 05:12:01.373085

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '101963065b54'
down_revision: Union[str, Sequence[str], None] = ('5d0af888387a', 'g3b4c5d6e7f8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
