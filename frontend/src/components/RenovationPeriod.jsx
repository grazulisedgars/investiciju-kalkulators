import { DiaryPeriod } from "./DiaryCostChoice";
import { periodFromDates } from "./diaryCostSources";

export default function RenovationPeriod({draft,setDraft,disabled,errors={},mortgage=false,embedded=false,required=false}) {
    const Wrapper=embedded?"div":"fieldset";
    const period=periodFromDates(draft.renovation_start_date,draft.renovation_end_date);
    const oldMonths=Number(draft.renovation_years || 0)*12+Number(draft.renovation_months || 0);
    return <Wrapper className={`renovation-period ${embedded ? "is-embedded" : ""}`}>{embedded ? <h4>Renovācijas periods pirms izīrēšanas</h4> : <legend>Renovācijas periods pirms izīrēšanas</legend>}
        {required && <p className="advanced-note">Izvēlies periodu, par kuru atlasīt remonta izdevumus.</p>}
        {(draft.renovation_start_date || draft.renovation_end_date) && <div className="renovation-date-actions"><button type="button" className="advanced-secondary" disabled={disabled} onClick={()=>setDraft(current=>({...current,renovation_start_date:null,renovation_end_date:null,renovation_years:0,renovation_months:0}))}>Notīrīt datumus</button></div>}
        <DiaryPeriod draft={draft} setDraft={setDraft} disabled={disabled}/>
        {period && <p className="advanced-note"><strong>Renovācijas ilgums: {period.renovation_years} {period.renovation_years===1?'gads':'gadi'} un {period.renovation_months} {period.renovation_months===1?'mēnesis':'mēneši'}.</strong> Aprēķināts automātiski no izvēlētajiem datumiem.</p>}
        {!required && !period && !draft.renovation_start_date && !draft.renovation_end_date && <p className="advanced-note">{oldMonths>0 ? `Iepriekš saglabātais ilgums: ${Math.floor(oldMonths/12)} gadi un ${oldMonths%12} mēneši. Norādi datumus, lai precizētu periodu.` : 'Ja īpašumam renovācija nav nepieciešama, datumus vari atstāt tukšus.'}</p>}
        {(errors.renovation_years || errors.renovation_months) && <p className="advanced-field-error">{errors.renovation_years || errors.renovation_months}</p>}
        <p className="advanced-note">Renovācijas laikā īres ienākumi netiek aprēķināti, taču {mortgage ? "kredīta maksājumi un īpašnieka izdevumi turpina uzkrāties." : "īpašnieka izdevumi turpina uzkrāties."}</p>
        <details><summary>Kā renovācijas periods ietekmē aprēķinus?</summary><p className="advanced-note">Īres ienākumu prognoze sākas pēc renovācijas beigām.</p><p className="advanced-note">Remonta izmaksas tiek aprēķinātas no atlasītajiem dienasgrāmatas izdevumiem vai reizinot norādītās remonta izmaksas uz m² ar īpašuma platību.</p><p className="advanced-note">Izmantojot dienasgrāmatu, sākotnēji tiek atlasīti visi izdevumi renovācijas periodā, ieskaitot sākuma un beigu datumu.</p><p className="advanced-note">Renovācijas ilgums tiek noteikts pēc periodā ietvertajiem kalendāra mēnešiem.</p></details>
    </Wrapper>;
}
