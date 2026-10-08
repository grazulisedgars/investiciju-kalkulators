from datetime import date, datetime, timezone
from sqlalchemy import DateTime, String, ForeignKey, Float, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from decimal import Decimal


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    first_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    last_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
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

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    financing_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="planned",
        nullable=False
    )

    purchase_price: Mapped[float] = mapped_column(
        nullable=False
    )

    market_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    area: Mapped[float] = mapped_column(
        nullable=False
    )

    renovation_cost_per_m2: Mapped[float] = mapped_column(
        default=0,
        nullable=False
    )

    monthly_rent: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    occupancy: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    down_payment_percent: Mapped[float | None] = mapped_column(
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    property_id: Mapped[int] = mapped_column(
        ForeignKey("properties.property_id"),
        nullable=False
    )

    entry_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    entry_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    notes: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class ExpenseEntry(Base):
    __tablename__ = "expense_entries"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    diary_entry_id: Mapped[int] = mapped_column(
        ForeignKey("diary_entries.id"),
        unique=True,
        nullable=False
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    supplier: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    room: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )


class LoanEntry(Base):
    __tablename__ = "loan_entries"

    id: Mapped[int] = mapped_column(primary_key=True)

    diary_entry_id: Mapped[int] = mapped_column(
        ForeignKey("diary_entries.id"),
        unique=True,
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    payment_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )


class UtilityEntry(Base):
    __tablename__ = "utility_entries"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    diary_entry_id: Mapped[int] = mapped_column(
        ForeignKey("diary_entries.id"),
        unique=True,
        nullable=False
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )
