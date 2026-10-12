export function normalizeRenovation(years, months) {
    const total = (Number(years) || 0)*12 + (Number(months) || 0);
    return { renovation_years: Math.floor(total/12), renovation_months: total%12 };
}

// Gada aizpildījumu pēc renovācijas sadala vienmērīgi pa mēnešiem.
// Precīzi izīrēto mēnešu datumi nav ievadīti, tāpēc tā ir vidējā prognoze.
export function applyMonthlyForecast(v, result, mortgage = false) {
    const renovation = (Number(v.renovation_years) || 0) * 12 + (Number(v.renovation_months) || 0);
    const loanMonths = mortgage ? Math.min(600, Math.max(12, Number(v.loan_years)*12 || 12)) : 0;
    const loan = mortgage ? result.loan_amount : 0;
    const rate = mortgage ? (v.bank_rate + v.euribor_rate) / 1200 : 0;
    const payment = mortgage ? result.loan_payment : 0;
    const horizon = Math.max(120, loanMonths, (Math.floor(renovation / 12) + 1) * 12);
    const initial = result.own_capital ?? result.investment;
    let cumulative = -initial, balance = loan, payback = null;
    const timeline = [{ year: 0, cash: -initial, gross: 0, tax: 0, expenses: 0, debt: 0, cumulative, loan_balance: loan, principal: 0, interest: 0 }];
    const monthly_timeline = [{ month: 0, year: 0, cumulative }];
    const empty = () => ({ cash: 0, gross: 0, tax: 0, expenses: 0, debt: 0, principal: 0, interest: 0 });
    let sums = empty();
    for (let month = 1; month <= horizon; month++) {
        const occupancy = month <= renovation ? 0 : v.rented_months / 12;
        const gross = v.monthly_rent * occupancy, tax = gross * v.tax_rate / 100;
        let expenses = (v.insurance + result.nin) / 12 + result.average_cost * (1-occupancy);
        let debt = 0, principal = 0, interest = 0;
        if (mortgage && month <= loanMonths) {
            const remaining = loanMonths-month;
            const next = rate === 0 ? loan * remaining / loanMonths : loan * Math.expm1(-remaining*Math.log1p(rate)) / Math.expm1(-loanMonths*Math.log1p(rate));
            principal = balance-next; debt = payment; interest = debt-principal; balance = next;
            expenses += v.loan_insurance_monthly;
        }
        const cash = gross-tax-expenses-debt;
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
            net_yield: operating/result.investment*100, cash_on_cash: initial > 0 ? cash/initial*100 : null };
    }
    return { ...result, renovation_total_months: renovation, rent_start_month: renovation+1, first_year_gross: timeline[1].gross, first_year_cash: timeline[1].cash, first_year_expenses: timeline[1].expenses, timeline, monthly_timeline, payback, cash_ten_years: timeline.slice(1,11).reduce((sum,item)=>sum+item.cash,0) };
}
