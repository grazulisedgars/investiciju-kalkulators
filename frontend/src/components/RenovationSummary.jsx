const money = n => n.toLocaleString('lv-LV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export default function RenovationSummary({ inputs, results }) {
    const months = results.renovation_total_months ?? 0;
    if (!months) return null;
    return <section className="renovation-summary"><h3>Renovācijas un īres plāns</h3><div className="renovation-summary-grid"><div><span>Renovācijas periods</span><strong>{Math.floor(months/12)} gadi un {months%12} mēneši</strong></div><div><span>Īres sākums prognozē</span><strong>{months+1}. mēnesī</strong></div><div><span>Pirmā gada īres ienākumi</span><strong>{money(results.first_year_gross)}</strong></div><div><span>{results.first_year_cash < 0 ? 'Pirmajā gadā tev jāsedz' : 'Pirmā gada atlikums'}</span><strong>{money(Math.abs(results.first_year_cash))}</strong></div></div><p className="advanced-note">Gada KPI rāda pirmos 12 mēnešus pēc renovācijas{results.loan_amount !== undefined ? ' un tajā atlikušos kredītmaksājumus' : ''}. Grafikā renovācijas periods jau ir iekļauts. Pēc renovācijas plānoti {inputs.rented_months} izīrēti mēneši gadā; tos prognozē vidēji sadala pa mēnešiem.</p></section>;
}
