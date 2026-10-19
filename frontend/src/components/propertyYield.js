// One source policy for property cards, headers and portfolio averages.
export function propertyGrossYield(property, isPro) {
    const advanced = property.advanced_gross_yield;
    if (isPro && typeof advanced === "number" && Number.isFinite(advanced)) return advanced;
    if (property.monthly_rent == null || property.occupancy == null) return null;
    const investment = Number(property.purchase_price || 0) + Number(property.area || 0) * Number(property.renovation_cost_per_m2 || 0);
    const annualRent = Number(property.monthly_rent) * 12 * Number(property.occupancy) / 100;
    return investment > 0 && Number.isFinite(annualRent) ? annualRent / investment * 100 : null;
}

// Contract/scenario monthly rent, rather than received rent or occupancy-adjusted income.
export function propertyMonthlyRent(property, isPro) {
    const advanced = property.advanced_monthly_rent;
    if (isPro && typeof advanced === "number" && Number.isFinite(advanced)) return advanced;
    if (property.monthly_rent == null || property.monthly_rent === "") return null;
    const basic = Number(property.monthly_rent);
    return Number.isFinite(basic) ? basic : null;
}
