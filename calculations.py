def calculate_price_per_m2(purchase_price, area):
    if area > 0:
        return purchase_price / area
    else:
        return 0
