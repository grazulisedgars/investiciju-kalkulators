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
    return notary_fee * 0.021

# Valsts nodeva


def calculate_state_fee(purchase_price):
    return purchase_price * 0.015

# Kopējās īpašuma iegādes izmakses


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
