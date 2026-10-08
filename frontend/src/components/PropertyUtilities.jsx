
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";

import UtilityModal from "./UtilityModal";
import "./PropertyExpenses.css";

function PropertyUtilities({ property }) {
    const [utilities, setUtilities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showUtilityModal, setShowUtilityModal] =
        useState(false);

    const [editingUtility, setEditingUtility] =
        useState(null);

    const [utilityMenu, setUtilityMenu] =
        useState(null);

    const [utilityToDelete, setUtilityToDelete] =
        useState(null);

    const [isDeletingUtility, setIsDeletingUtility] =
        useState(false);

    useEffect(() => {
        if (!utilityMenu) {
            return;
        }

        function handleUtilityMenuClickOutside(event) {
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
                setUtilityMenu(null);
            }
        }

        function handleUtilityMenuKeyDown(event) {
            if (event.key === "Escape") {
                setUtilityMenu(null);
            }
        }

        document.addEventListener(
            "mousedown",
            handleUtilityMenuClickOutside
        );

        document.addEventListener(
            "keydown",
            handleUtilityMenuKeyDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleUtilityMenuClickOutside
            );

            document.removeEventListener(
                "keydown",
                handleUtilityMenuKeyDown
            );
        };
    }, [utilityMenu]);

    async function fetchUtilities() {
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
                    "Neizdevās ielādēt komunālos maksājumus."
                );
            }

            const data = await response.json();

            const utilityEntries = data.filter(
                (entry) => entry.entry_type === "utility"
            );

            setUtilities(utilityEntries);
        } catch (error) {
            console.error("Utility GET error:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (property?.property_id) {
            fetchUtilities();
        }
    }, [property?.property_id]);

    async function handleDeleteUtility() {
        if (!utilityToDelete) {
            return;
        }

        try {
            setIsDeletingUtility(true);

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary/${utilityToDelete.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās izdzēst komunālo maksājumu."
                );
            }

            setUtilityToDelete(null);
            await fetchUtilities();
        } catch (error) {
            console.error("Utility DELETE error:", error);
        } finally {
            setIsDeletingUtility(false);
        }
    }

    const totalUtilities = utilities.reduce(
        (total, utility) =>
            total + Number(utility.amount || 0),
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
                    <h2>Komunālie maksājumi</h2>

                    <p>
                        Visi ar īpašumu saistītie komunālie
                        pakalpojumi un rēķini.
                    </p>
                </div>

                <button
                    type="button"
                    className="property-expenses-add"
                    onClick={() => {
                        setEditingUtility(null);
                        setShowUtilityModal(true);
                    }}
                >
                    <Plus size={17} />
                    Pievienot maksājumu
                </button>
            </div>

            {isLoading ? (
                <div className="property-expenses-empty">
                    Ielādē komunālos maksājumus...
                </div>
            ) : utilities.length > 0 ? (
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
                                {utilities.map((utility) => (
                                    <tr key={utility.id}>
                                        <td>
                                            {formatDate(
                                                utility.entry_date
                                            )}
                                        </td>

                                        <td className="expense-description">
                                            {utility.title}
                                        </td>

                                        <td className="expense-amount">
                                            €{Number(
                                                utility.amount
                                            ).toFixed(2)}
                                        </td>

                                        <td className="expense-notes">
                                            {utility.notes || "—"}
                                        </td>

                                        <td className="property-expense-actions-cell">
                                            <div className="property-expense-actions">
                                                <button
                                                    type="button"
                                                    className="property-expense-more"
                                                    aria-label="Maksājuma darbības"
                                                    onClick={(event) => {
                                                        const buttonRect =
                                                            event.currentTarget.getBoundingClientRect();

                                                        setUtilityMenu(
                                                            (currentMenu) => {
                                                                if (
                                                                    currentMenu?.utilityId ===
                                                                    utility.id
                                                                ) {
                                                                    return null;
                                                                }

                                                                return {
                                                                    utilityId:
                                                                        utility.id,
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
                            Kopā samaksāts (komunālie)
                        </strong>

                        <strong>
                            €{totalUtilities.toFixed(2)}
                        </strong>
                    </div>
                </>
            ) : (
                <div className="property-expenses-empty">
                    Šim īpašumam vēl nav pievienotu
                    komunālo maksājumu.
                </div>
            )}

            {utilityMenu &&
                createPortal(
                    <div
                        className="property-expense-actions-menu property-expense-actions-menu-portal"
                        style={{
                            top: `${utilityMenu.top}px`,
                            right: `${utilityMenu.right}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const utility = utilities.find(
                                    (item) =>
                                        item.id ===
                                        utilityMenu.utilityId
                                );

                                if (!utility) {
                                    return;
                                }

                                setEditingUtility(utility);
                                setUtilityMenu(null);
                                setShowUtilityModal(true);
                            }}
                        >
                            <Pencil size={14} />
                            <span>Rediģēt</span>
                        </button>

                        <button
                            type="button"
                            className="delete"
                            onClick={() => {
                                const utility = utilities.find(
                                    (item) =>
                                        item.id ===
                                        utilityMenu.utilityId
                                );

                                if (!utility) {
                                    return;
                                }

                                setUtilityToDelete(utility);
                                setUtilityMenu(null);
                            }}
                        >
                            <Trash2 size={14} />
                            <span>Dzēst</span>
                        </button>
                    </div>,
                    document.body
                )}

            {utilityToDelete && (
                <div
                    className="diary-delete-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isDeletingUtility
                        ) {
                            setUtilityToDelete(null);
                        }
                    }}
                >
                    <div className="diary-delete-modal">
                        <div className="diary-delete-heading">
                            <div className="diary-delete-icon">
                                <Trash2 size={18} />
                            </div>

                            <h3>
                                Dzēst komunālo maksājumu?
                            </h3>
                        </div>

                        <p>
                            Vai tiešām vēlies dzēst{" "}
                            <strong>
                                {utilityToDelete.title}
                            </strong>
                            ? Šo darbību nevarēs atsaukt.
                        </p>

                        <div className="diary-delete-actions">
                            <button
                                type="button"
                                className="diary-delete-cancel"
                                onClick={() =>
                                    setUtilityToDelete(null)
                                }
                                disabled={isDeletingUtility}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="diary-delete-confirm"
                                onClick={handleDeleteUtility}
                                disabled={isDeletingUtility}
                            >
                                <Trash2 size={15} />

                                {isDeletingUtility
                                    ? "Dzēš..."
                                    : "Dzēst"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUtilityModal && (
                <UtilityModal
                    property={property}
                    utility={editingUtility}
                    initialDate={
                        new Date().toLocaleDateString("en-CA")
                    }
                    onClose={() =>
                        setShowUtilityModal(false)
                    }
                    onSaved={async () => {
                        await fetchUtilities();
                    }}
                />
            )}
        </div>
    );
}

export default PropertyUtilities;
