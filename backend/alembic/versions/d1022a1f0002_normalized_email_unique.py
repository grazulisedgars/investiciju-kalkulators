"""Prevent duplicate mailboxes without altering or merging existing accounts."""
from alembic import op
import sqlalchemy as sa

revision = "d1022a1f0002"
down_revision = "d1022a1f0001"
branch_labels = None
depends_on = None


def upgrade():
    collisions = op.get_bind().execute(sa.text("SELECT count(*) FROM (SELECT lower(trim(email)) FROM users GROUP BY lower(trim(email)) HAVING count(*) > 1) AS duplicates")).scalar()
    if collisions:
        raise RuntimeError("E-pasta adrešu kolīzijas: migrācija apturēta. Esošie konti nav mainīti.")
    op.create_index("uq_users_email_normalized", "users", [sa.text("lower(trim(email))")], unique=True)


def downgrade():
    op.drop_index("uq_users_email_normalized", table_name="users")
