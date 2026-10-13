import { applyMonthlyForecast } from "./monthlyForecast";
// Tie paši apstiprinātie pieņēmumi kā serverī; ievades laikā rāda aprēķinus uzreiz.
export function calculateAdvanced(v, sources = null) {
    const price = v.purchase_price, area = v.area, cadastral = v.cadastral_value;
    const notary = Math.max(price * 0.004, 140), notary_vat = notary * 0.21, state_fee = price * 0.015;
    const acquisition = notary + notary_vat + state_fee + v.office_fee + v.valuation;
    const renovation = v.repair_source === 'diary' && sources ? sources.repairTotal : area * v.renovation_cost_per_m2, investment = price + acquisition + renovation;
    const nin = Math.max(7, Math.min(cadastral, 56915) * 0.002 + Math.max(0, Math.min(cadastral, 106715) - 56915) * 0.004 + Math.max(0, cadastral - 106715) * 0.006);
    const vacancy = 12 - v.rented_months, average_cost = (v.summer_cost + v.winter_cost) / 2;
    const vacancy_cost = vacancy * average_cost, gross_annual = v.monthly_rent * v.rented_months;
    const tax_annual = gross_annual * v.tax_rate / 100, expenses = v.insurance + nin + vacancy_cost;
    const net_annual = gross_annual - tax_annual - expenses, market_value = v.future_price_per_m2 == null ? null : v.future_price_per_m2 * area;
    return applyMonthlyForecast(v, { price_per_m2: area > 0 ? price / area : null, notary, notary_vat, state_fee, acquisition, renovation, investment, nin, vacancy, average_cost, annual_cost: average_cost * 12, vacancy_cost, gross_annual, tax_annual, net_rent_monthly: v.monthly_rent * (1-v.tax_rate/100), net_rent_annual: gross_annual-tax_annual, expenses, net_annual, net_monthly: net_annual / 12, occupancy: v.rented_months / 12 * 100, gross_yield: investment > 0 ? gross_annual / investment * 100 : null, net_yield: investment > 0 ? net_annual / investment * 100 : null, market_value, capital_gain: market_value == null ? null : market_value-investment, payback: net_annual > 0 && investment > 0 ? investment / net_annual : null }, false, sources);
}

export const analysisSteps = [
    { title: "Ieguldījums", fields: [
        ["purchase_price", "Īpašuma iegādes cena (€)", 0.01], ["area", "Īpašuma platība (m²)", 0.01],
        ["renovation_cost_per_m2", "Remonts uz m² (€)"], ["office_fee", "Kancelejas nodeva (€) — nav obligāti"], ["valuation", "Īpašuma vērtējuma izmaksas (€) — nav obligāti"],
    ] },
    { title: "Īres scenārijs", fields: [
        ["renovation_years", "Renovācijas gadi", 0, 50], ["renovation_months", "Renovācijas mēneši", 0, 12], ["monthly_rent", "Bruto īre mēnesī (€)"], ["rented_months", "Izīrētie mēneši gadā", 0, 12, 1], ["tax_rate", "Īres nodokļa pieņēmums (%)", 0, 100],
    ] },
    { title: "Īpašnieka izdevumi", fields: [
        ["summer_cost", "Apsaimniekošana un komunālie vasarā (€/mēn.)"], ["winter_cost", "Apsaimniekošana un komunālie ziemā (€/mēn.)"],
        ["insurance", "Apdrošināšana gadā (€)"], ["cadastral_value", "Kadastrālā vērtība (€)"],
    ] },
    { title: "Vērtība pēc remonta", fields: [["future_price_per_m2", "Prognozētā tirgus cena uz m² (€) — nav obligāti"]] },
];

export function validateAnalysis(draft, step = null) {
    const errors = {};
    const fields = (step === null ? analysisSteps : [analysisSteps[step]]).flatMap(s => s.fields);
    for (const [key, , min = 0, max = 1e10] of fields) {
        if (key === "renovation_cost_per_m2" && draft.repair_source === "diary") continue;
        if (["renovation_years", "renovation_months"].includes(key) && draft[key] == null) continue;
        if (["renovation_years", "renovation_months"].includes(key) && !Number.isInteger(Number(draft[key]))) { errors[key] = "Ievadi veselu skaitli."; continue; }
        if (key === "renovation_months" && Number(draft.renovation_years)*12+Number(draft[key])>611) { errors[key] = "Maksimālais periods ir 50 gadi un 11 mēneši."; continue; }
        if (["office_fee", "valuation", "future_price_per_m2"].includes(key) && (draft[key] === "" || draft[key] == null)) continue;
        // Pie pilna aizpildījuma tukšas sezonālās maksas neietekmē īpašnieka izdevumus.
        if (["summer_cost", "winter_cost"].includes(key) && Number(draft.rented_months) === 12 && ((Number(draft.renovation_years || 0)*12 + Number(draft.renovation_months || 0)) === 0 || draft.utilities_source === "diary") && draft[key] === "") continue;
        const value = Number(draft[key]);
        if (draft[key] === "" || !Number.isFinite(value)) errors[key] = "Ievadi skaitli; arī 0 ir derīga summa.";
        else if (value < min || value > max || (key === "area" && value > 1e6) || (key === "renovation_cost_per_m2" && value > 1e8)) errors[key] = "Vērtība ir ārpus atļautā diapazona.";
        else if (key === "rented_months" && !Number.isInteger(value)) errors[key] = "Izvēlies mēnešu skaitu no 0 līdz 12.";
    }
    return errors;
}
