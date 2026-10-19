import {useState} from "react";
import {Mail,LockKeyhole,UserRound,Eye,EyeOff} from "lucide-react";
export default function AuthField({type="text",...props}) {
 const [visible,setVisible]=useState(false);
 const password=type==="password", Icon=password?LockKeyhole:type==="email"?Mail:UserRound;
 return <div className="auth-field"><Icon className="auth-field-icon" size={18} aria-hidden="true"/><input {...props} type={password&&visible?"text":type}/>{password&&<button className="auth-password-toggle" type="button" aria-label={visible?"Paslēpt paroli":"Parādīt paroli"} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button>}</div>;
}
