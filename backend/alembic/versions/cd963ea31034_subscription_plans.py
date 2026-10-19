"""Persist Basic/PRO account plans; existing accounts start on Basic."""
from alembic import op
import sqlalchemy as sa
revision="cd963ea31034"
down_revision="bc852d920f23"
branch_labels=None
depends_on=None
def upgrade():
    op.add_column("users",sa.Column("plan",sa.String(10),nullable=False,server_default="basic"))
    op.create_check_constraint("ck_users_plan","users","plan IN ('basic', 'pro')")
def downgrade():
    op.drop_constraint("ck_users_plan","users",type_="check")
    op.drop_column("users","plan")
