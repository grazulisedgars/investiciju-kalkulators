import { useEffect, useState } from 'react';

export default function useAnalysisDiary(propertyId) {
    const [state,setState] = useState({ entries:[],loading:true,error:false });
    const [retry,setRetry] = useState(0);
    useEffect(()=>{
        const controller = new AbortController(); let revision=0;
        async function load() {
            const current=++revision;
            try {
                const response=await fetch(`http://localhost:8000/properties/${propertyId}/diary`,{credentials:'include',cache:'no-store',signal:controller.signal});
                if (!response.ok) throw new Error('diary');
                const entries=await response.json();
                if (!controller.signal.aborted && current===revision) setState({entries,loading:false,error:false});
            } catch { if (!controller.signal.aborted && current===revision) setState({entries:[],loading:false,error:true}); }
        }
        load(); window.addEventListener('focus',load);
        return ()=>{controller.abort();window.removeEventListener('focus',load);};
    },[propertyId,retry]);
    return {...state,reload:()=>setRetry(n=>n+1)};
}
