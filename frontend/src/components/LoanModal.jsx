import { useEffect, useRef, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

function LoanModal({
    property,
    loan = null,
    initialDate,
    onClose,
    onSaved,
}) {
    const loanDatePickerRef = useRef(null);

    const [loanForm, setLoanForm] = useState({
        entry_date: initialDate || "",
        title: "",
        amount: "",
        payment_type: "principal",
        notes: "",
    });

    const [isSavingLoan, setIsSavingLoan] =
        useState(false);

    const [loanError, setLoanError] =
        useState("");

    const [
        showLoanDatePicker,
        setShowLoanDatePicker,
    ] = useState(false);

    const [
        loanCalendarDate,
        setLoanCalendarDate,
    ] = useState(() => {
        if (initialDate) {
            return new Date(`${initialDate}T12:00:00`);
        }

        return new Date();
    });

    useEffect(() => {
        if (!loan) {
            return;
        }

        setLoanForm({
            entry_date: loan.entry_date,
            title: loan.title || "",
            amount: loan.amount ?? "",
            payment_type: loan.payment_type || "principal",
            notes: loan.notes || "",
        });

        setLoanCalendarDate(
            new Date(`${loan.entry_date}T12:00:00`)
        );
    }, [loan]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key !== "Escape") {
                return;
            }

            if (showLoanDatePicker) {
                setShowLoanDatePicker(false);
                return;
            }

            onClose();
        }

        function handleClickOutside(event) {
            if (
                showLoanDatePicker &&
                loanDatePickerRef.current &&
                !loanDatePickerRef.current.contains(event.target)
            ) {
                setShowLoanDatePicker(false);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);

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
    }, [showLoanDatePicker, onClose]);

    async function handleLoanSave() {
        if (
            !loanForm.entry_date ||
            !loanForm.title.trim() ||
            !loanForm.amount ||
            !loanForm.payment_type
        ) {
            setLoanError(
                "Lūdzu aizpildi datumu, aprakstu, summu un maksājuma tipu."
            );

            return;
        }

        try {
            setIsSavingLoan(true);
            setLoanError("");

            const url = loan
                ? `http://localhost:8000/properties/${property.property_id}/diary/loans/${loan.id}`
                : `http://localhost:8000/properties/${property.property_id}/diary/loans`;

            const method = loan ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entry_date: loanForm.entry_date,
                    title: loanForm.title.trim(),
                    amount: Number(loanForm.amount),
                    payment_type: loanForm.payment_type,
                    notes: loanForm.notes.trim() || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās saglabāt kredīta maksājumu."
                );
            }

            const savedLoan = await response.json();

            console.log(
                "Saglabāts kredīta maksājums:",
                savedLoan
            );

            if (onSaved) {
                await onSaved(savedLoan);
            }

            onClose();

        } catch (error) {
            console.error(
                "Loan save error:",
                error
            );

            setLoanError(
                error.message ||
                "Neizdevās saglabāt kredīta maksājumu."
            );

        } finally {
            setIsSavingLoan(false);
        }
    }

    function handleLoanChange(event) {
        const { name, value } = event.target;

        setLoanForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function changeLoanCalendarMonth(direction) {
        setLoanCalendarDate((currentDate) => {
            return new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + direction,
                1
            );
        });
    }

    function selectLoanDate(day) {
        const year = loanCalendarDate.getFullYear();

        const month = String(
            loanCalendarDate.getMonth() + 1
        ).padStart(2, "0");

        const formattedDay = String(day).padStart(2, "0");

        const dateString =
            `${year}-${month}-${formattedDay}`;

        setLoanForm((prev) => ({
            ...prev,
            entry_date: dateString,
        }));

        setShowLoanDatePicker(false);
    }

    function formatLoanDate(dateString) {
        if (!dateString) {
            return "";
        }

        const [year, month, day] =
            dateString.split("-");

        return `${day}.${month}.${year}`;
    }

    function toggleLoanDatePicker() {
        if (
            !showLoanDatePicker &&
            loanForm.entry_date
        ) {
            const [year, month] =
                loanForm.entry_date.split("-");

            setLoanCalendarDate(
                new Date(
                    Number(year),
                    Number(month) - 1,
                    1
                )
            );
        }

        setShowLoanDatePicker((prev) => !prev);
    }

    const loanCalendarYear =
        loanCalendarDate.getFullYear();

    const loanCalendarMonth =
        loanCalendarDate.getMonth();

    const loanCalendarMonthNames = [
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

    const loanCalendarDaysInMonth = new Date(
        loanCalendarYear,
        loanCalendarMonth + 1,
        0
    ).getDate();

    const loanCalendarFirstDay = new Date(
        loanCalendarYear,
        loanCalendarMonth,
        1
    ).getDay();

    const loanCalendarStartOffset =
        loanCalendarFirstDay === 0
            ? 6
            : loanCalendarFirstDay - 1;

    const loanCalendarDays = [
        ...Array(loanCalendarStartOffset).fill(null),
        ...Array.from(
            { length: loanCalendarDaysInMonth },
            (_, index) => index + 1
        ),
    ];

    let loanDateLabel = "";

    if (loanForm.entry_date) {
        const [year, month, day] =
            loanForm.entry_date.split("-");

        loanDateLabel =
            `${Number(day)}. ` +
            `${loanCalendarMonthNames[Number(month) - 1]}, ` +
            `${year}`;
    }

    return (
        <div
            className="diary-modal-overlay"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="diary-modal">
                <div className="diary-modal-header">
                    <div>
                        <span className="diary-modal-eyebrow">
                            KREDĪTS
                        </span>

                        <h3>
                            {loan
                                ? "Rediģēt maksājumu"
                                : "Pievienot maksājumu"}
                        </h3>
                    </div>

                    <button
                        type="button"
                        className="diary-modal-close"
                        onClick={onClose}
                        aria-label="Aizvērt"
                    >
                        x
                    </button>
                </div>

                <p className="diary-modal-date">
                    {loanDateLabel}
                </p>

                <div className="diary-expense-form">
                    <div
                        className="diary-form-group diary-expense-date-group"
                        ref={loanDatePickerRef}
                    >
                        <label htmlFor="loan-date">
                            Datums
                        </label>

                        <div className="diary-date-picker-field">
                            <input
                                id="loan-date"
                                type="text"
                                value={formatLoanDate(
                                    loanForm.entry_date
                                )}
                                readOnly
                                onClick={toggleLoanDatePicker}
                            />

                            <button
                                type="button"
                                className="diary-date-picker-button"
                                onClick={toggleLoanDatePicker}
                                aria-label="Izvēlēties datumu"
                            >
                                <CalendarDays size={17} />
                            </button>
                        </div>

                        {showLoanDatePicker && (
                            <div className="expense-date-calendar">
                                <div className="expense-date-calendar-header">
                                    <strong>
                                        {
                                            loanCalendarMonthNames[
                                            loanCalendarMonth
                                            ]
                                        }{" "}
                                        {loanCalendarYear}
                                    </strong>

                                    <div className="expense-date-calendar-navigation">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeLoanCalendarMonth(-1)
                                            }
                                            aria-label="Iepriekšējais mēnesis"
                                        >
                                            <ChevronLeft size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeLoanCalendarMonth(1)
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
                                    {loanCalendarDays.map(
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
                                                `${loanCalendarYear}-` +
                                                `${String(
                                                    loanCalendarMonth + 1
                                                ).padStart(2, "0")}-` +
                                                `${String(day).padStart(
                                                    2,
                                                    "0"
                                                )}`;

                                            const isSelected =
                                                loanForm.entry_date ===
                                                dateKey;

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
                                                        isToday
                                                            ? "today"
                                                            : "",
                                                        isSelected
                                                            ? "selected"
                                                            : "",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                    onClick={() =>
                                                        selectLoanDate(
                                                            day
                                                        )
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
                        <label htmlFor="loan-title">
                            Apraksts
                        </label>

                        <input
                            id="loan-title"
                            type="text"
                            name="title"
                            value={loanForm.title}
                            onChange={handleLoanChange}
                            placeholder="Piem. Kredīta maksājums"
                        />
                    </div>

                    <div className="diary-form-row">
                        <div className="diary-form-group">
                            <label htmlFor="loan-amount">
                                Summa (€)
                            </label>

                            <input
                                id="loan-amount"
                                type="number"
                                name="amount"
                                value={loanForm.amount}
                                onChange={handleLoanChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="diary-form-group">
                            <label htmlFor="loan-payment-type">
                                Maksājuma tips
                            </label>

                            <select
                                id="loan-payment-type"
                                name="payment_type"
                                value={loanForm.payment_type}
                                onChange={handleLoanChange}
                            >
                                <option value="principal">
                                    Pamatsumma
                                </option>

                                <option value="interest">
                                    Procenti
                                </option>

                                <option value="insurance">
                                    Apdrošināšana
                                </option>

                                <option value="other">
                                    Cits
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="diary-form-group">
                        <label htmlFor="loan-notes">
                            Piezīmes
                            <span> (nav obligāti)</span>
                        </label>

                        <textarea
                            id="loan-notes"
                            name="notes"
                            value={loanForm.notes}
                            onChange={handleLoanChange}
                            placeholder="Papildu informācija par maksājumu..."
                            rows="3"
                        />
                    </div>
                </div>

                {loanError && (
                    <p className="diary-form-error">
                        {loanError}
                    </p>
                )}

                <div className="diary-modal-actions">
                    <button
                        type="button"
                        className="diary-modal-cancel"
                        onClick={onClose}
                        disabled={isSavingLoan}
                    >
                        Atcelt
                    </button>

                    <button
                        type="button"
                        className="diary-modal-save"
                        onClick={handleLoanSave}
                        disabled={isSavingLoan}
                    >
                        {isSavingLoan
                            ? "Saglabā..."
                            : "Saglabāt"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoanModal;