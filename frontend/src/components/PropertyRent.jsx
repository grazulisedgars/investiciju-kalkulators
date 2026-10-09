
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";

import RentModal from "./RentModal";
import "./PropertyExpenses.css";
import "./PropertyRent.css";

function PropertyRent({ property }) {
    const [rents, setRents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const [showRentModal, setShowRentModal] =
        useState(false);

    const [editingRent, setEditingRent] =
        useState(null);

    const [rentMenu, setRentMenu] =
        useState(null);

    const [rentToDelete, setRentToDelete] =
        useState(null);

    const [isDeletingRent, setIsDeletingRent] =
        useState(false);

    useEffect(() => {
        if (!rentMenu) {
            return;
        }

        function handleRentMenuClickOutside(event) {
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
                setRentMenu(null);
            }
        }

        function handleRentMenuKeyDown(event) {
            if (event.key === "Escape") {
                setRentMenu(null);
            }
        }

        document.addEventListener(
            "mousedown",
            handleRentMenuClickOutside
        );

        document.addEventListener(
            "keydown",
            handleRentMenuKeyDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleRentMenuClickOutside
            );

            document.removeEventListener(
                "keydown",
                handleRentMenuKeyDown
            );
        };
    }, [rentMenu]);

    // Dienasgrāmatas GET atbildē atlasām tikai īres maksājumus.
    const fetchRents = useCallback(async (signal) => {
        const response = await fetch(
            `http://localhost:8000/properties/${property.property_id}/diary`,
            { credentials: "include", signal }
        );
        if (!response.ok) {
            throw new Error("Neizdevās ielādēt īres maksājumus.");
        }
        const data = await response.json();
        if (!signal?.aborted) {
            setRents(data.filter((entry) => entry.entry_type === "rent"));
            setLoadError("");
        }
    }, [property.property_id]);

    useEffect(() => {
        const controller = new AbortController();
        async function loadRents() {
            try {
                await fetchRents(controller.signal);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setLoadError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }
        loadRents();
        return () => controller.abort();
    }, [fetchRents]);

    async function handleDeleteRent() {
        if (!rentToDelete) {
            return;
        }

        try {
            setIsDeletingRent(true);
            setDeleteError("");

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary/${rentToDelete.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās izdzēst īres maksājumu."
                );
            }

            // Dzēšanu uzreiz atspoguļojam sarakstā un stundu kopsummā.
            setRents((entries) => entries.filter((entry) => entry.id !== rentToDelete.id));
            setRentToDelete(null);
        } catch (error) {
            setDeleteError(error.message || "Neizdevās izdzēst īres maksājumu.");
        } finally {
            setIsDeletingRent(false);
        }
    }

    // Saskaitām īres summas centos, lai kopsummā nerastos peldošā punkta kļūdas.
    const totalCents = rents.reduce(
        (total, rent) => total + Math.round(Number(rent.amount || 0) * 100),
        0
    );

    function formatAmount(amount) {
        return Number(amount).toLocaleString("lv-LV", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    function formatDate(dateString) {
        if (!dateString) {
            return "-";
        }

        const [year, month, day] = dateString.split("-");

        return `${day}.${month}.${year}`;
    }

    return (
        <div className="property-expenses property-rent">
            <div className="property-expenses-header">
                <div>
                    <h2>Saņemtā īre</h2>

                    <p>
                        Saņemtie īres maksājumi par īpašumu.
                    </p>
                </div>

                <button
                    type="button"
                    className="property-expenses-add"
                    onClick={() => {
                        setEditingRent(null);
                        setShowRentModal(true);
                    }}
                >
                    <Plus size={17} />
                    Pievienot īres maksājumu
                </button>
            </div>

            {isLoading ? (
                <div className="property-expenses-empty">
                    Ielādē īres maksājumus...
                </div>
            ) : loadError ? (
                <div className="property-expenses-empty" role="alert">
                    {loadError}
                    <button type="button" className="property-rent-retry" onClick={async () => {
                        setIsLoading(true);
                        try { await fetchRents(); }
                        catch (error) { setLoadError(error.message); }
                        finally { setIsLoading(false); }
                    }}>Mēģināt vēlreiz</button>
                </div>
            ) : rents.length > 0 ? (
                <>
                    <div className="property-expenses-table-wrapper">
                        <table className="property-expenses-table">
                            <thead>
                                <tr>
                                    <th>Datums</th>
                                    <th>Maksājums</th>
                                    <th>Summa (€)</th>
                                    <th>Piezīmes</th>
                                    <th aria-label="Darbības" />
                                </tr>
                            </thead>

                            <tbody>
                                {rents.map((rent) => (
                                    <tr key={rent.id}>
                                        <td>
                                            {formatDate(
                                                rent.entry_date
                                            )}
                                        </td>

                                        <td className="expense-description">
                                            {rent.title}
                                        </td>

                                        <td className="expense-amount">
                                            €{formatAmount(rent.amount)}
                                        </td>

                                        <td className="expense-notes">
                                            {rent.notes || "—"}
                                        </td>

                                        <td className="property-expense-actions-cell">
                                            <div className="property-expense-actions">
                                                <button
                                                    type="button"
                                                    className="property-expense-more"
                                                    aria-label="Īres maksājuma darbības"
                                                    onClick={(event) => {
                                                        const buttonRect =
                                                            event.currentTarget.getBoundingClientRect();

                                                        setRentMenu(
                                                            (currentMenu) => {
                                                                if (
                                                                    currentMenu?.rentId ===
                                                                    rent.id
                                                                ) {
                                                                    return null;
                                                                }

                                                                return {
                                                                    rentId:
                                                                        rent.id,
                                                                    top:
                                                                        buttonRect.bottom +
                                                                        4,
                                                                    right:
                                                                        window.innerWidth -
                                                                        buttonRect.right,
                                                                };
                                                            }
                                                        );
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
                        <strong>
                            Kopā saņemts
                        </strong>

                        <strong>
                            €{formatAmount(totalCents / 100)}
                        </strong>
                    </div>
                </>
            ) : (
                <div className="property-expenses-empty">
                    Šim īpašumam vēl nav pievienotu īres maksājumu.
                </div>
            )}

            {rentMenu &&
                createPortal(
                    <div
                        className="property-expense-actions-menu property-expense-actions-menu-portal"
                        style={{
                            top: `${rentMenu.top}px`,
                            right: `${rentMenu.right}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const rent = rents.find(
                                    (item) =>
                                        item.id ===
                                        rentMenu.rentId
                                );

                                if (!rent) {
                                    return;
                                }

                                setEditingRent(rent);
                                setRentMenu(null);
                                setShowRentModal(true);
                            }}
                        >
                            <Pencil size={14} />
                            <span>Rediģēt</span>
                        </button>

                        <button
                            type="button"
                            className="delete"
                            onClick={() => {
                                const rent = rents.find(
                                    (item) =>
                                        item.id ===
                                        rentMenu.rentId
                                );

                                if (!rent) {
                                    return;
                                }

                                setDeleteError("");
                                setRentToDelete(rent);
                                setRentMenu(null);
                            }}
                        >
                            <Trash2 size={14} />
                            <span>Dzēst</span>
                        </button>
                    </div>,
                    document.body
                )}

            {rentToDelete && (
                <div
                    className="diary-delete-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isDeletingRent
                        ) {
                            setRentToDelete(null);
                        }
                    }}
                >
                    <div className="diary-delete-modal">
                        <div className="diary-delete-heading">
                            <div className="diary-delete-icon">
                                <Trash2 size={18} />
                            </div>

                            <h3>
                                Dzēst īres maksājumu?
                            </h3>
                        </div>

                        <p>
                            Vai tiešām vēlies dzēst{" "}
                            <strong>
                                {rentToDelete.title}
                            </strong>
                            ? Šo darbību nevarēs atsaukt.
                        </p>

                        {deleteError && (
                            <p className="diary-form-error" role="alert">{deleteError}</p>
                        )}

                        <div className="diary-delete-actions">
                            <button
                                type="button"
                                className="diary-delete-cancel"
                                onClick={() =>
                                    setRentToDelete(null)
                                }
                                disabled={isDeletingRent}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="diary-delete-confirm"
                                onClick={handleDeleteRent}
                                disabled={isDeletingRent}
                            >
                                <Trash2 size={15} />

                                {isDeletingRent
                                    ? "Dzēš..."
                                    : "Dzēst"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRentModal && (
                <RentModal
                    property={property}
                    rent={editingRent}
                    initialDate={[
                        new Date().getFullYear(),
                        String(new Date().getMonth() + 1).padStart(2, "0"),
                        String(new Date().getDate()).padStart(2, "0"),
                    ].join("-")}
                    onClose={() => {
                        setEditingRent(null);
                        setShowRentModal(false);
                    }}
                    onSaved={async () => {
                        await fetchRents();
                    }}
                />
            )}
        </div>
    );
}

export default PropertyRent;
