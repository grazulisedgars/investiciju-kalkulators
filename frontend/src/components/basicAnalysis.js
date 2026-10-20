export function validateBasic(v) {
    const errors = {};
    for (const [key, label] of [['purchasePrice', 'Iegādes cenai'], ['area', 'Platībai']]) {
        if (v[key] === '' || !Number.isFinite(Number(v[key])) || Number(v[key]) <= 0) errors[key] = `${label} jābūt lielākai par 0.`;
    }
    for (const key of ['renovationCostPerM2', 'monthlyRent', 'occupancy']) {
        if (v[key] !== '' && (!Number.isFinite(Number(v[key])) || Number(v[key]) < 0 || (key === 'occupancy' && Number(v[key]) > 100))) errors[key] = key === 'occupancy' ? 'Aizpildījumam jābūt no 0 līdz 100%.' : 'Summa nedrīkst būt negatīva.';
    }
    if (v.financing === 'mortgage' && (v.downPaymentPercent === '' || !Number.isFinite(Number(v.downPaymentPercent)) || Number(v.downPaymentPercent) < 0 || Number(v.downPaymentPercent) >= 100)) errors.downPaymentPercent = 'Norādi pirmo iemaksu no 0 līdz 99,99%.';
    return errors;
}

export function calculateBasic(v) {
    if (Object.keys(validateBasic(v)).length) return null;
    const total_investment = Number(v.purchasePrice) + Number(v.area) * Number(v.renovationCostPerM2 || 0);
    const hasRent = v.monthlyRent !== '' && v.occupancy !== '';
    const annual_gross_rent = hasRent ? Number(v.monthlyRent) * 12 * Number(v.occupancy) / 100 : null;
    return {total_investment, annual_gross_rent, gross_yield: hasRent ? annual_gross_rent / total_investment * 100 : null};
}

const KEY = 'propfolio-calculator-draft-v1';
const fields = ['financing','purchasePrice','area','renovationCostPerM2','monthlyRent','occupancy','downPaymentPercent','ownerId','pending','requestId','fingerprint'];
export function readCalculatorDraft() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY));
        if (!data || !Number.isFinite(data.expires) || data.expires < Date.now() || !['cash','mortgage'].includes(data.financing)) return null;
        return Object.fromEntries(fields.filter(key => key in data).map(key => [key, data[key]]));
    } catch { return null; }
}
export function writeCalculatorDraft(data) {
    try { localStorage.setItem(KEY, JSON.stringify({...Object.fromEntries(fields.filter(key => key in data).map(key => [key,data[key]])), expires:Date.now()+48*60*60*1000})); return true; }
    catch { return false; }
}
export function clearCalculatorDraft() {
    try { localStorage.removeItem(KEY); } catch { /* Storage can be disabled by the browser. */ }
}
