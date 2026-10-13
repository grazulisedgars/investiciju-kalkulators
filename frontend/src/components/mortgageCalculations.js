import { calculateAdvanced } from './advancedCalculations';
import { applyMonthlyForecast } from './monthlyForecast';

export const mortgageSteps = [
    {title:'Ieguldījums',fields:[['purchase_price','Īpašuma iegādes cena (€)',0.01],['area','Īpašuma platība (m²)',0.01],['down_payment_percent','Pirmā iemaksa (%)',0,99.99],['bank_rate','Bankas pamata likme (%)',0,100],['euribor_rate','Euribor likme (%)',0,100],['loan_years','Atmaksas termiņš (gadi)',1,50],['renovation_cost_per_m2','Remonts uz m² (€)'],['renovation_years','Renovācijas gadi',0,50],['renovation_months','Renovācijas mēneši',0,12],['bank_fee','Bankas komisija (€) — nav obligāti'],['office_fee','Kancelejas nodeva (€) — nav obligāti'],['valuation','Īpašuma vērtējuma izmaksas (€) — nav obligāti']]},
    {title:'Īres scenārijs',fields:[['monthly_rent','Bruto īre mēnesī (€)'],['rented_months','Izīrētie mēneši gadā',0,12],['tax_rate','Īres nodokļa pieņēmums (%)',0,100]]},
    {title:'Īpašnieka izdevumi',fields:[['summer_cost','Vasaras maksājums (€/mēn.)'],['winter_cost','Ziemas maksājums (€/mēn.)'],['insurance','Īpašuma apdrošināšana gadā (€)'],['cadastral_value','Kadastrālā vērtība (€)'],['loan_insurance_monthly','Kredītmaksājuma apdrošināšana (€/mēn.) — nav obligāti']]},
    {title:'Vērtība pēc remonta',fields:[['future_price_per_m2','Prognozētā tirgus cena uz m² (€) — nav obligāti']]},
];

export function validateMortgage(draft, step = null) {
    const errors = {};
    for (const [key, , min = 0, max = 1e10] of (step == null ? mortgageSteps : [mortgageSteps[step]]).flatMap(item => item.fields)) {
        if (key === 'renovation_cost_per_m2' && draft.repair_source === 'diary') continue;
        if (['renovation_years', 'renovation_months'].includes(key) && draft[key] == null) continue;
        if (['renovation_years', 'renovation_months'].includes(key) && !Number.isInteger(Number(draft[key]))) { errors[key] = 'Ievadi veselu skaitli.'; continue; }
        if (key === 'renovation_months' && Number(draft.renovation_years)*12+Number(draft[key])>611) { errors[key] = 'Maksimālais periods ir 50 gadi un 11 mēneši.'; continue; }
        if (['bank_fee', 'office_fee', 'valuation', 'loan_insurance_monthly', 'future_price_per_m2'].includes(key) && (draft[key] === '' || draft[key] == null)) continue;
        if (['summer_cost', 'winter_cost'].includes(key) && Number(draft.rented_months) === 12 && ((Number(draft.renovation_years || 0)*12 + Number(draft.renovation_months || 0)) === 0 || draft.utilities_source === "diary") && draft[key] === '') continue;
        const value = Number(draft[key]);
        if (draft[key] === '' || draft[key] == null || !Number.isFinite(value)) errors[key] = 'Ievadi skaitli.';
        else if (value < min || value > max || (key === 'area' && value > 1e6) || (key === 'renovation_cost_per_m2' && value > 1e8)) errors[key] = 'Vērtība ārpus atļautā diapazona.';
        else if (['loan_years', 'rented_months'].includes(key) && !Number.isInteger(value)) errors[key] = 'Izvēlies veselu skaitli.';
    }
    return errors;
}

export function calculateMortgage(v, sources = null) {
    const base = calculateAdvanced(v, sources);
    const down_payment = v.purchase_price * v.down_payment_percent / 100;
    const loan_amount = v.purchase_price - down_payment;
    const total_rate = v.bank_rate + v.euribor_rate, rate = total_rate / 1200, loan_months = Math.min(600, Math.max(12, Number(v.loan_years)*12 || 12));
    const loan_payment = rate === 0 ? loan_amount / loan_months : loan_amount * rate / -Math.expm1(-loan_months * Math.log1p(rate));
    const mortgage_fee = loan_amount * 0.001, acquisition = base.acquisition + v.bank_fee + mortgage_fee;
    const investment = v.purchase_price + acquisition + base.renovation, own_capital = down_payment + acquisition + base.renovation;
    const loan_insurance_annual = v.loan_insurance_monthly * 12, expenses = base.expenses + loan_insurance_annual;
    const operating_annual = base.gross_annual - base.tax_annual - expenses, debt_annual = loan_payment * 12;
    const net_annual = operating_annual - debt_annual;
    return applyMonthlyForecast(v, { ...base, down_payment, loan_amount, total_rate, loan_months, loan_payment, mortgage_fee, acquisition, investment, own_capital, purchase_capital: down_payment+acquisition, loan_insurance_annual, expenses, operating_annual, debt_annual, net_annual, net_monthly: net_annual/12, gross_yield: base.gross_annual/investment*100, net_yield: operating_annual/investment*100, cash_on_cash: own_capital > 0 ? net_annual/own_capital*100 : null, capital_gain: base.market_value == null ? null : base.market_value-investment, chart_initial: own_capital, }, true, sources);
}
