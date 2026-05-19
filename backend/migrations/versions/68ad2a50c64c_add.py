"""Add audit_logs table

Revision ID: 68ad2a50c64c
Revises: d1f2e3c4b5a6
Create Date: 2026-05-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '68ad2a50c64c'
down_revision: Union[str, Sequence[str], None] = 'd1f2e3c4b5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('user_role', sa.String(length=64), nullable=True),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('resource', sa.String(length=256), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('http_status', sa.Integer(), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('previous_hash', sa.String(length=128), nullable=True),
        sa.Column('current_hash', sa.String(length=128), nullable=False),
    )
    # Create PL/pgSQL function and trigger for immutability (best-effort)
    op.execute("""
    CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
    RETURNS trigger AS $$
    BEGIN
        RAISE EXCEPTION 'audit_logs is immutable: updates and deletes are forbidden';
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER audit_logs_prevent_mutation
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE PROCEDURE prevent_audit_logs_mutation();
    """)


def downgrade() -> None:
    # Drop trigger/function if exists, then drop table
    op.execute("""
    DROP TRIGGER IF EXISTS audit_logs_prevent_mutation ON audit_logs;
    DROP FUNCTION IF EXISTS prevent_audit_logs_mutation();
    """)
    op.drop_table('audit_logs')
