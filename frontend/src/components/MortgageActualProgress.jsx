import { useEffect, useState } from 'react';
import { sumMortgageDiary } from './mortgageDiaryProgress';

const money = amount => amount.toLocaleString('lv-LV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export default function MortgageActualProgress({ propertyId, loanAmount, ownCapital, onData }) {
    const [data, setData] = useState(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        let revision = 0;
        async function load() {
            const current = ++revision;
            try {
                const response = await fetch(`http://localhost:8000/properties/${propertyId}/diary`, { credentials: 'include', cache: 'no-store', signal: controller.signal });
                if (!response.ok) throw new Error('diary');
                const entries = await response.json();
                if (!controller.signal.aborted && current === revision) { const totals = sumMortgageDiary(entries); setData(totals); onData(totals); setFailed(false); }
            } catch { if (!controller.signal.aborted && current === revision) { setFailed(true); setData(null); onData(null); } }
        }
        load(); window.addEventListener('focus', load);
        return () => { controller.abort(); window.removeEventListener('focus', load); };
    }, [propertyId, retry, onData]);
    if (failed) return <section className="advanced-panel advanced-recovery"><h3>Faktiskais progress</h3><p role="alert">Neizdevās ielādēt dienasgrāmatas datus.</p><button className="advanced-secondary" onClick={() => setRetry(value => value + 1)}>Mēģināt vēlreiz</button></section>;
    if (!data) return <section className="advanced-panel advanced-recovery" role="status">Ielādē faktisko progresu...</section>;
    const percentage = loanAmount > 0 ? Math.min(100, data.principal / loanAmount * 100) : 0;
    const remaining = Math.max(0, loanAmount - data.principal);
    return <section className="mortgage-actual-progress" aria-live="polite"><h3>Faktiskais progress pēc dienasgrāmatas</h3><div className="mortgage-actual-grid">
        <section className="advanced-panel"><h3>Saņemtā īre</h3><div className="advanced-recovery-heading"><strong>{money(data.rent)}</strong><span>{data.rentCount} ieraksti</span></div><dl className="advanced-rows"><div><dt>Reģistrētie kredītmaksājumi kopā</dt><dd>{money(data.loanPayments)}</dd></div><div><dt>No tiem samaksātie procenti</dt><dd>{money(data.interest)}</dd></div><div><dt>Īres atlikums pēc kredītmaksājumiem</dt><dd>{money(data.cashAfterLoan)}</dd></div></dl><p className="advanced-note">Atlikums pirms īres nodokļa un pārējiem īpašnieka izdevumiem. Tas nav paša kapitāla atgūšanas aprēķins.</p></section>
        <section className="advanced-panel"><h3>Kredīta pamatsummas atmaksa</h3><div className="advanced-recovery-heading"><span>Atmaksātā pamatsumma <strong>{money(data.principal)}</strong></span><strong>{percentage.toLocaleString('lv-LV', { maximumFractionDigits: 1 })}%</strong></div><div className="advanced-occupancy" role="progressbar" aria-label="Reģistrētās kredīta pamatsummas atmaksa" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentage}><div style={{ width: `${percentage}%` }} /></div><dl className="advanced-rows"><div><dt>Sākotnējais aizdevums no analīzes</dt><dd>{money(loanAmount)}</dd></div><div><dt>Atlikums pēc reģistrētajām atmaksām</dt><dd>{money(remaining)}</dd></div></dl>{data.principal >= loanAmount && <p className="advanced-note">Pamatsumma atgūta pēc reģistrētajiem maksājumiem.{data.principal > loanAmount && ` Reģistrētā summa pārsniedz aizdevumu par ${money(data.principal - loanAmount)} — pārbaudi ierakstus.`}</p>}<p className="advanced-note">Procenti, apdrošināšana un “Cits” pamatsummu nesamazina. Ja sākts kredīta vidū, iepriekšējās atmaksas jāiekļauj, lai atlikums sakristu ar bankas datiem.</p></section>
    </div><section className="advanced-panel advanced-recovery"><h3>Ieguldījuma segšana no īres</h3><div className="advanced-recovery-heading"><span>Īres atlikums pēc kredītmaksājumiem <strong>{money(data.cashAfterLoan)}</strong></span><strong>{Math.max(0, Math.min(100, data.cashAfterLoan / ownCapital * 100)).toLocaleString('lv-LV', { maximumFractionDigits: 1 })}%</strong></div><div className="advanced-occupancy" role="progressbar" aria-label="Ieguldījuma segšana no īres pirms nodokļa un pārējiem izdevumiem" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, data.cashAfterLoan / ownCapital * 100))}><div style={{ width: `${Math.max(0, Math.min(100, data.cashAfterLoan / ownCapital * 100))}%` }} /></div><div className="advanced-recovery-heading"><span>Paša ieguldītais kapitāls: {money(ownCapital)}</span><span>{data.cashAfterLoan >= ownCapital ? `Virs paša kapitāla: ${money(data.cashAfterLoan - ownCapital)}` : `Vēl jāsedz: ${money(ownCapital - data.cashAfterLoan)}`}</span></div><p className="advanced-note">Saņemtā īre mīnus visi reģistrētie kredītmaksājumi. Pirms īres nodokļa un pārējiem īpašnieka izdevumiem.</p></section></section>;
}
