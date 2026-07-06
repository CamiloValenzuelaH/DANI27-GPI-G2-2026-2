"""add threat link to vulnerabilities

Revision ID: 20260702_001_threat_vuln_link
Revises: 20260701_003
Create Date: 2026-07-02 00:01:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260702_001_threat_vuln_link"
down_revision: Union[str, Sequence[str], None] = "20260701_003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vulnerabilities", sa.Column("threat_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_vulnerabilities_threat_id_threats",
        source_table="vulnerabilities",
        referent_table="threats",
        local_cols=["threat_id"],
        remote_cols=["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_vulnerabilities_threat_id", "vulnerabilities", ["threat_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_vulnerabilities_threat_id", table_name="vulnerabilities")
    op.drop_constraint("fk_vulnerabilities_threat_id_threats", "vulnerabilities", type_="foreignkey")
    op.drop_column("vulnerabilities", "threat_id")