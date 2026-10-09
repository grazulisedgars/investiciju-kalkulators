import { useEffect, useState } from "react";
import { Receipt, Landmark, HousePlug, Banknote, Hammer } from "lucide-react";
import { calculateDiaryTotals } from "./diaryTotals";
import "./PropertyExpenses.css";
import "./PropertyTotals.css";

function formatValue(hundredths, unit) {
    return `${(hundredths / 100).toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
}

export default function PropertyTotals({ property }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    // Katru reizi atverot kopsavilkumu, nolasām aktuālos dienasgrāmatas ierakstus.
    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            try {
                const response = await fetch(`http://localhost:8000/properties/${property.property_id}/diary`, { credentials: "include", signal: controller.signal });
                if (!response.ok) throw new Error("Neizdevās ielādēt kopsavilkumu.");
                const data = await response.json();
                if (!controller.signal.aborted) { setEntries(data); setError(""); }
            } catch (error) { if (!controller.signal.aborted) setError(error.message); }
            finally { if (!controller.signal.aborted) setLoading(false); }
        }
        load();
        return () => controller.abort();
    }, [property.property_id, retry]);
    const totals = calculateDiaryTotals(entries);
    const showLoan = property.financing_type === "mortgage" || totals.loan.count > 0;
    const rows = [
        { key: "expense", label: "Izmaksas", Icon: Receipt },
        ...(showLoan ? [{ key: "loan", label: "Kredīta maksājumi", Icon: Landmark }] : []),
        { key: "utility", label: "Komunālie maksājumi", Icon: HousePlug },
        { key: "rent", label: "Saņemtā īre", Icon: Banknote },
        { key: "work", label: "Darba stundas", Icon: Hammer },
    ];
    return <section className="property-expenses property-totals">
        <div className="property-expenses-header"><div><h2>Kopā</h2><p>Dienasgrāmatas finanšu un darba stundu kopsavilkums</p></div></div>
        {loading ? <div className="property-expenses-empty">Ielādē kopsavilkumu...</div> : error ? <div className="property-expenses-empty" role="alert">{error}<button className="totals-retry" type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Mēģināt vēlreiz</button></div> : <>
            <div className="totals-kpis">
                <div className="totals-kpi"><span>Kopā saņemtā īre</span><strong>{formatValue(totals.rent.amount, "€")}</strong><small>Saņemtie īres maksājumi</small></div>
                <div className="totals-kpi"><span>Kopējie izdevumi</span><strong>{formatValue(totals.expenses, "€")}</strong><small>{showLoan ? "Izmaksas, kredīts un komunālie" : "Izmaksas un komunālie maksājumi"}</small></div>
                <div className="totals-kpi totals-kpi-balance"><span>Naudas plūsmas atlikums</span><strong>{formatValue(totals.balance, "€")}</strong><small>Saņemtā īre mīnus izdevumi</small></div>
            </div>
            <h3>Sadaļu kopsummas</h3>
            <div className="property-expenses-table-wrapper totals-table-wrapper"><table className="property-expenses-table">
                <thead><tr><th>Sadaļa</th><th className="totals-number">Ieraksti</th><th className="totals-number">Kopā</th></tr></thead>
                <tbody>{rows.map(({ key, label, Icon }) => <tr key={key}><td><span className="totals-section-label"><Icon size={17} />{label}</span></td><td className="totals-number">{totals[key].count}</td><td className="totals-number expense-amount">{formatValue(key === "work" ? totals.work.hours : totals[key].amount, key === "work" ? "h" : "€")}</td></tr>)}</tbody>
            </table></div>
            {showLoan && <details className="totals-credit"><summary>Kredīta maksājumu sadalījums</summary><table className="property-expenses-table"><tbody>{[{ key: "principal", label: "Pamatsumma" }, { key: "interest", label: "Procenti" }, { key: "insurance", label: "Apdrošināšana" }, { key: "other", label: "Cits" }].map((item) => <tr key={item.key}><td>{item.label}</td><td className="totals-number">{formatValue(totals.loanBreakdown[item.key], "€")}</td></tr>)}</tbody></table></details>}
        </>}
    </section>;
}
