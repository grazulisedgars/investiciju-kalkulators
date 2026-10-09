import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import "./DiaryCalendar.css";

const months = ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"];
function dateKey(year, month, day) { return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }

// Izmantojam tās pašas kalendāra CSS klases kā pārējo sadaļu formās.
export default function FormDatePicker({ id, value, onChange, disabled = false }) {
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [view, setView] = useState(() => value ? new Date(`${value}T12:00:00`) : new Date());
    const year = view.getFullYear(), month = view.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const days = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
    const now = new Date();
    const today = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
    useEffect(() => {
        if (!open) return;
        function outside(event) { if (!rootRef.current?.contains(event.target)) setOpen(false); }
        document.addEventListener("mousedown", outside);
        return () => document.removeEventListener("mousedown", outside);
    }, [open]);
    function toggle() {
        if (!open && value) setView(new Date(`${value}T12:00:00`));
        setOpen(!open);
    }
    return <div ref={rootRef} className="diary-form-group diary-expense-date-group" onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); }
    }}>
        <label htmlFor={id}>Datums</label>
        <div className="diary-date-picker-field">
            <input id={id} type="text" value={value ? value.split("-").reverse().join(".") : ""} readOnly disabled={disabled} onClick={toggle} />
            <button ref={triggerRef} type="button" className="diary-date-picker-button" disabled={disabled} aria-label="Izvēlēties datumu" aria-expanded={open} aria-controls={`${id}-calendar`} onClick={toggle}><CalendarDays size={17} /></button>
        </div>
        {open && <div id={`${id}-calendar`} className="expense-date-calendar">
            <div className="expense-date-calendar-header"><strong>{months[month]} {year}</strong>
                <div className="expense-date-calendar-navigation">
                    <button type="button" aria-label="Iepriekšējais mēnesis" onClick={() => setView(new Date(year, month - 1, 1))}><ChevronLeft size={17} /></button>
                    <button type="button" aria-label="Nākamais mēnesis" onClick={() => setView(new Date(year, month + 1, 1))}><ChevronRight size={17} /></button>
                </div>
            </div>
            <div className="expense-date-calendar-weekdays">{["P", "O", "T", "C", "P", "S", "Sv"].map((day,index) => <span key={index}>{day}</span>)}</div>
            <div className="expense-date-calendar-grid">{days.map((day,index) => {
                if (!day) return <span key={`empty-${index}`} className="expense-date-calendar-empty" />;
                const key = dateKey(year,month,day);
                return <button key={key} type="button" aria-label={`${day}. ${months[month]}, ${year}`} aria-pressed={key === value} className={[key === today ? "today" : "", key === value ? "selected" : ""].filter(Boolean).join(" ")} onClick={() => { onChange(key); setOpen(false); triggerRef.current?.focus(); }}>{day}</button>;
            })}</div>
        </div>}
    </div>;
}
