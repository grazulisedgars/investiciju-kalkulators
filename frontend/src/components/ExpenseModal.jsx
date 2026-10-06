import { useEffect, useRef, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

function ExpenseModal({
    property,
    expense = null,
    initialDate,
    onClose,
    onSaved,
}) {
    const expenseDatePickerRef = useRef(null);

    const [expenseForm, setExpenseForm] = useState({
        entry_date: initialDate || "",
        title: "",
        amount: "",
        supplier: "",
        room: "",
        notes: "",
    });

    const [isSavingExpense, setIsSavingExpense] =
        useState(false);

    const [expenseError, setExpenseError] =
        useState("");

    const [
        showExpenseDatePicker,
        setShowExpenseDatePicker,
    ] = useState(false);

    const [
        expenseCalendarDate,
        setExpenseCalendarDate,
    ] = useState(() => {
        if (initialDate) {
            return new Date(`${initialDate}T12:00:00`);
        }

        return new Date();
    });

    useEffect(() => {
        if (!expense) {
            return;
        }

        setExpenseForm({
            entry_date: expense.entry_date,
            title: expense.title || "",
            amount: expense.amount ?? "",
            supplier: expense.supplier || "",
            room: expense.room || "",
            notes: expense.notes || "",
        });

        setExpenseCalendarDate(
            new Date(`${expense.entry_date}T12:00:00`)
        );
    }, [expense]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key !== "Escape") {
                return;
            }

            if (showExpenseDatePicker) {
                setShowExpenseDatePicker(false);
                return;
            }

            onClose();
        }

        function handleClickOutside(event) {
            if (
                showExpenseDatePicker &&
                expenseDatePickerRef.current &&
                !expenseDatePickerRef.current.contains(event.target)
            ) {
                setShowExpenseDatePicker(false);
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
    }, [showExpenseDatePicker, onClose]);

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

            const url = expense
                ? `http://localhost:8000/properties/${property.property_id}/diary/expenses/${expense.id}`
                : `http://localhost:8000/properties/${property.property_id}/diary/expenses`;

            const method = expense ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entry_date: expenseForm.entry_date,
                    title: expenseForm.title.trim(),
                    amount: Number(expenseForm.amount),
                    supplier:
                        expenseForm.supplier.trim() || null,
                    room:
                        expenseForm.room.trim() || null,
                    notes:
                        expenseForm.notes.trim() || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās saglabāt izdevumu."
                );
            }

            const savedExpense = await response.json();

            console.log(
                "Saglabāts izdevums:",
                savedExpense
            );

            if (onSaved) {
                await onSaved(savedExpense);
            }

            onClose();

        } catch (error) {
            console.error(
                "Expense save error:",
                error
            );

            setExpenseError(
                error.message ||
                "Neizdevās saglabāt izdevumu."
            );

        } finally {
            setIsSavingExpense(false);
        }
    }

    function handleExpenseChange(event) {
        const { name, value } = event.target;

        setExpenseForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function changeExpenseCalendarMonth(direction) {
        setExpenseCalendarDate((currentDate) => {
            return new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + direction,
                1
            );
        });
    }

    function selectExpenseDate(day) {
        const year = expenseCalendarDate.getFullYear();

        const month = String(
            expenseCalendarDate.getMonth() + 1
        ).padStart(2, "0");

        const formattedDay = String(day).padStart(2, "0");

        const dateString =
            `${year}-${month}-${formattedDay}`;

        setExpenseForm((prev) => ({
            ...prev,
            entry_date: dateString,
        }));

        setShowExpenseDatePicker(false);
    }

    function formatExpenseDate(dateString) {
        if (!dateString) {
            return "";
        }

        const [year, month, day] =
            dateString.split("-");

        return `${day}.${month}.${year}`;
    }

    function toggleExpenseDatePicker() {
        if (
            !showExpenseDatePicker &&
            expenseForm.entry_date
        ) {
            const [year, month] =
                expenseForm.entry_date.split("-");

            setExpenseCalendarDate(
                new Date(
                    Number(year),
                    Number(month) - 1,
                    1
                )
            );
        }

        setShowExpenseDatePicker((prev) => !prev);
    }

    const expenseCalendarYear =
        expenseCalendarDate.getFullYear();

    const expenseCalendarMonth =
        expenseCalendarDate.getMonth();

    const expenseCalendarMonthNames = [
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

    const expenseCalendarDaysInMonth = new Date(
        expenseCalendarYear,
        expenseCalendarMonth + 1,
        0
    ).getDate();

    const expenseCalendarFirstDay = new Date(
        expenseCalendarYear,
        expenseCalendarMonth,
        1
    ).getDay();

    const expenseCalendarStartOffset =
        expenseCalendarFirstDay === 0
            ? 6
            : expenseCalendarFirstDay - 1;

    const expenseCalendarDays = [
        ...Array(expenseCalendarStartOffset).fill(null),
        ...Array.from(
            { length: expenseCalendarDaysInMonth },
            (_, index) => index + 1
        ),
    ];

    let expenseDateLabel = "";

    if (expenseForm.entry_date) {
        const [year, month, day] =
            expenseForm.entry_date.split("-");

        expenseDateLabel =
            `${Number(day)}. ` +
            `${expenseCalendarMonthNames[Number(month) - 1]}, ` +
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
                            IZMAKSAS
                        </span>

                        <h3>
                            {expense
                                ? "Rediģēt izdevumu"
                                : "Pievienot izdevumu"}
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
                    {expenseDateLabel}
                </p>

                <div className="diary-expense-form">
                    <div
                        className="diary-form-group diary-expense-date-group"
                        ref={expenseDatePickerRef}
                    >
                        <label htmlFor="expense-date">
                            Datums
                        </label>

                        <div className="diary-date-picker-field">
                            <input
                                id="expense-date"
                                type="text"
                                value={formatExpenseDate(
                                    expenseForm.entry_date
                                )}
                                readOnly
                                onClick={toggleExpenseDatePicker}
                            />

                            <button
                                type="button"
                                className="diary-date-picker-button"
                                onClick={toggleExpenseDatePicker}
                                aria-label="Izvēlēties datumu"
                            >
                                <CalendarDays size={17} />
                            </button>
                        </div>

                        {showExpenseDatePicker && (
                            <div className="expense-date-calendar">
                                <div className="expense-date-calendar-header">
                                    <strong>
                                        {
                                            expenseCalendarMonthNames[
                                            expenseCalendarMonth
                                            ]
                                        }{" "}
                                        {expenseCalendarYear}
                                    </strong>

                                    <div className="expense-date-calendar-navigation">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeExpenseCalendarMonth(
                                                    -1
                                                )
                                            }
                                            aria-label="Iepriekšējais mēnesis"
                                        >
                                            <ChevronLeft size={17} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeExpenseCalendarMonth(
                                                    1
                                                )
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
                                    {expenseCalendarDays.map(
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
                                                `${expenseCalendarYear}-` +
                                                `${String(
                                                    expenseCalendarMonth +
                                                    1
                                                ).padStart(2, "0")}-` +
                                                `${String(day).padStart(
                                                    2,
                                                    "0"
                                                )}`;

                                            const isSelected =
                                                expenseForm.entry_date ===
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
                                                        selectExpenseDate(
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
                        onClick={onClose}
                        disabled={isSavingExpense}
                    >
                        Atcelt
                    </button>

                    <button
                        type="button"
                        className="diary-modal-save"
                        onClick={handleExpenseSave}
                        disabled={isSavingExpense}
                    >
                        {isSavingExpense
                            ? "Saglabā..."
                            : "Saglabāt"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ExpenseModal;