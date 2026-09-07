from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
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
from models import User
from schemas import UserRegister, UserLogin
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

app = FastAPI()
security = HTTPBearer()

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
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email
    }

# --------------------------------------------------------------------------


@app.post("/login")
def login_user(
    login_data: UserLogin,
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

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }

# --------------------------------------------------------------------------


@app.get("/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    payload = decode_access_token(token)

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
        "username": user.username,
        "email": user.email
    }
