"""add private profile avatar storage name"""
from alembic import op
import sqlalchemy as sa
revision="ab742c810e12"
down_revision="a031c2200711"
branch_labels=None
depends_on=None
def upgrade():
    op.add_column("users",sa.Column("avatar_filename",sa.String(64),nullable=True))
def downgrade():
    op.drop_column("users","avatar_filename")
