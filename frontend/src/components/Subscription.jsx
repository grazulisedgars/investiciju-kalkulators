import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,LockKeyhole,Clock3,X} from 'lucide-react';
import building from '../assets/plans-pro-building.png';
import './Subscription.css';
export default function Subscription({profile,onOpenPlans,loading,onPlanUpdated,onGoToProperties}){
 const pro=profile?.plan==='pro',limit=profile?.property_limit ?? 3,count=profile?.property_count;
 const canCancelTest=pro && profile?.test_plan_switch_enabled;
 const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const dialog=useRef(null);
 useEffect(()=>{if(confirm)dialog.current?.showModal();else dialog.current?.close();},[confirm]);
 async function cancelTest(){
  if(busy)return;
  setBusy(true);setError('');
  try{
   const response=await fetch('http://localhost:8000/account/profile/test-plan',{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:'basic'})});
   const data=await response.json();
   if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:'Neizdevās atcelt testa piekļuvi.');
   setConfirm(false);onPlanUpdated(data);
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 const benefits=pro?['Neierobežots īpašumu skaits','Pamata un padziļinātā investīcijas analīze','Pilna dienasgrāmata un foto galerija']:[`Līdz ${limit} saglabātiem īpašumiem`,'Pamata investīcijas analīze','Personīgais investora profils'];
 return <>
  <h1>Abonements</h1><p className="my-profile-subtitle">Pārvaldi savu plānu un atklāj vairāk iespēju.</p>
  <div className="subscription-grid">
   <section className="subscription-card" aria-busy={loading}>
    <p className="subscription-eyebrow">Pašreizējais plāns</p>
    <div className="subscription-plan-heading"><h2>{pro?'PRO plāns':'Bezmaksas plāns'}</h2><span>{loading?'Ielādē…':canCancelTest?'Testa piekļuve':'Aktīvs'}</span></div>
    <ul className="subscription-features">{benefits.map(text=><li key={text}><Check size={15}/><span>{text}</span></li>)}</ul>
    <div className="subscription-usage"><div><span>Saglabātie īpašumi</span><strong>{loading || count==null?'—':count} / {pro?'neierobežoti':limit}</strong></div>{!pro && <div className="subscription-progress" role="progressbar" aria-label="Izmantotais īpašumu limits" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(count ?? 0,limit)}><span style={{width:Math.min(100,(count ?? 0)/limit*100)+'%'}}/></div>}</div>
    {!pro?<p className="subscription-price">0 € <span>/ vienmēr</span></p>:<div className="subscription-management"><p className="subscription-help">{canCancelTest?'Aktivizēta PRO testa piekļuve. Maksājumi netiek ieturēti.':'Šim kontam ir PRO piekļuve. Maksas abonementu pārvaldība vēl nav pieslēgta.'}</p><button type="button" className="subscription-cancel" disabled={loading || !canCancelTest} onClick={()=>{setError('');setConfirm(true);}}>{canCancelTest?'Atcelt PRO testa piekļuvi':'Atcelt abonementu'}</button></div>}
    {!pro && count>limit && <p className="subscription-help" style={{marginTop:16}}>Īpašumi ir saglabāti. Jaunus varēsi pievienot ar PRO plānu vai samazinot īpašumu skaitu zem {limit}.</p>}
   </section>
   {pro ? <section className="subscription-card subscription-welcome">
    <div className="subscription-welcome-status"><Check size={16}/>PRO aktīvs</div>
    <h2>Laipni lūdzam PROPFOLIO PRO!</h2>
    <p>Paldies, ka esi daļa no PROPFOLIO kopienas.</p>
    <p>Tev tagad ir pieejami visi rīki, lai pārvaldītu savus īpašumus un pieņemtu pārdomātākus investīciju lēmumus.</p>
    <button type="button" className="my-profile-save" onClick={onGoToProperties}>Doties uz īpašumiem<ArrowRight size={18}/></button>
    <img src={building} alt="" aria-hidden="true"/>
   </section> : (
   <section className="subscription-card subscription-discover">
    <div className="subscription-promo"><div><p className="subscription-eyebrow">{pro?'Tavas iespējas':'Vairāk iespēju'}</p><h2>{pro?'PRO iespējas ir atvērtas':'Atklāj PRO plānu'}</h2><p>Detalizēta analīze un īpašumu pārvaldība nopietnam investoram.</p><button className="my-profile-save" onClick={onOpenPlans}>{pro?'Salīdzināt plānus':'Apskatīt PRO plānu'}<ArrowRight size={18}/></button></div><img src={building} alt="" aria-hidden="true"/></div>
    <ul className="subscription-pro-features">{['Neierobežots īpašumu skaits','Padziļināta investīcijas analīze','Pilna īpašuma dienasgrāmata un foto galerija'].map(text=><li key={text}>{pro?<Check size={14}/>:<LockKeyhole size={14}/>} {text}</li>)}</ul>
    <div className="subscription-trial"><Clock3 size={20}/><div><h3>Izmēģini PRO 3 dienas bez maksas!</h3><p>Aktivizē abonementu un izmanto visas PRO iespējas bez maksas 3 dienas. Pēc izmēģinājuma beigām tiks piemērota izvēlētā abonementa maksa.</p><p>Pirms apstiprināšanas redzēsi pirmā maksājuma datumu un summu.</p></div></div>
    <p className="subscription-help">Stripe maksājumi vēl nav pieslēgti. Pašreizējā testa piekļuve nesāk 3 dienu izmēģinājumu un nerada maksājumus.</p>
   </section>
   )}
  </div>
  <dialog ref={dialog} className="subscription-dialog" aria-labelledby="subscription-cancel-title" onCancel={e=>{if(busy)e.preventDefault();else setConfirm(false);}} onClick={e=>{if(e.target===e.currentTarget&&!busy)setConfirm(false);}}>
   <button type="button" className="subscription-dialog-close" aria-label="Aizvērt" disabled={busy} onClick={()=>setConfirm(false)}><X size={20}/></button>
   <h2 id="subscription-cancel-title">Atcelt PRO testa piekļuvi?</h2>
   <p>Konts uzreiz pāries uz BASIC plānu. Visi īpašumi, dienasgrāmatas ieraksti, analīzes un foto saglabāsies.</p>
   <p>Dienasgrāmata un padziļinātā analīze būs slēgta līdz PRO atjaunošanai. BASIC plānā vari pievienot līdz 3 īpašumiem.</p>
   <p>Šī ir testa piekļuve — nav maksas abonementa vai plānotu maksājumu.</p>
   {error&&<p role="alert" className="subscription-error">{error}</p>}
   <div className="subscription-dialog-actions"><button type="button" autoFocus disabled={busy} onClick={()=>setConfirm(false)}>Saglabāt PRO</button><button type="button" disabled={busy} className="subscription-cancel" onClick={cancelTest}>{busy?'Atceļ…':'Atcelt testa piekļuvi'}</button></div>
  </dialog>
 </>;
}
