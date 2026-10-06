import { useEffect, useState } from "react";
import {
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";
import ExpenseModal from "./ExpenseModal";
import "./PropertyExpenses.css";

function PropertyExpenses({ property }) {
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] =
        useState(false);

    const [editingExpense, setEditingExpense] =
        useState(null);

    const [openExpenseMenuId, setOpenExpenseMenuId] =
        useState(null);

    const [expenseToDelete, setExpenseToDelete] =
        useState(null);

    const [isDeletingExpense, setIsDeletingExpense] =
        useState(false);

    async function fetchExpenses() {
        try {
            setIsLoading(true);

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary`,
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Neizdevās ielādēt izmaksas."
                );
            }

            const data = await response.json();

            const expenseEntries = data.filter(
                (entry) => entry.entry_type === "expense"
            );

            setExpenses(expenseEntries);

        } catch (error) {
            console.error(
                "Expense GET error:",
                error
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (property?.property_id) {
            fetchExpenses();
        }
    }, [property?.property_id]);

    async function handleDeleteExpense() {
        if (!expenseToDelete) {
            return;
        }

        try {
            setIsDeletingExpense(true);

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary/${expenseToDelete.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās izdzēst izdevumu."
                );
            }

            setExpenseToDelete(null);

            await fetchExpenses();

        } catch (error) {
            console.error(
                "Expense DELETE error:",
                error
            );
        } finally {
            setIsDeletingExpense(false);
        }
    }

    const totalExpenses = expenses.reduce(
        (total, expense) =>
            total + Number(expense.amount || 0),
        0
    );

    function formatDate(dateString) {
        if (!dateString) {
            return "-";
        }

        const [year, month, day] = dateString.split("-");

        return `${day}.${month}.${year}`;
    }

    return (
        <div className="property-expenses">

            <div className="property-expenses-header">
                <div>
                    <h2>Izmaksas</h2>

                    <p>
                        Visi ar īpašumu saistītie izdevumi.
                    </p>
                </div>

                <button
                    type="button"
                    className="property-expenses-add"
                    onClick={() => {
                        setEditingExpense(null);
                        setShowExpenseModal(true)
                    }}
                >
                    <Plus size={17} />
                    Pievienot izmaksas
                </button>
            </div>

            {isLoading ? (
                <div className="property-expenses-empty">
                    Ielādē izmaksas...
                </div>
            ) : expenses.length > 0 ? (
                <>
                    <div className="property-expenses-table-wrapper">
                        <table className="property-expenses-table">
                            <thead>
                                <tr>
                                    <th>Datums</th>
                                    <th>Apraksts</th>
                                    <th>Summa (€)</th>
                                    <th>Piegādātājs / Vieta</th>
                                    <th>Piezīmes</th>
                                    <th aria-label="Darbības" />
                                </tr>
                            </thead>

                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td>
                                            {formatDate(
                                                expense.entry_date
                                            )}
                                        </td>

                                        <td className="expense-description">
                                            {expense.title}
                                        </td>

                                        <td className="expense-amount">
                                            €{Number(
                                                expense.amount
                                            ).toFixed(2)}
                                        </td>

                                        <td>
                                            <div className="expense-place">
                                                <span>
                                                    {expense.supplier || "—"}
                                                </span>

                                                {expense.room && (
                                                    <small>
                                                        {expense.room}
                                                    </small>
                                                )}
                                            </div>
                                        </td>

                                        <td className="expense-notes">
                                            {expense.notes || "—"}
                                        </td>

                                        <td className="property-expense-actions-cell">
                                            <div className="property-expense-actions">
                                                <button
                                                    type="button"
                                                    className="property-expense-more"
                                                    aria-label="Izmaksas darbības"
                                                    onClick={() =>
                                                        setOpenExpenseMenuId((currentId) =>
                                                            currentId === expense.id
                                                                ? null
                                                                : expense.id
                                                        )
                                                    }
                                                >
                                                    <MoreVertical size={17} />
                                                </button>

                                                {openExpenseMenuId === expense.id && (
                                                    <div className="property-expense-actions-menu">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingExpense(expense);
                                                                setOpenExpenseMenuId(null);
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
                                                                setExpenseToDelete(expense);
                                                                setOpenExpenseMenuId(null);
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>Dzēst</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="property-expenses-total">
                        <strong>Kopējās izmaksas</strong>

                        <strong>
                            €{totalExpenses.toFixed(2)}
                        </strong>
                    </div>
                </>
            ) : (
                <div className="property-expenses-empty">
                    Šim īpašumam vēl nav pievienotu izmaksu.
                </div>
            )}

            {expenseToDelete && (
                <div
                    className="diary-delete-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isDeletingExpense
                        ) {
                            setExpenseToDelete(null);
                        }
                    }}
                >
                    <div className="diary-delete-modal">
                        <div className="diary-delete-heading">
                            <div className="diary-delete-icon">
                                <Trash2 size={18} />
                            </div>

                            <h3>Dzēst izdevumu?</h3>
                        </div>

                        <p>
                            Vai tiešām vēlies dzēst{" "}
                            <strong>
                                {expenseToDelete.title}
                            </strong>
                            ? Šo darbību nevarēs atsaukt.
                        </p>

                        <div className="diary-delete-actions">
                            <button
                                type="button"
                                className="diary-delete-cancel"
                                onClick={() =>
                                    setExpenseToDelete(null)
                                }
                                disabled={isDeletingExpense}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="diary-delete-confirm"
                                onClick={handleDeleteExpense}
                                disabled={isDeletingExpense}
                            >
                                <Trash2 size={15} />

                                {isDeletingExpense
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
                    initialDate={
                        new Date().toLocaleDateString("en-CA")
                    }
                    onClose={() =>
                        setShowExpenseModal(false)
                    }
                    onSaved={async () => {
                        await fetchExpenses();
                    }}
                />
            )}
        </div>
    );
}

export default PropertyExpenses;