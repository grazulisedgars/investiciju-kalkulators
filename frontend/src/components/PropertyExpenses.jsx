import {requestJson} from "./requestJson";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
    const [loadError,setLoadError]=useState("");
    const [deleteError,setDeleteError]=useState("");
    const [showExpenseModal, setShowExpenseModal] =
        useState(false);

    const [editingExpense, setEditingExpense] =
        useState(null);

    const [expenseMenu, setExpenseMenu] =
        useState(null);

    const [expenseToDelete, setExpenseToDelete] =
        useState(null);

    const [isDeletingExpense, setIsDeletingExpense] =
        useState(false);

    useEffect(() => {
        if (!expenseMenu) {
            return;
        }

        function handleExpenseMenuClickOutside(event) {
            const menu = document.querySelector(
                ".property-expense-actions-menu-portal"
            );

            const clickedMoreButton =
                event.target.closest(".property-expense-more");

            if (
                menu &&
                !menu.contains(event.target) &&
                !clickedMoreButton
            ) {
                setExpenseMenu(null);
            }
        }

        function handleExpenseMenuKeyDown(event) {
            if (event.key === "Escape") {
                setExpenseMenu(null);
            }
        }

        document.addEventListener(
            "mousedown",
            handleExpenseMenuClickOutside
        );

        document.addEventListener(
            "keydown",
            handleExpenseMenuKeyDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleExpenseMenuClickOutside
            );

            document.removeEventListener(
                "keydown",
                handleExpenseMenuKeyDown
            );
        };
    }, [expenseMenu]);

    const fetchExpenses = useCallback(async (signal) => {
        try {
            const data=await requestJson(`http://localhost:8000/properties/${property.property_id}/diary`,{signal});
            if(!signal?.aborted) {setExpenses(data.filter(entry=>entry.entry_type==="expense"));setLoadError("");}
        } catch(error) {if(!signal?.aborted)setLoadError(error.message);}
        finally {if(!signal?.aborted)setIsLoading(false);}
    },[property.property_id]);
    useEffect(()=>{const controller=new AbortController();Promise.resolve().then(()=>{if(!controller.signal.aborted)return fetchExpenses(controller.signal);});return()=>controller.abort();},[fetchExpenses]);

    async function handleDeleteExpense() {
        if (!expenseToDelete) {
            return;
        }

        if(isDeletingExpense)return;
        setDeleteError("");
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
            setDeleteError(error.message);
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

            {loadError ? <div className="app-status app-status-error" role="alert">{loadError} <button type="button" onClick={()=>{setIsLoading(true);fetchExpenses();}}>Mēģināt vēlreiz</button></div> : isLoading ? (
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

                                        <td data-empty={!expense.supplier && !expense.room || undefined}>
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

                                        <td className="expense-notes" data-label="Piezīmes" data-empty={!expense.notes || undefined}>
                                            {expense.notes || "—"}
                                        </td>

                                        <td className="property-expense-actions-cell">
                                            <div className="property-expense-actions">
                                                <button
                                                    type="button"
                                                    className="property-expense-more"
                                                    aria-label="Izmaksas darbības"
                                                    onClick={(event) => {
                                                        const buttonRect =
                                                            event.currentTarget.getBoundingClientRect();

                                                        setExpenseMenu((currentMenu) => {
                                                            if (
                                                                currentMenu?.expenseId === expense.id
                                                            ) {
                                                                return null;
                                                            }

                                                            return {
                                                                expenseId: expense.id,
                                                                top: buttonRect.bottom + 4,
                                                                right:
                                                                    window.innerWidth -
                                                                    buttonRect.right,
                                                            };
                                                        });
                                                    }}
                                                >
                                                    <MoreVertical size={17} />
                                                </button>
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

            {expenseMenu &&
                createPortal(
                    <div
                        className="property-expense-actions-menu property-expense-actions-menu-portal"
                        style={{
                            top: `${expenseMenu.top}px`,
                            right: `${expenseMenu.right}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const expense = expenses.find(
                                    (item) =>
                                        item.id ===
                                        expenseMenu.expenseId
                                );

                                if (!expense) {
                                    return;
                                }

                                setEditingExpense(expense);
                                setExpenseMenu(null);
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
                                const expense = expenses.find(
                                    (item) =>
                                        item.id ===
                                        expenseMenu.expenseId
                                );

                                if (!expense) {
                                    return;
                                }

                                setExpenseToDelete(expense);
                                setExpenseMenu(null);
                            }}
                        >
                            <Trash2 size={14} />
                            <span>Dzēst</span>
                        </button>
                    </div>,
                    document.body
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

                        {deleteError && <p role="alert" className="app-status app-status-error">{deleteError}</p>}
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