"""add gallery photos"""
from alembic import op
import sqlalchemy as sa

revision = "b905ca4217df"
down_revision = "d42a831c09f7"
branch_labels = None
depends_on = None

def upgrade():
    # Galerija ir saistīta ar īpašumu, nevis dienasgrāmatas ierakstu.
    op.create_table("gallery_photos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("storage_name", sa.String(100), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("photo_date", sa.Date(), nullable=False),
        sa.Column("category", sa.String(30), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["property_id"], ["properties.property_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("storage_name"))
    op.create_index("ix_gallery_photos_property_id", "gallery_photos", ["property_id"])

def downgrade():
    op.drop_index("ix_gallery_photos_property_id", table_name="gallery_photos")
    op.drop_table("gallery_photos")
