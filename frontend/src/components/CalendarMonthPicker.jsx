import {useEffect,useRef,useState} from 'react';
import {ChevronDown} from 'lucide-react';
const months = ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris'];

export default function CalendarMonthPicker({year,month,onChange}) {
    const [open,setOpen]=useState(null);
    const root=useRef(null),yearMenu=useRef(null);
    useEffect(()=>{
        if(!open)return;
        function close(event){if(!root.current?.contains(event.target))setOpen(null);}
        document.addEventListener('mousedown',close);
        const menu=yearMenu.current,selected=menu?.querySelector('[aria-selected="true"]');
        if(menu && selected)menu.scrollTop=selected.offsetTop-menu.clientHeight/2+selected.clientHeight/2;
        return ()=>document.removeEventListener('mousedown',close);
    },[open]);
    function choose(kind,value){onChange(new Date(kind==='year'?value:year,kind==='month'?value:month,1));setOpen(null);root.current?.querySelector(`[data-kind="${kind}"]`)?.focus();}
    const years=Array.from({length:Math.max(new Date().getFullYear()+50,year)-Math.min(1900,year)+1},(_,i)=>Math.min(1900,year)+i);
    return <div className="calendar-month-picker" ref={root} onKeyDown={event=>{if(event.key==='Escape' && open){event.stopPropagation();setOpen(null);root.current?.querySelector(`[data-kind="${open}"]`)?.focus();}}}>
        {['month','year'].map(kind=><div className={`calendar-period-choice ${kind}`} key={kind}>
            <button type="button" data-kind={kind} className="calendar-period-trigger" aria-label={kind==='month'?'Izvēlēties mēnesi':'Izvēlēties gadu'} aria-haspopup="listbox" aria-expanded={open===kind} onClick={()=>setOpen(open===kind?null:kind)}>{kind==='month'?months[month]:year}<ChevronDown size={15}/></button>
            {open===kind && <div ref={kind==='year'?yearMenu:null} className="calendar-period-menu" role="listbox" aria-label={kind==='month'?'Mēneši':'Gadi'}>
                {(kind==='month'?months:years).map((label,index)=>{const value=kind==='month'?index:label;return <button type="button" key={label} role="option" aria-selected={value===(kind==='month'?month:year)} onClick={()=>choose(kind,value)}>{label}</button>;})}
            </div>}
        </div>)}
    </div>;
}
