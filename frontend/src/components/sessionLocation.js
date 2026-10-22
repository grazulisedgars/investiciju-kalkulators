// Keep network/server failures distinct from an absent session.
export async function loadSessionLocation(search, signal, fetcher = fetch) {
    const response = await fetcher('http://localhost:8000/me', {credentials: 'include', signal});
    if (response.status === 401) return {user: null, restoredProperty: null};
    if (!response.ok) throw new Error('Neizdevās pārbaudīt sesiju. Mēģini vēlreiz.');
    const user = await response.json();
    const propertyId = new URLSearchParams(search).get('property');
    let restoredProperty = null;
    if (propertyId) {
        const properties = await fetcher('http://localhost:8000/properties', {credentials: 'include', signal});
        if (properties.status === 401) return {user: null, restoredProperty: null};
        if (!properties.ok) throw new Error('Neizdevās ielādēt īpašumu. Mēģini vēlreiz.');
        restoredProperty = (await properties.json()).find(property => String(property.property_id) === propertyId) || null;
    }
    return {user, restoredProperty};
}
