import {actualChartProgress} from './actualChartProgress';
import InitialInvestmentFields from "./InitialInvestmentFields";
import OwnerExpensesFields from "./OwnerExpensesFields";
import useAnalysisDiary from "./useAnalysisDiary";
import { numericAnalysis, diaryCostSources, validateDiarySources } from "./diaryCostSources";
import RenovationSummary from "./RenovationSummary";
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pencil, MoreVertical, Trash2, Wallet, Landmark, Percent, TrendingUp, Coins } from 'lucide-react';
import { mortgageSteps, calculateMortgage, validateMortgage } from './mortgageCalculations';
import { MonthSelect, Rows } from './AnalysisFields';
import { CashFlowChart, InvestmentSplit } from './AnalysisCharts';
import './AdvancedAnalysis.css';
import CalculationGuide from './CalculationGuide';
import MortgageActualProgress from './MortgageActualProgress';

const euro = value => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('lv-LV', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const compact = value => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('lv-LV', { maximumFractionDigits: 0 }) + ' €';
const percent = value => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('lv-LV', { maximumFractionDigits: 1 }) + '%';
const ratePercent = value => value == null || !Number.isFinite(value) ? "—" : value.toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
function defaults(property) {
    return { purchase_price: property.purchase_price ?? '', area: property.area ?? '', down_payment_percent: property.down_payment_percent ?? 20, bank_rate: '', euribor_rate: '', loan_years: '', bank_fee: '', loan_insurance_monthly: '', office_fee: '', valuation: '', monthly_rent: property.monthly_rent ?? '', tax_rate: 10, rented_months: 12, renovation_years: 0, renovation_months: 0, repair_source: "manual", utilities_source: "manual", renovation_start_date: null, renovation_end_date: null, repair_entry_ids: null, summer_cost: '', winter_cost: '', insurance: '', cadastral_value: '', renovation_cost_per_m2: property.renovation_cost_per_m2 ?? 0, future_price_per_m2: '' };
}

export default function MortgageAnalysis({ property }) {
    const sectionRef = useRef(null);
    const scrollRequested = useRef(false);
    const [draft, setDraft] = useState(() => defaults(property));
    const [saved, setSaved] = useState(null), [loading, setLoading] = useState(true), [loadFailed, setLoadFailed] = useState(false);
    const [editing, setEditing] = useState(true), [step, setStep] = useState(0), [errors, setErrors] = useState({});
    const [error, setError] = useState(''), [saving, setSaving] = useState(false), [retry, setRetry] = useState(0);
    const [showDelete, setShowDelete] = useState(false), [deleting, setDeleting] = useState(false), [deleteError, setDeleteError] = useState('');
    const [more, setMore] = useState(false), [detail, setDetail] = useState('Ieguldījums');
    const dialog = useRef(null), actions = useRef(null);
    const [diaryProgress, setDiaryProgress] = useState(null);
    useEffect(() => {
        if (!scrollRequested.current) return;
        scrollRequested.current = false;
        sectionRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }, [step, editing]);
    const diary = useAnalysisDiary(property.property_id);
    const url = `http://localhost:8000/properties/${property.property_id}/advanced-analysis`;
    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            try {
                const response = await fetch(url, { credentials: 'include', signal: controller.signal });
                if (!response.ok) throw new Error('Neizdevās ielādēt analīzi.');
                const data = await response.json();
                if (!controller.signal.aborted) { if (data) { setSaved(data); setDraft(data.inputs); setEditing(false); } setLoadFailed(false); setError(''); }
            } catch (err) { if (!controller.signal.aborted) { setError(err.message); setLoadFailed(true); } }
            finally { if (!controller.signal.aborted) setLoading(false); }
        }
        load(); return () => controller.abort();
    }, [url, retry]);
    useEffect(() => {
        if (!more) return;
        const close = event => { if (!actions.current?.contains(event.target)) setMore(false); };
        document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close);
    }, [more]);
    useEffect(() => {
        if (!showDelete) return;
        const previous = document.activeElement; dialog.current.showModal();
        return () => { if (previous?.isConnected) previous.focus(); };
    }, [showDelete]);
    if (loading) return <div className="advanced-analysis" role="status">Ielādē analīzi...</div>;
    if (loadFailed) return <div className="advanced-error" role="alert">{error}<button onClick={() => { setLoading(true); setRetry(value => value + 1); }}>Mēģināt vēlreiz</button></div>;
    const numeric = numericAnalysis(draft);
    const activeInputs = editing ? draft : saved.inputs;
    const wantsDiary = activeInputs.repair_source === 'diary' || activeInputs.utilities_source === 'diary';
    const sourceError = validateDiarySources(activeInputs);
    const sourceData = wantsDiary && !diary.loading && !diary.error && !sourceError ? diaryCostSources(activeInputs,diary.entries) : null;
    const preview = calculateMortgage(numeric, editing ? sourceData : null), r = editing ? preview : !wantsDiary || sourceData ? calculateMortgage(numericAnalysis(saved.inputs),sourceData) : saved.results, v = editing ? numeric : saved.inputs;
    const actualPoint=!diary.loading && !diary.error?actualChartProgress(v,r,diary.entries):null;
    function edit(target) { scrollRequested.current = true; setDraft(saved.inputs); setStep(target); setEditing(true); setError(''); setErrors({}); }
    function field([key, label]) {
        const props = { disabled: saving, 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `mortgage-error-${key}` : undefined };
        function change(event) {
            const value = event.target.value.replace(',', '.');
            if (!/^\d*(?:\.\d{0,2})?$/.test(value)) return;
            setDraft(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined }));
        }
        return <label key={key}>{label}{key === 'rented_months' ? <MonthSelect {...props} value={draft[key]} onChange={change} /> : <input {...props} type="text" inputMode={key === 'loan_years' ? 'numeric' : 'decimal'} value={String(draft[key] ?? '').replace('.', ',')} onChange={change} />}{errors[key] && <span className="advanced-field-error" id={`mortgage-error-${key}`}>{errors[key]}</span>}</label>;
    }
    const expenseRows = [['Īpašuma apdrošināšana', euro(v.insurance)], ['NĪN (no kadastrālās vērtības)', euro(r.nin)], ['Īpašnieks sedz tukšajos mēnešos', euro(r.vacancy_cost)], ['Kredītmaksājuma apdrošināšana gadā', euro(r.loan_insurance_annual)]];
    const acquisitionRows = [['Notārs (0,4%, vismaz 140 €)', euro(r.notary)], ['Notāra PVN (21%)', euro(r.notary_vat)], ['Kancelejas nodeva', euro(v.office_fee)], ['Īpašuma vērtējums', euro(v.valuation)], ['Hipotēkas nostiprināšana (0,1%)', euro(r.mortgage_fee)], ['Valsts nodeva (1,5%)', euro(r.state_fee)], ['Bankas komisija', euro(v.bank_fee)]];
    function stepPreview() {
        if (Object.keys(validateMortgage(draft, step)).length || validateDiarySources(draft,step<2?"repair":"all") || ((step<2?draft.repair_source==='diary':wantsDiary) && (diary.loading || diary.error))) return null;
        if (step === 0) return <Rows rows={[["Kopējais ieguldījums",euro(r.investment)],["Tavs kapitāls",euro(r.own_capital)]]}/>;

        if (step === 1) return <><Rows rows={[["Neto īre mēnesī", euro(r.net_rent_monthly)], ['Izīrēti mēneši', v.rented_months], ['Aizpildījums', percent(r.occupancy)], ['Tukšie mēneši', r.vacancy], ['Gada bruto īre', euro(r.gross_annual)], ['Īres nodoklis gadā', euro(r.tax_annual)], ['Gada īre pēc nodokļa', euro(r.net_rent_annual)]]} /><div className="advanced-occupancy"><div style={{ width: `${r.occupancy}%` }} /></div></>;
        if (step === 2) return <div className="owner-expense-summaries">
            {draft.utilities_source==='diary' && <section><h4>Faktiskie komunālie maksājumi</h4><Rows rows={[["Atlasītie dienasgrāmatas maksājumi",euro(sourceData.utilitiesTotal)]]}/><p className="advanced-note">Ieskaitīti analīzē atbilstoši ierakstu mēnešiem.</p></section>}
            <section><h4>{draft.renovation_required===false?'Plānotie īpašnieka izdevumi — 12 mēneši':'Plānotie īpašnieka izdevumi pēc renovācijas — 12 mēneši'}</h4><Rows rows={[...expenseRows,['Kopā',euro(r.expenses)]]}/><details><summary>NĪN aprēķina pieņēmumi</summary><p className="advanced-note">0,2% līdz 56 915 €, 0,4% nākamajai daļai līdz 106 715 €, 0,6% pārsniegumam; vismaz 7 € gadā.</p></details></section>
        </div>;
        return <><Rows rows={[["Remonta summa", euro(r.renovation)], ['Kopējais ieguldījums', euro(r.investment)], ['Paša ieguldītais kapitāls', euro(r.own_capital)], ['Potenciālā tirgus vērtība', euro(r.market_value)], ['Potenciālais vērtības pieaugums', euro(r.capital_gain)]]} totalLabel="Paša ieguldītais kapitāls" /><p className="advanced-note">Prognozētā vērtība nav obligāta. Ja nezini, atstāj tukšu.</p></>;
    }
    async function next(event) {
        event.preventDefault();
        const sourceMessage = validateDiarySources(draft,step<2?"repair":"all");
        const neededDiary = step<2?draft.repair_source==='diary':wantsDiary;
        if (sourceMessage || (neededDiary && (diary.loading || diary.error))) { setError(sourceMessage || 'Sagaidi dienasgrāmatas ielādi vai mēģini vēlreiz.'); return; }
        const invalid = validateMortgage(draft, step); setErrors(invalid);
        if (Object.keys(invalid).length) return;
        if (step < mortgageSteps.length - 1) { setError(''); scrollRequested.current = true; setStep(step + 1); return; }
        const all = validateMortgage(draft);
        if (Object.keys(all).length) { setErrors(all); setStep(mortgageSteps.findIndex(item => item.fields.some(([key]) => all[key]))); return; }
        setSaving(true); setError('');
        try {
            const response = await fetch(url, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(numeric) });
            if (!response.ok) throw new Error('Neizdevās saglabāt analīzi. Pārbaudi ievadi.');
            const data = await response.json(); scrollRequested.current = true; setSaved(data); setDraft(data.inputs); setEditing(false);
        } catch (err) { setError(err.message); } finally { setSaving(false); }
    }
    async function remove() {
        setDeleting(true); setDeleteError('');
        try {
            const response = await fetch(url, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) throw new Error('Neizdevās dzēst analīzi.');
            setSaved(null); setDraft(defaults(property)); setEditing(true); setStep(0); setErrors({}); setError(''); setShowDelete(false);
        } catch (err) { setDeleteError(err.message); } finally { setDeleting(false); }
    }
    const details = {
        Ieguldījums: [['Pirkuma cena', euro(v.purchase_price)], ['Remonts', euro(r.renovation)], ...acquisitionRows, ['Kopējais ieguldījums', euro(r.investment)]],
        Hipotēka: [['Pirmā iemaksa', euro(r.down_payment)], ['Aizdevums', euro(r.loan_amount)], ['Bankas pamata likme', ratePercent(v.bank_rate)], ['Euribor', ratePercent(v.euribor_rate)], ['Kopējā likme', ratePercent(r.total_rate)], ['Termiņš', `${v.loan_years} gadi`], ['Maksājums mēnesī', euro(r.loan_payment)], ['Maksājumi gadā', euro(r.debt_annual)]],
        Ienesīgums: [['Bruto ienesīgums', percent(r.gross_yield)], ['Neto ienesīgums pirms hipotēkas', percent(r.net_yield)], ['Tava kapitāla atdeve (cash-on-cash)', percent(r.cash_on_cash)], [r.net_annual < 0 ? 'Tev jāsedz gadā' : 'Peļņa gadā pēc hipotēkas', euro(Math.abs(r.net_annual))], [r.net_monthly < 0 ? 'Tev jāsedz mēnesī' : 'Peļņa mēnesī pēc hipotēkas', euro(Math.abs(r.net_monthly))]],
    };
    return <section ref={sectionRef} className="advanced-analysis mortgage-analysis">
        <header className="advanced-heading"><div><h2>{editing ? 'Izveido savu hipotēkas analīzi' : 'Padziļinātā analīze ar hipotēku'}</h2><p>Īpašuma ieguldījums, kredītmaksājumi un atdeve.</p></div>{saved && <div className="advanced-heading-actions">{!editing && <button className="advanced-secondary" onClick={() => edit(0)}><Pencil size={16} />Mainīt pieņēmumus</button>}<div ref={actions} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMore(false); }}><button className={more ? 'advanced-secondary advanced-delete-button' : 'advanced-more-trigger'} aria-label={more ? 'Dzēst analīzi' : 'Analīzes papildu darbības'} disabled={saving} onClick={() => { if (!more) setMore(true); else { setMore(false); setDeleteError(''); setShowDelete(true); } }} onKeyDown={event => { if (event.key === 'Escape') setMore(false); }}>{more ? <><Trash2 size={16} />Dzēst analīzi</> : <MoreVertical size={20} />}</button></div></div>}</header>
        {wantsDiary && !editing && (diary.loading || diary.error) && <p className="advanced-note">{diary.loading ? "Ielādē aktuālās dienasgrāmatas izmaksas..." : "Dienasgrāmatas izmaksas neizdevās atsvaidzināt."}</p>}{error && <p className="advanced-error" role="alert">{error}</p>}
        {editing ? <><nav className="advanced-steps mortgage-steps" aria-label="Ievades soļi">{mortgageSteps.map((item, index) => <button type="button" key={item.title} aria-current={step === index ? 'step' : undefined} disabled={saving || index > step} onClick={() => { setStep(index); setErrors({}); }}>{index+1}. {item.title}</button>)}</nav><form onSubmit={next} noValidate>
            <h3>{step===0?'Sākotnējais ieguldījums':mortgageSteps[step].title}</h3>
            {step===0 && <><p className="advanced-source-note">Pamatinformācija pārņemta no īpašuma. Šīs analīzes pieņēmumus vari mainīt atsevišķi.</p><InitialInvestmentFields draft={draft} setDraft={setDraft} diary={diary} disabled={saving} errors={errors} field={field} preview={r} mortgage fieldsOverride={mortgageSteps[0].fields}/></>}
            {step===2 && <OwnerExpensesFields draft={draft} setDraft={setDraft} diary={diary} disabled={saving} field={field} mortgage/>}
            {(step===1 || step===3) && <div className="advanced-fields">{mortgageSteps[step].fields.map(field)}</div>}
            {step===1 && Number(draft.rented_months)===0 && <p className="advanced-scenario-note">0 izīrēti mēneši nozīmē, ka īres nav arī pēc renovācijas.</p>}
            <div className="advanced-preview">{stepPreview()}</div>
            <div className="advanced-actions"><div><button type="button" className="advanced-secondary" disabled={step===0 || saving} onClick={()=>{setStep(step-1);setErrors({});setError('');}}><ArrowLeft size={16}/>Atpakaļ</button>{saved && <button type="button" className="advanced-secondary" disabled={saving} onClick={()=>{setEditing(false);setError('');}}>Atcelt</button>}</div><button className="advanced-primary" disabled={saving}>{saving?'Saglabā...':step===3?'Saglabāt un skatīt analīzi':'Turpināt'}<ArrowRight size={16}/></button></div>
        </form></> : <>
            <div className="advanced-kpis">{[['Kopējais ieguldījums', compact(r.investment), 'Pirkums + remonts + iegādes izdevumi', Coins], ['Tavs kapitāls', compact(r.own_capital), 'Pirmā iemaksa + izdevumi + remonts', Wallet], ['Kredītmaksājums', compact(r.loan_payment_after_renovation ?? r.loan_payment), 'Pēc renovācijas, ja kredīts vēl aktīvs', Landmark], ['Neto ienesīgums', percent(r.net_yield), 'Pirms hipotēkas, no visa ieguldījuma', Percent], ['Tava kapitāla atdeve', percent(r.cash_on_cash), 'Gada atdeve no tava kapitāla', TrendingUp], [r.net_monthly < 0 ? 'Tev jāsedz mēnesī' : 'Peļņa mēnesī', compact(Math.abs(r.net_monthly)), r.net_monthly < 0 ? 'Vidēji no saviem līdzekļiem' : 'Pēc hipotēkas, nodokļa un izdevumiem', TrendingUp]].map(([label, value, caption, Icon]) => <div className="advanced-kpi" key={label}><div className="advanced-kpi-main"><span className="advanced-icon"><Icon size={24} /></span><div><span>{label}</span><strong>{value}</strong></div></div><small>{caption}</small></div>)}</div>
            <RenovationSummary inputs={v} results={r} /><CalculationGuide inputs={v} results={r} mortgage /><div className="advanced-charts"><section className="advanced-panel"><h3>Īres ienākumi un tava ieguldītā kapitāla atgūšana (10 gadi)</h3><CashFlowChart results={r} annualBars actualProgress={actualPoint} receivedRent={diaryProgress?.cashAfterLoan ?? null} progressLabel="Īres atlikums" hasActualProgress={diaryProgress===null || diary.loading || diary.error ? null : diary.entries.some(entry=>["rent","loan"].includes(entry.entry_type) && Number.isFinite(Number(entry.amount)) && Number(entry.amount)>=0)} rentedMonths={v.rented_months} /></section><section className="advanced-panel"><h3>Ieguldījuma sadalījums</h3><InvestmentSplit inputs={v} results={r} /></section></div>
            <div className="advanced-details"><section className="advanced-panel"><h3>Detalizētie aprēķini</h3><div className="advanced-detail-tabs" role="tablist" aria-label="Aprēķini">{Object.keys(details).map(label => <button key={label} role="tab" id={`mortgage-tab-${label}`} aria-controls="mortgage-detail" aria-selected={detail === label} onClick={() => setDetail(label)}>{label}</button>)}</div><div id="mortgage-detail" role="tabpanel" aria-labelledby={`mortgage-tab-${detail}`}><Rows rows={details[detail]} /></div><div className="advanced-card-total"><Rows rows={[["Paša ieguldītais kapitāls", euro(r.own_capital)]]} totalLabel="Paša ieguldītais kapitāls" /></div></section>
                <section className="advanced-panel"><div className="advanced-panel-heading"><h3>Īres scenārijs</h3><button aria-label="Rediģēt īres scenāriju" onClick={() => edit(1)}><Pencil size={16} /></button></div><Rows rows={[["Bruto īre mēnesī", euro(v.monthly_rent)], ['Izīrēti mēneši gadā', v.rented_months], ['Gada bruto īre', euro(r.gross_annual)], [`Īres nodoklis (${v.tax_rate}%)`, euro(r.tax_annual)], ['Aizpildījums', percent(r.occupancy)], ['Tukšie mēneši', r.vacancy]]} /><div className="advanced-occupancy"><div style={{ width: `${r.occupancy}%` }} /></div><div className="advanced-card-total"><Rows rows={[["Gada īre pēc nodokļa", euro(r.net_rent_annual)]]} /></div></section>
                <section className="advanced-panel"><div className="advanced-panel-heading"><h3>Ikgadējie izdevumi</h3><button aria-label="Rediģēt īpašnieka izdevumus" onClick={() => edit(2)}><Pencil size={16} /></button></div><Rows rows={expenseRows} /><div className="advanced-card-total"><Rows rows={[["Kopējie gada izdevumi", euro(r.expenses)]]} /></div></section>
                <section className="advanced-panel"><h3>Galvenie rādītāji</h3><Rows rows={[["Bruto ienesīgums", percent(r.gross_yield)], ['Neto ienesīgums', percent(r.net_yield)], ['Tava kapitāla atdeve', percent(r.cash_on_cash)], [r.net_monthly < 0 ? 'Tev jāsedz mēnesī' : 'Peļņa mēnesī pēc hipotēkas', compact(Math.abs(r.net_monthly))], [r.net_annual < 0 ? 'Tev jāsedz gadā' : 'Peļņa gadā pēc hipotēkas', compact(Math.abs(r.net_annual))], ['Ieguldītā kapitāla atmaksa', r.payback == null ? 'Neatmaksājas' : `${r.payback.toLocaleString('lv-LV', { maximumFractionDigits: 1 })} gadi`]]} /></section>
            </div>
            <details className="advanced-future-details"><summary>Vērtība pēc remonta — papildu scenārijs</summary><section className="advanced-panel"><div className="advanced-panel-heading"><h3>Vērtība pēc remonta</h3><button aria-label="Rediģēt remontu un vērtību" onClick={() => edit(3)}><Pencil size={16} /></button></div><Rows totalLabel="Potenciālais vērtības pieaugums" rows={[["Prognozētā cena uz m²", euro(v.future_price_per_m2)], ['Potenciālā tirgus vērtība', euro(r.market_value)], ['Kopējais ieguldījums', euro(r.investment)], ['Potenciālais vērtības pieaugums', euro(r.capital_gain)]]} /><p className="advanced-note">Pirms pārdošanas izdevumiem un nodokļiem. Šis nav aprēķins naudai pēc pārdošanas un kredīta dzēšanas.</p></section></details><p className="advanced-note">Prognoze ar nemainīgu īri, izdevumiem un procentu likmi. Dienasgrāmatas faktiskie maksājumi prognozi neaizstāj.</p><MortgageActualProgress propertyId={property.property_id} loanAmount={r.loan_amount} ownCapital={r.own_capital} onData={setDiaryProgress} />
        </>}
        {showDelete && <dialog ref={dialog} className="advanced-delete-dialog" aria-labelledby="mortgage-delete-title" onCancel={event => { event.preventDefault(); if (!deleting) setShowDelete(false); }}><div className="property-delete-icon"><Trash2 size={24} /></div><h2 id="mortgage-delete-title">Dzēst padziļināto analīzi?</h2><p>Tiks dzēsti saglabātie pieņēmumi. Īpašuma un dienasgrāmatas dati saglabāsies.</p>{deleteError && <p role="alert">{deleteError}</p>}<div className="property-delete-actions"><button className="property-delete-cancel" autoFocus disabled={deleting} onClick={() => setShowDelete(false)}>Atcelt</button><button className="property-delete-confirm" disabled={deleting} onClick={remove}>{deleting ? 'Dzēš...' : 'Dzēst analīzi'}</button></div></dialog>}
    </section>;
}
