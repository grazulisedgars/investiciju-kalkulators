from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    first_name: str = Field(
        min_length=1,
        max_length=100
    )

    last_name: str = Field(
        min_length=1,
        max_length=100
    )

    username: str = Field(
        min_length=3,
        max_length=50
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128
    )


class PropertyCreate(BaseModel):
    financing_type: str
    purchase_price: float = Field(gt=0)
    area: float = Field(gt=0)
    renovation_cost_per_m2: float = Field(default=0, ge=0)

    monthly_rent: float | None = Field(default=None, ge=0)
    occupancy: float | None = Field(default=None, ge=0, le=100)

    down_payment_percent: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    image_url: str | None = None


class PropertyUpdate(BaseModel):
    property_name: str
    address: str | None = None

    purchase_price: float = Field(gt=0)
    market_value: float | None = Field(default=None, ge=0)
    area: float = Field(gt=0)
    renovation_cost_per_m2: float = Field(default=0, ge=0)

    monthly_rent: float | None = Field(default=None, ge=0)
    occupancy: float | None = Field(default=None, ge=0, le=100)

    down_payment_percent: float | None = Field(
        default=None,
        ge=0,
        le=100
    )
