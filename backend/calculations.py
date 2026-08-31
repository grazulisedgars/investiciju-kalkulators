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


# Kopējās īpašuma iegādes PAPILDU izmakses


# def calculate_additional_purchase_costs(
    # notary_fee,
    # notary_vat,
    # registry_fee,
    # property_valuation,
    # state_fee
# ):
    # return (
    # notary_fee
    # + notary_vat
    # + registry_fee
    # + property_valuation
    # + state_fee
    # )

# Kopējās īpašuma iegādes izmaksas


# def calculate_total_purchase_cost(
    # purchase_price,
    # total_additional_costs
# ):
    # return purchase_price + total_additional_costs
