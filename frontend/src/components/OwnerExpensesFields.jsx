import DiaryCostChoice from './DiaryCostChoice';
import FormDatePicker from './FormDatePicker';
import {diaryCostSources} from './diaryCostSources';
import {analysisSteps} from './advancedCalculations';
const money=n=>n.toLocaleString('lv-LV',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';

// Šis bloks maina tikai padziļinātās analīzes ievadi, nevis dienasgrāmatas ierakstus.
export default function OwnerExpensesFields({draft,setDraft,diary,disabled,field}) {
    const source=draft.utilities_source || 'manual';
    const info=diaryCostSources(draft,diary.entries);
    const used=new Set(info.usedUtilityIds);
    const months=new Set(info.utilityRows.filter(row=>used.has(row.id)).map(row=>row.entry_date.slice(0,7))).size;
    const fields=analysisSteps[2].fields;
    const renderFields=keys=>fields.filter(([key])=>keys.includes(key)).map(([key,label,...rest])=>field([key,key==='summer_cost'?'Vasaras maksājums (€/mēn.)':key==='winter_cost'?'Ziemas maksājums (€/mēn.)':key==='cadastral_value'?label+' *':label,...rest]));
    const seasonsReady=['summer_cost','winter_cost'].every(key=>draft[key]!=='' && draft[key]!=null && Number.isFinite(Number(draft[key])));
    const average=(Number(draft.summer_cost || 0)+Number(draft.winter_cost || 0))/2;
    const utilStart=draft.utilities_start_date || draft.renovation_start_date,utilEnd=draft.utilities_end_date || draft.renovation_end_date;
    const datesReady=!!utilStart && !!utilEnd && utilEnd>=utilStart;
    function utilityDate(key,value){setDraft(current=>({...current,utilities_start_date:current.utilities_start_date || current.renovation_start_date || null,utilities_end_date:current.utilities_end_date || current.renovation_end_date || null,[key]:value}));}
    return <div className="owner-expense-blocks">
        <fieldset className="investment-input-block"><legend>Komunālie maksājumi</legend>
            <p className="advanced-note">Kā vēlies aprēķināt apsaimniekošanu un komunālos renovācijas laikā?</p>
            <div className="diary-source-options owner-source-options">
                <label><input type="radio" name="owner-utilities-source" checked={source==='manual'} disabled={disabled} onChange={()=>setDraft(current=>({...current,utilities_source:'manual'}))}/>Aprēķināt pēc sezonām</label>
                <label><input type="radio" name="owner-utilities-source" checked={source==='diary'} disabled={disabled} onChange={()=>setDraft(current=>({...current,utilities_source:'diary'}))}/>Izmantot dienasgrāmatas datus</label>
            </div>
            {source==='manual' ? <>
                <div className="advanced-fields owner-season-fields">{renderFields(['summer_cost','winter_cost'])}</div>
                <div className="owner-utility-summary" aria-live="polite"><div className="owner-utility-summary-row"><span>Vidējais komunālais maksājums</span><output>{seasonsReady?money(average)+' / mēn.':'Ievadi abas summas'}</output></div></div>
                <details><summary>Kā tiek aprēķināti komunālie maksājumi?</summary><p className="advanced-note">Vidējais mēneša maksājums tiek aprēķināts no vasaras un ziemas izmaksām, pieņemot 6 vasaras un 6 ziemas mēnešus gadā.</p><p className="advanced-note">Renovācijas laikā un mēnešos, kad īpašums nav izīrēts, komunālos maksājumus sedz īpašnieks. Izīrētajos mēnešos tos sedz īrnieks.</p></details>
            </> : <>
                <p className="advanced-note">Komunālo maksājumu atlases periods. Tas nemaina renovācijas ilgumu vai īres sākumu.</p>
                <div className="advanced-fields"><FormDatePicker id="utility-period-start" label="Perioda sākums" value={utilStart || ''} disabled={disabled} onChange={value=>utilityDate('utilities_start_date',value)}/><FormDatePicker id="utility-period-end" label="Perioda beigas" value={utilEnd || ''} disabled={disabled} onChange={value=>utilityDate('utilities_end_date',value)}/></div>
                {datesReady && !diary.loading && !diary.error && <div className="owner-utility-summary" aria-live="polite">
                    {months>0 ? <><div className="owner-utility-summary-row"><span>Vidējais komunālais maksājums <small>(no {months} mēnešiem)</small></span><output>{money(info.utilitiesTotal/months)} / mēn.</output></div></> : <span>Šajā periodā komunālie maksājumi nav atrasti. Pievieno tos īpašuma dienasgrāmatā vai atlasi vēlāk samaksātos renovācijas rēķinus zemāk.</span>}
                </div>}
                <details><summary>Kā tiek aprēķināti komunālie maksājumi?</summary><p className="advanced-note">Vidējo mēneša maksājumu aprēķina, saskaitot atlasītos komunālos maksājumus un dalot tos ar mēnešu skaitu, kuros reģistrēti maksājumi. Ja vienā mēnesī ir vairāki ieraksti, to summas tiek apvienotas.</p><p className="advanced-note">Vidējais maksājums ir tikai informatīvs. Investīcijas analīzē tiek izmantotas faktiskās izmaksas atbilstoši to reģistrēšanas mēnesim.</p></details><DiaryCostChoice kind="utilities" draft={draft} setDraft={setDraft} diary={diary} disabled={disabled} recordsOnly embedded hideHelp/>
                {Number(draft.rented_months)<12 && <div className="owner-future-utilities"><h4>Komunālie neizīrētajos mēnešos pēc renovācijas</h4><p className="advanced-note">Šeit norādītās summas izmanto nākotnes prognozei. Dienasgrāmatas vidējo automātiski nepārnes uz visu gadu.</p><div className="advanced-fields">{renderFields(['summer_cost','winter_cost'])}</div></div>}
            </>}
        </fieldset>
        <fieldset className="investment-input-block owner-other-expenses"><legend>Citi īpašnieka izdevumi</legend><p className="advanced-note">Apdrošināšanu un NĪN ņem vērā arī renovācijas laikā.</p><div className="advanced-fields">{renderFields(['insurance','cadastral_value'])}</div><p className="advanced-note">* Kadastrālo vērtību nepieciešams norādīt, lai varētu aprēķināt NĪN.</p></fieldset>
    </div>;
}
