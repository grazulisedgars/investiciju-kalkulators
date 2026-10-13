const money=n=>n.toLocaleString('lv-LV',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const displayDate=value=>value.split('-').reverse().join('.');

export default function RenovationSummary({inputs,results}) {
    const forecastMonths=results.renovation_total_months ?? 0;
    if(!forecastMonths)return null;
    const months=Number(inputs.renovation_years || 0)*12+Number(inputs.renovation_months || 0) || forecastMonths;
    const years=Math.floor(months/12),remainder=months%12;
    const end=inputs.renovation_end_date;
    const rentStart=end?new Date(Number(end.slice(0,4)),Number(end.slice(5,7)),1):null;
    const rentMonth=rentStart?`${rentStart.getFullYear()}. gada ${rentStart.toLocaleDateString('lv-LV',{month:'long'})}`:null;
    return <section className="renovation-summary">
        <h3>Renovācijas un izīrēšanas prognoze</h3>
        {inputs.renovation_start_date && <p className="advanced-note renovation-summary-period">Renovācijas periods: {displayDate(inputs.renovation_start_date)}–{displayDate(end)}.</p>}
        <div className="renovation-summary-grid">
            <div><span>Renovācijas ilgums</span><strong>{years} {years===1?'gads':'gadi'} un {remainder} {remainder===1?'mēnesis':'mēneši'}</strong></div>
            <div><span>Plānotais īres sākums</span><strong>{rentMonth || `${forecastMonths+1}. mēnesī`}</strong>{rentMonth && <small>{forecastMonths+1}. prognozes mēnesī</small>}</div>
            <div><span>Īpašnieka izmaksas renovācijas laikā</span><strong>{money(results.renovation_owner_costs ?? 0)}</strong></div>
            <div><span>Plānotā bruto īre mēnesī pēc renovācijas</span><strong>{money(inputs.monthly_rent)}</strong></div>
        </div>
        <details className="renovation-summary-help"><summary>Kā lasīt šo prognozi?</summary>
            <p className="advanced-note">Renovācijas laikā īres ienākumi netiek gūti, bet remonta un īpašuma uzturēšanas izmaksas turpina uzkrāties.</p>
            <p className="advanced-note">Renovācijas perioda izmaksās iekļauts remonts, komunālie maksājumi, apdrošināšana un NĪN. Īpašuma iegādes izmaksas nav iekļautas. Pēc renovācijas veiktos atlasītos maksājumus uzskaita atsevišķi to reģistrēšanas mēnešos.</p>
            <p className="advanced-note">Gada finanšu rādītāji attiecas uz pirmajiem 12 mēnešiem pēc renovācijas. Bruto īres ienākumi tiek aprēķināti pirms nodokļiem un izdevumiem, pieņemot 12 izīrētus mēnešus gadā un vienmērīgu ienākumu sadalījumu.</p>
        </details>
        {(inputs.repair_source==='diary' || inputs.utilities_source==='diary') && <div className="renovation-diary-lines">
            {inputs.repair_source==='diary' && <p className="advanced-note">Remonts no dienasgrāmatas: <strong>{money(results.renovation)}</strong> · {results.diary_repair_count} ieraksti · {money(results.effective_repair_per_m2)}/m²</p>}
            {inputs.utilities_source==='diary' && <p className="advanced-note">Komunālie no dienasgrāmatas: <strong>{money(results.diary_utilities_total)}</strong> · {results.diary_utilities_count} ieraksti</p>}
        </div>}
    </section>;
}
