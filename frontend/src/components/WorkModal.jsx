
import { useEffect, useRef, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

function WorkModal({
    property,
    work = null,
    initialDate,
    onClose,
    onSaved,
}) {
    const workDatePickerRef = useRef(null);

    // Eso?a ieraksta v?rt?bas iel?d?jam, atverot redi???anas formu.
    const [workForm, setWorkForm] = useState(() => ({
        entry_date: work?.entry_date || initialDate || "",
        title: work?.title || "",
        hours: work?.hours ?? "",
        notes: work?.notes || "",
    }));

    const [isSavingWork, setIsSavingWork] =
        useState(false);

    const [workError, setWorkError] = useState("");

    const [
        showWorkDatePicker,
        setShowWorkDatePicker,
    ] = useState(false);

    const [
        workCalendarDate,
        setWorkCalendarDate,
    ] = useState(() => {
        const entryDate = work?.entry_date || initialDate;
        if (entryDate) {
            return new Date(`${entryDate}T12:00:00`);
        }

        return new Date();
    });

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key !== "Escape") {
                return;
            }

            if (showWorkDatePicker) {
                setShowWorkDatePicker(false);
                return;
            }

            if (!isSavingWork) {
                onClose();
            }
        }

        function handleClickOutside(event) {
            if (
                showWorkDatePicker &&
                workDatePickerRef.current &&
                !workDatePickerRef.current.contains(event.target)
            ) {
                setShowWorkDatePicker(false);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [showWorkDatePicker, isSavingWork, onClose]);

    // Saglabājam jaunu ierakstu ar POST vai esoša ieraksta izmaiņas ar PATCH.
    async function handleWorkSave() {
        const hours = Number(workForm.hours);

        if (
            !workForm.entry_date ||
            !workForm.title.trim() ||
            workForm.hours === ""
        ) {
            setWorkError(
                "Lūdzu aizpildi datumu, darba nosaukumu un stundas."
            );
            return;
        }

        if (
            !Number.isFinite(hours) ||
            hours <= 0
        ) {
            setWorkError(
                "Stundām jābūt lielākām par 0."
            );
            return;
        }

        // Backend pieņem ne vairāk kā divas zīmes aiz komata.
        if (!/^\d+(?:\.\d{1,2})?$/.test(String(workForm.hours))) {
            setWorkError("Stundas ievadi ar ne vairāk kā divām zīmēm aiz komata.");
            return;
        }

        if (isSavingWork) {
            return;
        }

        try {
            setIsSavingWork(true);
            setWorkError("");

            const url = work
                ? `http://localhost:8000/properties/${property.property_id}/diary/work/${work.id}`
                : `http://localhost:8000/properties/${property.property_id}/diary/work`;

            const method = work ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entry_date: workForm.entry_date,
                    title: workForm.title.trim(),
                    hours,
                    notes: workForm.notes.trim() || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const errorMessage =
                    typeof errorData.detail === "string"
                        ? errorData.detail
                        : "Neizdevās saglabāt darba ierakstu.";

                throw new Error(errorMessage);
            }

            const savedWork = await response.json();

            if (onSaved) {
                await onSaved(savedWork);
            }

            onClose();
        } catch (error) {
            console.error("Work save error:", error);

            setWorkError(
                error.message ||
                "Neizdevās saglabāt darba ierakstu."
            );
        } finally {
            setIsSavingWork(false);
        }
    }

    function handleWorkChange(event) {
        const { name, value } = event.target;

        setWorkForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function changeWorkCalendarMonth(direction) {
        setWorkCalendarDate((currentDate) => {
            return new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + direction,
                1
            );
        });
    }

    function selectWorkDate(day) {
        const year = workCalendarDate.getFullYear();

        const month = String(
            workCalendarDate.getMonth() + 1
        ).padStart(2, "0");

        const formattedDay = String(day).padStart(2, "0");

        const dateString =
            `${year}-${month}-${formattedDay}`;

        setWorkForm((prev) => ({
            ...prev,
            entry_date: dateString,
        }));

        setShowWorkDatePicker(false);
    }

    function formatWorkDate(dateString) {
        if (!dateString) {
            return "";
        }

        const [year, month, day] =
            dateString.split("-");

        return `${day}.${month}.${year}`;
    }

    function toggleWorkDatePicker() {
        if (
            !showWorkDatePicker &&
            workForm.entry_date
        ) {
            const [year, month] =
                workForm.entry_date.split("-");

            setWorkCalendarDate(
                new Date(
                    Number(year),
                    Number(month) - 1,
                    1
                )
            );
        }

        setShowWorkDatePicker((prev) => !prev);
    }

    const workCalendarYear =
        workCalendarDate.getFullYear();

    const workCalendarMonth =
        workCalendarDate.getMonth();

    const workCalendarMonthNames = [
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

    const workCalendarDaysInMonth = new Date(
        workCalendarYear,
        workCalendarMonth + 1,
        0
    ).getDate();

    const workCalendarFirstDay = new Date(
        workCalendarYear,
        workCalendarMonth,
        1
    ).getDay();

    const workCalendarStartOffset =
        workCalendarFirstDay === 0
            ? 6
            : workCalendarFirstDay - 1;

    const workCalendarDays = [
        ...Array(workCalendarStartOffset).fill(null),
        ...Array.from(
            { length: workCalendarDaysInMonth },
            (_, index) => index + 1
        ),
    ];

    let workDateLabel = "";

    if (workForm.entry_date) {
        const [year, month, day] =
            workForm.entry_date.split("-");

        workDateLabel =
            `${Number(day)}. ` +
            `${workCalendarMonthNames[Number(month) - 1]}, ` +
            `${year}`;
    }

    return (
        <div
            className="diary-modal-overlay"
            onClick={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSavingWork
                ) {
                    onClose();
                }
            }}
        >
            <div className="diary-modal" role="dialog" aria-modal="true" aria-labelledby="work-modal-title">
                <div className="diary-modal-header">
                    <div>
                        <span className="diary-modal-eyebrow">
                            DARBA DIENA
                        </span>

                        <h3 id="work-modal-title">
                            {work
                                ? "Rediģēt darba ierakstu"
                                : "Pievienot darba ierakstu"}
                        </h3>
                    </div>

                    <button
                        type="button"
                        className="diary-modal-close"
                        onClick={onClose}
                        disabled={isSavingWork}
                        aria-label="Aizvērt"
                    >
                        x
                    </button>
                </div>

                <p className="diary-modal-date">
                    {workDateLabel}
                </p>

                <div className="diary-expense-form">
                    <div
                        className="diary-form-group diary-expense-date-group"
                        ref={workDatePickerRef}
                    >
                        <label htmlFor="work-date">
                            Datums
                        </label>

                        <div className="diary-date-picker-field">
                            <input
                                id="work-date"
                                type="text"
                                value={formatWorkDate(
                                    workForm.entry_date
                                )}
                                readOnly
                                onClick={toggleWorkDatePicker}
                            />

                            <button
                                type="button"
                                className="diary-date-picker-button"
                                onClick={toggleWorkDatePicker}
                                aria-label="Izvēlēties datumu"
                            >
                                <CalendarDays size={17} />
                            </button>
                        </div>

                        {showWorkDatePicker && (
                            <div className="expense-date-calendar">
                                <div className="expense-date-calendar-header">
                                    <strong>
                                        {
                                            workCalendarMonthNames[
                                            workCalendarMonth
                                            ]
                                        }{" "}
                                        {workCalendarYear}
                                    </strong>

                                    <div className="expense-date-calendar-navigation">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeWorkCalendarMonth(-1)
                                            }
                                            aria-label="Iepriekšējais mēnesis"
                                        >
                                            <ChevronLeft size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeWorkCalendarMonth(1)
                                            }
                                            aria-label="Nākamais mēnesis"
                                        >
                                            <ChevronRight size={17} />
                                        </button>
                                    </div>
                                </div>

                                <div className="expense-date-calendar-weekdays">
                                    <span>P</span>
                                    <span>O</span>
                                    <span>T</span>
                                    <span>C</span>
                                    <span>P</span>
                                    <span>S</span>
                                    <span>Sv</span>
                                </div>

                                <div className="expense-date-calendar-grid">
                                    {workCalendarDays.map(
                                        (day, index) => {
                                            if (!day) {
                                                return (
                                                    <span
                                                        key={`empty-${index}`}
                                                        className="expense-date-calendar-empty"
                                                    />
                                                );
                                            }

                                            const dateKey =
                                                `${workCalendarYear}-` +
                                                `${String(
                                                    workCalendarMonth + 1
                                                ).padStart(2, "0")}-` +
                                                `${String(day).padStart(2, "0")}`;

                                            const isSelected =
                                                workForm.entry_date === dateKey;

                                            const today = new Date();

                                            const todayKey =
                                                `${today.getFullYear()}-` +
                                                `${String(
                                                    today.getMonth() + 1
                                                ).padStart(2, "0")}-` +
                                                `${String(
                                                    today.getDate()
                                                ).padStart(2, "0")}`;

                                            const isToday =
                                                dateKey === todayKey;

                                            return (
                                                <button
                                                    key={dateKey}
                                                    type="button"
                                                    className={[
                                                        isToday ? "today" : "",
                                                        isSelected ? "selected" : "",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                    onClick={() =>
                                                        selectWorkDate(day)
                                                    }
                                                >
                                                    {day}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="work-title">
                            Darba nosaukums
                        </label>

                        <input
                            id="work-title"
                            type="text"
                            name="title"
                            value={workForm.title}
                            onChange={handleWorkChange}
                            placeholder="Piem. Virtuves demontāža"
                            maxLength={255}
                        />
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="work-hours">
                            Nostrādātās stundas
                        </label>

                        <input
                            id="work-hours"
                            type="number"
                            name="hours"
                            value={workForm.hours}
                            onChange={handleWorkChange}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="work-notes">
                            Piezīmes
                            <span> (nav obligāti)</span>
                        </label>

                        <textarea
                            id="work-notes"
                            name="notes"
                            value={workForm.notes}
                            onChange={handleWorkChange}
                            placeholder="Papildu informācija par darbu..."
                            maxLength={1000}
                            rows="3"
                        />
                    </div>
                </div>

                {workError && (
                    <p className="diary-form-error">
                        {workError}
                    </p>
                )}

                <div className="diary-modal-actions">
                    <button
                        type="button"
                        className="diary-modal-cancel"
                        onClick={onClose}
                        disabled={isSavingWork}
                    >
                        Atcelt
                    </button>

                    <button
                        type="button"
                        className="diary-modal-save"
                        onClick={handleWorkSave}
                        disabled={isSavingWork}
                    >
                        {isSavingWork
                            ? "Saglabā..."
                            : "Saglabāt"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WorkModal;
