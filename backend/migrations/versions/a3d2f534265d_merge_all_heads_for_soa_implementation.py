"""merge all heads for soa implementation

Revision ID: a3d2f534265d
Revises: 4d5e6f7a8b90, feff6ed97204, h4c5d6e7f8a9, z9a8b7c6d5e4, zz_add_capa_tracker
Create Date: 2026-06-30 16:06:35.947844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3d2f534265d'
down_revision: Union[str, Sequence[str], None] = ('4d5e6f7a8b90', 'feff6ed97204', 'h4c5d6e7f8a9', 'z9a8b7c6d5e4', 'zz_add_capa_tracker')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
