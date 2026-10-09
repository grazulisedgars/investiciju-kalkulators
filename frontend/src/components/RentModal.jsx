
import { useEffect, useRef, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

function RentModal({
    property,
    rent = null,
    initialDate,
    onClose,
    onSaved,
}) {
    const rentDatePickerRef = useRef(null);

    // Eso?a ieraksta v?rt?bas iel?d?jam, atverot redi???anas formu.
    const [rentForm, setRentForm] = useState(() => ({
        entry_date: rent?.entry_date || initialDate || "",
        title: rent?.title || "",
        amount: rent?.amount ?? "",
        notes: rent?.notes || "",
    }));

    const [isSavingRent, setIsSavingRent] =
        useState(false);

    const [rentError, setRentError] = useState("");

    const [
        showRentDatePicker,
        setShowRentDatePicker,
    ] = useState(false);

    const [
        rentCalendarDate,
        setRentCalendarDate,
    ] = useState(() => {
        const entryDate = rent?.entry_date || initialDate;
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

            if (showRentDatePicker) {
                setShowRentDatePicker(false);
                return;
            }

            if (!isSavingRent) {
                onClose();
            }
        }

        function handleClickOutside(event) {
            if (
                showRentDatePicker &&
                rentDatePickerRef.current &&
                !rentDatePickerRef.current.contains(event.target)
            ) {
                setShowRentDatePicker(false);
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
    }, [showRentDatePicker, isSavingRent, onClose]);

    // Saglabājam jaunu ierakstu ar POST vai esoša ieraksta izmaiņas ar PATCH.
    async function handleRentSave() {
        const amount = Number(rentForm.amount);

        if (
            !rentForm.entry_date ||
            !rentForm.title.trim() ||
            rentForm.amount === ""
        ) {
            setRentError(
                "Lūdzu aizpildi datumu, maksājuma nosaukumu un summu."
            );
            return;
        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            setRentError(
                "Summai jābūt lielākai par 0."
            );
            return;
        }

        // Backend pieņem ne vairāk kā divas zīmes aiz komata.
        if (!/^\d+(?:\.\d{1,2})?$/.test(String(rentForm.amount))) {
            setRentError("Summu ievadi ar ne vairāk kā divām zīmēm aiz komata.");
            return;
        }

        if (isSavingRent) {
            return;
        }

        try {
            setIsSavingRent(true);
            setRentError("");

            const url = rent
                ? `http://localhost:8000/properties/${property.property_id}/diary/rent/${rent.id}`
                : `http://localhost:8000/properties/${property.property_id}/diary/rent`;

            const method = rent ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entry_date: rentForm.entry_date,
                    title: rentForm.title.trim(),
                    amount,
                    notes: rentForm.notes.trim() || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const errorMessage =
                    typeof errorData.detail === "string"
                        ? errorData.detail
                        : "Neizdevās saglabāt īres maksājumu.";

                throw new Error(errorMessage);
            }

            const savedRent = await response.json();

            if (onSaved) {
                await onSaved(savedRent);
            }

            onClose();
        } catch (error) {
            console.error("Rent save error:", error);

            setRentError(
                error.message ||
                "Neizdevās saglabāt īres maksājumu."
            );
        } finally {
            setIsSavingRent(false);
        }
    }

    function handleRentChange(event) {
        const { name, value } = event.target;

        setRentForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function changeRentCalendarMonth(direction) {
        setRentCalendarDate((currentDate) => {
            return new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + direction,
                1
            );
        });
    }

    function selectRentDate(day) {
        const year = rentCalendarDate.getFullYear();

        const month = String(
            rentCalendarDate.getMonth() + 1
        ).padStart(2, "0");

        const formattedDay = String(day).padStart(2, "0");

        const dateString =
            `${year}-${month}-${formattedDay}`;

        setRentForm((prev) => ({
            ...prev,
            entry_date: dateString,
        }));

        setShowRentDatePicker(false);
    }

    function formatRentDate(dateString) {
        if (!dateString) {
            return "";
        }

        const [year, month, day] =
            dateString.split("-");

        return `${day}.${month}.${year}`;
    }

    function toggleRentDatePicker() {
        if (
            !showRentDatePicker &&
            rentForm.entry_date
        ) {
            const [year, month] =
                rentForm.entry_date.split("-");

            setRentCalendarDate(
                new Date(
                    Number(year),
                    Number(month) - 1,
                    1
                )
            );
        }

        setShowRentDatePicker((prev) => !prev);
    }

    const rentCalendarYear =
        rentCalendarDate.getFullYear();

    const rentCalendarMonth =
        rentCalendarDate.getMonth();

    const rentCalendarMonthNames = [
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

    const rentCalendarDaysInMonth = new Date(
        rentCalendarYear,
        rentCalendarMonth + 1,
        0
    ).getDate();

    const rentCalendarFirstDay = new Date(
        rentCalendarYear,
        rentCalendarMonth,
        1
    ).getDay();

    const rentCalendarStartOffset =
        rentCalendarFirstDay === 0
            ? 6
            : rentCalendarFirstDay - 1;

    const rentCalendarDays = [
        ...Array(rentCalendarStartOffset).fill(null),
        ...Array.from(
            { length: rentCalendarDaysInMonth },
            (_, index) => index + 1
        ),
    ];

    let rentDateLabel = "";

    if (rentForm.entry_date) {
        const [year, month, day] =
            rentForm.entry_date.split("-");

        rentDateLabel =
            `${Number(day)}. ` +
            `${rentCalendarMonthNames[Number(month) - 1]}, ` +
            `${year}`;
    }

    return (
        <div
            className="diary-modal-overlay"
            onClick={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSavingRent
                ) {
                    onClose();
                }
            }}
        >
            <div className="diary-modal" role="dialog" aria-modal="true" aria-labelledby="rent-modal-title">
                <div className="diary-modal-header">
                    <div>
                        <span className="diary-modal-eyebrow">
                            SAŅEMTĀ ĪRE
                        </span>

                        <h3 id="rent-modal-title">
                            {rent
                                ? "Rediģēt īres maksājumu"
                                : "Pievienot īres maksājumu"}
                        </h3>
                    </div>

                    <button
                        type="button"
                        className="diary-modal-close"
                        onClick={onClose}
                        disabled={isSavingRent}
                        aria-label="Aizvērt"
                    >
                        x
                    </button>
                </div>

                <p className="diary-modal-date">
                    {rentDateLabel}
                </p>

                <div className="diary-expense-form">
                    <div
                        className="diary-form-group diary-expense-date-group"
                        ref={rentDatePickerRef}
                    >
                        <label htmlFor="rent-date">
                            Datums
                        </label>

                        <div className="diary-date-picker-field">
                            <input
                                id="rent-date"
                                type="text"
                                value={formatRentDate(
                                    rentForm.entry_date
                                )}
                                readOnly
                                onClick={toggleRentDatePicker}
                            />

                            <button
                                type="button"
                                className="diary-date-picker-button"
                                onClick={toggleRentDatePicker}
                                aria-label="Izvēlēties datumu"
                            >
                                <CalendarDays size={17} />
                            </button>
                        </div>

                        {showRentDatePicker && (
                            <div className="expense-date-calendar">
                                <div className="expense-date-calendar-header">
                                    <strong>
                                        {
                                            rentCalendarMonthNames[
                                            rentCalendarMonth
                                            ]
                                        }{" "}
                                        {rentCalendarYear}
                                    </strong>

                                    <div className="expense-date-calendar-navigation">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeRentCalendarMonth(-1)
                                            }
                                            aria-label="Iepriekšējais mēnesis"
                                        >
                                            <ChevronLeft size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeRentCalendarMonth(1)
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
                                    {rentCalendarDays.map(
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
                                                `${rentCalendarYear}-` +
                                                `${String(
                                                    rentCalendarMonth + 1
                                                ).padStart(2, "0")}-` +
                                                `${String(day).padStart(2, "0")}`;

                                            const isSelected =
                                                rentForm.entry_date === dateKey;

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
                                                        selectRentDate(day)
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
                        <label htmlFor="rent-title">
                            Maksājums
                        </label>

                        <input
                            id="rent-title"
                            type="text"
                            name="title"
                            value={rentForm.title}
                            onChange={handleRentChange}
                            placeholder="Piem. Īre par oktobri"
                            maxLength={255}
                        />
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="rent-amount">
                            Saņemtā summa (€)
                        </label>

                        <input
                            id="rent-amount"
                            type="number"
                            name="amount"
                            value={rentForm.amount}
                            onChange={handleRentChange}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="rent-notes">
                            Piezīmes
                            <span> (nav obligāti)</span>
                        </label>

                        <textarea
                            id="rent-notes"
                            name="notes"
                            value={rentForm.notes}
                            onChange={handleRentChange}
                            placeholder="Papildu informācija par īres maksājumu..."
                            maxLength={1000}
                            rows="3"
                        />
                    </div>
                </div>

                {rentError && (
                    <p className="diary-form-error">
                        {rentError}
                    </p>
                )}

                <div className="diary-modal-actions">
                    <button
                        type="button"
                        className="diary-modal-cancel"
                        onClick={onClose}
                        disabled={isSavingRent}
                    >
                        Atcelt
                    </button>

                    <button
                        type="button"
                        className="diary-modal-save"
                        onClick={handleRentSave}
                        disabled={isSavingRent}
                    >
                        {isSavingRent
                            ? "Saglabā..."
                            : "Saglabāt"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RentModal;
