from datetime import datetime, timezone
from sqlalchemy import DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class Property(Base):
    __tablename__ = "properties"

    property_id: Mapped[int] = mapped_column(
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    property_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    financing_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    purchase_price: Mapped[float] = mapped_column(
        nullable=False
    )

    area: Mapped[float] = mapped_column(
        nullable=False
    )

    renovation_cost_per_m2: Mapped[float] = mapped_column(
        default=0,
        nullable=False
    )

    monthly_rent: Mapped[float] = mapped_column(
        default=0,
        nullable=False
    )

    occupancy: Mapped[float] = mapped_column(
        default=100,
        nullable=False
    )

    down_payment_percent: Mapped[float | None] = mapped_column(
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
