"""Record explicit registration consent; leave existing users unset."""
from alembic import op
import sqlalchemy as sa

revision = "d1022a1f0001"
down_revision = "d1020a1f0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("terms_accepted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("terms_version", sa.String(64), nullable=True))


def downgrade():
    op.drop_column("users", "terms_version")
    op.drop_column("users", "terms_accepted_at")
