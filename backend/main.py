from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from calculations import (
    calculate_price_per_m2,
    calculate_purchase_costs
)

app = FastAPI()

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


@app.get("/calculate/price-per-m2")
def calculate_price(purchase_price: float, area: float):
    price_per_m2 = calculate_price_per_m2(
        purchase_price,
        area
    )

    return {
        "price_per_m2": price_per_m2
    }


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
