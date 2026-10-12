import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pencil, Coins, ChartNoAxesCombined, Percent, Clock, TrendingUp, Trash2, ChevronDown, Check, MoreVertical } from "lucide-react";
import { calculateAdvanced, analysisSteps, validateAnalysis } from "./advancedCalculations";
import { CashFlowChart, InvestmentSplit } from "./AnalysisCharts";
import "./AdvancedAnalysis.css";

const euro = value => value === null ? "—" : value.toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const percent = value => value === null ? "—" : value.toLocaleString("lv-LV", { maximumFractionDigits: 2 }) + "%";
const years = value => value === null ? "Neatmaksājas" : value.toLocaleString("lv-LV", { maximumFractionDigits: 2 }) + " gadi";
// KPI ir noapaļots pārskats; detalizētās summas saglabā centu precizitāti.
const kpiEuro = value => value === null ? "—" : value.toLocaleString("lv-LV", { maximumFractionDigits: 0 }) + " €";
const kpiPercent = value => value === null ? "—" : value.toLocaleString("lv-LV", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
const kpiYears = value => value === null ? "Neatmaksājas" : value.toLocaleString("lv-LV", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " gadi";
const stepHeadings = ["Sākotnējais ieguldījums", "Plānotie īres ieņēmumi", "Īpašnieka izdevumi", "Potenciālā vērtība pēc remonta"];

// Mēnešu izvēlne izmanto lapas zaļo stilu un atbalsta tastatūru.
function MonthSelect({ value, onChange, ...attributes }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(12);
    const root = useRef(null);
    const trigger = useRef(null);
    useEffect(() => {
        if (!open) return;
        function outside(event) { if (!root.current?.contains(event.target)) setOpen(false); }
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    useEffect(() => {
        if (open) root.current?.querySelector(`[data-month="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [open, active]);
    function choose(month) { onChange({ target: { value: String(month) } }); setOpen(false); trigger.current?.focus(); }
    function keys(event) {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault(); setOpen(true);
            setActive(current => event.key === 'Home' ? 1 : event.key === 'End' ? 12 : !open ? Number(value) || 1 : Math.max(1, Math.min(12, current + (event.key === 'ArrowDown' ? 1 : -1))));
        } else if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
        else if (open && ['Enter', ' '].includes(event.key)) { event.preventDefault(); choose(active); }
        else if (event.key === 'Tab') setOpen(false);
    }
    return <div className="advanced-month-select" ref={root}>
        <button {...attributes} ref={trigger} type="button" className="advanced-month-trigger" role="combobox" aria-label="Izīrētie mēneši gadā" aria-haspopup="listbox" aria-expanded={open} aria-controls="advanced-month-options" aria-activedescendant={open ? `advanced-month-${active}` : undefined} onKeyDown={keys} onClick={() => { setActive(Number(value) || 1); setOpen(!open); }}>
            <span>{Number(value) >= 1 ? value : 'Izvēlies mēnešu skaitu'}</span><ChevronDown size={17} className={open ? 'is-open' : ''} />
        </button>
        {open && <div id="advanced-month-options" role="listbox" aria-label="Izīrētie mēneši gadā" className="advanced-month-options">
            {Array.from({ length: 12 }, (_, index) => index + 1).map(month => <div key={month} id={`advanced-month-${month}`} data-month={month} role="option" aria-selected={Number(value) === month} className={`advanced-month-option ${Number(value) === month ? 'selected' : ''} ${active === month ? 'active' : ''}`} onMouseEnter={() => setActive(month)} onMouseDown={event => event.preventDefault()} onClick={event => { event.preventDefault(); event.stopPropagation(); choose(month); }}><span>{month}</span>{Number(value) === month && <Check size={16} />}</div>)}
        </div>}
    </div>;
}

function Rows({ rows, totalLabel }) {
    return <dl className="advanced-rows">{rows.map(([label, value]) => <div key={label} className={(totalLabel ? label === totalLabel : label.startsWith("Kopēj") || label === "Gada īre pēc nodokļa") ? "advanced-row-total" : undefined}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function initialInputs(property) {
    return { purchase_price: property.purchase_price ?? "", area: property.area ?? "", renovation_cost_per_m2: property.renovation_cost_per_m2 ?? 0, office_fee: 35, valuation: "", monthly_rent: property.monthly_rent ?? "", rented_months: 12, tax_rate: 10, summer_cost: "", winter_cost: "", insurance: "", cadastral_value: "", future_price_per_m2: property.market_value && property.area ? Math.round(property.market_value/property.area*100)/100 : "" };
}

export default function AdvancedAnalysis({ property }) {
    const [draft, setDraft] = useState(() => initialInputs(property));
    const [saved, setSaved] = useState(null);
    const [editing, setEditing] = useState(true);
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
                if (!controller.signal.aborted && current === revision) setRentProgress({ total: cents / 100, loading: false, error: false });
            } catch { if (!controller.signal.aborted && current === revision) setRentProgress({ total: null, loading: false, error: true }); }
        }
        refreshRent();
        window.addEventListener("focus", refreshRent);
        return () => { controller.abort(); window.removeEventListener("focus", refreshRent); };
    }, [property.property_id, property.financing_type, rentRetry]);
    const url = `http://localhost:8000/properties/${property.property_id}/advanced-analysis`;
    useEffect(() => {
        if (property.financing_type !== "cash") return;
        const controller = new AbortController();
        async function load() {
            try {
                const response = await fetch(url, { credentials: "include", signal: controller.signal });
                if (!response.ok) throw new Error("Neizdevās ielādēt analīzi. Pārbaudi, vai backend darbojas.");
                const data = await response.json();
                if (!controller.signal.aborted && data) { setSaved(data); setDraft(data.inputs); setEditing(false); }
                if (!controller.signal.aborted) { setError(""); setLoadFailed(false); }
            } catch (err) { if (!controller.signal.aborted) { setError(err.message); setLoadFailed(true); } }
            finally { if (!controller.signal.aborted) setLoading(false); }
        }
        load();
        return () => controller.abort();
    }, [url, property.financing_type, retry]);

    if (property.financing_type !== "cash") return <section className="advanced-analysis"><h2>Padziļinātā analīze</h2><p>Hipotēkas kalkulatoru pievienosim nākamajā posmā.</p></section>;
    if (loading) return <div className="advanced-analysis" role="status">Ielādē analīzi...</div>;
    if (loadFailed) return <div className="advanced-error" role="alert">{error}<button type="button" onClick={() => { setLoading(true); setRetry(retry+1); }}>Mēģināt vēlreiz</button></div>;
    // Tukša ievade nav nulle: kopsummu rāda tikai tad, kad tās ievades ir derīgas.
    const numeric = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, key === "future_price_per_m2" && (value === "" || value == null) ? null : Number(value)]));
    const preview = calculateAdvanced(numeric);
    const results = editing ? preview : saved.results;
    const inputs = editing ? numeric : saved.inputs;
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
    const fullOccupancy = Number(draft.rented_months) === 12;
    function rowsFor(currentStep) {
        if (Object.keys(validateAnalysis(draft, currentStep)).length) return null;
        if (currentStep === 0) return <Rows rows={[["Pirkuma cena uz m²", euro(preview.price_per_m2)], ["Aprēķinātā remonta summa", euro(preview.renovation)], ["Notārs (0,4%, minimums 140 €)", euro(preview.notary)], ["Notāra PVN (21%)", euro(preview.notary_vat)], ["Valsts nodeva (1,5%)", euro(preview.state_fee)], ["Iegādes papildu izdevumi kopā", euro(preview.acquisition)], ["Kopējais ieguldījums", euro(preview.investment)]]} />;
        if (currentStep === 1) return <><Rows rows={[["Neto īre mēnesī pēc nodokļa", euro(preview.net_rent_monthly)], ["Aizpildījums", percent(preview.occupancy)]]} /><div className="advanced-occupancy" role="progressbar" aria-label="Aizpildījums" aria-valuemin="0" aria-valuemax="100" aria-valuenow={preview.occupancy}><div style={{ width: `${preview.occupancy}%` }} /></div><Rows rows={[["Tukšie mēneši", preview.vacancy], ["Gada bruto īre", euro(preview.gross_annual)], ["Gada īres nodoklis", euro(preview.tax_annual)], ["Gada īre pēc nodokļa", euro(preview.net_rent_annual)]]} /></>;
        if (currentStep === 2) return <><Rows rows={[...(!fullOccupancy || (draft.summer_cost !== "" && draft.winter_cost !== "") ? [["Apsaimniekošana - vidēji mēnesī", euro(preview.average_cost)], ["Apsaimniekošana - gada summa", euro(preview.annual_cost)]] : []), ["Īpašnieks sedz tukšajos mēnešos", euro(preview.vacancy_cost)], ["NĪN gadā", euro(preview.nin)], ["Kopējie īpašnieka izdevumi gadā", euro(preview.expenses)]]} /><p className="advanced-note">Pieņemti 6 vasaras un 6 ziemas mēneši. Izīrētajos mēnešos apsaimniekošanu un komunālos sedz īrnieks.</p><details><summary>NĪN aprēķina pieņēmumi</summary><p className="advanced-note">Kadastrālās vērtības daļai līdz 56 915 €: 0,2%; daļai no 56 915 līdz 106 715 €: 0,4%; virs 106 715 €: 0,6%. Minimums 7 € gadā.</p></details></>;
        const validInvestment = Object.keys(validateAnalysis(draft, 0)).length === 0;
        return <><Rows rows={[["Potenciālā tirgus vērtība", euro(preview.market_value)], ["Kopējais ieguldījums", validInvestment ? euro(preview.investment) : "—"], ["Potenciālais vērtības pieaugums", validInvestment ? euro(preview.capital_gain) : "—"]]} /><p className="advanced-note">Šis solis nav obligāts. Ja vērtību nezini, atstāj lauku tukšu. Vērtības pieaugumu aprēķina pirms pārdošanas izdevumiem un nodokļiem.</p></>;
    }
    async function next(event) {
        event.preventDefault();
        const invalid = validateAnalysis(draft, step); setErrors(invalid);
        if (Object.keys(invalid).length) return;
        if (step < 3) { setStep(step+1); return; }
        const all = validateAnalysis(draft);
        if (Object.keys(all).length) { setErrors(all); setStep(analysisSteps.findIndex(s => s.fields.some(([key]) => all[key]))); return; }
        setSaving(true); setError("");
        try {
            const response = await fetch(url, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(numeric) });
            if (!response.ok) throw new Error("Neizdevās saglabāt analīzi. Pārbaudi ievadi un mēģini vēlreiz.");
            const data = await response.json(); setSaved(data); setDraft(data.inputs); setEditing(false);
        } catch (err) { setError(err.message); }
        finally { setSaving(false); }
    }
    async function removeAnalysis() {
        setDeleting(true); setDeleteError("");
        try {
            const response = await fetch(url, { method: "DELETE", credentials: "include" });
            if (!response.ok) throw new Error("Neizdevās dzēst analīzi. Mēģini vēlreiz.");
            setSaved(null); setDraft(initialInputs(property)); setStep(0); setErrors({}); setError(""); setEditing(true); setShowDelete(false);
        } catch (err) { setDeleteError(err.message); }
        finally { setDeleting(false); }
    }
    function edit(target = 0) { setDraft(saved.inputs); setErrors({}); setError(""); setStep(target); setEditing(true); }
    const detailRows = {
        Ieguldījums: [["Pirkuma cena", euro(inputs.purchase_price)], ["Platība", `${inputs.area} m²`], ["Cena uz m²", euro(results.price_per_m2)], ["Remonts", euro(results.renovation)], ["Notārs", euro(results.notary)], ["Notāra PVN", euro(results.notary_vat)], ["Kancelejas nodeva", euro(inputs.office_fee)], ["Vērtējums", euro(inputs.valuation)], ["Valsts nodeva", euro(results.state_fee)], ["Kopējais ieguldījums", euro(results.investment)]],
        "Īres ieņēmumi": [["Bruto īre mēnesī", euro(inputs.monthly_rent)], ["Neto īre mēnesī", euro(results.net_rent_monthly)], ["Gada bruto īre", euro(results.gross_annual)], ["Gada īre pēc nodokļa", euro(results.net_rent_annual)]],
        Izdevumi: [["Īpašuma apdrošināšana", euro(inputs.insurance)], ["Apsaimniekošana - vidēji mēnesī", euro(results.average_cost)], ["Apsaimniekošana - gada summa", euro(results.annual_cost)], ["Īpašnieks sedz tukšajos mēnešos", euro(results.vacancy_cost)], ["NĪN", euro(results.nin)], ["Kopējie gada izdevumi", euro(results.expenses)]],
        Ienesīgums: [["Bruto ienesīgums", percent(results.gross_yield)], ["Neto ienesīgums", percent(results.net_yield)], ["Peļņa gadā pēc izdevumiem", euro(results.net_annual)], ["Peļņa mēnesī pēc izdevumiem", euro(results.net_monthly)], ["Atmaksāšanās laiks", years(results.payback)]],
        Nodokļi: [["Kadastrālā vērtība", euro(inputs.cadastral_value)], ["NĪN gadā", euro(results.nin)], ["Īres nodokļa pieņēmums", percent(inputs.tax_rate)], ["Gada īres nodoklis", euro(results.tax_annual)]],
    };
    return <section className="advanced-analysis">
        <header className="advanced-heading"><div><h2>{editing ? "Izveido savu investīcijas analīzi" : "Padziļinātā analīze"}</h2><p>{editing ? "Aprēķini sava ieguldījuma atdevi." : "Īpašuma ieguldījums, naudas plūsma un atdeve."}</p></div>{saved && <div className="advanced-heading-actions">{!editing && <button className="advanced-secondary" onClick={() => edit()}><Pencil size={16} />Mainīt pieņēmumus</button>}<div className="advanced-more" ref={menuRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false); }} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); menuButton.current?.focus(); } }}><button type="button" ref={menuButton} className={menuOpen ? "advanced-secondary advanced-delete-button" : "advanced-more-trigger"} aria-label={menuOpen ? "Dzēst analīzi" : "Analīzes papildu darbības"} disabled={saving} onClick={() => { if (menuOpen) { setMenuOpen(false); setDeleteError(""); setShowDelete(true); } else setMenuOpen(true); }}>{menuOpen ? <><Trash2 size={16} />Dzēst analīzi</> : <MoreVertical size={20} />}</button></div></div>}</header>
        {error && <div className="advanced-error" role="alert">{error}{!saved && <button type="button" onClick={() => { setLoading(true); setRetry(retry+1); }}>Mēģināt ielādēt vēlreiz</button>}</div>}
        {editing ? <>
            <nav className="advanced-steps" aria-label="Ievades soļi">{analysisSteps.map((item, index) => <button type="button" key={item.title} aria-current={step === index ? "step" : undefined} disabled={saving || index > step} onClick={() => { setStep(index); setErrors({}); }}>{index+1}. {item.title}</button>)}</nav>
            <form onSubmit={next} noValidate>{step === 0 && !saved && <p className="advanced-source-note">Sākotnējie dati pārņemti no īpašuma. Analīzes pieņēmumus vari mainīt atsevišķi.</p>}<h3>{stepHeadings[step]}</h3><div className="advanced-fields">{analysisSteps[step].fields.filter(([key]) => !(step === 2 && fullOccupancy && ['summer_cost','winter_cost'].includes(key))).map(field)}</div>
                {step === 2 && fullOccupancy && <><p className="advanced-note">Īpašums izīrēts 12 mēnešus: apsaimniekošanu un komunālos sedz īrnieks. Īpašniekam paliek apdrošināšana un NĪN.</p><details className="advanced-seasonal"><summary>Sezonālās maksas (nav obligāti pie 12 mēnešiem)</summary><div className="advanced-fields">{analysisSteps[2].fields.filter(([key]) => ['summer_cost','winter_cost'].includes(key)).map(field)}</div></details></>}
                <div className="advanced-preview" aria-live="polite">{rowsFor(step)}</div>
                <div className="advanced-actions"><div><button type="button" className="advanced-secondary" disabled={step === 0 || saving} onClick={() => { setStep(step-1); setErrors({}); }}><ArrowLeft size={16} />Atpakaļ</button>{saved && <button type="button" className="advanced-secondary" disabled={saving} onClick={() => { setDraft(saved.inputs); setEditing(false); setError(""); }}>Atcelt</button>}</div><button className="advanced-primary" disabled={saving}>{saving ? "Saglabā..." : step === 3 ? "Saglabāt un skatīt analīzi" : "Turpināt"}<ArrowRight size={16} /></button></div>
            </form>
        </> : <>
            <div className="advanced-kpis">{[
                ["Kopējais ieguldījums", kpiEuro(results.investment), "Pirkums + remonts + iegādes izdevumi", Coins],
                ["Gada bruto īre", kpiEuro(results.gross_annual), `${kpiEuro(inputs.monthly_rent)}/mēn. · ${inputs.rented_months} mēn.`, ChartNoAxesCombined],
                ["Bruto ienesīgums", kpiPercent(results.gross_yield), "No kopējā ieguldījuma", Percent],
                ["Neto ienesīgums", kpiPercent(results.net_yield), "Pēc nodokļa un izdevumiem", ChartNoAxesCombined],
                ["Atmaksāšanās periods", kpiYears(results.payback), "Pie nemainīgas naudas plūsmas", Clock],
                ["Peļņa mēnesī", kpiEuro(results.net_monthly), "Pēc nodokļa un īpašnieka izdevumiem", TrendingUp],
            ].map(([label, value, caption, Icon]) => <div className="advanced-kpi" key={label}><div className="advanced-kpi-main"><span className="advanced-icon"><Icon size={24} /></span><div><span>{label}</span><strong>{value}</strong></div></div><small>{caption}</small></div>)}</div>
            <div className="advanced-charts"><section className="advanced-panel"><h3>Naudas plūsma (10 gadi)</h3><CashFlowChart results={results} annualBars receivedRent={rentProgress.total} /></section><section className="advanced-panel"><h3>Ieguldījuma sadalījums</h3><InvestmentSplit inputs={inputs} results={results} /></section></div>
            <div className="advanced-details"><section className="advanced-panel"><h3>Detalizētie aprēķini</h3><div className="advanced-detail-tabs" role="tablist" aria-label="Aprēķinu sadaļas">{Object.keys(detailRows).map(label => <button key={label} role="tab" id={`analysis-tab-${label}`} aria-selected={detail === label} aria-controls="analysis-details-panel" onClick={() => setDetail(label)}>{label}</button>)}</div><div className="advanced-detail-body" id="analysis-details-panel" role="tabpanel" aria-labelledby={`analysis-tab-${detail}`}>{detail === "Ieguldījums" ? <><Rows rows={[["Pirkuma cena", euro(inputs.purchase_price)], ["Remonts", euro(results.renovation)]]} /><details className="advanced-acquisition" open><summary>Iegādes papildu izdevumi</summary><Rows rows={[["Notārs (0,4%, vismaz 140 €)", euro(results.notary)], ["Notāra PVN (21%)", euro(results.notary_vat)], ["Kancelejas nodeva", euro(inputs.office_fee)], ...(inputs.valuation ? [["Vērtējums", euro(inputs.valuation)]] : []), ["Valsts nodeva (1,5%)", euro(results.state_fee)]]} /></details></> : <><Rows rows={["Īres ieņēmumi", "Izdevumi"].includes(detail) ? detailRows[detail].slice(0, -1) : detailRows[detail]} /></>}</div>{["Ieguldījums", "Īres ieņēmumi", "Izdevumi"].includes(detail) && <div className="advanced-card-total"><Rows rows={detail === "Ieguldījums" ? [["Kopējais ieguldījums", euro(results.investment)]] : detailRows[detail].slice(-1)} /></div>}</section>
                <section className="advanced-panel"><div className="advanced-panel-heading"><h3>Īres scenārijs</h3><button aria-label="Rediģēt īres scenāriju" onClick={() => edit(1)}><Pencil size={16} /></button></div><Rows rows={[["Īre mēnesī bruto", euro(inputs.monthly_rent)], ["Izīrēti mēneši gadā", inputs.rented_months], ["Gada bruto īre", euro(results.gross_annual)], [`Īres nodoklis (${inputs.tax_rate}%)`, euro(results.tax_annual)], ["Aizpildījums", percent(results.occupancy)]]} /><div className="advanced-occupancy"><div style={{ width: `${results.occupancy}%` }} /></div><Rows rows={[["Tukši mēneši gadā", results.vacancy]]} /><div className="advanced-card-total"><Rows rows={[["Gada īre pēc nodokļa", euro(results.net_rent_annual)]]} /></div></section>
                <section className="advanced-panel"><div className="advanced-panel-heading"><h3>Ikgadējie izdevumi</h3><button aria-label="Rediģēt īpašnieka izdevumus" onClick={() => edit(2)}><Pencil size={16} /></button></div><Rows rows={[["Īpašuma apdrošināšana", euro(inputs.insurance)], ["NĪN (no kadastrālās vērtības)", euro(results.nin)], ["Īpašnieks sedz tukšajos mēnešos", euro(results.vacancy_cost)]]} /><div className="advanced-card-total"><Rows rows={[["Kopējie gada izdevumi", euro(results.expenses)]]} /></div></section>
                <section className="advanced-panel"><h3>Galvenie rādītāji</h3><Rows rows={[["Bruto ienesīgums", kpiPercent(results.gross_yield)], ["Neto ienesīgums", kpiPercent(results.net_yield)], ["Peļņa mēnesī pēc izdevumiem", kpiEuro(results.net_monthly)], ["Peļņa gadā pēc izdevumiem", kpiEuro(results.net_annual)], ["Atmaksāšanās periods", kpiYears(results.payback)], ["Neto naudas plūsma 10 gados", kpiEuro(results.net_annual * 10)]]} /></section>
            </div><details className="advanced-future-details"><summary>Vērtība pēc remonta — papildu scenārijs</summary>                <section className="advanced-panel"><div className="advanced-panel-heading"><h3>Vērtība pēc remonta</h3><button aria-label="Rediģēt nākotnes vērtību" onClick={() => edit(3)}><Pencil size={16} /></button></div><Rows totalLabel="Potenciālais vērtības pieaugums" rows={[["Prognozētā cena uz m²", euro(inputs.future_price_per_m2)], ["Potenciālā tirgus vērtība", euro(results.market_value)], ["Kopējais ieguldījums", euro(results.investment)], ["Potenciālais vērtības pieaugums", euro(results.capital_gain)]]} /><p className="advanced-note">{inputs.future_price_per_m2 == null ? "Prognozētā vērtība nav norādīta. To vari pievienot vēlāk." : "Pirms pārdošanas izdevumiem un nodokļiem."}</p></section></details><p className="advanced-note">Aprēķins balstās uz nemainīgu īri, aizpildījumu un izdevumiem. Šie pieņēmumi ir saglabāti atsevišķi no pamata analīzes un dienasgrāmatas.</p><section className="advanced-panel advanced-recovery" aria-live="polite"><h3>Ieguldījuma atgūšanas progress</h3>{rentProgress.loading ? <p>Ielādē saņemto īri...</p> : rentProgress.error ? <p>Neizdevās ielādēt saņemto īri. <button className="advanced-secondary" onClick={() => setRentRetry(value => value + 1)}>Mēģināt vēlreiz</button></p> : <><div className="advanced-recovery-heading"><span>Saņemtā īre <strong>{euro(rentProgress.total)}</strong></span><strong>{percent(Math.max(0, Math.min(100, rentProgress.total / results.investment * 100)))} atgūti</strong></div><div className="advanced-occupancy" role="progressbar" aria-label="Ieguldījuma atgūšana pēc saņemtās īres" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, rentProgress.total / results.investment * 100))}><div style={{ width: `${Math.max(0, Math.min(100, rentProgress.total / results.investment * 100))}%` }} /></div><div className="advanced-recovery-heading"><span>Kopējais ieguldījums: {euro(results.investment)}</span><span>{rentProgress.total >= results.investment ? `Ieguldījums atgūts · virs ieguldījuma: ${euro(rentProgress.total - results.investment)}` : `Vēl jāatgūst: ${euro(results.investment - rentProgress.total)}`}</span></div><p className="advanced-note">Pēc dienasgrāmatā saņemtās īres, pirms nodokļiem un izdevumiem.</p></>}</section>
        </>}
        {showDelete && <dialog ref={deleteDialog} className="advanced-delete-dialog" aria-labelledby="advanced-delete-title" onCancel={event => { event.preventDefault(); if (!deleting) setShowDelete(false); }}>
            <div className="property-delete-icon"><Trash2 size={24} /></div><h2 id="advanced-delete-title">Dzēst padziļināto analīzi?</h2>
            <p>Tiks dzēsti šīs analīzes saglabātie pieņēmumi. Pēc tam varēsi izveidot jaunu aprēķinu.</p><p>Īpašuma un dienasgrāmatas dati saglabāsies.</p>
            {deleteError && <p role="alert" className="advanced-field-error">{deleteError}</p>}
            <div className="property-delete-actions"><button type="button" className="property-delete-cancel" autoFocus disabled={deleting} onClick={() => setShowDelete(false)}>Atcelt</button><button type="button" className="property-delete-confirm" disabled={deleting} onClick={removeAnalysis}>{deleting ? "Dzēš..." : "Dzēst analīzi"}</button></div>
        </dialog>}
    </section>;
}
