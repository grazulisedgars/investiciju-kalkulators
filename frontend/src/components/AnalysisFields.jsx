import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// Mēnešu izvēlne izmanto lapas zaļo stilu un atbalsta tastatūru.
export function MonthSelect({ value, onChange, ...attributes }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(12);
    const root = useRef(null);
    const trigger = useRef(null);
    useEffect(() => {
        if (!open) return;
        function outside(event) { if (!root.current?.contains(event.target)) setOpen(false); }
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    useEffect(() => {
        if (open) root.current?.querySelector(`[data-month="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [open, active]);
    function choose(month) { onChange({ target: { value: String(month) } }); setOpen(false); trigger.current?.focus(); }
    function keys(event) {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault(); setOpen(true);
            setActive(current => event.key === 'Home' ? 0 : event.key === 'End' ? 12 : !open ? Number(value) || 0 : Math.max(0, Math.min(12, current + (event.key === 'ArrowDown' ? 1 : -1))));
        } else if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
        else if (open && ['Enter', ' '].includes(event.key)) { event.preventDefault(); choose(active); }
        else if (event.key === 'Tab') setOpen(false);
    }
    return <div className="advanced-month-select" ref={root}>
        <button {...attributes} ref={trigger} type="button" className="advanced-month-trigger" role="combobox" aria-label="Izīrētie mēneši gadā" aria-haspopup="listbox" aria-expanded={open} aria-controls="advanced-month-options" aria-activedescendant={open ? `advanced-month-${active}` : undefined} onKeyDown={keys} onClick={() => { setActive(Number(value) || 0); setOpen(!open); }}>
            <span>{value !== "" && value != null && Number(value) >= 0 ? value : 'Izvēlies mēnešu skaitu'}</span><ChevronDown size={17} className={open ? 'is-open' : ''} />
        </button>
        {open && <div id="advanced-month-options" role="listbox" aria-label="Izīrētie mēneši gadā" className="advanced-month-options">
            {Array.from({ length: 13 }, (_, index) => index).map(month => <div key={month} id={`advanced-month-${month}`} data-month={month} role="option" aria-selected={Number(value) === month} className={`advanced-month-option ${Number(value) === month ? 'selected' : ''} ${active === month ? 'active' : ''}`} onMouseEnter={() => setActive(month)} onMouseDown={event => event.preventDefault()} onClick={event => { event.preventDefault(); event.stopPropagation(); choose(month); }}><span>{month}</span>{Number(value) === month && <Check size={16} />}</div>)}
        </div>}
    </div>;
}

export function Rows({ rows, totalLabel }) {
    return <dl className="advanced-rows">{rows.map(([label, value]) => <div key={label} className={(totalLabel ? label === totalLabel : label.startsWith("Kopēj") || label === "Gada īre pēc nodokļa") ? "advanced-row-total" : undefined}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

