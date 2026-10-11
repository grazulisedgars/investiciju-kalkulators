"""add saved advanced analysis inputs"""
from alembic import op
import sqlalchemy as sa

revision = "a031c2200711"
down_revision = "b905ca4217df"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("advanced_analyses",
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("inputs", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["property_id"], ["properties.property_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("property_id"))

def downgrade():
    op.drop_table("advanced_analyses")
