// Summas skaitām centos, bet stundas — simtdaļās. Pamata analīzes dati netiek izmantoti.
export function calculateDiaryTotals(entries) {
    const totals = {
        expense: { amount: 0, count: 0 },
        loan: { amount: 0, count: 0 },
        utility: { amount: 0, count: 0 },
        rent: { amount: 0, count: 0 },
        work: { hours: 0, count: 0 },
        loanBreakdown: { principal: 0, interest: 0, insurance: 0, other: 0 },
    };
    for (const entry of entries) {
        const target = totals[entry.entry_type];
        if (!target || entry.entry_type === "loanBreakdown") continue;
        target.count += 1;
        if (entry.entry_type === "work") {
            target.hours += Math.round(Number(entry.hours || 0) * 100);
        } else {
            const cents = Math.round(Number(entry.amount || 0) * 100);
            target.amount += cents;
            if (entry.entry_type === "loan") {
                const type = ["principal", "interest", "insurance"].includes(entry.payment_type) ? entry.payment_type : "other";
                totals.loanBreakdown[type] += cents;
            }
        }
    }
    totals.expenses = totals.expense.amount + totals.loan.amount + totals.utility.amount;
    totals.balance = totals.rent.amount - totals.expenses;
    return totals;
}
