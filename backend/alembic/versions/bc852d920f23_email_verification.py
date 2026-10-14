"""add email verification without automatically verifying existing accounts"""
from alembic import op
import sqlalchemy as sa
revision="bc852d920f23"
down_revision="ab742c810e12"
branch_labels=None
depends_on=None
def upgrade():
    for name in ("email_verified_at","email_verification_expires_at","email_verification_sent_at"):
        op.add_column("users",sa.Column(name,sa.DateTime(timezone=True),nullable=True))
    op.add_column("users",sa.Column("email_verification_hash",sa.String(64),nullable=True))
    op.create_unique_constraint("uq_users_email_verification_hash","users",["email_verification_hash"])
def downgrade():
    op.drop_constraint("uq_users_email_verification_hash","users",type_="unique")
    for name in ("email_verification_hash","email_verification_sent_at","email_verification_expires_at","email_verified_at"):
        op.drop_column("users",name)
