"""add rent entries

Revision ID: d42a831c09f7
Revises: e01b08297e68
"""
from alembic import op
import sqlalchemy as sa

revision = "d42a831c09f7"
down_revision = "e01b08297e68"
branch_labels = None
depends_on = None

def upgrade():
    # Veidojam tikai saņemtās īres tabulu; esošās tabulas netiek pārveidotas.
    op.create_table(
        "rent_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("diary_entry_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["diary_entry_id"], ["diary_entries.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("diary_entry_id"),
    )

def downgrade():
    op.drop_table("rent_entries")
