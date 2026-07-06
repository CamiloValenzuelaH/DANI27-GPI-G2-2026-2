"""merge_user_language_and_audit_day

Revision ID: 69cb0baea8bd
Revises: 20260702_002_user_language, 20260702_add_audit_day
Create Date: 2026-07-03 01:44:37.039973

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69cb0baea8bd'
down_revision: Union[str, Sequence[str], None] = ('20260702_002_user_language', '20260702_add_audit_day')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
