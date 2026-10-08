
import { useEffect, useRef, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

function UtilityModal({
    property,
    utility = null,
    initialDate,
    onClose,
    onSaved,
}) {
    const utilityDatePickerRef = useRef(null);

    const [utilityForm, setUtilityForm] = useState({
        entry_date: initialDate || "",
        title: "",
        amount: "",
        notes: "",
    });

    const [isSavingUtility, setIsSavingUtility] =
        useState(false);

    const [utilityError, setUtilityError] = useState("");

    const [
        showUtilityDatePicker,
        setShowUtilityDatePicker,
    ] = useState(false);

    const [
        utilityCalendarDate,
        setUtilityCalendarDate,
    ] = useState(() => {
        if (initialDate) {
            return new Date(`${initialDate}T12:00:00`);
        }

        return new Date();
    });

    useEffect(() => {
        if (!utility) {
            return;
        }

        setUtilityForm({
            entry_date: utility.entry_date,
            title: utility.title || "",
            amount: utility.amount ?? "",
            notes: utility.notes || "",
        });

        setUtilityCalendarDate(
            new Date(`${utility.entry_date}T12:00:00`)
        );
    }, [utility]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key !== "Escape") {
                return;
            }

            if (showUtilityDatePicker) {
                setShowUtilityDatePicker(false);
                return;
            }

            if (!isSavingUtility) {
                onClose();
            }
        }

        function handleClickOutside(event) {
            if (
                showUtilityDatePicker &&
                utilityDatePickerRef.current &&
                !utilityDatePickerRef.current.contains(event.target)
            ) {
                setShowUtilityDatePicker(false);
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
    }, [showUtilityDatePicker, isSavingUtility, onClose]);

    async function handleUtilitySave() {
        const amount = Number(utilityForm.amount);

        if (
            !utilityForm.entry_date ||
            !utilityForm.title.trim() ||
            utilityForm.amount === ""
        ) {
            setUtilityError(
                "Lūdzu aizpildi datumu, maksājumu un summu."
            );
            return;
        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            setUtilityError(
                "Summai jābūt lielākai par 0."
            );
            return;
        }

        if (isSavingUtility) {
            return;
        }

        try {
            setIsSavingUtility(true);
            setUtilityError("");

            const url = utility
                ? `http://localhost:8000/properties/${property.property_id}/diary/utilities/${utility.id}`
                : `http://localhost:8000/properties/${property.property_id}/diary/utilities`;

            const method = utility ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entry_date: utilityForm.entry_date,
                    title: utilityForm.title.trim(),
                    amount,
                    notes: utilityForm.notes.trim() || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const errorMessage =
                    typeof errorData.detail === "string"
                        ? errorData.detail
                        : "Neizdevās saglabāt komunālo maksājumu.";

                throw new Error(errorMessage);
            }

            const savedUtility = await response.json();

            if (onSaved) {
                await onSaved(savedUtility);
            }

            onClose();
        } catch (error) {
            console.error("Utility save error:", error);

            setUtilityError(
                error.message ||
                "Neizdevās saglabāt komunālo maksājumu."
            );
        } finally {
            setIsSavingUtility(false);
        }
    }

    function handleUtilityChange(event) {
        const { name, value } = event.target;

        setUtilityForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function changeUtilityCalendarMonth(direction) {
        setUtilityCalendarDate((currentDate) => {
            return new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + direction,
                1
            );
        });
    }

    function selectUtilityDate(day) {
        const year = utilityCalendarDate.getFullYear();

        const month = String(
            utilityCalendarDate.getMonth() + 1
        ).padStart(2, "0");

        const formattedDay = String(day).padStart(2, "0");

        const dateString =
            `${year}-${month}-${formattedDay}`;

        setUtilityForm((prev) => ({
            ...prev,
            entry_date: dateString,
        }));

        setShowUtilityDatePicker(false);
    }

    function formatUtilityDate(dateString) {
        if (!dateString) {
            return "";
        }

        const [year, month, day] =
            dateString.split("-");

        return `${day}.${month}.${year}`;
    }

    function toggleUtilityDatePicker() {
        if (
            !showUtilityDatePicker &&
            utilityForm.entry_date
        ) {
            const [year, month] =
                utilityForm.entry_date.split("-");

            setUtilityCalendarDate(
                new Date(
                    Number(year),
                    Number(month) - 1,
                    1
                )
            );
        }

        setShowUtilityDatePicker((prev) => !prev);
    }

    const utilityCalendarYear =
        utilityCalendarDate.getFullYear();

    const utilityCalendarMonth =
        utilityCalendarDate.getMonth();

    const utilityCalendarMonthNames = [
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

    const utilityCalendarDaysInMonth = new Date(
        utilityCalendarYear,
        utilityCalendarMonth + 1,
        0
    ).getDate();

    const utilityCalendarFirstDay = new Date(
        utilityCalendarYear,
        utilityCalendarMonth,
        1
    ).getDay();

    const utilityCalendarStartOffset =
        utilityCalendarFirstDay === 0
            ? 6
            : utilityCalendarFirstDay - 1;

    const utilityCalendarDays = [
        ...Array(utilityCalendarStartOffset).fill(null),
        ...Array.from(
            { length: utilityCalendarDaysInMonth },
            (_, index) => index + 1
        ),
    ];

    let utilityDateLabel = "";

    if (utilityForm.entry_date) {
        const [year, month, day] =
            utilityForm.entry_date.split("-");

        utilityDateLabel =
            `${Number(day)}. ` +
            `${utilityCalendarMonthNames[Number(month) - 1]}, ` +
            `${year}`;
    }

    return (
        <div
            className="diary-modal-overlay"
            onClick={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSavingUtility
                ) {
                    onClose();
                }
            }}
        >
            <div className="diary-modal">
                <div className="diary-modal-header">
                    <div>
                        <span className="diary-modal-eyebrow">
                            KOMUNĀLIE MAKSĀJUMI
                        </span>

                        <h3>
                            {utility
                                ? "Rediģēt komunālo maksājumu"
                                : "Pievienot komunālo maksājumu"}
                        </h3>
                    </div>

                    <button
                        type="button"
                        className="diary-modal-close"
                        onClick={onClose}
                        disabled={isSavingUtility}
                        aria-label="Aizvērt"
                    >
                        x
                    </button>
                </div>

                <p className="diary-modal-date">
                    {utilityDateLabel}
                </p>

                <div className="diary-expense-form">
                    <div
                        className="diary-form-group diary-expense-date-group"
                        ref={utilityDatePickerRef}
                    >
                        <label htmlFor="utility-date">
                            Datums
                        </label>

                        <div className="diary-date-picker-field">
                            <input
                                id="utility-date"
                                type="text"
                                value={formatUtilityDate(
                                    utilityForm.entry_date
                                )}
                                readOnly
                                onClick={toggleUtilityDatePicker}
                            />

                            <button
                                type="button"
                                className="diary-date-picker-button"
                                onClick={toggleUtilityDatePicker}
                                aria-label="Izvēlēties datumu"
                            >
                                <CalendarDays size={17} />
                            </button>
                        </div>

                        {showUtilityDatePicker && (
                            <div className="expense-date-calendar">
                                <div className="expense-date-calendar-header">
                                    <strong>
                                        {
                                            utilityCalendarMonthNames[
                                            utilityCalendarMonth
                                            ]
                                        }{" "}
                                        {utilityCalendarYear}
                                    </strong>

                                    <div className="expense-date-calendar-navigation">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeUtilityCalendarMonth(-1)
                                            }
                                            aria-label="Iepriekšējais mēnesis"
                                        >
                                            <ChevronLeft size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeUtilityCalendarMonth(1)
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
                                    {utilityCalendarDays.map(
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
                                                `${utilityCalendarYear}-` +
                                                `${String(
                                                    utilityCalendarMonth + 1
                                                ).padStart(2, "0")}-` +
                                                `${String(day).padStart(2, "0")}`;

                                            const isSelected =
                                                utilityForm.entry_date === dateKey;

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
                                                        selectUtilityDate(day)
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
                        <label htmlFor="utility-title">
                            Maksājums
                        </label>

                        <input
                            id="utility-title"
                            type="text"
                            name="title"
                            value={utilityForm.title}
                            onChange={handleUtilityChange}
                            placeholder="Piem. Elektrība, RNP, Latvijas Gāze"
                            maxLength={255}
                        />
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="utility-amount">
                            Summa (€)
                        </label>

                        <input
                            id="utility-amount"
                            type="number"
                            name="amount"
                            value={utilityForm.amount}
                            onChange={handleUtilityChange}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="utility-notes">
                            Piezīmes
                            <span> (nav obligāti)</span>
                        </label>

                        <textarea
                            id="utility-notes"
                            name="notes"
                            value={utilityForm.notes}
                            onChange={handleUtilityChange}
                            placeholder="Papildu informācija par maksājumu..."
                            maxLength={1000}
                            rows="3"
                        />
                    </div>
                </div>

                {utilityError && (
                    <p className="diary-form-error">
                        {utilityError}
                    </p>
                )}

                <div className="diary-modal-actions">
                    <button
                        type="button"
                        className="diary-modal-cancel"
                        onClick={onClose}
                        disabled={isSavingUtility}
                    >
                        Atcelt
                    </button>

                    <button
                        type="button"
                        className="diary-modal-save"
                        onClick={handleUtilitySave}
                        disabled={isSavingUtility}
                    >
                        {isSavingUtility
                            ? "Saglabā..."
                            : "Saglabāt"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UtilityModal;
