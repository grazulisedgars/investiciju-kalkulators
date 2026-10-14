import {useEffect,useRef,useState} from 'react';
import {Mail,CheckCircle2} from 'lucide-react';
import './EmailVerification.css';
const API='http://localhost:8000';
export default function EmailVerification({token,user,onContinue,onProfile,onLogout}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirmed,setConfirmed]=useState(false),[cooldown,setCooldown]=useState(false);
 const verificationRequest=useRef(null);
 useEffect(()=>{
  if(!token)return;
  let active=true;
  // Reuse the request during React StrictMode's effect replay.
  if(!verificationRequest.current || verificationRequest.current.token!==token){
   const promise=fetch(API+'/account/email/verify',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:'Neizdevās apstiprināt e-pastu.');return data;});
   verificationRequest.current={token,promise};
  }
  verificationRequest.current.promise.then(async()=>{if(!active)return;setConfirmed(true);window.history.replaceState({},'',window.location.pathname);await onContinue();}).catch(e=>{if(active)setError(e.message);});
  return ()=>{active=false;};
 },[token,onContinue]);
 useEffect(()=>{
  if(token || !user)return;
  const controller=new AbortController();let checking=false;
  async function check(){
   if(checking || document.visibilityState==='hidden')return;
   checking=true;
   try{const response=await fetch(API+'/me',{credentials:'include',cache:'no-store',signal:controller.signal});
    if(response.ok){const account=await response.json();if(account.id===user.id && account.email_verified && !controller.signal.aborted)await onContinue();}
   }catch{/* Retry when the tab is focused again or at the next interval. */}finally{checking=false;}
  }
  check();window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);
  const interval=window.setInterval(check,15000);
  return ()=>{controller.abort();window.clearInterval(interval);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
 },[token,user,onContinue]);
 async function action(){setBusy(true);setError('');setNotice('');try{const response=await fetch(API+'/account/email/resend',{method:'POST',credentials:'include'});const data=await response.json();if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:'Neizdevās nosūtīt saiti.');setNotice(data.message);setCooldown(true);setTimeout(()=>setCooldown(false),60000);}catch(e){setError(e.message);}finally{setBusy(false);}}

 return <main className="email-verification"><div className="email-verification-icon">{confirmed?<CheckCircle2 size={30}/>:<Mail size={30}/>}</div><h1>{confirmed?'E-pasts apstiprināts':token?(error?'Neizdevās apstiprināt e-pastu':'Apstiprinām e-pastu…'):'Pārbaudi savu e-pastu'}</h1><p>{confirmed?'Tagad vari turpināt darbu PROPFOLIO.':token?'Saites atvēršana automātiski apstiprina tavu e-pasta adresi.':'Lai pabeigtu reģistrāciju un pievienotu īpašumus, atver apstiprinājuma saiti e-pastā.'}</p>{!token && user && <p><strong>{user.email}</strong></p>}{!token && <p className="email-verification-help">Lokālās testēšanas režīms: vēstules tiek saglabātas testa pastkastē datorā un netiek nosūtītas uz īsto e-pastu. Saite derīga 24 stundas.</p>}{error && <p role="alert" className="email-verification-error">{error}</p>}{notice && <p role="status">{notice}</p>}{!token && <button disabled={busy || cooldown} onClick={action}>{busy?'Lūdzu, uzgaidi…':cooldown?'Atkārtoti var nosūtīt pēc 60 sekundēm':'Nosūtīt saiti vēlreiz'}</button>}<div className="email-verification-links">{token && (error || confirmed) && <button onClick={onContinue}>Atgriezties kontā</button>}{!token && onProfile && <button onClick={onProfile}>Mans profils</button>}{!token && onLogout && <button onClick={onLogout}>Iziet</button>}</div></main>;
}
