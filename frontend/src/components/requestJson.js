export async function requestJson(url, options = {}) {
    let response;
    try { response = await fetch(url, {credentials:'include', ...options}); }
    catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('Neizdevās savienoties ar serveri. Pārbaudi savienojumu un mēģini vēlreiz.', {cause:error});
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        if(response.status===401 && typeof window!=="undefined")window.dispatchEvent(new CustomEvent("propfolio-session-expired"));
        const error = new Error(response.status === 401 ? 'Sesija ir beigusies. Lūdzu, ieej savā kontā vēlreiz.' : typeof data?.detail === 'string' ? data.detail : data?.detail?.message || 'Neizdevās pabeigt darbību. Pārbaudi ievadītos datus un mēģini vēlreiz.');
        error.status = response.status;
        throw error;
    }
    return data;
}
