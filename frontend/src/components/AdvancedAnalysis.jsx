import {readAnalysisDraft,saveAnalysisDraft,clearAnalysisDraft} from "./analysisDraft";
import MobileAnalysisPanel from "./MobileAnalysisPanel";
import {actualChartProgress} from './actualChartProgress';
import OwnerExpensesFields from "./OwnerExpensesFields";
import useAnalysisDiary from "./useAnalysisDiary";
import { numericAnalysis, diaryCostSources, validateDiarySources } from "./diaryCostSources";
import InitialInvestmentFields from "./InitialInvestmentFields";
import RenovationSummary from "./RenovationSummary";
import { useEffect, useRef, useState } from "react";
import { Check, ArrowLeft, ArrowRight, Pencil, Coins, ChartNoAxesCombined, Percent, Clock, TrendingUp, Trash2, MoreVertical } from "lucide-react";
import { calculateAdvanced, analysisSteps, validateAnalysis } from "./advancedCalculations";
import { CashFlowChart, InvestmentSplit } from "./AnalysisCharts";
import "./AdvancedAnalysis.css";
import CalculationGuide from "./CalculationGuide";
import { MonthSelect, Rows } from "./AnalysisFields";
import MortgageAnalysis from "./MortgageAnalysis";

const euro = value => value === null ? "—" : value.toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const percent = value => value === null ? "—" : value.toLocaleString("lv-LV", { maximumFractionDigits: 2 }) + "%";
const years = value => value === null ? "Neatmaksājas" : value.toLocaleString("lv-LV", { maximumFractionDigits: 2 }) + " gadi";
// KPI ir noapaļots pārskats; detalizētās summas saglabā centu precizitāti.
const kpiEuro = value => value === null ? "—" : value.toLocaleString("lv-LV", { maximumFractionDigits: 0 }) + " €";
const kpiPercent = value => value === null ? "—" : value.toLocaleString("lv-LV", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const kpiYears = value => value === null ? "Neatmaksājas" : value.toLocaleString("lv-LV", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " gadi";
const stepHeadings = ["Sākotnējais ieguldījums", "Plānotie īres ieņēmumi", "Īpašnieka izdevumi", "Potenciālā vērtība pēc remonta"];

function initialInputs(property) {
    return { purchase_price: property.purchase_price ?? "", area: property.area ?? "", renovation_cost_per_m2: property.renovation_cost_per_m2 ?? 0, office_fee: "", valuation: "", monthly_rent: property.monthly_rent ?? "", rented_months: 12, renovation_years: 0, renovation_months: 0, repair_source: "manual", utilities_source: "manual", renovation_start_date: null, renovation_end_date: null, repair_entry_ids: null, tax_rate: 10, summer_cost: "", winter_cost: "", insurance: "", cadastral_value: "", future_price_per_m2: property.market_value && property.area ? Math.round(property.market_value/property.area*100)/100 : "" };
}

export default function AdvancedAnalysis({ property, onAnalysisChanged, onEditingChange }) {
    return property.financing_type === "mortgage" ? <MortgageAnalysis property={property} onAnalysisChanged={onAnalysisChanged} onEditingChange={onEditingChange} /> : <CashAnalysis property={property} onAnalysisChanged={onAnalysisChanged} onEditingChange={onEditingChange} />;
}

function CashAnalysis({ property, onAnalysisChanged, onEditingChange }) {
    const sectionRef = useRef(null);
    const scrollRequested = useRef(false);
    const [draft, setDraft] = useState(() => initialInputs(property));
    const [saved, setSaved] = useState(null);
    const [editing, setEditing] = useState(true);
    useEffect(() => { onEditingChange?.(editing); }, [editing, onEditingChange]);
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loadFailed, setLoadFailed] = useState(false);
    const [errors, setErrors] = useState({});
    const [retry, setRetry] = useState(0);
    const [detail, setDetail] = useState("Ieguldījums");
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const deleteDialog = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const menuButton = useRef(null);
    useEffect(() => {
        if (!menuOpen) return;
        function outside(event) { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); }
        document.addEventListener("pointerdown", outside);
        return () => document.removeEventListener("pointerdown", outside);
    }, [menuOpen]);
    useEffect(() => {
        if (!showDelete) return;
        const previous = document.activeElement;
        deleteDialog.current.showModal();
        return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
    }, [showDelete]);
    const [rentProgress, setRentProgress] = useState({ total: null, loading: true, error: false });
    const [rentRetry, setRentRetry] = useState(0);
    // Sadaļu pārslēgšana ielādē aktuālos ierakstus; fokuss atsvaidzina citu logu izmaiņas.
    useEffect(() => {
        if (property.financing_type !== "cash") return;
        const controller = new AbortController();
        let revision = 0;
        async function refreshRent() {
            const current = ++revision;
            try {
                const response = await fetch(`http://localhost:8000/properties/${property.property_id}/diary`, { credentials: "include", signal: controller.signal, cache: "no-store" });
                if (!response.ok) throw new Error("rent");
                const entries = await response.json();
                const cents = entries.filter(entry => entry.entry_type === "rent").reduce((sum, entry) => sum + Math.round(Number(entry.amount || 0) * 100), 0);
                if (!controller.signal.aborted && current === revision) setRentProgress({ total: cents / 100, count:entries.filter(entry=>entry.entry_type==="rent").length, loading: false, error: false });
            } catch { if (!controller.signal.aborted && current === revision) setRentProgress({ total: null, loading: false, error: true }); }
        }
        refreshRent();
        window.addEventListener("focus", refreshRent);
        return () => { controller.abort(); window.removeEventListener("focus", refreshRent); };
    }, [property.property_id, property.financing_type, rentRetry]);
    const [draftNotice,setDraftNotice]=useState("");
    useEffect(()=>{
        if(loading)return;
        if(editing)saveAnalysisDraft(property.property_id,"cash",draft,step,saved?.updated_at);
        else clearAnalysisDraft(property.property_id,"cash");
    },[loading,editing,draft,step,saved?.updated_at,property.property_id]);
    useEffect(() => {
        if (!scrollRequested.current) return;
        scrollRequested.current = false;
        sectionRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }, [step, editing]);
    const diary = useAnalysisDiary(property.property_id);
    const url = `http://localhost:8000/properties/${property.property_id}/advanced-analysis`;
    useEffect(() => {
        if (property.financing_type !== "cash") return;
        const controller = new AbortController();
        async function load() {
            try {
                const response = await fetch(url, { credentials: "include", signal: controller.signal });
                if (!response.ok) throw new Error("Neizdevās ielādēt analīzi. Pārbaudi, vai backend darbojas.");
                const data = await response.json();
                if (!controller.signal.aborted) {
                    if(data){setSaved(data);onAnalysisChanged?.(data);}
                    const pending=readAnalysisDraft(property.property_id,"cash");
                    if(pending && pending.base===(data?.updated_at??null)){setDraft(pending.draft);setStep(Math.max(0,Math.min(3,Number(pending.step)||0)));setEditing(true);setDraftNotice("Nesaglabātā ievade ir atjaunota. Pārbaudi datus pirms saglabāšanas.");}
                    else if(data){setDraft(data.inputs);setEditing(false);}
                }
                if (!controller.signal.aborted) { setError(""); setLoadFailed(false); }
            } catch (err) { if (!controller.signal.aborted) { setError(err.message); setLoadFailed(true); } }
            finally { if (!controller.signal.aborted) setLoading(false); }
        }
        load();
        return () => controller.abort();
    }, [url, property.property_id, property.financing_type, retry, onAnalysisChanged]);

    if (property.financing_type !== "cash") return <section className="advanced-analysis"><h2>Padziļinātā analīze</h2><p>Hipotēkas kalkulatoru pievienosim nākamajā posmā.</p></section>;
    if (loading) return <div className="advanced-analysis" role="status">Ielādē analīzi...</div>;
    if (loadFailed) return <div className="advanced-error" role="alert">{error}<button type="button" onClick={() => { setLoading(true); setRetry(retry+1); }}>Mēģināt vēlreiz</button></div>;
    // Tukša ievade nav nulle: kopsummu rāda tikai tad, kad tās ievades ir derīgas.
    const numeric = numericAnalysis(draft);
    const wantsDiary = (editing ? draft : saved.inputs).repair_source === 'diary' || (editing ? draft : saved.inputs).utilities_source === 'diary';
    const sourceError = validateDiarySources(editing ? draft : saved.inputs);
    const sourceData = wantsDiary && !diary.loading && !diary.error && !sourceError ? diaryCostSources(editing ? draft : saved.inputs, diary.entries) : null;
    const preview = calculateAdvanced(numeric, editing ? sourceData : null);
    const results = editing ? preview : !wantsDiary || sourceData ? calculateAdvanced(numericAnalysis(saved.inputs), sourceData) : saved.results;
    const inputs = editing ? numeric : saved.inputs;
    const actualPoint=!diary.loading && !diary.error?actualChartProgress(inputs,results,diary.entries):null;
    function field([key, label]) {
        const attributes = { disabled: saving, 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? 'analysis-error-'+key : undefined };
        function change(event) {
            // Komatu normalizē aprēķinam; summām pieņem līdz divām decimālzīmēm.
            const value = event.target.value.replace(",", ".");
            if (!/^\d*(?:\.\d{0,2})?$/.test(value)) return;
            setDraft({ ...draft, [key]: value }); setErrors({ ...errors, [key]: undefined });
        }
        return <label key={key}>{label}{key === 'rented_months' ? <MonthSelect {...attributes} value={draft[key]} onChange={change} /> : <input {...attributes} type="text" inputMode="decimal" onKeyDown={event => { if (["-", "+", "e", "E", "ArrowUp", "ArrowDown"].includes(event.key)) event.preventDefault(); }} onPaste={event => { if (event.clipboardData.getData("text").includes("-")) event.preventDefault(); }} value={String(draft[key] ?? "").replace(".", ",")} onChange={change} />}{errors[key] && <span className="advanced-field-error" id={'analysis-error-'+key}>{errors[key]}</span>}</label>;
    }
    function rowsFor(currentStep) {
        if (Object.keys(validateAnalysis(draft, currentStep)).length || validateDiarySources(draft,currentStep<2?"repair":"all") || ((currentStep<2 ? draft.repair_source==='diary' : wantsDiary) && (diary.loading || diary.error))) return null;
        if (currentStep === 0) return <Rows rows={[["Kopējais ieguldījums", euro(preview.investment)]]} />;
        if (currentStep === 1) return <><Rows rows={[["Neto īre mēnesī pēc nodokļa", euro(preview.net_rent_monthly)], ["Aizpildījums", percent(preview.occupancy)]]} /><div className="advanced-occupancy" role="progressbar" aria-label="Aizpildījums" aria-valuemin="0" aria-valuemax="100" aria-valuenow={preview.occupancy}><div style={{ width: `${preview.occupancy}%` }} /></div><Rows rows={[["Tukšie mēneši", preview.vacancy], ["Gada bruto īre", euro(preview.gross_annual)], ["Gada īres nodoklis", euro(preview.tax_annual)], ["Gada īre pēc nodokļa", euro(preview.net_rent_annual)]]} /></>;
        if (currentStep === 2) return <div className="owner-expense-summaries">
            {draft.utilities_source === 'diary' && <section><h4>Faktiskie komunālie maksājumi</h4><p className="advanced-note">Atlasītais periods: {(draft.utilities_start_date || draft.renovation_start_date)?.split('-').reverse().join('.')}–{(draft.utilities_end_date || draft.renovation_end_date)?.split('-').reverse().join('.')}.</p><Rows rows={[["Atlasītie dienasgrāmatas maksājumi", euro(sourceData.utilitiesTotal)]]} /><p className="advanced-note">Ieskaitīti analīzē atbilstoši ierakstu mēnešiem, arī atsevišķi atlasītie maksājumi pēc perioda beigām.</p></section>}
            <section><h4>{draft.renovation_required === false ? "Plānotie īpašnieka izdevumi — 12 mēneši" : "Plānotie īpašnieka izdevumi pēc renovācijas — 12 mēneši"}</h4><Rows rows={[["Komunālie mēnešos bez īrnieka", euro(preview.vacancy_cost)], ["Apdrošināšana gadā", euro(Number(draft.insurance || 0))], ["NĪN gadā", euro(preview.nin)], ["Kopā", euro(preview.expenses)]]} /><details><summary>NĪN aprēķina pieņēmumi</summary><p className="advanced-note">Kadastrālās vērtības daļai līdz 56 915 €: 0,2%; daļai no 56 915 līdz 106 715 €: 0,4%; virs 106 715 €: 0,6%. Minimums 7 € gadā.</p></details></section>
        </div>;
        const validInvestment = Object.keys(validateAnalysis(draft, 0)).length === 0;
        return <><Rows rows={[["Potenciālā tirgus vērtība", euro(preview.market_value)], ["Kopējais ieguldījums", validInvestment ? euro(preview.investment) : "—"], ["Potenciālais vērtības pieaugums", validInvestment ? euro(preview.capital_gain) : "—"]]} /><p className="advanced-note">Šis solis nav obligāts. Ja vērtību nezini, atstāj lauku tukšu. Vērtības pieaugumu aprēķina pirms pārdošanas izdevumiem un nodokļiem.</p></>;
    }
    async function next(event) {
        event.preventDefault();
        const sourceMessage = validateDiarySources(draft,step<2?"repair":"all");
        const neededDiary = step<2 ? draft.repair_source==='diary' : wantsDiary;
        if (sourceMessage || (neededDiary && (diary.loading || diary.error))) { setError(sourceMessage || 'Sagaidi dienasgrāmatas ielādi vai mēģini vēlreiz.'); return; }
        const invalid = validateAnalysis(draft, step); setErrors(invalid);
        if (Object.keys(invalid).length) return;
        if (step < 3) { setError(""); scrollRequested.current = true; setStep(step+1); return; }
        const all = validateAnalysis(draft);
        if (Object.keys(all).length) { setErrors(all); setStep(analysisSteps.findIndex(s => s.fields.some(([key]) => all[key]))); return; }
        setSaving(true); setError("");
        try {
            const response = await fetch(url, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(numeric) });
            if (!response.ok) throw new Error("Neizdevās saglabāt analīzi. Pārbaudi ievadi un mēģini vēlreiz.");
            const data = await response.json(); scrollRequested.current = true; setSaved(data); onAnalysisChanged?.(data); setDraft(data.inputs); setEditing(false);
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    }
    async function removeAnalysis() {
        setDeleting(true); setDeleteError("");
        try {
            const response = await fetch(url, { method: "DELETE", credentials: "include" });
            if (!response.ok) throw new Error("Neizdevās dzēst analīzi. Mēģini vēlreiz.");
            setSaved(null); onAnalysisChanged?.(null); setDraft(initialInputs(property)); setStep(0); setErrors({}); setError(""); setEditing(true); setShowDelete(false);
        } catch (err) { setDeleteError(err.message); }
        finally { setDeleting(false); }
    }
    function edit(target = 0) { scrollRequested.current = true; setDraft(saved.inputs); setErrors({}); setError(""); setStep(target); setEditing(true); }
    const detailRows = {
        Ieguldījums: [["Pirkuma cena", euro(inputs.purchase_price)], ["Platība", `${inputs.area} m²`], ["Cena uz m²", euro(results.price_per_m2)], ["Remonts", euro(results.renovation)], ["Notārs", euro(results.notary)], ["Notāra PVN", euro(results.notary_vat)], ["Kancelejas nodeva", euro(inputs.office_fee)], ["Vērtējums", euro(inputs.valuation)], ["Valsts nodeva", euro(results.state_fee)], ["Kopējais ieguldījums", euro(results.investment)]],
        "Īres ieņēmumi": [["Bruto īre mēnesī", euro(inputs.monthly_rent)], ["Neto īre mēnesī", euro(results.net_rent_monthly)], ["Gada bruto īre", euro(results.gross_annual)], ["Gada īre pēc nodokļa", euro(results.net_rent_annual)]],
        Izdevumi: [["Īpašuma apdrošināšana", euro(inputs.insurance)], ["Apsaimniekošana - vidēji mēnesī", euro(results.average_cost)], ["Apsaimniekošana - gada summa", euro(results.annual_cost)], ["Īpašnieks sedz tukšajos mēnešos", euro(results.vacancy_cost)], ["NĪN", euro(results.nin)], ["Kopējie gada izdevumi", euro(results.expenses)]],
        Ienesīgums: [["Bruto ienesīgums", percent(results.gross_yield)], ["Neto ienesīgums", percent(results.net_yield)], [results.net_annual < 0 ? "Tev jāsedz gadā" : "Peļņa gadā pēc izdevumiem", euro(Math.abs(results.net_annual))], [results.net_monthly < 0 ? "Tev jāsedz mēnesī" : "Peļņa mēnesī pēc izdevumiem", euro(Math.abs(results.net_monthly))], ["Atmaksāšanās laiks", years(results.payback)]],
        Nodokļi: [["Kadastrālā vērtība", euro(inputs.cadastral_value)], ["NĪN gadā", euro(results.nin)], ["Īres nodokļa pieņēmums", percent(inputs.tax_rate)], ["Gada īres nodoklis", euro(results.tax_annual)]],
    };
    const inputPreview = editing ? rowsFor(step) : null;
    return <section ref={sectionRef} className={`advanced-analysis ${editing ? "advanced-input-mode" : ""}`}>
        <header className="advanced-heading"><div><h2>{editing ? "Izveido savu investīcijas analīzi" : "Padziļinātā analīze"}</h2><p>{editing ? "Aprēķini sava ieguldījuma atdevi." : "Īpašuma ieguldījums, naudas plūsma un atdeve."}</p></div>{saved && !editing && <div className="advanced-heading-actions">{!editing && <button className="advanced-secondary" onClick={() => edit()}><Pencil size={16} />Mainīt pieņēmumus</button>}<div className="advanced-more" ref={menuRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false); }} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); menuButton.current?.focus(); } }}><button type="button" ref={menuButton} className={menuOpen ? "advanced-secondary advanced-delete-button" : "advanced-more-trigger"} aria-label={menuOpen ? "Dzēst analīzi" : "Analīzes papildu darbības"} disabled={saving} onClick={() => { if (menuOpen) { setMenuOpen(false); setDeleteError(""); setShowDelete(true); } else setMenuOpen(true); }}>{menuOpen ? <><Trash2 size={16} />Dzēst analīzi</> : <MoreVertical size={20} />}</button></div></div>}</header>{editing && draftNotice && <p className="app-status" role="status">{draftNotice}</p>}
        {wantsDiary && !editing && (diary.loading || diary.error) && <p className="advanced-note">{diary.loading ? "Ielādē aktuālās dienasgrāmatas izmaksas..." : "Dienasgrāmatas izmaksas neizdevās atsvaidzināt."}</p>}{error && <div className="advanced-error" role="alert">{error}{loadFailed && <button type="button" onClick={() => { setLoading(true); setRetry(retry+1); }}>Mēģināt ielādēt vēlreiz</button>}</div>}
        {editing ? <>
            <nav className="advanced-steps" aria-label="Ievades soļi">{analysisSteps.map((item, index) => <button type="button" key={item.title} aria-label={`${index+1}. ${item.title}`} aria-current={step === index ? "step" : undefined} disabled={saving || index > step} onClick={() => { setStep(index); setErrors({}); }} data-complete={index < step || undefined}><span className="advanced-step-marker" aria-hidden="true">{index < step ? <Check size={16}/> : index+1}</span><span className="advanced-step-desktop">{index+1}. {item.title}</span><span className="advanced-step-mobile">{["Ieguldījums","Īre","Izdevumi","Vērtība"][index]}</span></button>)}</nav>
            <form onSubmit={next} noValidate>{step === 0 && !saved && <p className="advanced-source-note">Sākotnējie dati pārņemti no īpašuma. Analīzes pieņēmumus vari mainīt atsevišķi.</p>}<h3>{stepHeadings[step]}</h3>{step === 0 && <InitialInvestmentFields draft={draft} setDraft={setDraft} diary={diary} disabled={saving} errors={errors} field={field} preview={preview} />}{step === 2 && <OwnerExpensesFields draft={draft} setDraft={setDraft} diary={diary} disabled={saving} field={field} />}{step !== 0 && step !== 2 && <div className="advanced-fields">{analysisSteps[step].fields.filter(([key]) => !["renovation_years", "renovation_months"].includes(key) && !(key === "renovation_cost_per_m2" && draft.repair_source === "diary")).map(field)}</div>}

                {inputPreview && <div className="advanced-preview" aria-live="polite">{inputPreview}</div>}
                <div className="advanced-actions"><div><button type="button" className="advanced-secondary" disabled={step === 0 || saving} onClick={() => { setStep(step-1); setErrors({}); }}><ArrowLeft size={16} />Atpakaļ</button>{saved && <button type="button" className="advanced-secondary" disabled={saving} onClick={() => { setDraft(saved.inputs); setEditing(false); setError(""); }}>Atcelt</button>}</div><button className="advanced-primary" disabled={saving}>{saving ? "Saglabā..." : step === 3 ? "Saglabāt" : "Turpināt"}<ArrowRight size={16} /></button></div>
            </form>
        </> : <>
            <div className="advanced-kpis">{[
                ["Kopējais ieguldījums", kpiEuro(results.investment), "Pirkums + remonts + iegādes izdevumi", Coins],
                ["Gada bruto īre", kpiEuro(results.gross_annual), `${kpiEuro(inputs.monthly_rent)}/mēn. · ${inputs.rented_months} mēn.`, ChartNoAxesCombined],
                ["Bruto ienesīgums", kpiPercent(results.gross_yield), "No kopējā ieguldījuma", Percent],
                ["Neto ienesīgums", kpiPercent(results.net_yield), "Pēc nodokļa un izdevumiem", ChartNoAxesCombined],
                ["Atmaksāšanās periods", kpiYears(results.payback), "Pie nemainīgiem ienākumiem un izdevumiem", Clock],
                [results.net_monthly < 0 ? "Tev jāsedz mēnesī" : "Peļņa mēnesī", kpiEuro(Math.abs(results.net_monthly)), results.net_monthly < 0 ? "Vidēji no saviem līdzekļiem" : "Pēc nodokļa un īpašnieka izdevumiem", TrendingUp],
            ].map(([label, value, caption, Icon]) => <div className="advanced-kpi" key={label}><div className="advanced-kpi-main"><span className="advanced-icon"><Icon size={24} /></span><div><span>{label}</span><strong>{value}</strong></div></div><small>{caption}</small></div>)}</div>
            <RenovationSummary inputs={inputs} results={results} /><CalculationGuide inputs={inputs} results={results} /><div className="advanced-charts"><MobileAnalysisPanel><h3>Īres ienākumi un ieguldījuma atgūšana (10 gadi)</h3><CashFlowChart results={results} annualBars actualProgress={actualPoint} receivedRent={rentProgress.total} hasActualProgress={rentProgress.loading || rentProgress.error ? null : rentProgress.count>0} rentedMonths={inputs.rented_months} /></MobileAnalysisPanel><MobileAnalysisPanel><h3>Ieguldījuma sadalījums</h3><InvestmentSplit inputs={inputs} results={results} /></MobileAnalysisPanel></div>
            <div className="advanced-details"><MobileAnalysisPanel><h3>Detalizētie aprēķini</h3><div className="advanced-detail-tabs" role="tablist" aria-label="Aprēķinu sadaļas">{Object.keys(detailRows).map(label => <button key={label} role="tab" id={`analysis-tab-${label}`} aria-selected={detail === label} aria-controls="analysis-details-panel" onClick={() => setDetail(label)}>{label}</button>)}</div><div className="advanced-detail-body" id="analysis-details-panel" role="tabpanel" aria-labelledby={`analysis-tab-${detail}`}>{detail === "Ieguldījums" ? <><Rows rows={[["Pirkuma cena", euro(inputs.purchase_price)], ["Remonts", euro(results.renovation)]]} /><details className="advanced-acquisition" open><summary>Iegādes papildu izdevumi</summary><Rows rows={[["Notārs (0,4%, vismaz 140 €)", euro(results.notary)], ["Notāra PVN (21%)", euro(results.notary_vat)], ["Kancelejas nodeva", euro(inputs.office_fee)], ...(inputs.valuation ? [["Vērtējums", euro(inputs.valuation)]] : []), ["Valsts nodeva (1,5%)", euro(results.state_fee)]]} /></details></> : <><Rows rows={["Īres ieņēmumi", "Izdevumi"].includes(detail) ? detailRows[detail].slice(0, -1) : detailRows[detail]} /></>}</div>{["Ieguldījums", "Īres ieņēmumi", "Izdevumi"].includes(detail) && <div className="advanced-card-total"><Rows rows={detail === "Ieguldījums" ? [["Kopējais ieguldījums", euro(results.investment)]] : detailRows[detail].slice(-1)} /></div>}</MobileAnalysisPanel>
                <MobileAnalysisPanel><div className="advanced-panel-heading"><h3>Īres scenārijs</h3><button aria-label="Rediģēt īres scenāriju" onClick={() => edit(1)}><Pencil size={16} /></button></div><Rows rows={[["Īre mēnesī bruto", euro(inputs.monthly_rent)], ["Izīrēti mēneši gadā", inputs.rented_months], ["Gada bruto īre", euro(results.gross_annual)], [`Īres nodoklis (${inputs.tax_rate}%)`, euro(results.tax_annual)], ["Aizpildījums", percent(results.occupancy)]]} /><div className="advanced-occupancy"><div style={{ width: `${results.occupancy}%` }} /></div><Rows rows={[["Tukši mēneši gadā", results.vacancy]]} /><div className="advanced-card-total"><Rows rows={[["Gada īre pēc nodokļa", euro(results.net_rent_annual)]]} /></div></MobileAnalysisPanel>
                <MobileAnalysisPanel><div className="advanced-panel-heading"><h3>Ikgadējie izdevumi</h3><button aria-label="Rediģēt īpašnieka izdevumus" onClick={() => edit(2)}><Pencil size={16} /></button></div><Rows rows={[["Īpašuma apdrošināšana", euro(inputs.insurance)], ["NĪN (no kadastrālās vērtības)", euro(results.nin)], ["Īpašnieks sedz tukšajos mēnešos", euro(results.vacancy_cost)]]} /><div className="advanced-card-total"><Rows rows={[["Kopējie gada izdevumi", euro(results.expenses)]]} /></div></MobileAnalysisPanel>
                <MobileAnalysisPanel><h3>Galvenie rādītāji</h3><Rows rows={[["Bruto ienesīgums", kpiPercent(results.gross_yield)], ["Neto ienesīgums", kpiPercent(results.net_yield)], [results.net_monthly < 0 ? "Tev jāsedz mēnesī" : "Peļņa mēnesī pēc izdevumiem", kpiEuro(Math.abs(results.net_monthly))], [results.net_annual < 0 ? "Tev jāsedz gadā" : "Peļņa gadā pēc izdevumiem", kpiEuro(Math.abs(results.net_annual))], ["Atmaksāšanās periods", kpiYears(results.payback)]]} /></MobileAnalysisPanel>
            </div><details className="advanced-future-details"><summary>Vērtība pēc remonta — papildu scenārijs</summary>                <MobileAnalysisPanel><div className="advanced-panel-heading"><h3>Vērtība pēc remonta</h3><button aria-label="Rediģēt nākotnes vērtību" onClick={() => edit(3)}><Pencil size={16} /></button></div><Rows totalLabel="Potenciālais vērtības pieaugums" rows={[["Prognozētā cena uz m²", euro(inputs.future_price_per_m2)], ["Potenciālā tirgus vērtība", euro(results.market_value)], ["Kopējais ieguldījums", euro(results.investment)], ["Potenciālais vērtības pieaugums", euro(results.capital_gain)]]} /><p className="advanced-note">{inputs.future_price_per_m2 == null ? "Prognozētā vērtība nav norādīta. To vari pievienot vēlāk." : "Pirms pārdošanas izdevumiem un nodokļiem."}</p></MobileAnalysisPanel></details><p className="advanced-note">Aprēķins balstās uz nemainīgu īri, aizpildījumu un izdevumiem. Šie pieņēmumi ir saglabāti atsevišķi no pamata analīzes un dienasgrāmatas.</p><section className="advanced-panel advanced-recovery" aria-live="polite"><h3>Ieguldījuma atgūšanas progress</h3>{rentProgress.loading ? <p>Ielādē saņemto īri...</p> : rentProgress.error ? <p>Neizdevās ielādēt saņemto īri. <button className="advanced-secondary" onClick={() => setRentRetry(value => value + 1)}>Mēģināt vēlreiz</button></p> : <><div className="advanced-recovery-heading"><span>Saņemtā īre <strong>{euro(rentProgress.total)}</strong></span><strong>{percent(Math.max(0, Math.min(100, rentProgress.total / results.investment * 100)))} atgūti</strong></div><div className="advanced-occupancy" role="progressbar" aria-label="Ieguldījuma atgūšana pēc saņemtās īres" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, rentProgress.total / results.investment * 100))}><div style={{ width: `${Math.max(0, Math.min(100, rentProgress.total / results.investment * 100))}%` }} /></div><div className="advanced-recovery-heading"><span>Kopējais ieguldījums: {euro(results.investment)}</span><span>{rentProgress.total >= results.investment ? `Ieguldījums atgūts · virs ieguldījuma: ${euro(rentProgress.total - results.investment)}` : `Vēl jāatgūst: ${euro(results.investment - rentProgress.total)}`}</span></div><p className="advanced-note">Pēc dienasgrāmatā saņemtās īres, pirms nodokļiem un izdevumiem.</p></>}</section>
        </>}
        {showDelete && <dialog ref={deleteDialog} className="advanced-delete-dialog" aria-labelledby="advanced-delete-title" onCancel={event => { event.preventDefault(); if (!deleting) setShowDelete(false); }}>
            <div className="property-delete-icon"><Trash2 size={24} /></div><h2 id="advanced-delete-title">Dzēst padziļināto analīzi?</h2>
            <p>Tiks dzēsti šīs analīzes saglabātie pieņēmumi. Pēc tam varēsi izveidot jaunu aprēķinu.</p><p>Īpašuma un dienasgrāmatas dati saglabāsies.</p>
            {deleteError && <p role="alert" className="advanced-field-error">{deleteError}</p>}
            <div className="property-delete-actions"><button type="button" className="property-delete-cancel" autoFocus disabled={deleting} onClick={() => setShowDelete(false)}>Atcelt</button><button type="button" className="property-delete-confirm" disabled={deleting} onClick={removeAnalysis}>{deleting ? "Dzēš..." : "Dzēst analīzi"}</button></div>
        </dialog>}
    </section>;
}
