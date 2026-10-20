import {Children,isValidElement,useEffect,useId,useState} from "react";
import {ChevronUp,ChevronDown} from "lucide-react";
function textOf(node){if(typeof node==="string"||typeof node==="number")return String(node);if(Array.isArray(node))return node.map(textOf).join("");return isValidElement(node)?textOf(node.props.children):"";}
export default function MobileAnalysisPanel({children}) {
 const [mobile,setMobile]=useState(()=>window.matchMedia("(max-width:600px)").matches);
 const [expanded,setExpanded]=useState(true);const id=useId();
 useEffect(()=>{const media=window.matchMedia("(max-width:600px)");const update=()=>setMobile(media.matches);media.addEventListener("change",update);return()=>media.removeEventListener("change",update);},[]);
 const items=Children.toArray(children),heading=items.shift(),title=textOf(heading);
 return <section className="advanced-panel advanced-mobile-panel"><div className="advanced-mobile-panel-header">{heading}<button type="button" className="advanced-panel-toggle" aria-label={`${expanded?"Sakļaut":"Izvērst"}: ${title}`} aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(value=>!value)}>{expanded?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button></div><div id={id} className="advanced-mobile-panel-body" hidden={mobile&&!expanded}>{items}</div></section>;
}
