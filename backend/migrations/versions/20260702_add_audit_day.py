"""add audit_day_of_month to audit_schedule

Revision ID: 20260702_add_audit_day
Revises: 4d5e6f7a8b90
Create Date: 2026-07-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260702_add_audit_day"
down_revision = "4d5e6f7a8b90"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add column (nullable initially)
    op.add_column(
        "audit_schedule",
        sa.Column("audit_day_of_month", sa.Integer(), nullable=True),
    )

    # Populate existing rows by inferring a day from next_audit_date, then last_audit_date, default to 1
    # Ensure value is constrained to 1..28 via LEAST/GREATEST
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
        UPDATE audit_schedule
        SET audit_day_of_month = LEAST(28, GREATEST(1, COALESCE(
            CAST(EXTRACT(DAY FROM next_audit_date) AS INTEGER),
            CAST(EXTRACT(DAY FROM last_audit_date) AS INTEGER),
            1
        )))
        WHERE audit_day_of_month IS NULL
        """
        )
    )

    # Add check constraint to enforce 1..28
    op.create_check_constraint(
        "ck_audit_schedule_audit_day_range",
        "audit_schedule",
        "audit_day_of_month BETWEEN 1 AND 28",
    )


def downgrade() -> None:
    op.drop_constraint("ck_audit_schedule_audit_day_range", "audit_schedule", type_="check")
    op.drop_column("audit_schedule", "audit_day_of_month")
