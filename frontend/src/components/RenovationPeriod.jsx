import { normalizeRenovation } from "./monthlyForecast";

export default function RenovationPeriod({ draft, setDraft, disabled, errors = {} }) {
    const years = draft.renovation_years ?? 0, months = draft.renovation_months ?? 0;
    function change(key, event) {
        const value = event.target.value;
        if (!/^\d*$/.test(value) || Number(value) > (key === 'renovation_years' ? 50 : 12)) return;
        setDraft(current => ({ ...current, [key]: value }));
    }
    function normalize() { if (Number(years)*12+Number(months)>611) return; setDraft(current => ({ ...current, ...normalizeRenovation(current.renovation_years, current.renovation_months) })); }
    return <fieldset className="renovation-period"><legend>Renovācijas periods pirms īres sākuma</legend><div className="advanced-fields"><label>Gadi<input type="text" inputMode="numeric" disabled={disabled} value={years} onChange={event => change('renovation_years',event)} onBlur={normalize} />{errors.renovation_years && <span className="advanced-field-error">{errors.renovation_years}</span>}</label><label>Mēneši<input type="text" inputMode="numeric" disabled={disabled} value={months} onChange={event => change('renovation_months',event)} onBlur={normalize} />{errors.renovation_months && <span className="advanced-field-error">{errors.renovation_months}</span>}</label></div><p className="advanced-note">12 mēneši pārvēršas par 1 gadu. Renovācijas laikā īres nav; pēc tam sākas zemāk norādītais īres scenārijs. Kredītmaksājumi un īpašnieka izdevumi turpinās arī renovācijas laikā.</p></fieldset>;
}
