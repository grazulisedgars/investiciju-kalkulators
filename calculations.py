# Cena par m2
def calculate_price_per_m2(purchase_price, area):
    if area > 0:
        return purchase_price / area
    else:
        return 0

# Notāra samaksa


def calculate_notary_fee(purchase_price):
    return max(purchase_price * 0.005, 140)

# Notārs PVN


def calculate_notary_vat(notary_fee):
    return notary_fee * 0.21

# Valsts nodeva


def calculate_state_fee(purchase_price):
    return purchase_price * 0.015

# Kopējās īpašuma iegādes PAPILDU izmakses


def calculate_additional_purchase_costs(
    notary_fee,
    notary_vat,
    registry_fee,
    property_valuation,
    state_fee
):
    return (
        notary_fee
        + notary_vat
        + registry_fee
        + property_valuation
        + state_fee
    )

# Kopējās īpašuma iegādes izmaksas


def calculate_total_purchase_cost(
    purchase_price,
    total_additional_costs
):
    return purchase_price + total_additional_costs
