from fastapi import FastAPI, Depends, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from calculations import (
    calculate_price_per_m2,
    calculate_purchase_costs,
    calculate_free_analysis
)
from database import Base, engine
import models

from sqlalchemy.orm import Session

from database import get_db
from models import User, Property
from schemas import UserRegister, UserLogin, PropertyCreate
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Investīciju kalkulatora backend darbojas!"}

# --------------------------------------------------------------------------


@app.get("/calculate/price-per-m2")
def calculate_price(purchase_price: float, area: float):
    price_per_m2 = calculate_price_per_m2(
        purchase_price,
        area
    )

    return {
        "price_per_m2": price_per_m2
    }

# --------------------------------------------------------------------------


@app.get("/calculate/purchase-costs")
def calculate_costs(
    purchase_price: float,
    office_fee: float = 0,
    valuation: float = 0
):
    return calculate_purchase_costs(
        purchase_price,
        office_fee,
        valuation
    )

# --------------------------------------------------------------------------


@app.get("/calculate/free-analysis")
def free_analysis(
    purchase_price: float,
    renovation_costs: float = 0,
    monthly_rent: float = 0,
    occupancy: float = 100
):
    return calculate_free_analysis(
        purchase_price,
        renovation_costs,
        monthly_rent,
        occupancy
    )

# --------------------------------------------------------------------------


@app.post("/register")
def register_user(
    user_data: UserRegister,
    response: Response,
    db: Session = Depends(get_db)
):

    existing_username = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Lietotājvārds jau tiek izmantots."
        )

    existing_email = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="E-pasts jau tiek izmantots."
        )

    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(new_user.id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60,
    )

    return {
        "id": new_user.id,
        "first_name": new_user.first_name,
        "last_name": new_user.last_name,
        "username": new_user.username,
        "email": new_user.email
    }

# --------------------------------------------------------------------------


@app.post("/login")
def login_user(
    login_data: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Nepareizs e-pasts un/vai parole."
        )

    if not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Nepareizs e-pasts un/vai parole."
        )

    access_token = create_access_token(user.id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure="False",
        max_age=60*60,
    )

    return {
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "email": user.email
        }
    }

# --------------------------------------------------------------------------


@app.get("/me")
def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Nav autentifikācijas tokena."
        )

    payload = decode_access_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Tokens nav derīgs vai ir beidzies."
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Tokenā nav lietotāja ID."
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Lietotājs nav atrasts."
        )

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "username": user.username,
        "email": user.email
    }
# --------------------------------------------------------------------------


@app.post("/logout")
def logout_user(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,
    )

    return {
        "message": "Izlogošanās veiksmīga."
    }

# --------------------------------------------------------------------------


@app.post("/properties")
def create_property(
    property_data: PropertyCreate,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Nav autentifikācijas tokena."
        )

    payload = decode_access_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Tokens nav derīgs vai ir beidzies"
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Tokenā nav lietotāja ID."
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Lietotājs nav atrasts."
        )

    property_count = db.query(Property).filter(
        Property.user_id == user.id
    ).count()

    new_property = Property(
        user_id=user.id,
        property_name=f"Īpašums #{property_count + 1}",
        financing_type=property_data.financing_type,
        purchase_price=property_data.purchase_price,
        area=property_data.area,
        renovation_cost_per_m2=property_data.renovation_cost_per_m2,
        monthly_rent=property_data.monthly_rent,
        occupancy=property_data.occupancy,
        down_payment_percent=property_data.down_payment_percent,
    )

    db.add(new_property)
    db.commit()
    db.refresh(new_property)

    return {
        "property_id": new_property.property_id,
        "user_id": new_property.user_id,
        "property_name": new_property.property_name,
        "financing_type": new_property.financing_type,
        "purchase_price": new_property.purchase_price,
        "area": new_property.area,
        "renovation_cost_per_m2": new_property.renovation_cost_per_m2,
        "monthly_rent": new_property.monthly_rent,
        "occupancy": new_property.occupancy,
        "down_payment_percent": new_property.down_payment_percent,
    }
# --------------------------------------------------------------------------


@app.get("/properties")
def get_properties(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Nav autentifikācijas tokena."
        )

    payload = decode_access_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Tokens nav derīgs vai ir beidzies."
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Tokenā nav lietotāja ID."
        )

    properties = (
        db.query(Property)
        .filter(Property.user_id == int(user_id))
        .order_by(Property.property_id.asc())
        .all()
    )

    return properties
