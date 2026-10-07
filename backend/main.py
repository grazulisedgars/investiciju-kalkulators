import os
import shutil
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Response,
    Cookie,
    UploadFile,
    File,
    Query,
)
from fastapi.staticfiles import StaticFiles
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
from models import User, Property, DiaryEntry, ExpenseEntry, LoanEntry
from schemas import (
    UserRegister,
    UserLogin,
    PropertyCreate,
    PropertyUpdate,
    ExpenseEntryCreate,
    ExpenseEntryUpdate,
    LoanEntryCreate,
    LoanEntryUpdate,
)
from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from datetime import datetime, timezone

app = FastAPI()

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)

UPLOAD_DIR = "uploads/properties"

os.makedirs(UPLOAD_DIR, exist_ok=True)

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
    monthly_rent: float | None = Query(default=None, ge=0),
    occupancy: float | None = Query(default=None, ge=0, le=100)
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
        max_age=60 * 60 * 24 * 7
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
        max_age=60*60*24*7
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

    property_count = (
        db.query(Property)
        .filter(Property.user_id == user.id)
        .count()
    )

    if property_count >= 3:
        raise HTTPException(
            status_code=403,
            detail="Bezmaksas profilā vari saglabāt ne vairāk kā 3 īpašumus."
        )

    new_property = Property(
        user_id=user.id,
        property_name=f"Īpašums #{property_count + 1}",
        image_url=property_data.image_url,
        financing_type=property_data.financing_type,
        status=property_data.status,
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
        "image_url": new_property.image_url,
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
# --------------------------------------------------------------------------


@app.post("/properties/{property_id}/image")
def upload_property_image(
    property_id: int,
    image: UploadFile = File(...),
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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
            detail="Tokens nac derīgs vai ir beidzies."
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Tokenā nav lietotāja ID."
        )

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    if property.image_url:
        old_image_path = property.image_url.lstrip("/")

        if os.path.exists(old_image_path):
            os.remove(old_image_path)

    file_path = os.path.join(
        UPLOAD_DIR,
        f"property_{property_id}_{image.filename}"
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    image_url = f"/uploads/properties/property_{property.property_id}_{image.filename}"

    property.image_url = image_url

    db.commit()
    db.refresh(property)

    return {
        "message": "Attēls veiksmīgi saglabāts.",
        "image_url": property.image_url,
    }

# --------------------------------------------------------------------------


@app.patch("/properties/{property_id}")
def update_property(
    property_id: int,
    property_data: PropertyUpdate,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    property.property_name = property_data.property_name
    property.address = property_data.address
    property.status = property_data.status
    property.purchase_price = property_data.purchase_price
    property.market_value = property_data.market_value
    property.area = property_data.area
    property.renovation_cost_per_m2 = property_data.renovation_cost_per_m2
    property.monthly_rent = property_data.monthly_rent
    property.occupancy = property_data.occupancy
    property.down_payment_percent = property_data.down_payment_percent

    property.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(property)

    return property
# --------------------------------------------------------------------------


@app.delete("/properties/{property_id}")
def delete_property(
    property_id: int,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    if property.image_url:
        image_path = property.image_url.lstrip("/")

        if os.path.exists(image_path):
            os.remove(image_path)

    db.delete(property)
    db.commit()

    return {
        "message": "Īpašums veiksmīgi izdzēsts.",
        "property_id": property_id,
    }
# --------------------------------------------------------------------------


@app.delete("/properties/{property_id}/image")
def delete_property_image(
    property_id: int,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    payload = decode_access_token(access_token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )

    user_id = payload.get("sub")

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    if property.image_url:
        image_path = property.image_url.lstrip("/")

        if os.path.exists(image_path):
            os.remove(image_path)

    property.image_url = None

    db.commit()
    db.refresh(property)

    return property
# --------------------------------------------------------------------------


@app.post("/properties/{property_id}/diary/expenses")
def create_expense_entry(
    property_id: int,
    expense_data: ExpenseEntryCreate,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    diary_entry = DiaryEntry(
        property_id=property.property_id,
        entry_type="expense",
        entry_date=expense_data.entry_date,
        title=expense_data.title,
        notes=expense_data.notes,
    )

    db.add(diary_entry)
    db.flush()

    expense_entry = ExpenseEntry(
        diary_entry_id=diary_entry.id,
        amount=expense_data.amount,
        supplier=expense_data.supplier,
        room=expense_data.room,
    )

    db.add(expense_entry)
    db.commit()

    db.refresh(diary_entry)
    db.refresh(expense_entry)

    return {
        "id": diary_entry.id,
        "property_id": diary_entry.property_id,
        "entry_type": diary_entry.entry_type,
        "entry_date": diary_entry.entry_date,
        "title": diary_entry.title,
        "notes": diary_entry.notes,
        "created_at": diary_entry.created_at,
        "amount": expense_entry.amount,
        "supplier": expense_entry.supplier,
        "room": expense_entry.room,
    }
# --------------------------------------------------------------------------


@app.get("/properties/{property_id}/diary")
def get_diary_entries(
    property_id: int,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    diary_entries = (
        db.query(DiaryEntry)
        .filter(DiaryEntry.property_id == property_id)
        .order_by(
            DiaryEntry.entry_date.desc(),
            DiaryEntry.created_at.desc(),
        )
        .all()
    )

    result = []

    for entry in diary_entries:
        entry_data = {
            "id": entry.id,
            "property_id": entry.property_id,
            "entry_type": entry.entry_type,
            "entry_date": entry.entry_date,
            "title": entry.title,
            "notes": entry.notes,
            "created_at": entry.created_at,
        }

        if entry.entry_type == "expense":
            expense = (
                db.query(ExpenseEntry)
                .filter(
                    ExpenseEntry.diary_entry_id == entry.id
                )
                .first()
            )

            if expense:
                entry_data["amount"] = expense.amount
                entry_data["supplier"] = expense.supplier
                entry_data["room"] = expense.room

        elif entry.entry_type == "loan":
            loan = (
                db.query(LoanEntry)
                .filter(
                    LoanEntry.diary_entry_id == entry.id
                )
                .first()
            )

            if loan:
                entry_data["amount"] = loan.amount
                entry_data["payment_type"] = loan.payment_type

        result.append(entry_data)

    return result
# --------------------------------------------------------------------------


@app.delete("/properties/{property_id}/diary/{entry_id}")
def delete_diary_entry(
    property_id: int,
    entry_id: int,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    diary_entry = (
        db.query(DiaryEntry)
        .filter(
            DiaryEntry.id == entry_id,
            DiaryEntry.property_id == property_id,
        )
        .first()
    )

    if not diary_entry:
        raise HTTPException(
            status_code=404,
            detail="Dienasgrāmatas ieraksts nav atrasts."
        )

    if diary_entry.entry_type == "expense":
        expense_entry = (
            db.query(ExpenseEntry)
            .filter(
                ExpenseEntry.diary_entry_id == diary_entry.id
            )
            .first()
        )

        if expense_entry:
            db.delete(expense_entry)
            db.flush()

    elif diary_entry.entry_type == "loan":
        loan_entry = (
            db.query(LoanEntry)
            .filter(
                LoanEntry.diary_entry_id == diary_entry.id
            )
            .first()
        )

        if loan_entry:
            db.delete(loan_entry)
            db.flush()

    db.delete(diary_entry)
    db.commit()

    return {
        "message": "Dienasgrāmatas ieraksts veiksmīgi izdzēsts.",
        "entry_id": entry_id,
    }
# --------------------------------------------------------------------------


@app.patch("/properties/{property_id}/diary/expenses/{entry_id}")
def update_expense_entry(
    property_id: int,
    entry_id: int,
    expense_data: ExpenseEntryUpdate,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    diary_entry = (
        db.query(DiaryEntry)
        .filter(
            DiaryEntry.id == entry_id,
            DiaryEntry.property_id == property_id,
            DiaryEntry.entry_type == "expense",
        )
        .first()
    )

    if not diary_entry:
        raise HTTPException(
            status_code=404,
            detail="Izdevumu ieraksts nav atrasts."
        )

    expense_entry = (
        db.query(ExpenseEntry)
        .filter(
            ExpenseEntry.diary_entry_id == diary_entry.id
        )
        .first()
    )

    if not expense_entry:
        raise HTTPException(
            status_code=404,
            detail="Izdevumu dati nav atrasti."
        )

    diary_entry.entry_date = expense_data.entry_date
    diary_entry.title = expense_data.title
    diary_entry.notes = expense_data.notes
    diary_entry.updated_at = datetime.now(timezone.utc)

    expense_entry.amount = expense_data.amount
    expense_entry.supplier = expense_data.supplier
    expense_entry.room = expense_data.room

    db.commit()

    db.refresh(diary_entry)
    db.refresh(expense_entry)

    return {
        "id": diary_entry.id,
        "property_id": diary_entry.property_id,
        "entry_type": diary_entry.entry_type,
        "entry_date": diary_entry.entry_date,
        "title": diary_entry.title,
        "notes": diary_entry.notes,
        "created_at": diary_entry.created_at,
        "updated_at": diary_entry.updated_at,
        "amount": expense_entry.amount,
        "supplier": expense_entry.supplier,
        "room": expense_entry.room,
    }
# --------------------------------------------------------------------------


@app.post("/properties/{property_id}/diary/loans")
def create_loan_entry(
    property_id: int,
    loan_data: LoanEntryCreate,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    diary_entry = DiaryEntry(
        property_id=property.property_id,
        entry_type="loan",
        entry_date=loan_data.entry_date,
        title=loan_data.title,
        notes=loan_data.notes,
    )

    db.add(diary_entry)
    db.flush()

    loan_entry = LoanEntry(
        diary_entry_id=diary_entry.id,
        amount=loan_data.amount,
        payment_type=loan_data.payment_type,
    )

    db.add(loan_entry)
    db.commit()

    db.refresh(diary_entry)
    db.refresh(loan_entry)

    return {
        "id": diary_entry.id,
        "property_id": diary_entry.property_id,
        "entry_type": diary_entry.entry_type,
        "entry_date": diary_entry.entry_date,
        "title": diary_entry.title,
        "notes": diary_entry.notes,
        "created_at": diary_entry.created_at,
        "amount": loan_entry.amount,
        "payment_type": loan_entry.payment_type,
    }
# --------------------------------------------------------------------------


@app.patch("/properties/{property_id}/diary/loans/{entry_id}")
def update_loan_entry(
    property_id: int,
    entry_id: int,
    loan_data: LoanEntryUpdate,
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
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

    property = (
        db.query(Property)
        .filter(
            Property.property_id == property_id,
            Property.user_id == int(user_id),
        )
        .first()
    )

    if not property:
        raise HTTPException(
            status_code=404,
            detail="Īpašums nav atrasts."
        )

    diary_entry = (
        db.query(DiaryEntry)
        .filter(
            DiaryEntry.id == entry_id,
            DiaryEntry.property_id == property_id,
            DiaryEntry.entry_type == "loan",
        )
        .first()
    )

    if not diary_entry:
        raise HTTPException(
            status_code=404,
            detail="Kredīta maksājuma ieraksts nav atrasts."
        )

    loan_entry = (
        db.query(LoanEntry)
        .filter(
            LoanEntry.diary_entry_id == diary_entry.id
        )
        .first()
    )

    if not loan_entry:
        raise HTTPException(
            status_code=404,
            detail="Kredīta maksājuma dati nav atrasti."
        )

    if loan_data.entry_date is not None:
        diary_entry.entry_date = loan_data.entry_date

    if loan_data.title is not None:
        diary_entry.title = loan_data.title

    if loan_data.notes is not None:
        diary_entry.notes = loan_data.notes

    if loan_data.amount is not None:
        loan_entry.amount = loan_data.amount

    if loan_data.payment_type is not None:
        loan_entry.payment_type = loan_data.payment_type

    diary_entry.updated_at = datetime.now(timezone.utc)

    db.commit()

    db.refresh(diary_entry)
    db.refresh(loan_entry)

    return {
        "id": diary_entry.id,
        "property_id": diary_entry.property_id,
        "entry_type": diary_entry.entry_type,
        "entry_date": diary_entry.entry_date,
        "title": diary_entry.title,
        "notes": diary_entry.notes,
        "created_at": diary_entry.created_at,
        "updated_at": diary_entry.updated_at,
        "amount": loan_entry.amount,
        "payment_type": loan_entry.payment_type,
    }
