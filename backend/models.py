from datetime import date, datetime, timezone
from sqlalchemy import DateTime, String, ForeignKey, Float, Date, Numeric, JSON, event, update
from sqlalchemy.orm import Mapped, mapped_column, Session
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

    plan: Mapped[str] = mapped_column(String(10), nullable=False, default="basic", server_default="basic")

    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verification_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    email_verification_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verification_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    avatar_filename: Mapped[str | None] = mapped_column(String(64), nullable=True)

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


class WorkEntry(Base):
    __tablename__ = "work_entries"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    diary_entry_id: Mapped[int] = mapped_column(
        ForeignKey("diary_entries.id"),
        unique=True,
        nullable=False
    )

    hours: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False
    )


# Saņemtās īres summa ir saistīta ar vienu dienasgrāmatas ierakstu.
class RentEntry(Base):
    __tablename__ = "rent_entries"

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

# Galerijas foto dati; failus glabājam atsevišķi uploads/gallery mapē.
class AdvancedAnalysis(Base):
    # Pieņēmumi ir neatkarīgi no pamata analīzes un dienasgrāmatas.
    __tablename__ = "advanced_analyses"
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.property_id", ondelete="CASCADE"), primary_key=True)
    inputs: Mapped[dict] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class GalleryPhoto(Base):
    __tablename__ = "gallery_photos"
    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False, index=True)
    storage_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    photo_date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


# Visu īpašuma sadaļu izmaiņas atjauno dashboard aktivitātes laiku tajā pašā transakcijā.
@event.listens_for(Session, "before_flush")
def update_property_activity(session, flush_context, instances):
    property_ids = set()
    deleted_properties = {row.property_id for row in session.deleted if isinstance(row, Property)}
    children = (ExpenseEntry, LoanEntry, UtilityEntry, WorkEntry, RentEntry)
    for row in list(session.new) + list(session.dirty) + list(session.deleted):
        if row in session.dirty and not session.is_modified(row, include_collections=False):
            continue
        if isinstance(row, (DiaryEntry, AdvancedAnalysis, GalleryPhoto)):
            property_ids.add(row.property_id)
        elif isinstance(row, children):
            diary = session.get(DiaryEntry, row.diary_entry_id)
            if diary is not None:
                property_ids.add(diary.property_id)
    property_ids -= deleted_properties
    property_ids.discard(None)
    if property_ids:
        session.execute(update(Property).where(Property.property_id.in_(property_ids)).values(updated_at=datetime.now(timezone.utc)))
