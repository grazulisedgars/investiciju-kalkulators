
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";

import WorkModal from "./WorkModal";
import "./PropertyExpenses.css";
import "./PropertyWork.css";

function PropertyWork({ property }) {
    const [works, setWorks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const [showWorkModal, setShowWorkModal] =
        useState(false);

    const [editingWork, setEditingWork] =
        useState(null);

    const [workMenu, setWorkMenu] =
        useState(null);

    const [workToDelete, setWorkToDelete] =
        useState(null);

    const [isDeletingWork, setIsDeletingWork] =
        useState(false);

    useEffect(() => {
        if (!workMenu) {
            return;
        }

        function handleWorkMenuClickOutside(event) {
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
                setWorkMenu(null);
            }
        }

        function handleWorkMenuKeyDown(event) {
            if (event.key === "Escape") {
                setWorkMenu(null);
            }
        }

        document.addEventListener(
            "mousedown",
            handleWorkMenuClickOutside
        );

        document.addEventListener(
            "keydown",
            handleWorkMenuKeyDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleWorkMenuClickOutside
            );

            document.removeEventListener(
                "keydown",
                handleWorkMenuKeyDown
            );
        };
    }, [workMenu]);

    // Dienasgrāmatas GET atbildē atlasām tikai darba ierakstus.
    const fetchWorks = useCallback(async (signal) => {
        const response = await fetch(
            `http://localhost:8000/properties/${property.property_id}/diary`,
            { credentials: "include", signal }
        );
        if (!response.ok) {
            throw new Error("Neizdevās ielādēt darba ierakstus.");
        }
        const data = await response.json();
        if (!signal?.aborted) {
            setWorks(data.filter((entry) => entry.entry_type === "work"));
            setLoadError("");
        }
    }, [property.property_id]);

    useEffect(() => {
        const controller = new AbortController();
        async function loadWorks() {
            try {
                await fetchWorks(controller.signal);
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
        loadWorks();
        return () => controller.abort();
    }, [fetchWorks]);

    async function handleDeleteWork() {
        if (!workToDelete) {
            return;
        }

        try {
            setIsDeletingWork(true);
            setDeleteError("");

            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/diary/${workToDelete.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();

                throw new Error(
                    errorData.detail ||
                    "Neizdevās izdzēst darba ierakstu."
                );
            }

            // Dzēšanu uzreiz atspoguļojam sarakstā un stundu kopsummā.
            setWorks((entries) => entries.filter((entry) => entry.id !== workToDelete.id));
            setWorkToDelete(null);
        } catch (error) {
            setDeleteError(error.message || "Neizdevās izdzēst darba ierakstu.");
        } finally {
            setIsDeletingWork(false);
        }
    }

    // Saskaitām stundas simtdaļās, lai kopsummā nerastos peldošā punkta kļūdas.
    const totalHundredths = works.reduce(
        (total, work) => total + Math.round(Number(work.hours || 0) * 100),
        0
    );

    function formatHours(hours) {
        return Number(hours).toLocaleString("lv-LV", {
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
        <div className="property-expenses property-work">
            <div className="property-expenses-header">
                <div>
                    <h2>Darba dienas</h2>

                    <p>
                        Ar īpašumu saistītie darbi un nostrādātās stundas.
                    </p>
                </div>

                <button
                    type="button"
                    className="property-expenses-add"
                    onClick={() => {
                        setEditingWork(null);
                        setShowWorkModal(true);
                    }}
                >
                    <Plus size={17} />
                    Pievienot darba dienu
                </button>
            </div>

            {isLoading ? (
                <div className="property-expenses-empty">
                    Ielādē darba ierakstus...
                </div>
            ) : loadError ? (
                <div className="property-expenses-empty" role="alert">
                    {loadError}
                    <button type="button" className="property-work-retry" onClick={async () => {
                        setIsLoading(true);
                        try { await fetchWorks(); }
                        catch (error) { setLoadError(error.message); }
                        finally { setIsLoading(false); }
                    }}>Mēģināt vēlreiz</button>
                </div>
            ) : works.length > 0 ? (
                <>
                    <div className="property-expenses-table-wrapper">
                        <table className="property-expenses-table">
                            <thead>
                                <tr>
                                    <th>Datums</th>
                                    <th>Darbs</th>
                                    <th>Stundas</th>
                                    <th>Piezīmes</th>
                                    <th aria-label="Darbības" />
                                </tr>
                            </thead>

                            <tbody>
                                {works.map((work) => (
                                    <tr key={work.id}>
                                        <td>
                                            {formatDate(
                                                work.entry_date
                                            )}
                                        </td>

                                        <td className="expense-description">
                                            {work.title}
                                        </td>

                                        <td className="expense-amount">
                                            {formatHours(work.hours)} h
                                        </td>

                                        <td className="expense-notes">
                                            {work.notes || "—"}
                                        </td>

                                        <td className="property-expense-actions-cell">
                                            <div className="property-expense-actions">
                                                <button
                                                    type="button"
                                                    className="property-expense-more"
                                                    aria-label="Darba ieraksta darbības"
                                                    onClick={(event) => {
                                                        const buttonRect =
                                                            event.currentTarget.getBoundingClientRect();

                                                        setWorkMenu(
                                                            (currentMenu) => {
                                                                if (
                                                                    currentMenu?.workId ===
                                                                    work.id
                                                                ) {
                                                                    return null;
                                                                }

                                                                return {
                                                                    workId:
                                                                        work.id,
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
                            Kopējais stundu skaits
                        </strong>

                        <strong>
                            {formatHours(totalHundredths / 100)} h
                        </strong>
                    </div>
                </>
            ) : (
                <div className="property-expenses-empty">
                    Šim īpašumam vēl nav pievienotu darba ierakstu.
                </div>
            )}

            {workMenu &&
                createPortal(
                    <div
                        className="property-expense-actions-menu property-expense-actions-menu-portal"
                        style={{
                            top: `${workMenu.top}px`,
                            right: `${workMenu.right}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                const work = works.find(
                                    (item) =>
                                        item.id ===
                                        workMenu.workId
                                );

                                if (!work) {
                                    return;
                                }

                                setEditingWork(work);
                                setWorkMenu(null);
                                setShowWorkModal(true);
                            }}
                        >
                            <Pencil size={14} />
                            <span>Rediģēt</span>
                        </button>

                        <button
                            type="button"
                            className="delete"
                            onClick={() => {
                                const work = works.find(
                                    (item) =>
                                        item.id ===
                                        workMenu.workId
                                );

                                if (!work) {
                                    return;
                                }

                                setDeleteError("");
                                setWorkToDelete(work);
                                setWorkMenu(null);
                            }}
                        >
                            <Trash2 size={14} />
                            <span>Dzēst</span>
                        </button>
                    </div>,
                    document.body
                )}

            {workToDelete && (
                <div
                    className="diary-delete-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isDeletingWork
                        ) {
                            setWorkToDelete(null);
                        }
                    }}
                >
                    <div className="diary-delete-modal">
                        <div className="diary-delete-heading">
                            <div className="diary-delete-icon">
                                <Trash2 size={18} />
                            </div>

                            <h3>
                                Dzēst darba ierakstu?
                            </h3>
                        </div>

                        <p>
                            Vai tiešām vēlies dzēst{" "}
                            <strong>
                                {workToDelete.title}
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
                                    setWorkToDelete(null)
                                }
                                disabled={isDeletingWork}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="diary-delete-confirm"
                                onClick={handleDeleteWork}
                                disabled={isDeletingWork}
                            >
                                <Trash2 size={15} />

                                {isDeletingWork
                                    ? "Dzēš..."
                                    : "Dzēst"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWorkModal && (
                <WorkModal
                    property={property}
                    work={editingWork}
                    initialDate={[
                        new Date().getFullYear(),
                        String(new Date().getMonth() + 1).padStart(2, "0"),
                        String(new Date().getDate()).padStart(2, "0"),
                    ].join("-")}
                    onClose={() => {
                        setEditingWork(null);
                        setShowWorkModal(false);
                    }}
                    onSaved={async () => {
                        await fetchWorks();
                    }}
                />
            )}
        </div>
    );
}

export default PropertyWork;
