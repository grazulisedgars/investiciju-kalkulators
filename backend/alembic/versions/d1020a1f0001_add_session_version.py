"""Invalidate older sessions when a password is changed or recovered."""
from alembic import op
import sqlalchemy as sa

revision = "d1020a1f0001"
down_revision = "cd963ea31034"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("session_version", sa.Integer(), nullable=False, server_default="0"))


def downgrade():
    op.drop_column("users", "session_version")
