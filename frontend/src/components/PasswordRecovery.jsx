import {useRef,useState} from 'react';
import AuthField from './AuthField';
import {passwordRules} from './passwordRules';
import {requestJson} from './requestJson';
import './Login.css';
import './AuthMobile.css';

export default function PasswordRecovery({token,onBack}) {
    const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
    const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[complete,setComplete]=useState(false);
    const submitting=useRef(false);
    async function submit(event) {
        event.preventDefault();if(submitting.current)return;setError('');setNotice('');
        if(token && (!passwordRules.every(([,test])=>test(password)) || password!==confirm)){setError('Pārbaudi paroles prasības un pārliecinies, ka paroles sakrīt.');return;}
        submitting.current=true;setBusy(true);
        try {
            const data=await requestJson('http://localhost:8000/account/password/'+(token?'reset':'request'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(token?{token,password,confirm_password:confirm}:{email:email.trim()})});
            setNotice(data.message);if(token){setComplete(true);setPassword('');setConfirm('');}
        } catch(e){setError(e.message);}finally{submitting.current=false;setBusy(false);}
    }
    return <main className="app"><section className="login-page"><button type="button" className="back-button" onClick={onBack}>← Atpakaļ uz ieiešanu</button><div className="login-card"><div className="login-header"><p className="login-eyebrow">PROPFOLIO</p><h1>{token?'Izveido jaunu paroli':'Atjauno paroli'}</h1><p>{token?'Izvēlies drošu paroli savam profilam.':'Ievadi sava konta e-pastu, lai pieprasītu paroles atjaunošanas saiti.'}</p></div>{!complete && <form className="login-form" onSubmit={submit}>{!token?<div className="input-group"><label htmlFor="recovery-email">E-pasts</label><AuthField id="recovery-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={busy} placeholder="Ievadi savu e-pastu"/></div>:<><div className="input-group"><label htmlFor="recovery-password">Jaunā parole</label><AuthField id="recovery-password" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} maxLength={128} disabled={busy} aria-describedby="recovery-rules"/><small id="recovery-rules">Vismaz 8 rakstzīmes, lielais un mazais burts, cipars un speciālais simbols.</small></div><div className="input-group"><label htmlFor="recovery-confirm">Atkārtot paroli</label><AuthField id="recovery-confirm" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required disabled={busy}/></div></>}<button className="login-submit" disabled={busy}>{busy?'Lūdzu, uzgaidi…':token?'Saglabāt paroli':'Nosūtīt atjaunošanas saiti'}</button></form>}{error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p role="status" className="app-status">{notice}</p>}{!token&&<p className="auth-recovery-help">Lokālajā testa režīmā vēstule tiek saglabāta datora testa pastkastē un netiek nosūtīta uz īsto e-pastu.</p>}{complete&&<button className="login-submit" onClick={onBack}>Ieiet profilā</button>}</div></section></main>;
}
