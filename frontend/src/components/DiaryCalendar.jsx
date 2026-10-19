import CalendarMonthPicker from "./CalendarMonthPicker";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ChevronLeft,
    ChevronRight,
    Receipt,
    Landmark,
    HousePlug,
    Hammer,
    Banknote,
    ImagePlus,
    MoreVertical,
    Plus,
    Pencil,
    CalendarDays,
    Trash2,
    X,
} from "lucide-react";
import "./DiaryCalendar.css";
import ExpenseModal from "./ExpenseModal";
import LoanModal from "./LoanModal";
import UtilityModal from "./UtilityModal";
import WorkModal from "./WorkModal";
import RentModal from "./RentModal";
import { PhotoForm, PhotoPreview } from "./PropertyGallery";

function DiaryCalendar({ property, addEntryRequest, onAddEntryHandled }) {
    const today = new Date();

    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const [currentDate, setCurrentDate] = useState(today);
    const [showEntryMenu, setShowEntryMenu] = useState(false);
    const [mobileDayOpen, setMobileDayOpen] = useState(false);
    useEffect(() => {
        if (!addEntryRequest) return;
        setMobileDayOpen(true);
        setShowEntryMenu(true);
        onAddEntryHandled?.();
    }, [addEntryRequest, onAddEntryHandled]);
    const entryMenuRef = useRef(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [showUtilityModal, setShowUtilityModal] = useState(false);
    const [editingUtility, setEditingUtility] = useState(null);
    // Darba ieraksta formas stāvoklis izveidei un rediģēšanai.
    const [showWorkModal, setShowWorkModal] = useState(false);
    const [editingWork, setEditingWork] = useState(null);
    // Īres formas stāvoklis izveidei un rediģēšanai.
    const [showRentModal, setShowRentModal] = useState(false);
    const [editingRent, setEditingRent] = useState(null);

    const [entryMenu, setEntryMenu] =
        useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [isDeletingEntry, setIsDeletingEntry] = useState(false);

    const [diaryEntries, setDiaryEntries] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [photoForm, setPhotoForm] = useState(null);
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);
    const [photoError, setPhotoError] = useState("");
    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const selectedPhoto = photos.find(photo => photo.id === selectedPhotoId);

    useEffect(() => {
        const controller = new AbortController();
        setPhotos([]);
        setPhotoError("");
        fetch(`http://localhost:8000/properties/${property.property_id}/gallery`, {
            credentials: "include", signal: controller.signal,
        }).then(async response => {
            if (!response.ok) throw new Error("Neizdevās ielādēt foto.");
            setPhotos(await response.json());
        }).catch(error => { if (error.name !== "AbortError") setPhotoError(error.message); });
        return () => controller.abort();
    }, [property.property_id]);

    useEffect(() => {
        if (!photoForm && !selectedPhotoId) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [photoForm, selectedPhotoId]);

    function savePhotos(items) {
        const ids = new Set(items.map(photo => photo.id));
        setPhotos(current => [...current.filter(photo => !ids.has(photo.id)), ...items]);
    }

    async function deletePhoto() {
        if (!selectedPhoto || deletingPhoto) return;
        setDeletingPhoto(true); setPhotoError("");
        try {
            const response = await fetch(`http://localhost:8000/properties/${property.property_id}/gallery/${selectedPhoto.id}`, { method: "DELETE", credentials: "include" });
            if (!response.ok) throw new Error("Neizdevās dzēst foto.");
            setPhotos(current => current.filter(photo => photo.id !== selectedPhoto.id));
            setSelectedPhotoId(null);
        } catch (error) { setPhotoError(error.message); }
        finally { setDeletingPhoto(false); }
    }

    const [selectedDate, setSelectedDate] = useState(() => {
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    });


    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();


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
        if (!entryMenu) {
            return;
        }

        function handleEntryMenuClickOutside(event) {
            const menu = document.querySelector(
                ".diary-entry-actions-menu-portal"
            );

            const clickedMoreButton =
                event.target.closest(".diary-entry-more");

            if (
                menu &&
                !menu.contains(event.target) &&
                !clickedMoreButton
            ) {
                setEntryMenu(null);
            }
        }

        function handleEntryMenuKeyDown(event) {
            if (event.key === "Escape") {
                setEntryMenu(null);
            }
        }

        document.addEventListener(
            "mousedown",
            handleEntryMenuClickOutside
        );

        document.addEventListener(
            "keydown",
            handleEntryMenuKeyDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleEntryMenuClickOutside
            );

            document.removeEventListener(
                "keydown",
                handleEntryMenuKeyDown
            );
        };
    }, [entryMenu]);

    useEffect(() => {
        if (property?.property_id) {
            fetchDiaryEntries();
        }
    }, [property?.property_id]);

    useEffect(() => {
        if (!showEntryMenu) {
            return;
        }

        const mobile = window.matchMedia('(max-width: 600px)').matches;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        const menu = entryMenuRef.current?.querySelector('.diary-entry-menu');
        if (mobile) { document.body.style.overflow = 'hidden'; menu?.querySelector('button')?.focus(); }
        function handleKeyDown(event) {
            if (event.key === "Escape") setShowEntryMenu(false);
            if (mobile && event.key === 'Tab') {
                const buttons = [...menu.querySelectorAll('button')].filter(button => button.getClientRects().length);
                const first = buttons[0], last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
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
            if (mobile) { document.body.style.overflow = previousOverflow; previousFocus?.focus(); }
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
        setMobileDayOpen(true);
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

    const photoLabel = photo => photo.description || ({ initial: "Sākotnējais stāvoklis", renovation: "Remonts", finished: "Pabeigts" }[photo.category]) || "Īpašuma foto";
    const calendarEntries = [...diaryEntries, ...photos.map(photo => ({
        ...photo, id: `photo-${photo.id}`, photoId: photo.id, entry_type: "photo", entry_date: photo.photo_date,
    }))];
    const selectedDateEntries = calendarEntries.filter(
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
        <div className={`diary-calendar-layout ${mobileDayOpen ? "mobile-day-open" : "mobile-calendar-open"}`}>

            <div className="diary-calendar-sidebar">

                <div className="diary-calendar-header">
                    <CalendarMonthPicker year={year} month={month} onChange={setCurrentDate} />

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
                                    calendarEntries
                                        .filter((entry) => entry.entry_date === dateKey)
                                        .map((entry) => entry.entry_type)
                                ),
                            ].slice(0, 3)
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
                        <span className="diary-legend-dot utility"></span>
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
                    <div className="diary-calendar-legend-item">
                        <span className="diary-legend-dot photo" />
                        <span>Foto</span>
                    </div>
                </div>

            </div>

            <div className="diary-calendar-content">

                {selectedDate ? (
                    <>
                        <div className="diary-selected-date-header">
                            <h3>
                                {selectedDateLabel}
                                <button type="button" className="diary-mobile-calendar-back" aria-label="Atgriezties kalendārā" onClick={() => setMobileDayOpen(false)}><CalendarDays size={20}/></button>
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
                                        role="menu" aria-label="Pievienot ierakstu">
                                        <div className="diary-mobile-menu-heading"><h3>Pievienot ierakstu</h3><button type="button" aria-label="Aizvērt ierakstu izvēlni" onClick={() => setShowEntryMenu(false)}><X size={20}/></button></div>

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
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowEntryMenu(false);
                                                    setEditingLoan(null);
                                                    setShowLoanModal(true);
                                                }}
                                            >
                                                <span className="diary-entry-menu-icon loan">
                                                    <Landmark size={14} />
                                                </span>

                                                <span>Kredīta maksājums</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEntryMenu(false);
                                                setEditingUtility(null);
                                                setShowUtilityModal(true);
                                            }}
                                        >
                                            <span className="diary-entry-menu-icon utilities">
                                                <HousePlug size={14} />
                                            </span>
                                            <span>Komunālie maksājumi</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEntryMenu(false);
                                                setEditingWork(null);
                                                setShowWorkModal(true);
                                            }}
                                        >
                                            <span className="diary-entry-menu-icon work">
                                                <Hammer size={14} />
                                            </span>
                                            <span>Darba diena</span>
                                        </button>

                                        <button type="button" onClick={() => {
                                            setShowEntryMenu(false);
                                            setEditingRent(null);
                                            setShowRentModal(true);
                                        }}>
                                            <span className="diary-entry-menu-icon rent">
                                                <Banknote size={14} />
                                            </span>
                                            <span>Saņemtā īre</span>
                                        </button>
                                        <button type="button" onClick={() => {
                                            setShowEntryMenu(false); setPhotoError(""); setPhotoForm({ photo: null });
                                        }}>
                                            <span className="diary-entry-menu-icon photo"><ImagePlus size={14} /></span>
                                            <span>Foto</span>
                                        </button>
                                        <button type="button" className="diary-mobile-menu-cancel" onClick={() => setShowEntryMenu(false)}>Atcelt</button>
                                    </div>
                                )}
                            </div>

                        </div>

                        {selectedDateEntries.length > 0 ? (
                            <div className="diary-day-entries">
                                {selectedDateEntries.map((entry) => entry.entry_type === "photo" ? (
                                    <button type="button" key={entry.id} className="diary-photo-entry"
                                        onClick={() => { setPhotoError(""); setSelectedPhotoId(entry.photoId); }}
                                        aria-label={`Atvērt foto: ${photoLabel(entry)}`}>
                                        <span className="diary-entry-icon photo"><ImagePlus size={17} /></span>
                                        <span className="diary-entry-description"><span className="diary-entry-type photo">Foto</span>
                                            <span className="diary-entry-title">{photoLabel(entry)}</span></span>
                                        <img src={`http://localhost:8000${entry.image_url}`} alt={photoLabel(entry)} loading="lazy" />
                                    </button>
                                ) : (
                                    <div
                                        key={entry.id}
                                        className={`diary-entry-card ${entry.entry_type}`}
                                    >
                                        <div
                                            className={`diary-entry-icon ${entry.entry_type}`}
                                        >
                                            {entry.entry_type === "loan" ? (
                                                <Landmark size={17} strokeWidth={2} />
                                            ) : entry.entry_type === "utility" ? (
                                                <HousePlug size={17} strokeWidth={2} />
                                            ) : entry.entry_type === "work" ? (
                                                <Hammer size={17} strokeWidth={2} />
                                            ) : entry.entry_type === "rent" ? (
                                                <Banknote size={17} strokeWidth={2} />
                                            ) : (
                                                <Receipt size={17} strokeWidth={2} />
                                            )}
                                        </div>

                                        <div className="diary-entry-description">
                                            <span
                                                className={`diary-entry-type ${entry.entry_type}`}
                                            >
                                                {entry.entry_type === "loan"
                                                    ? "Kredīts"
                                                    : entry.entry_type === "utility"
                                                        ? "Komunālie maksājumi"
                                                        : entry.entry_type === "work"
                                                            ? "Darba diena"
                                                            : entry.entry_type === "rent"
                                                                ? "Saņemtā īre"
                                                                : "Izmaksas"}
                                            </span>

                                            <span className="diary-entry-title">
                                                {entry.title}
                                            </span>
                                        </div>
                                        <div className="diary-entry-value">
                                            <strong>
                                                {/* Darba ierakstiem attēlojam stundas. */}
                                                {entry.entry_type === "work"
                                                    ? `${Number(entry.hours).toLocaleString("lv-LV", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })} h`
                                                    : `€${Number(entry.amount).toFixed(2)}`}
                                            </strong>

                                            <span>
                                                {entry.entry_type === "loan"
                                                    ? entry.payment_type === "principal"
                                                        ? "Pamatsumma"
                                                        : entry.payment_type === "interest"
                                                            ? "Procenti"
                                                            : entry.payment_type === "insurance"
                                                                ? "Apdrošināšana"
                                                                : "Cits"
                                                    : ["utility", "work", "rent"].includes(entry.entry_type)
                                                        ? null
                                                        : entry.supplier || "—"}
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
                                                onClick={(event) => {
                                                    const buttonRect =
                                                        event.currentTarget.getBoundingClientRect();

                                                    setEntryMenu((currentMenu) => {
                                                        if (
                                                            currentMenu?.entryId === entry.id
                                                        ) {
                                                            return null;
                                                        }

                                                        return {
                                                            entryId: entry.id,
                                                            top: buttonRect.bottom + 4,
                                                            right:
                                                                window.innerWidth -
                                                                buttonRect.right,
                                                        };
                                                    });
                                                }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

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

            {photoError && !selectedPhoto && <p role="alert" className="diary-photo-error">{photoError}</p>}
            {selectedPhoto && !photoForm && <PhotoPreview key={selectedPhoto.id} photo={selectedPhoto}
                index={photos.findIndex(photo => photo.id === selectedPhotoId)} count={photos.length}
                busy={deletingPhoto} error={photoError} onClose={() => setSelectedPhotoId(null)}
                onNavigate={direction => {
                    const index = photos.findIndex(photo => photo.id === selectedPhotoId);
                    setSelectedPhotoId(photos[(index + direction + photos.length) % photos.length].id);
                }} onEdit={() => setPhotoForm({ photo: selectedPhoto })} onDelete={deletePhoto} />}
            {photoForm && <PhotoForm propertyId={property.property_id} photo={photoForm.photo}
                initialDate={selectedDate} onClose={() => setPhotoForm(null)} onSaved={savePhotos} />}

            {entryMenu &&
                createPortal(
                    <div
                        className="diary-entry-actions-menu diary-entry-actions-menu-portal"
                        style={{
                            top: `${entryMenu.top}px`,
                            right: `${entryMenu.right}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const entry = diaryEntries.find(
                                    (item) =>
                                        item.id === entryMenu.entryId
                                );

                                if (!entry) {
                                    return;
                                }

                                setEntryMenu(null);

                                if (entry.entry_type === "loan") {
                                    setEditingLoan(entry);
                                    setShowLoanModal(true);
                                } else if (entry.entry_type === "utility") {
                                    setEditingUtility(entry);
                                    setShowUtilityModal(true);
                                } else if (entry.entry_type === "work") {
                                    setEditingWork(entry);
                                    setShowWorkModal(true);
                                } else if (entry.entry_type === "rent") {
                                    setEditingRent(entry);
                                    setShowRentModal(true);
                                } else {
                                    setEditingExpense(entry);
                                    setShowExpenseModal(true);
                                }
                            }}
                        >
                            <Pencil size={14} />
                            <span>Rediģēt</span>
                        </button>

                        <button
                            type="button"
                            className="delete"
                            onClick={() => {
                                const entry = diaryEntries.find(
                                    (item) =>
                                        item.id === entryMenu.entryId
                                );

                                if (!entry) {
                                    return;
                                }

                                setEntryToDelete(entry);
                                setEntryMenu(null);
                            }}
                        >
                            <Trash2 size={14} />
                            <span>Dzēst</span>
                        </button>
                    </div>,
                    document.body
                )}

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

            {showLoanModal && (
                <LoanModal
                    property={property}
                    loan={editingLoan}
                    initialDate={selectedDate}
                    onClose={() => {
                        setEditingLoan(null);
                        setShowLoanModal(false);
                    }}
                    onSaved={async () => {
                        await fetchDiaryEntries();
                    }}
                />
            )}

            {/* Pēc saglabāšanas pārlādējam kalendāra ierakstus no GET endpointa. */}
            {/* Īres saglabāšana pārlādē dienasgrāmatas sarakstu. */}
            {showRentModal && (
                <RentModal property={property} rent={editingRent} initialDate={selectedDate}
                    onClose={() => { setEditingRent(null); setShowRentModal(false); }}
                    onSaved={async () => { await fetchDiaryEntries(); }} />
            )}

            {showWorkModal && (
                <WorkModal
                    property={property}
                    work={editingWork}
                    initialDate={selectedDate}
                    onClose={() => {
                        setEditingWork(null);
                        setShowWorkModal(false);
                    }}
                    onSaved={async () => {
                        await fetchDiaryEntries();
                    }}
                />
            )}

            {showUtilityModal && (
                <UtilityModal
                    property={property}
                    utility={editingUtility}
                    initialDate={selectedDate}
                    onClose={() => {
                        setEditingUtility(null);
                        setShowUtilityModal(false);
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