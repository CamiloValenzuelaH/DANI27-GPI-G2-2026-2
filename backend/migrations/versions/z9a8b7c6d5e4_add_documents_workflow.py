"""add documents workflow tables

Revision ID: z9a8b7c6d5e4
Revises: 3c9e1f5c2ff0
Create Date: 2026-06-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


# revision identifiers, used by Alembic.
revision = "z9a8b7c6d5e4"
down_revision = "3c9e1f5c2ff0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    document_type = ENUM(
        "policy",
        "report",
        "procedure",
        "general",
        name="document_type",
        create_type=False,
    )
    document_status = ENUM(
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "published",
        "archived",
        name="document_status",
        create_type=False,
    )
    document_type.create(op.get_bind(), checkfirst=True)
    document_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column("updated_by", sa.Uuid(), nullable=True),
        sa.Column("type", document_type, nullable=False, server_default="policy"),
        sa.Column("status", document_status, nullable=False, server_default="draft"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("submitted_by", sa.Uuid(), nullable=True),
        sa.Column("review_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by", sa.Uuid(), nullable=True),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_by", sa.Uuid(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_by", sa.Uuid(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["approved_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["rejected_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["published_by"], ["users.id"]),
    )
    op.create_index("ix_documents_organization_id", "documents", ["organization_id"], unique=False)
    op.create_index("ix_documents_created_by", "documents", ["created_by"], unique=False)
    op.create_index("ix_documents_updated_by", "documents", ["updated_by"], unique=False)
    op.create_index("ix_documents_submitted_by", "documents", ["submitted_by"], unique=False)
    op.create_index("ix_documents_approved_by", "documents", ["approved_by"], unique=False)
    op.create_index("ix_documents_rejected_by", "documents", ["rejected_by"], unique=False)
    op.create_index("ix_documents_published_by", "documents", ["published_by"], unique=False)
    op.create_index("ix_documents_org_type_status", "documents", ["organization_id", "type", "status"], unique=False)

    op.create_table(
        "document_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("version_number", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("change_notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
    )
    op.create_index("ix_document_versions_document_id", "document_versions", ["document_id"], unique=False)
    op.create_index(
        "ix_document_versions_document_id_version_number",
        "document_versions",
        ["document_id", "version_number"],
        unique=True,
    )
    op.create_index("ix_document_versions_created_by", "document_versions", ["created_by"], unique=False)

    op.create_table(
        "document_sections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("document_version_id", sa.Uuid(), nullable=False),
        sa.Column("section_index", sa.Integer(), nullable=False),
        sa.Column("section_title", sa.String(length=255), nullable=False),
        sa.Column("section_content", sa.Text(), nullable=False),
        sa.Column("control_contexts", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["document_version_id"], ["document_versions.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_document_sections_document_version_id", "document_sections", ["document_version_id"], unique=False)
    op.create_index(
        "ix_document_sections_version_section",
        "document_sections",
        ["document_version_id", "section_index"],
        unique=True,
    )

    op.create_table(
        "document_review_actions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("document_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_document_review_actions_document_id", "document_review_actions", ["document_id"], unique=False)
    op.create_index("ix_document_review_actions_user_id", "document_review_actions", ["user_id"], unique=False)
    op.create_index(
        "ix_document_review_actions_document_user",
        "document_review_actions",
        ["document_id", "user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_document_review_actions_document_user", table_name="document_review_actions")
    op.drop_index("ix_document_review_actions_user_id", table_name="document_review_actions")
    op.drop_index("ix_document_review_actions_document_id", table_name="document_review_actions")
    op.drop_table("document_review_actions")

    op.drop_index("ix_document_sections_version_section", table_name="document_sections")
    op.drop_index("ix_document_sections_document_version_id", table_name="document_sections")
    op.drop_table("document_sections")

    op.drop_index("ix_document_versions_created_by", table_name="document_versions")
    op.drop_index("ix_document_versions_document_id_version_number", table_name="document_versions")
    op.drop_index("ix_document_versions_document_id", table_name="document_versions")
    op.drop_table("document_versions")

    op.drop_index("ix_documents_org_type_status", table_name="documents")
    op.drop_index("ix_documents_published_by", table_name="documents")
    op.drop_index("ix_documents_rejected_by", table_name="documents")
    op.drop_index("ix_documents_approved_by", table_name="documents")
    op.drop_index("ix_documents_submitted_by", table_name="documents")
    op.drop_index("ix_documents_updated_by", table_name="documents")
    op.drop_index("ix_documents_created_by", table_name="documents")
    op.drop_index("ix_documents_organization_id", table_name="documents")
    op.drop_table("documents")

    sa.Enum(name="document_status", create_type=True).drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="document_type", create_type=True).drop(op.get_bind(), checkfirst=True)
