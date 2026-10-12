// Pamatsummu samazina tikai konkrēti principal ieraksti, nevis visi kredītmaksājumi.
export function sumMortgageDiary(entries) {
    let rent = 0, principal = 0, loanPayments = 0, interest = 0;
    let rentCount = 0, principalCount = 0;
    for (const entry of entries) {
        const amount = Number(entry.amount);
        if (!Number.isFinite(amount) || amount < 0) continue;
        const cents = Math.round(amount * 100);
        if (entry.entry_type === 'rent') { rent += cents; rentCount++; }
        if (entry.entry_type === 'loan') {
            loanPayments += cents;
            if (entry.payment_type === 'principal') { principal += cents; principalCount++; }
            if (entry.payment_type === 'interest') interest += cents;
        }
    }
    return { rent: rent / 100, principal: principal / 100, loanPayments: loanPayments / 100, interest: interest / 100, rentCount, principalCount, cashAfterLoan: (rent - loanPayments) / 100 };
}

