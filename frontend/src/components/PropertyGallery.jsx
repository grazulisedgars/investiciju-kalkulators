import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Pencil, Trash2, ImagePlus, ChevronDown, Check } from "lucide-react";
import "./PropertyExpenses.css";
import "./PropertyGallery.css";
import FormDatePicker from "./FormDatePicker";

const API = "http://localhost:8000";
const categories = [
    { id: "initial", label: "Sākotnējais stāvoklis" },
    { id: "renovation", label: "Remonts" },
    { id: "finished", label: "Pabeigts" },
];
function today() {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function formatDate(date) { return date.split("-").reverse().join("."); }
async function readResponse(response) {
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Neizdevās saglabāt foto. Pārbaudi ievadītos datus.");
    return data;
}

// Dialogā ierobežojam Tab navigāciju un pēc aizvēršanas atjaunojam fokusu.
function useDialogFocus(ref, active = true) {
    useEffect(() => {
        if (!active) return;
        const previous = document.activeElement;
        const dialog = ref.current;
        dialog?.focus();
        function handleTab(event) {
            if (event.key !== "Tab" || !dialog) return;
            const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
            if (!controls.length) { event.preventDefault(); return; }
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
        }
        dialog?.addEventListener("keydown", handleTab);
        return () => { dialog?.removeEventListener("keydown", handleTab); previous?.focus(); };
    }, [ref, active]);
}

// Pielāgota kategoriju izvēlne ar tastatūras navigāciju un zaļo dizainu.
function GalleryCategorySelect({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const selectedIndex = categories.findIndex((item) => item.id === value);
    const [activeIndex, setActiveIndex] = useState(selectedIndex);
    useEffect(() => {
        if (!open) return;
        function closeOutside(event) {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        }
        document.addEventListener("mousedown", closeOutside);
        return () => document.removeEventListener("mousedown", closeOutside);
    }, [open]);
    function choose(index) {
        onChange(categories[index].id);
        setOpen(false);
        triggerRef.current?.focus();
    }
    function handleKey(event) {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => event.key === "Home" ? 0 : event.key === "End" ? categories.length - 1 :
                !open ? selectedIndex : (current + (event.key === "ArrowDown" ? 1 : -1) + categories.length) % categories.length);
        } else if (event.key === "Escape" && open) {
            event.preventDefault(); event.stopPropagation(); setOpen(false);
        } else if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault(); choose(activeIndex);
        } else if (event.key === "Tab") setOpen(false);
    }
    return <div className="gallery-category-select" ref={rootRef}>
        <button type="button" id="gallery-category" ref={triggerRef} className="gallery-category-trigger"
            role="combobox" aria-expanded={open} aria-controls="gallery-category-options" aria-haspopup="listbox"
            aria-labelledby="gallery-category-label" aria-activedescendant={open ? `gallery-category-${categories[activeIndex].id}` : undefined}
            onKeyDown={handleKey} onClick={() => { setActiveIndex(selectedIndex); setOpen(!open); }}>
            <span>{categories[selectedIndex].label}</span><ChevronDown size={17} className={open ? "is-open" : ""} />
        </button>
        {open && <div id="gallery-category-options" role="listbox" aria-labelledby="gallery-category-label" className="gallery-category-options">
            {categories.map((item, index) => <div id={`gallery-category-${item.id}`} role="option" aria-selected={value === item.id}
                key={item.id} className={`gallery-category-option ${value === item.id ? "selected" : ""} ${activeIndex === index ? "active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
                <span>{item.label}</span>{value === item.id && <Check size={16} />}
            </div>)}
        </div>}
    </div>;
}

function PhotoForm({ propertyId, photo, initialCategory, onClose, onSaved }) {
    const dialogRef = useRef(null);
    const fileInputRef = useRef(null);
    useDialogFocus(dialogRef);
    const [form, setForm] = useState(() => ({ photo_date: photo?.photo_date || today(), category: photo?.category || initialCategory || "initial", description: photo?.description || "" }));
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const previewUrlsRef = useRef([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    // Vietējie priekšskatījumi tiek atbrīvoti, aizverot formu.
    useEffect(() => {
        const urls = previewUrlsRef;
        return () => urls.current.forEach((item) => URL.revokeObjectURL(item.url));
    }, []);
    function chooseFiles(event) {
        const selected = [...event.target.files];
        if (!selected.length) return;
        const size = selected.reduce((total, file) => total + file.size, 0);
        if (selected.length > 20 || size > 50 * 1024 * 1024 || selected.some((file) => file.size > 10 * 1024 * 1024)) {
            setError("Izvēlies līdz 20 foto, katru līdz 10 MB un kopā līdz 50 MB.");
            event.target.value = ""; return;
        }
        if (selected.some((file) => !/\.(jpe?g|png|webp)$/i.test(file.name) && !["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/webp"].includes(file.type))) {
            setError("Atļauti JPG, PNG un WebP attēli."); event.target.value = ""; return;
        }
        previewUrlsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
        const items = selected.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
        previewUrlsRef.current = items;
        setPreviews(items); setError(""); setFiles(selected);
        event.target.value = "";
    }
    // Izņemam tikai vietējo izvēli; serverī foto vēl nav saglabāts.
    function removeFile(index) {
        const items = previewUrlsRef.current;
        URL.revokeObjectURL(items[index].url);
        const remaining = items.filter((_, itemIndex) => itemIndex !== index);
        previewUrlsRef.current = remaining;
        setPreviews(remaining);
        setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
        setError("");
    }
    async function save(event) {
        event.preventDefault();
        if (busy) return;
        if (!photo && !files.length) { setError("Izvēlies vismaz vienu foto."); return; }
        setBusy(true); setError("");
        try {
            let options, url = `${API}/properties/${propertyId}/gallery`;
            if (photo) {
                url += `/${photo.id}`;
                options = { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, description: form.description.trim() || null }) };
            } else {
                const body = new FormData();
                files.forEach((file) => body.append("photos", file));
                body.append("photo_date", form.photo_date); body.append("category", form.category); body.append("description", form.description.trim());
                options = { method: "POST", body };
            }
            const data = await readResponse(await fetch(url, { ...options, credentials: "include" }));
            onSaved(photo ? [data] : data);
            onClose();
        } catch (error) { setError(error.message || "Neizdevās saglabāt foto."); }
        finally { setBusy(false); }
    }
    return <div className="gallery-overlay" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
        <div ref={dialogRef} tabIndex={-1} className="gallery-form-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-form-title" onKeyDown={(event) => { if (event.key === "Escape" && !busy) { event.stopPropagation(); onClose(); } }}>
            <div className="gallery-dialog-header"><h3 id="gallery-form-title">{photo ? "Rediģēt foto datus" : "Pievienot foto"}</h3><button type="button" aria-label="Aizvērt" onClick={onClose} disabled={busy}><X size={20} /></button></div>
            <form onSubmit={save}>
                <fieldset disabled={busy}>
                    {!photo && <div className="diary-form-group">
                        <label>Foto</label>
                        <input ref={fileInputRef} id="gallery-files" className="gallery-hidden-file-input" type="file" multiple accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={chooseFiles} />
                        <div className="gallery-file-picker">
                            <button type="button" className="gallery-file-select" onClick={() => fileInputRef.current?.click()}><ImagePlus size={18} />Izvēlēties foto</button>
                            <span aria-live="polite">{files.length ? `Izvēlēti foto: ${files.length}` : "Nav izvēlētu foto"}</span>
                        </div>
                        <small>JPG, PNG vai WebP. Līdz 20 foto; 10 MB katram, 50 MB kopā.</small>
                    </div>}
                    {!!previews.length && <div className="gallery-upload-previews">{previews.map((item, index) => <div className="gallery-upload-preview" key={item.url}>
                        <img src={item.url} alt={item.name} />
                        <button type="button" className="gallery-preview-remove" aria-label={`Izņemt foto: ${item.name}`} title="Izņemt foto" onClick={() => removeFile(index)}><X size={12} strokeWidth={2} /></button>
                    </div>)}</div>}
                    {photo && <img className="gallery-edit-preview" src={`${API}${photo.image_url}`} alt={photo.description || photo.filename} />}
                    <FormDatePicker id="gallery-date" value={form.photo_date} disabled={busy} onChange={(photo_date) => setForm({ ...form, photo_date })} />
                    <div className="diary-form-group"><label id="gallery-category-label" htmlFor="gallery-category">Kategorija</label><GalleryCategorySelect value={form.category} onChange={(category) => setForm({ ...form, category })} /></div>
                    <div className="diary-form-group"><label htmlFor="gallery-description">Apraksts <span>(nav obligāts)</span></label><textarea id="gallery-description" maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Kas redzams foto?" /></div>
                    {!photo && files.length > 1 && <p className="gallery-form-hint">Datums, kategorija un apraksts tiks piemērots visiem {files.length} foto. Vēlāk tos varēsi labot katram atsevišķi.</p>}
                </fieldset>
                {error && <p className="diary-form-error" role="alert">{error}</p>}
                <div className="gallery-dialog-actions"><button type="button" className="gallery-action-button gallery-action-cancel" onClick={onClose} disabled={busy}>Atcelt</button><button type="submit" className="gallery-action-button gallery-action-save" disabled={busy}>{busy ? "Saglabā..." : photo ? "Saglabāt" : "Augšupielādēt"}</button></div>
            </form>
        </div>
    </div>;
}

// Atsevišķs dzēšanas apstiprinājums pārējo sadaļu modāļu stilā.
function PhotoDeleteDialog({ photo, busy, error, onCancel, onDelete }) {
    const dialogRef = useRef(null);
    useDialogFocus(dialogRef);
    return <div className="gallery-overlay gallery-delete-overlay" onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
    }}>
        <div ref={dialogRef} tabIndex={-1} className="diary-delete-modal gallery-delete-dialog" role="alertdialog"
            aria-modal="true" aria-labelledby="gallery-delete-title" aria-describedby="gallery-delete-description"
            onKeyDown={(event) => { if (event.key === "Escape" && !busy) { event.stopPropagation(); onCancel(); } }}>
            <div className="diary-delete-heading"><div className="diary-delete-icon"><Trash2 size={18} /></div><h3 id="gallery-delete-title">Dzēst foto?</h3></div>
            <p id="gallery-delete-description">Vai tiešām vēlies dzēst foto no {formatDate(photo.photo_date)}? Šo darbību nevarēs atsaukt.</p>
            {error && <p className="diary-form-error" role="alert">{error}</p>}
            <div className="gallery-dialog-actions">
                <button type="button" className="gallery-action-button gallery-action-cancel" onClick={onCancel} disabled={busy}>Atcelt</button>
                <button type="button" className="gallery-delete" onClick={onDelete} disabled={busy}><Trash2 size={16} />{busy ? "Dzēš..." : "Dzēst foto"}</button>
            </div>
        </div>
    </div>;
}

function PhotoPreview({ photo, index, count, busy, error, onClose, onNavigate, onEdit, onDelete }) {
    const dialogRef = useRef(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    useDialogFocus(dialogRef, !confirmDelete);
    if (confirmDelete) return <PhotoDeleteDialog photo={photo} busy={busy} error={error} onCancel={() => setConfirmDelete(false)} onDelete={onDelete} />;
    return <div className="gallery-overlay" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
        <div ref={dialogRef} tabIndex={-1} className="gallery-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-preview-title" onKeyDown={(event) => {
            if (busy) return;
            if (event.key === "Escape") onClose();
            if (!confirmDelete && event.key === "ArrowLeft") onNavigate(-1);
            if (!confirmDelete && event.key === "ArrowRight") onNavigate(1);
        }}>
            <div className="gallery-dialog-header"><h3 id="gallery-preview-title">{categories.find((item) => item.id === photo.category)?.label} · {formatDate(photo.photo_date)}</h3><button type="button" aria-label="Aizvērt" disabled={busy} onClick={onClose}><X size={20} /></button></div>
            <div className="gallery-preview-image"><img src={`${API}${photo.image_url}`} alt={photo.description || photo.filename} />{count > 1 && <><button type="button" className="gallery-previous" aria-label="Iepriekšējais foto" disabled={busy || confirmDelete} onClick={() => onNavigate(-1)}><ChevronLeft /></button><button type="button" className="gallery-next" aria-label="Nākamais foto" disabled={busy || confirmDelete} onClick={() => onNavigate(1)}><ChevronRight /></button></>}</div>
            <div className="gallery-preview-details"><span>{index + 1} / {count}</span>{photo.description && <p>{photo.description}</p>}
                <div className="gallery-dialog-actions"><button type="button" className="gallery-action-button gallery-action-cancel" onClick={onEdit}><Pencil size={16} />Rediģēt datus</button><button type="button" className="gallery-delete" onClick={() => setConfirmDelete(true)}><Trash2 size={16} />Dzēst foto</button></div>
                {error && <p className="diary-form-error" role="alert">{error}</p>}
            </div>
        </div>
    </div>;
}

export default function PropertyGallery({ property }) {
    const [photos, setPhotos] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [retry, setRetry] = useState(0);
    const visible = photos.filter((photo) => filter === "all" || photo.category === filter);
    const selectedIndex = visible.findIndex((photo) => photo.id === selectedId);
    const selected = visible[selectedIndex];
    const modalOpen = !!form || !!selected;
    useEffect(() => {
        if (!modalOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [modalOpen]);
    // Atceļam novecojušu GET pieprasījumu, ja īpašums vai sadaļa mainās.
    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            try {
                const data = await readResponse(await fetch(`${API}/properties/${property.property_id}/gallery`, { credentials: "include", signal: controller.signal }));
                if (!controller.signal.aborted) { setPhotos(data); setError(""); }
            } catch (error) { if (!controller.signal.aborted) setError(error.message); }
            finally { if (!controller.signal.aborted) setLoading(false); }
        }
        load();
        return () => controller.abort();
    }, [property.property_id, retry]);
    const saved = useCallback((items) => {
        // Clear the preview selection after saving to prevent filter changes reopening it.
        setSelectedId(null);
        setDeleteError("");
        setPhotos((current) => {
            const updatedIds = new Set(items.map((item) => item.id));
            return [...current.filter((item) => !updatedIds.has(item.id)), ...items].sort((a, b) => a.photo_date.localeCompare(b.photo_date) || a.id - b.id);
        });
    }, []);
    function navigate(direction) { setDeleteError(""); setSelectedId(visible[(selectedIndex + direction + visible.length) % visible.length].id); }
    async function deletePhoto() {
        if (!selected || deleting) return;
        setDeleting(true); setDeleteError("");
        try {
            await readResponse(await fetch(`${API}/properties/${property.property_id}/gallery/${selected.id}`, { method: "DELETE", credentials: "include" }));
            setPhotos((current) => current.filter((photo) => photo.id !== selected.id)); setSelectedId(null);
        } catch (error) { setDeleteError(error.message); }
        finally { setDeleting(false); }
    }
    return <section className="property-gallery">
        <div className="property-expenses-header"><div><h2>Galerija</h2><p>Pievieno fotoattēlus no īpašuma stāvokļa, remonta procesa un rezultāta.</p></div><button type="button" className="property-expenses-add" onClick={() => setForm({ photo: null })}><Plus size={17} />Pievienot foto</button></div>
        <div className="gallery-filters" role="group" aria-label="Foto kategorijas">{[{ id: "all", label: "Visi" }, ...categories].map((item) => <button type="button" key={item.id} aria-pressed={filter === item.id} className={filter === item.id ? "active" : ""} onClick={() => { setSelectedId(null); setDeleteError(""); setFilter(item.id); }}>{item.label}</button>)}</div>
        {loading ? <p className="property-expenses-empty">Ielādē foto...</p> : error ? <div className="property-expenses-empty" role="alert">{error}<button type="button" className="gallery-retry" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Mēģināt vēlreiz</button></div> : <>
            {!visible.length && <p className="gallery-empty">{filter === "all" ? "Galerijā vēl nav foto. Pievieno pirmo foto, lai sāktu dokumentēt īpašuma pārmaiņas." : "Šajā kategorijā vēl nav foto."}</p>}
            <div className="gallery-grid">{visible.map((photo) => <figure key={photo.id} className="gallery-card"><button type="button" className="gallery-photo-button" aria-label={`Atvērt foto: ${photo.description || photo.filename}`} onClick={() => { setSelectedId(photo.id); setDeleteError(""); }}><img loading="lazy" src={`${API}${photo.image_url}`} alt={photo.description || photo.filename} /></button><figcaption><time dateTime={photo.photo_date}>{formatDate(photo.photo_date)}</time></figcaption></figure>)}<button type="button" className="gallery-add-tile" onClick={() => setForm({ photo: null })}><ImagePlus size={27} /><span>Pievienot foto</span></button></div>
        </>}
        {selected && !form && <PhotoPreview key={selected.id} photo={selected} index={selectedIndex} count={visible.length} busy={deleting} error={deleteError} onClose={() => setSelectedId(null)} onNavigate={navigate} onEdit={() => setForm({ photo: selected })} onDelete={deletePhoto} />}
        {form && <PhotoForm propertyId={property.property_id} photo={form.photo} initialCategory={filter === "all" ? "initial" : filter} onClose={() => setForm(null)} onSaved={saved} />}
    </section>;
}
