import { useState, useEffect } from "react";
import "./EditPropertyModal.css";

function EditPropertyModal({
    editingProperty,
    setEditingProperty,
    onClose,
    onSave,
}) {
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    useEffect(() => {
        if (!editingProperty) return;

        function handleEscape(event) {
            if (event.key === "Escape" && !isSaving) {
                onClose();
            }
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [editingProperty, isSaving, onClose]);

    async function handleSave() {
        if (isSaving || !editingProperty) return;

        setSaveError("");

        if (!editingProperty.property_name?.trim()) {
            setSaveError("Lūdzu, norādi īpašuma nosaukumu.");
            return;
        }

        const requiredNumbers = [
            "purchase_price",
            "area",
            "renovation_cost_per_m2",
        ];

        if (
            requiredNumbers.some(
                (field) =>
                    editingProperty[field] === "" ||
                    editingProperty[field] == null ||
                    !Number.isFinite(Number(editingProperty[field]))
            )
        ) {
            setSaveError("Lūdzu korekti aizpildi visus skaitliskos laukus.");
            return;
        }

        if (
            Number(editingProperty.purchase_price) <= 0 ||
            Number(editingProperty.area) <= 0 ||
            Number(editingProperty.renovation_cost_per_m2) < 0
        ) {
            setSaveError("Pārbaudi ievadītās summas un platību.");
            return;
        }

        if (
            editingProperty.monthly_rent !== "" &&
            editingProperty.monthly_rent != null &&
            (
                !Number.isFinite(Number(editingProperty.monthly_rent)) ||
                Number(editingProperty.monthly_rent) < 0
            )
        ) {
            setSaveError("Pārbaudi mēneša īres maksu.");
            return;
        }

        if (
            editingProperty.occupancy !== "" &&
            editingProperty.occupancy != null &&
            (
                !Number.isFinite(Number(editingProperty.occupancy)) ||
                Number(editingProperty.occupancy) < 0 ||
                Number(editingProperty.occupancy) > 100
            )
        ) {
            setSaveError("Aizpildījumam jābūt robežās no 0 līdz 100%.");
            return;
        }

        if (editingProperty.financing_type === "mortgage") {
            const downPayment = editingProperty.down_payment_percent;

            if (
                downPayment === "" ||
                downPayment == null ||
                !Number.isFinite(Number(downPayment)) ||
                Number(downPayment) < 0 ||
                Number(downPayment) > 100
            ) {
                setSaveError("Pirmās iemaksas procentiem jābūt robežās no 0 līdz 100.");
                return;
            }
        }

        setIsSaving(true);

        try {
            await onSave(editingProperty);
            onClose();
        } catch (error) {
            setSaveError(error.message || "Neizdevās saglabāt izmaiņas.");
        } finally {
            setIsSaving(false);
        }
    }

    if (!editingProperty) return null;

    function handleInputChange(event) {
        const { name, value } = event.target;

        setEditingProperty((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function renderField(label, name, type = "text", options = {}) {
        return (
            <div className="edit-property-field">
                <label htmlFor={`edit-${name}`}>
                    {label}
                </label>

                <input
                    id={`edit-${name}`}
                    name={name}
                    type={type}
                    value={editingProperty[name] ?? ""}
                    onChange={handleInputChange}
                    min={options.min}
                    max={options.max}
                    step={options.step}
                    placeholder={options.placeholder}
                />
            </div>
        );
    }

    return (
        <div
            className="edit-property-overlay"
            onClick={(event) => {
                if (event.target === event.currentTarget && !isSaving) {
                    onClose();
                }
            }}
        >
            <div
                className="edit-property-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-property-title"
            >

                <div className="edit-property-modal-header">
                    <h2 id="edit-property-title">
                        Rediģēt īpašumu
                    </h2>

                    <p>
                        Maini īpašuma pamatinformāciju.
                    </p>
                </div>

                <div className="edit-property-form">

                    {/* Īpašuma informācija */}

                    <div className="edit-property-section">
                        <h3>Īpašuma informācija</h3>

                        {renderField(
                            "Īpašuma nosaukums",
                            "property_name"
                        )}

                        {renderField(
                            "Adrese",
                            "address"
                        )}

                        {renderField(
                            "Potenciālā tirgus vērtība (€)",
                            "market_value",
                            "number",
                            {
                                min: 0,
                                step: 1,
                                placeholder: "Piemēram 45000",
                            }
                        )}
                    </div>

                    {/* Iegāde un renovācija */}

                    <div className="edit-property-section">
                        <h3>Iegāde un renovācija</h3>

                        <div className="edit-property-fields-grid">
                            {renderField(
                                "Pirkuma cena (€)",
                                "purchase_price",
                                "number",
                                { min: 0, step: 1 }
                            )}

                            {renderField(
                                "Platība (m²)",
                                "area",
                                "number",
                                { min: 0, step: "any" }
                            )}
                        </div>

                        {renderField(
                            "Remonta izmaksas par m (€)",
                            "renovation_cost_per_m2",
                            "number",
                            { min: 0, step: 1 }
                        )}
                    </div>

                    {/*Īres ienākumi */}

                    <div className="edit-property-section">
                        <h3>Īres ienākumi</h3>

                        <div className="edit-property-fields-grid">
                            {renderField(
                                "Mēneša īres maksa (€)",
                                "monthly_rent",
                                "number",
                                { min: 0, step: 1 }
                            )}

                            {renderField(
                                "Gada aizpildījums (%)",
                                "occupancy",
                                "number",
                                { min: 0, max: 100, step: 1 }
                            )}
                        </div>
                    </div>

                    {/*Hipotekārais finansējums */}

                    {editingProperty.financing_type === "mortgage" && (
                        <div className="edit-property-section">
                            <h3>Hipotekārais finansējums</h3>

                            {renderField(
                                "Pirmā iemaksa (%)",
                                "down_payment_percent",
                                "number",
                                { min: 0, max: 100, step: 1 }
                            )}
                        </div>
                    )}

                </div>

                {saveError && (
                    <p className="edit-property-error" role="alert">
                        {saveError}
                    </p>
                )}

                <div className="edit-property-actions">
                    <button
                        type="button"
                        className="edit-property-close"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Atcelt
                    </button>

                    <button
                        type="button"
                        className="edit-property-save"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saglabā..." : "Saglabāt izmaiņas"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditPropertyModal;