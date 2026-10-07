import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";
import LoanModal from "./LoanModal";
import "./PropertyExpenses.css";

function PropertyLoan({ property }) {
    const [loans, setLoans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showLoanModal, setShowLoanModal] =
        useState(false);

    const [editingLoan, setEditingLoan] =
        useState(null);

    const [loanMenu, setLoanMenu] =
        useState(null);

    const [loanToDelete, setLoanToDelete] =
        useState(null);

    const [isDeletingLoan, setIsDeletingLoan] =
        useState(false);

    useEffect(() => {
        if (!loanMenu) {
            return;
        }

        function handleLoanMenuClickOutside(event) {
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
                setLoanMenu(null);
            }
        }

        function handleLoanMenuKeyDown(event) {
            if (event.key === "Escape") {
                setLoanMenu(null);
            }
        }

        document.addEventListener(
            "mousedown",
            handleLoanMenuClickOutside
        );

        document.addEventListener(
            "keydown",
            handleLoanMenuKeyDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleLoanMenuClickOutside
            );

            document.removeEventListener(
                "keydown",
                handleLoanMenuKeyDown
            );
        };
    }, [loanMenu]);

    async function fetchLoans() {
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
                    "Neizdevās ielādēt kredīta maksājumus."
                );
            }

            const data = await response.json();

            const loanEntries = data.filter(
                (entry) => entry.entry_type === "loan"
            );

            setLoans(loanEntries);

        } catch (error) {
            console.error(
                "Loan GET error:",
                error
            );

        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (property?.property_id) {
            fetchLoans();
        }
    }, [property?.property_id]);

    async function handleDeleteLoan() {
        if (!loanToDelete) {
            return;
        }

        try {
            setIsDeletingLoan(true);

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary/${loanToDelete.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās izdzēst kredīta maksājumu."
                );
            }

            setLoanToDelete(null);

            await fetchLoans();

        } catch (error) {
            console.error(
                "Loan DELETE error:",
                error
            );

        } finally {
            setIsDeletingLoan(false);
        }
    }

    const totalPaid = loans.reduce(
        (total, loan) =>
            total + Number(loan.amount || 0),
        0
    );

    const totalPrincipal = loans
        .filter(
            (loan) =>
                loan.payment_type === "principal"
        )
        .reduce(
            (total, loan) =>
                total + Number(loan.amount || 0),
            0
        );

    const totalInterest = loans
        .filter(
            (loan) =>
                loan.payment_type === "interest"
        )
        .reduce(
            (total, loan) =>
                total + Number(loan.amount || 0),
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
                    <h2>Kredīta maksājumi</h2>

                    <p>
                        Visi ar hipotēku saistītie maksājumi –
                        pamatsumma, procenti un citi.
                    </p>
                </div>

                <button
                    type="button"
                    className="property-expenses-add"
                    onClick={() => {
                        setEditingLoan(null);
                        setShowLoanModal(true);
                    }}
                >
                    <Plus size={17} />
                    Pievienot maksājumu
                </button>
            </div>

            {isLoading ? (
                <div className="property-expenses-empty">
                    Ielādē kredīta maksājumus...
                </div>
            ) : loans.length > 0 ? (
                <>
                    <div className="property-expenses-table-wrapper">
                        <table className="property-expenses-table">
                            <thead>
                                <tr>
                                    <th>Datums</th>
                                    <th>Apraksts</th>
                                    <th>Summa (€)</th>
                                    <th>Tips</th>
                                    <th>Piezīmes</th>
                                    <th aria-label="Darbības" />
                                </tr>
                            </thead>

                            <tbody>
                                {loans.map((loan) => (
                                    <tr key={loan.id}>
                                        <td>
                                            {formatDate(
                                                loan.entry_date
                                            )}
                                        </td>

                                        <td className="expense-description">
                                            {loan.title}
                                        </td>

                                        <td className="expense-amount">
                                            €{Number(
                                                loan.amount
                                            ).toFixed(2)}
                                        </td>

                                        <td>
                                            {loan.payment_type === "principal"
                                                ? "Pamatsumma"
                                                : loan.payment_type === "interest"
                                                    ? "Procenti"
                                                    : loan.payment_type === "insurance"
                                                        ? "Apdrošināšana"
                                                        : "Cits"}
                                        </td>

                                        <td className="expense-notes">
                                            {loan.notes || "—"}
                                        </td>

                                        <td className="property-expense-actions-cell">
                                            <div className="property-expense-actions">
                                                <button
                                                    type="button"
                                                    className="property-expense-more"
                                                    aria-label="Kredīta maksājuma darbības"
                                                    onClick={(event) => {
                                                        const buttonRect =
                                                            event.currentTarget.getBoundingClientRect();

                                                        setLoanMenu((currentMenu) => {
                                                            if (
                                                                currentMenu?.loanId ===
                                                                loan.id
                                                            ) {
                                                                return null;
                                                            }

                                                            return {
                                                                loanId: loan.id,
                                                                top:
                                                                    buttonRect.bottom +
                                                                    4,
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
                        <div>
                            <span>Kopā samaksāts</span>
                            <strong>
                                €{totalPaid.toFixed(2)}
                            </strong>
                        </div>

                        <div>
                            <span>Pamatsummas atmaksa</span>
                            <strong>
                                €{totalPrincipal.toFixed(2)}
                            </strong>
                        </div>

                        <div>
                            <span>Samaksātie procenti</span>
                            <strong>
                                €{totalInterest.toFixed(2)}
                            </strong>
                        </div>
                    </div>
                </>
            ) : (
                <div className="property-expenses-empty">
                    Šim īpašumam vēl nav pievienotu kredīta maksājumu.
                </div>
            )}

            {loanMenu &&
                createPortal(
                    <div
                        className="property-expense-actions-menu property-expense-actions-menu-portal"
                        style={{
                            top: `${loanMenu.top}px`,
                            right: `${loanMenu.right}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const loan = loans.find(
                                    (item) =>
                                        item.id ===
                                        loanMenu.loanId
                                );

                                if (!loan) {
                                    return;
                                }

                                setEditingLoan(loan);
                                setLoanMenu(null);
                                setShowLoanModal(true);
                            }}
                        >
                            <Pencil size={14} />
                            <span>Rediģēt</span>
                        </button>

                        <button
                            type="button"
                            className="delete"
                            onClick={() => {
                                const loan = loans.find(
                                    (item) =>
                                        item.id ===
                                        loanMenu.loanId
                                );

                                if (!loan) {
                                    return;
                                }

                                setLoanToDelete(loan);
                                setLoanMenu(null);
                            }}
                        >
                            <Trash2 size={14} />
                            <span>Dzēst</span>
                        </button>
                    </div>,
                    document.body
                )}

            {loanToDelete && (
                <div
                    className="diary-delete-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isDeletingLoan
                        ) {
                            setLoanToDelete(null);
                        }
                    }}
                >
                    <div className="diary-delete-modal">
                        <div className="diary-delete-heading">
                            <div className="diary-delete-icon">
                                <Trash2 size={18} />
                            </div>

                            <h3>
                                Dzēst kredīta maksājumu?
                            </h3>
                        </div>

                        <p>
                            Vai tiešām vēlies dzēst{" "}
                            <strong>
                                {loanToDelete.title}
                            </strong>
                            ? Šo darbību nevarēs atsaukt.
                        </p>

                        <div className="diary-delete-actions">
                            <button
                                type="button"
                                className="diary-delete-cancel"
                                onClick={() =>
                                    setLoanToDelete(null)
                                }
                                disabled={isDeletingLoan}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="diary-delete-confirm"
                                onClick={handleDeleteLoan}
                                disabled={isDeletingLoan}
                            >
                                <Trash2 size={15} />

                                {isDeletingLoan
                                    ? "Dzēš..."
                                    : "Dzēst"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLoanModal && (
                <LoanModal
                    property={property}
                    loan={editingLoan}
                    initialDate={
                        new Date().toLocaleDateString("en-CA")
                    }
                    onClose={() => {
                        setShowLoanModal(false);
                        setEditingLoan(null);
                    }}
                    onSaved={async () => {
                        await fetchLoans();
                    }}
                />
            )}
        </div>
    );
}

export default PropertyLoan;