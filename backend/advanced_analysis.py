"""Apstiprinātie padziļinātās analīzes modeļi ar un bez hipotēkas."""
from decimal import Decimal, localcontext
from datetime import datetime, timezone
from fastapi import APIRouter, Cookie, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
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
    renovation_years: int = Field(default=0, ge=0, le=50)
    renovation_months: int = Field(default=0, ge=0, le=12)

    @model_validator(mode="after")
    def normalize_renovation(self):
        if self.renovation_months == 12:
            if self.renovation_years >= 50:
                raise ValueError("Renovācijas periods nevar pārsniegt 50 gadus un 11 mēnešus.")
            self.renovation_years += 1
            self.renovation_months = 0
        return self

    future_price_per_m2: float | None = Field(default=None, ge=0, le=1e10)

class MortgageInputs(AnalysisInputs):
    down_payment_percent: float = Field(ge=0, lt=100)
    bank_rate: float = Field(ge=0, le=100)
    euribor_rate: float = Field(ge=0, le=100)
    loan_years: int = Field(ge=1, le=50)
    bank_fee: float = Field(default=0, ge=0, le=1e10)
    loan_insurance_monthly: float = Field(default=0, ge=0, le=1e10)


def apply_monthly_forecast(inputs, result, mortgage=False):
    # Izīrētie mēneši ir vidējais gada aizpildījums PĒC renovācijas.
    # Mēnešiem piemēro vienādu aizpildījuma daļu, jo precīzs īres kalendārs nav ievadīts.
    with localcontext() as context:
        context.prec = 100
        d = lambda value: Decimal(str(value))
        renovation = inputs.renovation_years * 12 + inputs.renovation_months
        loan_months = inputs.loan_years * 12 if mortgage else 0
        loan = d(result["loan_amount"]) if mortgage else Decimal(0)
        payment = d(result["loan_payment"]) if mortgage else Decimal(0)
        rate = (d(inputs.bank_rate) + d(inputs.euribor_rate)) / 1200 if mortgage else Decimal(0)
        # Nepārvērš aprēķināto maksājumu uz float mēneša kredīta grafikam.
        if mortgage:
            payment = loan / loan_months if rate == 0 else loan * rate / (1 - (1 + rate) ** (-loan_months))
        horizon = max(120, loan_months, ((renovation // 12) + 1) * 12)
        initial = d(result.get("own_capital", result["investment"]))
        cumulative, balance = -initial, loan
        timeline = [{"year": 0, "cash": float(-initial), "gross": 0.0, "tax": 0.0, "expenses": 0.0, "debt": 0.0, "cumulative": float(-initial), "loan_balance": float(loan), "principal": 0.0, "interest": 0.0}]
        monthly = [{"month": 0, "year": 0.0, "cumulative": float(-initial)}]
        sums = {key: Decimal(0) for key in ("cash", "gross", "tax", "expenses", "debt", "principal", "interest")}
        payback = None
        for month in range(1, horizon + 1):
            occupancy = Decimal(0) if month <= renovation else d(inputs.rented_months) / 12
            gross = d(inputs.monthly_rent) * occupancy
            tax = gross * d(inputs.tax_rate) / 100
            expenses = (d(inputs.insurance) + d(result["nin"])) / 12 + d(result["average_cost"]) * (1 - occupancy)
            debt = principal = interest = Decimal(0)
            if mortgage and month <= loan_months:
                remaining = loan_months - month
                next_balance = loan * remaining / loan_months if rate == 0 else loan * (1 - (1 + rate) ** (-remaining)) / (1 - (1 + rate) ** (-loan_months))
                principal, debt = balance - next_balance, payment
                interest = debt - principal
                balance = next_balance
                expenses += d(inputs.loan_insurance_monthly)
            cash = gross - tax - expenses - debt
            if payback is None and cumulative < 0 and cumulative + cash >= 0 and cash > 0:
                payback = float((d(month - 1) - cumulative / cash) / 12)
            cumulative += cash
            for key, value in dict(cash=cash, gross=gross, tax=tax, expenses=expenses, debt=debt, principal=principal, interest=interest).items():
                sums[key] += value
            monthly.append({"month": month, "year": month / 12, "cumulative": float(cumulative)})
            if month % 12 == 0:
                timeline.append({"year": month // 12, **{key: float(value) for key, value in sums.items()}, "cumulative": float(cumulative), "loan_balance": float(balance)})
                sums = {key: Decimal(0) for key in sums}
        after = d(inputs.monthly_rent) * d(inputs.rented_months) * (1 - d(inputs.tax_rate) / 100) - d(inputs.insurance) - d(result["nin"]) - d(result["average_cost"]) * (12 - inputs.rented_months)
        if payback is None and cumulative < 0 and after > 0:
            payback = horizon / 12 + float(-cumulative / after)
        if mortgage:
            # Gada KPI attiecas uz pirmajiem 12 mēnešiem pēc renovācijas.
            # Ja kredīts jau beidzies renovācijas laikā, to atkārtoti neatņem.
            debt_months = min(12, max(0, loan_months - renovation))
            loan_insurance = d(inputs.loan_insurance_monthly) * debt_months
            annual_expenses = d(inputs.insurance) + d(result["nin"]) + d(result["average_cost"]) * (12 - inputs.rented_months) + loan_insurance
            operating = d(result["gross_annual"]) - d(result["tax_annual"]) - annual_expenses
            annual_cash = operating - payment * debt_months
            result.update(debt_annual=float(payment * debt_months), debt_months_after_renovation=debt_months,
                          loan_payment_after_renovation=float(payment) if debt_months else 0.0,
                          loan_insurance_annual=float(loan_insurance), expenses=float(annual_expenses),
                          operating_annual=float(operating), net_annual=float(annual_cash), net_monthly=float(annual_cash / 12),
                          net_yield=float(operating / d(result["investment"]) * 100),
                          cash_on_cash=float(annual_cash / initial * 100) if initial > 0 else None)
        result.update(renovation_total_months=renovation, rent_start_month=renovation + 1,
                      first_year_gross=timeline[1]["gross"], first_year_cash=timeline[1]["cash"],
                      first_year_expenses=timeline[1]["expenses"], payback=payback,
                      timeline=timeline, monthly_timeline=monthly,
                      cash_ten_years=sum(item["cash"] for item in timeline[1:11]))
        return result


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
    output = {k: float(value) if value is not None else None for k, value in result.items()}
    return apply_monthly_forecast(inputs, output)

def calculate_mortgage(inputs: MortgageInputs):
    with localcontext() as context:
        context.prec = 100
        # Annuitātes maksājums, nemainīga bankas un Euribor likme visā prognozē.
        base = calculate(inputs)
        price = Decimal(str(inputs.purchase_price))
        down = price * Decimal(str(inputs.down_payment_percent)) / 100
        loan = price - down
        rate = (Decimal(str(inputs.bank_rate)) + Decimal(str(inputs.euribor_rate))) / 1200
        months = inputs.loan_years * 12
        payment = loan / months if rate == 0 else loan * rate / (1 - (1 + rate) ** (-months))
        mortgage_fee = loan * Decimal("0.001")
        acquisition = Decimal(str(base["acquisition"])) + Decimal(str(inputs.bank_fee)) + mortgage_fee
        renovation = Decimal(str(base["renovation"]))
        investment = price + acquisition + renovation
        capital = down + acquisition + renovation
        insurance = Decimal(str(inputs.loan_insurance_monthly)) * 12
        expenses = Decimal(str(base["expenses"])) + insurance
        operating = Decimal(str(base["gross_annual"])) - Decimal(str(base["tax_annual"])) - expenses
        cash = operating - payment * 12
        market = base["market_value"]
        base.update(down_payment=float(down), loan_amount=float(loan), total_rate=inputs.bank_rate + inputs.euribor_rate,
                    loan_months=months, loan_payment=float(payment), mortgage_fee=float(mortgage_fee),
                    acquisition=float(acquisition), investment=float(investment), own_capital=float(capital),
                    purchase_capital=float(down + acquisition), loan_insurance_annual=float(insurance), expenses=float(expenses),
                    operating_annual=float(operating), debt_annual=float(payment * 12), net_annual=float(cash), net_monthly=float(cash / 12),
                    gross_yield=float(Decimal(str(base["gross_annual"])) / investment * 100),
                    net_yield=float(operating / investment * 100), cash_on_cash=float(cash / capital * 100) if capital > 0 else None,
                    capital_gain=market - float(investment) if market is not None else None,
                    chart_initial=float(capital))
        return apply_monthly_forecast(inputs, base, mortgage=True)

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
    if prop.financing_type not in ("cash", "mortgage"):
        raise HTTPException(400, "Neatbalstīts finansējuma veids.")
    return prop

def serialize(row):
    inputs = (MortgageInputs if "down_payment_percent" in row.inputs else AnalysisInputs).model_validate(row.inputs)
    results = calculate_mortgage(inputs) if isinstance(inputs, MortgageInputs) else calculate(inputs)
    return {"inputs": inputs.model_dump(), "results": results, "updated_at": row.updated_at}

@router.get("")
def get_analysis(property_id: int, access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    owned_property(property_id, access_token, db)
    row = db.query(AdvancedAnalysis).filter(AdvancedAnalysis.property_id == property_id).first()
    return serialize(row) if row else None

@router.put("")
def save_analysis(property_id: int, inputs: MortgageInputs | AnalysisInputs, access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    prop = owned_property(property_id, access_token, db)
    if (prop.financing_type == "mortgage") != isinstance(inputs, MortgageInputs):
        raise HTTPException(422, "Analīzes ievade neatbilst īpašuma finansējuma veidam.")
    # 0 mēneši atļauti neizīrētam īpašumam vai renovācijas scenārijam.
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
