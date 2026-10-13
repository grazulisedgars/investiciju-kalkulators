import DiaryCostChoice from './DiaryCostChoice';
import RenovationPeriod from './RenovationPeriod';
import {Rows} from './AnalysisFields';
import {analysisSteps} from './advancedCalculations';
const money=value=>Number.isFinite(value)?value.toLocaleString('lv-LV',{minimumFractionDigits:2,maximumFractionDigits:2})+' €':'—';

// Pirmajā solī avotu izvēlas pirms datumiem, ierakstus atlasa pēc datumu ievades.
export default function InitialInvestmentFields({draft,setDraft,diary,disabled,errors,field,preview,mortgage=false,fieldsOverride}) {
    const fields=fieldsOverride || analysisSteps[0].fields;
    const renderFields=keys=>fields.filter(([key])=>keys.includes(key)).map(field);
    const validDates=!!draft.renovation_start_date && !!draft.renovation_end_date && draft.renovation_end_date>=draft.renovation_start_date;
    return <div className="initial-investment-blocks">
        <fieldset className="investment-input-block"><legend>Īpašuma pamatinformācija</legend><div className="advanced-fields">{renderFields(['purchase_price','area'])}</div></fieldset>
        {mortgage && <fieldset className="investment-input-block"><legend>Hipotēkas nosacījumi</legend><div className="advanced-fields">{renderFields(['down_payment_percent','bank_rate','euribor_rate','loan_years'])}</div><Rows rows={[["Pirmā iemaksa",money(preview.down_payment)],["Bankas finansējums",money(preview.loan_amount)],["Kredītmaksājums mēnesī",money(preview.loan_payment)]]}/><details><summary>Kredīta aprēķina detaļas</summary><Rows rows={[["Kopējā likme",Number.isFinite(preview.total_rate)?preview.total_rate.toLocaleString('lv-LV',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':'—'],["Termiņš mēnešos",preview.loan_months]]}/><p className="advanced-note">Kopējā likme ir bankas pamata likme un Euribor. Prognozē likme ir nemainīga.</p></details></fieldset>}
        <fieldset className="investment-input-block"><legend>Vai īpašumam nepieciešama renovācija?</legend><div className="diary-source-options">
            <label><input type="radio" name="renovation-required" checked={draft.renovation_required!==false} disabled={disabled} onChange={()=>setDraft(current=>({...current,renovation_required:true,repair_entry_ids:current.renovation_required===false?null:current.repair_entry_ids}))}/>Jā</label>
            <label><input type="radio" name="renovation-required" checked={draft.renovation_required===false} disabled={disabled} onChange={()=>setDraft(current=>({...current,renovation_required:false,utilities_start_date:current.utilities_start_date || current.renovation_start_date || null,utilities_end_date:current.utilities_end_date || current.renovation_end_date || null,repair_source:'manual',renovation_cost_per_m2:0,renovation_start_date:null,renovation_end_date:null,renovation_years:0,renovation_months:0,repair_entry_ids:null}))}/>Nē</label>
        </div>{draft.renovation_required===false && <p className="advanced-note">Remonta izmaksas ir 0 €. Īres ienākumu prognoze sākas uzreiz.</p>}</fieldset>
        {draft.renovation_required!==false && <DiaryCostChoice kind="repair" draft={draft} setDraft={setDraft} diary={diary} disabled={disabled} sourceOnly hideSourceHint>
            {draft.repair_source!=='diary' && <div className="advanced-fields">{renderFields(['renovation_cost_per_m2'])}<div className="investment-repair-result"><span>Aprēķinātās remonta izmaksas</span><output>{money(preview.renovation)}</output></div></div>}
        <RenovationPeriod draft={draft} setDraft={setDraft} disabled={disabled} errors={errors} mortgage={mortgage} embedded required={draft.repair_source==='diary'}/>
        {draft.repair_source==='diary' && validDates && <DiaryCostChoice kind="repair" draft={draft} setDraft={setDraft} diary={diary} disabled={disabled} recordsOnly embedded/>}
        </DiaryCostChoice>}
        <fieldset className="investment-input-block"><legend>Iegādes papildu izmaksas</legend><div className="advanced-fields">{renderFields(mortgage?['office_fee','valuation','bank_fee']:['office_fee','valuation'])}</div><Rows rows={[
            ['Notārs (0,4%*, minimums 140 €)',money(preview.notary)],['Notāra PVN (21%)',money(preview.notary_vat)],['Valsts nodeva (1,5%*)',money(preview.state_fee)],...(mortgage? [['Hipotēkas nostiprināšana (0,1% no kredīta)',money(preview.mortgage_fee)]]:[]),['Iegādes papildu izmaksas kopā',money(preview.acquisition)]
        ]}/><p className="advanced-note">* Procents no īpašuma iegādes cenas.</p></fieldset>
    </div>;
}
