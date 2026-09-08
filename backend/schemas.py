from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
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
    purchase_price: float
    area: float
    renovation_cost_per_m2: float = 0
    monthly_rent: float = 0
    occupancy: float = 100
    down_payment_percent: float | None = None
