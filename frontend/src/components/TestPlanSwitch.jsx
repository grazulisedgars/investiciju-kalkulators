import {useState} from 'react';
import './TestPlanSwitch.css';
export default function TestPlanSwitch({user,onUserUpdated}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!user?.test_plan_switch_enabled)return null;
 async function change(plan){if(busy || plan===user.plan)return;setBusy(true);setError('');try{const response=await fetch('http://localhost:8000/account/profile/test-plan',{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan})});const data=await response.json();if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:'Neizdevās pārslēgt testa plānu.');onUserUpdated(data);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <aside className="test-plan-switch" aria-label="Plāna testēšana"><span>Testa režīms</span><div role="group" aria-label="Testa plāns">{['basic','pro'].map(plan=><button key={plan} aria-pressed={user.plan===plan} disabled={busy} onClick={()=>change(plan)}>{plan.toUpperCase()}</button>)}</div><small>{busy?'Pārslēdz…':'Bez maksājumiem · dati saglabājas'}</small>{error && <p role="alert">{error}</p>}</aside>;
}
