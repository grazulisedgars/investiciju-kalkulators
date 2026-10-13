export function normalizeRenovation(years, months) {
    const total = (Number(years) || 0)*12 + (Number(months) || 0);
    return { renovation_years: Math.floor(total/12), renovation_months: total%12 };
}

// Gada aizpildījumu pēc renovācijas sadala vienmērīgi pa mēnešiem.
// Precīzi izīrēto mēnešu datumi nav ievadīti, tāpēc tā ir vidējā prognoze.
export function applyMonthlyForecast(v, result, mortgage = false, sources = null) {
    let renovation = (Number(v.renovation_years) || 0) * 12 + (Number(v.renovation_months) || 0);
    const starts=[v.renovation_start_date,v.utilities_source==='diary'?v.utilities_start_date:null].filter(Boolean).sort();
    if(v.renovation_end_date && starts.length){const [y,m]=v.renovation_end_date.split('-').map(Number),[sy,sm]=starts[0].split('-').map(Number);renovation=(y-sy)*12+m-sm+1;}
    const loanMonths = mortgage ? Math.min(600, Math.max(12, Number(v.loan_years)*12 || 12)) : 0;
    const loan = mortgage ? result.loan_amount : 0;
    const rate = mortgage ? (v.bank_rate + v.euribor_rate) / 1200 : 0;
    const payment = mortgage ? result.loan_payment : 0;
    const lastBill = sources && v.utilities_source === "diary" ? Math.max(0,...Object.keys(sources.utilitiesByMonth).map(Number)) : 0;
    const lastRepair = sources && v.repair_source === "diary" ? Math.max(0,...Object.keys(sources.repairByMonth).map(Number)) : 0;
    const horizon = Math.max(120, loanMonths, (Math.floor(renovation / 12) + 1) * 12, Math.ceil(Math.max(lastBill,lastRepair)/12)*12);
    const totalCapital = result.own_capital ?? result.investment;
    const diaryRepair = v.repair_source === 'diary' && sources;
    const stagedRepair = diaryRepair || (v.repair_source!=='diary' && renovation>0);
    const initial = totalCapital - (stagedRepair ? result.renovation : 0);
    result = {...result, chart_initial:initial};
    let cumulative = -initial, balance = loan, payback = null;
    const timeline = [{ year: 0, cash: -initial, gross: 0, tax: 0, expenses: 0, debt: 0, cumulative, loan_balance: loan, principal: 0, interest: 0 }];
    const monthly_timeline = [{ month: 0, year: 0, cumulative }];
    const empty = () => ({ cash: 0, gross: 0, tax: 0, expenses: 0, debt: 0, principal: 0, interest: 0 });
    let sums = empty();
    let renovationStartMonth=1;
    if(v.renovation_start_date && starts.length){const [y,m]=v.renovation_start_date.split('-').map(Number),[sy,sm]=starts[0].split('-').map(Number);renovationStartMonth=(y-sy)*12+m-sm+1;}
    const repairMonthCount=Math.max(1,renovation-renovationStartMonth+1);
    const manualRepairMonthly=stagedRepair && !diaryRepair?result.renovation/repairMonthCount:0;
    const renovationCosts={repair:renovation>0 && !stagedRepair?result.renovation:0,utilities:0,other:0,debt:0,principal:0};
    for (let month = 1; month <= horizon; month++) {
        const occupancy = month <= renovation ? 0 : v.rented_months / 12;
        const gross = v.monthly_rent * occupancy, tax = gross * v.tax_rate / 100;
        let utilities = result.average_cost * (1-occupancy);
        if (v.utilities_source === 'diary' && sources && (month <= renovation || Object.hasOwn(sources.utilitiesByMonth,month))) utilities = sources.utilitiesByMonth[month] || 0;
        let expenses = (v.insurance + result.nin) / 12 + utilities;
        let debt = 0, principal = 0, interest = 0;
        if (mortgage && month <= loanMonths) {
            const remaining = loanMonths-month;
            const next = rate === 0 ? loan * remaining / loanMonths : loan * Math.expm1(-remaining*Math.log1p(rate)) / Math.expm1(-loanMonths*Math.log1p(rate));
            principal = balance-next; debt = payment; interest = debt-principal; balance = next;
            expenses += v.loan_insurance_monthly;
        }
        let repair = diaryRepair ? sources.repairByMonth[month] || 0 : 0;
        if(stagedRepair && !diaryRepair && month>=renovationStartMonth && month<=renovation)repair=month===renovation?result.renovation-manualRepairMonthly*(repairMonthCount-1):manualRepairMonthly;
        if(month>=renovationStartMonth && month<=renovation){renovationCosts.repair+=repair;renovationCosts.utilities+=utilities;renovationCosts.other+=expenses-utilities;renovationCosts.debt+=debt;renovationCosts.principal+=principal;}
        const cash = gross-tax-expenses-debt-repair;
        if (payback == null && cumulative < 0 && cumulative+cash >= 0 && cash > 0) payback = (month-1-cumulative/cash)/12;
        cumulative += cash;
        for (const [key, value] of Object.entries({ cash, gross, tax, expenses, debt, principal, interest })) sums[key] += value;
        monthly_timeline.push({ month, year: month/12, cumulative });
        if (month%12 === 0) { timeline.push({ year: month/12, ...sums, cumulative, loan_balance: balance }); sums = empty(); }
    }
    const after = v.monthly_rent*v.rented_months*(1-v.tax_rate/100)-v.insurance-result.nin-result.average_cost*(12-v.rented_months);
    if (payback == null && cumulative < 0 && after > 0) payback = horizon/12-cumulative/after;
    if (mortgage) {
        const debtMonths = Math.min(12, Math.max(0, loanMonths-renovation));
        const loanInsurance = v.loan_insurance_monthly * debtMonths;
        const expenses = v.insurance+result.nin+result.average_cost*(12-v.rented_months)+loanInsurance;
        const operating = result.gross_annual-result.tax_annual-expenses;
        const cash = operating-payment*debtMonths;
        result = { ...result, debt_annual: payment*debtMonths, debt_months_after_renovation: debtMonths,
            loan_payment_after_renovation: debtMonths ? payment : 0, loan_insurance_annual: loanInsurance,
            expenses, operating_annual: operating, net_annual: cash, net_monthly: cash/12,
            net_yield: operating/result.investment*100, cash_on_cash: totalCapital > 0 ? cash/totalCapital*100 : null };
    }
    if (sources) result = { ...result, diary_repair_total: sources.repairTotal, diary_repair_count: sources.repairCount,
        diary_utilities_total: sources.utilitiesTotal, diary_utilities_count: sources.utilitiesCount,
        effective_repair_per_m2: result.renovation / v.area };
    return { ...result, renovation_owner_costs:renovationCosts.repair+renovationCosts.utilities+renovationCosts.other+renovationCosts.debt,
        renovation_repair_costs:renovationCosts.repair,renovation_utilities_costs:renovationCosts.utilities,renovation_other_costs:renovationCosts.other,renovation_debt_costs:renovationCosts.debt,renovation_principal_costs:renovationCosts.principal,
        renovation_total_months: renovation, rent_start_month: renovation+1, first_year_gross: timeline[1].gross, first_year_cash: timeline[1].cash, first_year_expenses: timeline[1].expenses, timeline, monthly_timeline, payback, cash_ten_years: timeline.slice(1,11).reduce((sum,item)=>sum+item.cash,0) };
}
