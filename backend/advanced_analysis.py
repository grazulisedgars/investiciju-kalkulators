"""Apstiprinātais analīzes modelis īpašumam bez hipotēkas."""
from decimal import Decimal
from datetime import datetime, timezone
from fastapi import APIRouter, Cookie, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session
from database import get_db
from models import AdvancedAnalysis, Property
from security import decode_access_token

router = APIRouter(prefix="/properties/{property_id}/advanced-analysis", tags=["Padziļinātā analīze"])

class AnalysisInputs(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    purchase_price: float = Field(gt=0, le=1e10)
    area: float = Field(gt=0, le=1e6)
    renovation_cost_per_m2: float = Field(ge=0, le=1e8)
    office_fee: float = Field(default=0, ge=0, le=1e10)
    valuation: float = Field(default=0, ge=0, le=1e10)
    monthly_rent: float = Field(ge=0, le=1e10)
    rented_months: int = Field(ge=0, le=12)
    tax_rate: float = Field(ge=0, le=100)
    summer_cost: float = Field(ge=0, le=1e10)
    winter_cost: float = Field(ge=0, le=1e10)
    insurance: float = Field(ge=0, le=1e10)
    cadastral_value: float = Field(ge=0, le=1e10)
    future_price_per_m2: float | None = Field(default=None, ge=0, le=1e10)

def calculate(inputs: AnalysisInputs):
    # NĪN bāze ir kadastrālā vērtība; likmes ir apstiprinātā modeļa pieņēmumi.
    v = {k: Decimal(str(value)) if value is not None else None for k, value in inputs.model_dump().items()}
    price, area, cadastral = v["purchase_price"], v["area"], v["cadastral_value"]
    notary = max(price * Decimal("0.004"), Decimal(140))
    vat, state_fee = notary * Decimal("0.21"), price * Decimal("0.015")
    acquisition = notary + vat + state_fee + v["office_fee"] + v["valuation"]
    renovation = area * v["renovation_cost_per_m2"]
    investment = price + acquisition + renovation
    nin = max(Decimal(7), min(cadastral, Decimal(56915)) * Decimal("0.002")
              + max(Decimal(0), min(cadastral, Decimal(106715)) - Decimal(56915)) * Decimal("0.004")
              + max(Decimal(0), cadastral - Decimal(106715)) * Decimal("0.006"))
    vacancy = 12 - v["rented_months"]
    average = (v["summer_cost"] + v["winter_cost"]) / 2
    vacancy_cost = vacancy * average
    gross = v["monthly_rent"] * v["rented_months"]
    tax = gross * v["tax_rate"] / 100
    expenses = v["insurance"] + nin + vacancy_cost
    net = gross - tax - expenses
    market = v["future_price_per_m2"] * area if v["future_price_per_m2"] is not None else None
    result = dict(price_per_m2=price / area, notary=notary, notary_vat=vat, state_fee=state_fee,
                  acquisition=acquisition, renovation=renovation, investment=investment,
                  nin=nin, vacancy=vacancy, average_cost=average, annual_cost=average * 12,
                  vacancy_cost=vacancy_cost, gross_annual=gross, tax_annual=tax,
                  net_rent_monthly=v["monthly_rent"] * (1-v["tax_rate"] / 100),
                  net_rent_annual=gross-tax, expenses=expenses, net_annual=net, net_monthly=net / 12,
                  occupancy=v["rented_months"] / 12 * 100, gross_yield=gross / investment * 100,
                  net_yield=net / investment * 100, market_value=market, capital_gain=market-investment if market is not None else None,
                  payback=investment / net if net > 0 else None)
    return {k: float(value) if value is not None else None for k, value in result.items()}

def owned_property(property_id, token, db):
    payload = decode_access_token(token) if token else None
    try:
        user_id = int(payload["sub"]) if payload else None
    except (KeyError, ValueError, TypeError):
        user_id = None
    if user_id is None:
        raise HTTPException(401, "Nepieciešama derīga autentifikācija.")
    prop = db.query(Property).filter(Property.property_id == property_id, Property.user_id == user_id).first()
    if not prop:
        raise HTTPException(404, "Īpašums nav atrasts.")
    if prop.financing_type != "cash":
        raise HTTPException(400, "Šis kalkulators paredzēts īpašumam bez hipotēkas.")
    return prop

def serialize(row):
    inputs = AnalysisInputs.model_validate(row.inputs)
    return {"inputs": inputs.model_dump(), "results": calculate(inputs), "updated_at": row.updated_at}

@router.get("")
def get_analysis(property_id: int, access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    owned_property(property_id, access_token, db)
    row = db.query(AdvancedAnalysis).filter(AdvancedAnalysis.property_id == property_id).first()
    return serialize(row) if row else None

@router.put("")
def save_analysis(property_id: int, inputs: AnalysisInputs, access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    owned_property(property_id, access_token, db)
    # Iepriekš saglabātu 0 mēnešu scenāriju var nolasīt, bet jaunā ievade ir 1–12.
    if inputs.rented_months < 1:
        raise HTTPException(422, "Izvēlies izīrēto mēnešu skaitu no 1 līdz 12.")
    row = db.query(AdvancedAnalysis).filter(AdvancedAnalysis.property_id == property_id).first()
    if row is None:
        row = AdvancedAnalysis(property_id=property_id)
        db.add(row)
    row.inputs = inputs.model_dump()
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return serialize(row)

@router.delete("", status_code=204)
def delete_analysis(property_id: int, access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    owned_property(property_id, access_token, db)
    row = db.query(AdvancedAnalysis).filter(AdvancedAnalysis.property_id == property_id).first()
    if row:
        db.delete(row)
        db.commit()
