# Cena par m2
def calculate_price_per_m2(purchase_price, area):
    if area > 0:
        return purchase_price / area
    else:
        return 0

# Notāra samaksa, Notāra PVN un Valsts Nodeva


def calculate_purchase_costs(purchase_price, office_fee, valuation):
    notary = max(purchase_price * 0.005, 140)
    notary_vat = notary * 0.21
    state_fee = purchase_price * 0.015

    total_additional_costs = (
        notary
        + notary_vat
        + office_fee
        + valuation
        + state_fee
    )

    total_purchase_cost = purchase_price + total_additional_costs

    return {
        "notary": notary,
        "notary_vat": notary_vat,
        "office_fee": office_fee,
        "valuation": valuation,
        "state_fee": state_fee,
        "total_additional_costs": total_additional_costs,
        "total_purchase_cost": total_purchase_cost
    }

# Free Analysis aprēķini (Gada bruto īres ienākumi, Kopējā investīcija, Bruto ienesīgums)


def calculate_free_analysis(
    purchase_price,
    renovation_costs,
    monthly_rent,
    occupancy
):
    annual_gross_rent = monthly_rent * 12 * (occupancy / 100)

    total_investment = purchase_price + renovation_costs

    if total_investment > 0:
        gross_yield = (annual_gross_rent / total_investment) * 100
    else:
        gross_yield = 0

    return {
        "annual_gross_rent": annual_gross_rent,
        "total_investment": total_investment,
        "gross_yield": gross_yield
    }
