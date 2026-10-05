import { useEffect, useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import "./PropertyExpenses.css";

function PropertyExpenses({ property }) {
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

        if (property?.property_id) {
            fetchExpenses();
        }
    }, [property?.property_id]);

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

                                        <td>
                                            <button
                                                type="button"
                                                className="property-expense-more"
                                                aria-label="Izmaksas darbības"
                                            >
                                                <MoreVertical size={17} />
                                            </button>
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

        </div>
    );
}

export default PropertyExpenses;