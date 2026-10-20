const key=(propertyId,kind)=>`propfolio-analysis-draft-${kind}-${propertyId}`;
export function readAnalysisDraft(propertyId,kind) {
    try {
        const data=JSON.parse(sessionStorage.getItem(key(propertyId,kind)));
        return data && data.expires>Date.now() && data.draft && typeof data.draft==='object' && !Array.isArray(data.draft) ? data : null;
    } catch {return null;}
}
export function saveAnalysisDraft(propertyId,kind,draft,step,base) {
    try {sessionStorage.setItem(key(propertyId,kind),JSON.stringify({draft,step,base:base??null,expires:Date.now()+24*60*60*1000}));} catch {/* Editing continues if browser storage is unavailable. */}
}
export function clearAnalysisDraft(propertyId,kind) {
    try {sessionStorage.removeItem(key(propertyId,kind));} catch {/* Browser storage is optional. */}
}
