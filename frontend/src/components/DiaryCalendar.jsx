import { useEffect, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Receipt,
    Landmark,
    HousePlug,
    Hammer,
    Banknote,
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";
import "./DiaryCalendar.css";
import ExpenseModal from "./ExpenseModal";

function DiaryCalendar({ property }) {
    const today = new Date();

    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const [currentDate, setCurrentDate] = useState(today);
    const [showEntryMenu, setShowEntryMenu] = useState(false);
    const entryMenuRef = useRef(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    const [openEntryMenuId, setOpenEntryMenuId] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [isDeletingEntry, setIsDeletingEntry] = useState(false);

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

    useEffect(() => {
        if (!showEntryMenu) {
            return;
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setShowEntryMenu(false);
            }
        }

        function handleClickOutside(event) {
            if (
                entryMenuRef.current &&
                !entryMenuRef.current.contains(event.target)
            ) {
                setShowEntryMenu(false);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEntryMenu]);

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

    const selectedDateEntries = diaryEntries.filter(
        (entry) => entry.entry_date === selectedDate
    );

    async function handleDeleteEntry() {
        if (!entryToDelete) {
            return;
        }

        try {
            setIsDeletingEntry(true);

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary/${entryToDelete.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās izdzēst ierakstu."
                );
            }

            setEntryToDelete(null);

            await fetchDiaryEntries();

        } catch (error) {
            console.error("Diary DELETE error:", error);
        } finally {
            setIsDeletingEntry(false);
        }
    }

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

                            <div
                                className="diary-add-entry"
                                ref={entryMenuRef}
                            >
                                <button
                                    type="button"
                                    className="diary-add-entry-button"
                                    onClick={() => setShowEntryMenu((prev) => !prev)}
                                    aria-expanded={showEntryMenu}
                                    aria-haspopup="menu"
                                >
                                    <Plus size={17} />
                                    <span>Pievienot ierakstu</span>
                                </button>

                                {showEntryMenu && (
                                    <div className="diary-entry-menu"
                                        role="menu">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEntryMenu(false);
                                                setEditingExpense(null);
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

                                        <div className="diary-entry-actions">
                                            <button
                                                type="button"
                                                className="diary-entry-more"
                                                aria-label="Ieraksta darbības"
                                                onClick={() =>
                                                    setOpenEntryMenuId((currentId) =>
                                                        currentId === entry.id
                                                            ? null
                                                            : entry.id
                                                    )
                                                }
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {openEntryMenuId === entry.id && (
                                                <div className="diary-entry-actions-menu">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingExpense(entry);
                                                            setOpenEntryMenuId(null);
                                                            setShowExpenseModal(true);
                                                        }}
                                                    >
                                                        <Pencil size={14} />
                                                        <span>Rediģēt</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="delete"
                                                        onClick={() => {
                                                            setEntryToDelete(entry);
                                                            setOpenEntryMenuId(null);
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                        <span>Dzēst</span>
                                                    </button>
                                                </div>
                                            )}

                                        </div>
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

            {entryToDelete && (
                <div
                    className="diary-delete-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isDeletingEntry
                        ) {
                            setEntryToDelete(null);
                        }
                    }}
                >
                    <div className="diary-delete-modal">
                        <div className="diary-delete-heading">
                            <div className="diary-delete-icon">
                                <Trash2 size={18} />
                            </div>

                            <h3>Dzēst ierakstu?</h3>
                        </div>

                        <p>
                            Vai tiešām vēlies Dzēst {" "}
                            <strong>{entryToDelete.title}</strong>?
                            {" "}Šo darbību nevarēs atsaukt.
                        </p>

                        <div className="diary-delete-actions">
                            <button
                                type="button"
                                className="diary-delete-cancel"
                                onClick={() => setEntryToDelete(null)}
                                disabled={isDeletingEntry}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="diary-delete-confirm"
                                onClick={handleDeleteEntry}
                                disabled={isDeletingEntry}
                            >
                                <Trash2 size={15} />

                                {isDeletingEntry
                                    ? "Dzēš..."
                                    : "Dzēst"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExpenseModal && (
                <ExpenseModal
                    property={property}
                    expense={editingExpense}
                    initialDate={selectedDate}
                    onClose={() => {
                        setEditingExpense(null);
                        setShowExpenseModal(false);
                    }}
                    onSaved={async () => {
                        await fetchDiaryEntries();
                    }}
                />
            )}

        </div>
    );
}

export default DiaryCalendar;