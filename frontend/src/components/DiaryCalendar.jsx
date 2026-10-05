import { useEffect, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Receipt,
    Landmark,
    HousePlug,
    Hammer,
    Banknote,
    MoreVertical,
} from "lucide-react";
import "./DiaryCalendar.css";

function DiaryCalendar({ property }) {
    const today = new Date();

    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const [currentDate, setCurrentDate] = useState(today);
    const [showEntryMenu, setShowEntryMenu] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    const [expenseForm, setExpenseForm] = useState({
        entry_date: "",
        title: "",
        amount: "",
        supplier: "",
        room: "",
        notes: "",
    });

    const [isSavingExpense, setIsSavingExpense] = useState(false);
    const [expenseError, setExpenseError] = useState("");

    const [diaryEntries, setDiaryEntries] = useState([]);

    const [selectedDate, setSelectedDate] = useState(() => {
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = new Intl.DateTimeFormat("lv-LV", {
        month: "long",
    }).format(currentDate);

    const calendarTitle =
        `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

    const firstDay = new Date(year, month, 1);

    // Pirmdiena = 0, Svētdiena =6
    const startingDay = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = [
        ...Array(startingDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    function changeMonth(direction) {
        setCurrentDate(new Date(year, month + direction, 1));
    }

    function handleExpenseChange(event) {
        const { name, value } = event.target;

        setExpenseForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function fetchDiaryEntries() {
        try {
            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Neizdevās ielādēt dienasgrāmatas ierakstus.");
            }

            const data = await response.json();

            setDiaryEntries(data);

        } catch (error) {
            console.error("Diary GET error:", error);
        }
    }

    useEffect(() => {
        if (property?.property_id) {
            fetchDiaryEntries();
        }
    }, [property?.property_id]);

    async function handleExpenseSave() {
        if (
            !expenseForm.entry_date ||
            !expenseForm.title.trim() ||
            !expenseForm.amount
        ) {
            setExpenseError(
                "Lūdzu aizpildi datumu, aprakstu un summu."
            );
            return;
        }

        try {
            setIsSavingExpense(true);
            setExpenseError("");

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary/expenses`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entry_date: expenseForm.entry_date,
                        title: expenseForm.title.trim(),
                        amount: Number(expenseForm.amount),
                        supplier: expenseForm.supplier.trim() || null,
                        room: expenseForm.room.trim() || null,
                        notes: expenseForm.notes.trim() || null,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail || "Neizdevās saglabāt izdevumu."
                );
            }

            const savedExpense = await response.json();

            console.log("Saglabāts izdevums:", savedExpense);

            await fetchDiaryEntries();

            setShowExpenseModal(false);

        } catch (error) {
            console.error(error);

            setExpenseError(
                error.message || "Neizdevās saglabāt izdevumu."
            );
        } finally {
            setIsSavingExpense(false);
        }
    }

    function selectDay(day) {
        if (!day) return;

        const date = new Date(year, month, day);

        const formattedDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
        ].join("-");

        setSelectedDate(formattedDate);
    }

    const monthNames = [
        "Janvāris",
        "Februāris",
        "Marts",
        "Aprīlis",
        "Maijs",
        "Jūnijs",
        "Jūlijs",
        "Augusts",
        "Septembris",
        "Oktobris",
        "Novembris",
        "Decembris",
    ];

    let selectedDateLabel = "";

    if (selectedDate) {
        const [selectedYear, selectedMonth, selectedDay] =
            selectedDate.split("-");

        selectedDateLabel =
            `${Number(selectedDay)}. ${monthNames[Number(selectedMonth) - 1]},
                ${selectedYear}`;
    }

    let expenseDateLabel = "";

    if (expenseForm.entry_date) {
        const [expenseYear, expenseMonth, expenseDay] =
            expenseForm.entry_date.split("-");

        expenseDateLabel =
            `${Number(expenseDay)}. ${monthNames[Number(expenseMonth) - 1]}, ${expenseYear}`;
    }

    const selectedDateEntries = diaryEntries.filter(
        (entry) => entry.entry_date === selectedDate
    );

    return (
        <div className="diary-calendar-layout">

            <div className="diary-calendar-sidebar">

                <div className="diary-calendar-header">
                    <h3>{calendarTitle}</h3>

                    <div className="diary-calendar-controls">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            aria-label="Iepriekšējais mēnesis"
                        >
                            <ChevronLeft size={17} strokeWidth={2} />
                        </button>

                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            aria-label="Nākamais mēnesis"
                        >
                            <ChevronRight size={17} strokeWidth={2} />
                        </button>
                    </div>
                </div>

                <div className="diary-calendar-grid">
                    {["P", "O", "T", "C", "P", "S", "Sv"].map((day, index) => (
                        <div
                            className="diary-calendar-weekday"
                            key={index}
                        >
                            {day}
                        </div>
                    ))}

                    {calendarDays.map((day, index) => {
                        const dateKey = day
                            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                            : null;

                        const dayEntryTypes = dateKey
                            ? [
                                ...new Set(
                                    diaryEntries
                                        .filter((entry) => entry.entry_date === dateKey)
                                        .map((entry) => entry.entry_type)
                                ),
                            ]
                            : [];

                        return day ? (
                            <button
                                key={dateKey}
                                type="button"
                                className={[
                                    "diary-calendar-day",
                                    selectedDate === dateKey ? "selected" : "",
                                    todayKey === dateKey ? "today" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onClick={() => selectDay(day)}
                            >
                                <span className="diary-calendar-day-number">
                                    {day}
                                </span>

                                <span className="diary-calendar-entry-dots">
                                    {dayEntryTypes.map((entryType) => (
                                        <span
                                            key={entryType}
                                            className={`diary-calendar-entry-dot ${entryType}`}
                                        />
                                    ))}
                                </span>
                            </button>
                        ) : (
                            <div key={`empty-${index}`} />
                        );
                    })}
                </div>

                <div className="diary-calendar-legend">
                    <div className="diary-calendar-legend-item">
                        <span className="diary-legend-dot expense"></span>
                        <span>Izmaksas</span>
                    </div>

                    {property?.financing_type === "mortgage" && (
                        <div className="diary-calendar-legend-item">
                            <span className="diary-legend-dot loan"></span>
                            <span>Kredīta maksājumi</span>
                        </div>
                    )}


                    <div className="diary-calendar-legend-item">
                        <span className="diary-legend-dot utilities"></span>
                        <span>Komunālie maksājumi</span>
                    </div>

                    <div className="diary-calendar-legend-item">
                        <span className="diary-legend-dot work"></span>
                        <span>Darba dienas</span>
                    </div>

                    <div className="diary-calendar-legend-item">
                        <span className="diary-legend-dot rent"></span>
                        <span>Saņemtā īre</span>
                    </div>
                </div>

            </div>

            <div className="diary-calendar-content">

                {selectedDate ? (
                    <>
                        <div className="diary-selected-date-header">
                            <h3>
                                {selectedDateLabel}
                            </h3>

                            <div className="diary-add-entry">
                                <button
                                    type="button"
                                    className="diary-add-entry-button"
                                    onClick={() => setShowEntryMenu((prev) => !prev)}
                                >
                                    <span className="diary-add-entry-plus">+</span>
                                    <span>Pievienot ierakstu</span>
                                </button>

                                {showEntryMenu && (
                                    <div className="diary-entry-menu">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEntryMenu(false);

                                                setExpenseForm({
                                                    entry_date: selectedDate,
                                                    title: "",
                                                    amount: "",
                                                    supplier: "",
                                                    room: "",
                                                    notes: "",
                                                });
                                                setShowExpenseModal(true);
                                            }}
                                        >
                                            <span className="diary-entry-menu-icon expense">
                                                <Receipt size={14} />
                                            </span>
                                            <span>Izmaksas</span>
                                        </button>

                                        {property?.financing_type === "mortgage" && (
                                            <button type="button">
                                                <span className="diary-entry-menu-icon loan">
                                                    <Landmark size={14} />
                                                </span>
                                                <span>Kredīta maksājums</span>
                                            </button>
                                        )}

                                        <button type="button">
                                            <span className="diary-entry-menu-icon utilities">
                                                <HousePlug size={14} />
                                            </span>
                                            <span>Komunālie maksājumi</span>
                                        </button>

                                        <button type="button">
                                            <span className="diary-entry-menu-icon work">
                                                <Hammer size={14} />
                                            </span>
                                            <span>Darba diena</span>
                                        </button>

                                        <button type="button">
                                            <span className="diary-entry-menu-icon rent">
                                                <Banknote size={14} />
                                            </span>
                                            <span>Saņemtā īre</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>

                        {selectedDateEntries.length > 0 ? (
                            <div className="diary-day-entries">
                                {selectedDateEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={`diary-entry-card ${entry.entry_type}`}
                                    >
                                        <div className="diary-entry-icon expense">
                                            <Receipt size={17} strokeWidth={2} />
                                        </div>

                                        <div className="diary-entry-description">
                                            <span className="diary-entry-type">
                                                Izmaksas
                                            </span>

                                            <span className="diary-entry-title">
                                                {entry.title}
                                            </span>
                                        </div>

                                        <div className="diary-entry-value">
                                            <strong>
                                                €{Number(entry.amount).toFixed(2)}
                                            </strong>

                                            <span>
                                                {entry.supplier || "—"}
                                            </span>
                                        </div>

                                        <div className="diary-entry-time">
                                            {new Date(entry.created_at).toLocaleTimeString(
                                                "lv-LV",
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="diary-entry-more"
                                            aria-label="Ieraksta darbības"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="diary-empty-state">
                                <p>Šajā datumā pagaidām nav ierakstu.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="diary-empty-state">
                        Izvēlies datumu kalendārā.
                    </div>
                )}

            </div>

            {showExpenseModal && (
                <div
                    className="diary-modal-overlay"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowExpenseModal(false);
                        }
                    }}
                >
                    <div className="diary-modal">
                        <div className="diary-modal-header">
                            <div>
                                <span className="diary-modal-eyebrow">
                                    IZMAKSAS
                                </span>

                                <h3>Pievienot izdevumu</h3>
                            </div>

                            <button
                                type="button"
                                className="diary-modal-close"
                                onClick={() => setShowExpenseModal(false)}
                                aria-label="Aizvērt"
                            >
                                x
                            </button>
                        </div>

                        <p className="diary-modal-date">
                            {expenseDateLabel}
                        </p>

                        <div className="diary-expense-form">

                            <div className="diary-form-group">
                                <label htmlFor="expense-date">
                                    Datums
                                </label>

                                <input
                                    id="expense-date"
                                    type="date"
                                    name="entry_date"
                                    value={expenseForm.entry_date}
                                    onChange={handleExpenseChange}
                                />
                            </div>

                            <div className="diary-form-group">
                                <label htmlFor="expense-title">
                                    Apraksts
                                </label>

                                <input
                                    id="expense-title"
                                    type="text"
                                    name="title"
                                    value={expenseForm.title}
                                    onChange={handleExpenseChange}
                                    placeholder="Piem. Flīzes vannas istabai"
                                />
                            </div>

                            <div className="diary-form-row">

                                <div className="diary-form-group">
                                    <label htmlFor="expense-amount">
                                        Summa (€)
                                    </label>

                                    <input
                                        id="expense-amount"
                                        type="number"
                                        name="amount"
                                        value={expenseForm.amount}
                                        onChange={handleExpenseChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="diary-form-group">
                                    <label htmlFor="expense-supplier">
                                        Piegādātājs/ veikals
                                    </label>

                                    <input
                                        id="expense-supplier"
                                        type="text"
                                        name="supplier"
                                        value={expenseForm.supplier}
                                        onChange={handleExpenseChange}
                                        placeholder="Piem. DEPO"
                                    />
                                </div>

                            </div>

                            <div className="diary-form-group">
                                <label htmlFor="expense-room">
                                    Telpa
                                </label>

                                <input
                                    id="expense-room"
                                    type="text"
                                    name="room"
                                    value={expenseForm.room}
                                    onChange={handleExpenseChange}
                                    placeholder="Piem. Vannas istaba"
                                />
                            </div>

                            <div className="diary-form-group">
                                <label htmlFor="expense-notes">
                                    Piezīmes
                                    <span> (nav obligāti)</span>
                                </label>

                                <textarea
                                    id="expense-notes"
                                    name="notes"
                                    value={expenseForm.notes}
                                    onChange={handleExpenseChange}
                                    placeholder="Papildu informācija par izdevumu..."
                                    rows="3"
                                />
                            </div>

                        </div>


                        {expenseError && (
                            <p className="diary-form-error">
                                {expenseError}
                            </p>
                        )}

                        <div className="diary-modal-actions">
                            <button
                                type="button"
                                className="diary-modal-cancel"
                                onClick={() => setShowExpenseModal(false)}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="diary-modal-save"
                                onClick={handleExpenseSave}
                                disabled={isSavingExpense}
                            >
                                {isSavingExpense ? "Saglabā..." : "Saglabāt"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default DiaryCalendar;