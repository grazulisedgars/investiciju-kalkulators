"""Avoid duplicate properties when a save is retried after a lost response."""
from alembic import op
import sqlalchemy as sa

revision = "d1020a1f0002"
down_revision = "d1020a1f0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("properties", sa.Column("client_request_id", sa.String(36), nullable=True))
    op.create_unique_constraint("uq_property_client_request", "properties", ["user_id", "client_request_id"])


def downgrade():
    op.drop_constraint("uq_property_client_request", "properties", type_="unique")
    op.drop_column("properties", "client_request_id")
