"""Add maintenance and performance indexes

Revision ID: 20260701_002
Revises: 20260701_001
Create Date: 2026-07-01 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260701_002"
down_revision: Union[str, Sequence[str], None] = "20260701_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


INDEX_DEFINITIONS = (
    (
        "ix_evidence_taxonomy_org_created_at",
        "evidence_taxonomy",
        '"organization_id", "created_at"',
    ),
    (
        "ix_assessment_answers_org_updated_at",
        "assessment_answers",
        '"organization_id", "updated_at"',
    ),
    (
        "ix_risks_org_updated_at",
        "risks",
        '"organization_id", "updated_at"',
    ),
)


def _index_exists(index_name: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(
        sa.text(
            """
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname = :index_name
            LIMIT 1
            """
        ),
        {"index_name": index_name},
    )
    return result.scalar() is not None


def _create_index_concurrently_if_missing(index_name: str, table_name: str, columns_sql: str) -> None:
    if _index_exists(index_name):
        return

    with op.get_context().autocommit_block():
        op.execute(
            sa.text(
                f'CREATE INDEX CONCURRENTLY "{index_name}" ON "{table_name}" ({columns_sql})'
            )
        )


def _drop_index_concurrently_if_exists(index_name: str) -> None:
    if not _index_exists(index_name):
        return

    with op.get_context().autocommit_block():
        op.execute(sa.text(f'DROP INDEX CONCURRENTLY IF EXISTS "{index_name}"'))


def upgrade() -> None:
    for index_name, table_name, columns_sql in INDEX_DEFINITIONS:
        _create_index_concurrently_if_missing(index_name, table_name, columns_sql)


def downgrade() -> None:
    for index_name, _, _ in reversed(INDEX_DEFINITIONS):
        _drop_index_concurrently_if_exists(index_name)