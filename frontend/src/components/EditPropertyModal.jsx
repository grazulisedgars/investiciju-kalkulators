import "./EditPropertyModal.css";

function EditPropertyModal({
    editingProperty,
    setEditingProperty,
    onClose,
}) {
    if (!editingProperty) return null;

    function handleInputChange(event) {
        const { name, value } = event.target;

        setEditingProperty((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    return (
        <div className="edit-property-overlay">
            <div className="edit-property-modal">

                <div className="edit-property-modal-header">
                    <div>
                        <h2>Rediģēt īpašumu</h2>
                        <p>Maini īpašuma pamatinformāciju.</p>
                    </div>
                </div>

                <div className="edit-property-form">

                    <div className="edit-property-field">
                        <label htmlFor="edit-property-name">
                            Īpašuma nosaukums
                        </label>

                        <input
                            id="edit-property-name"
                            type="text"
                            name="property_name"
                            value={editingProperty.property_name ?? ""}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="edit-property-field">
                        <label htmlFor="edit-property-address">
                            Adrese
                        </label>

                        <input
                            id="edit-property-address"
                            type="text"
                            name="address"
                            value={editingProperty.address ?? ""}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="edit-property-field">
                        <label htmlFor="edit-property-market-value">
                            Potenciālā tirgus vērtība (€)
                        </label>

                        <input
                            id="edit-property-market-value"
                            type="number"
                            name="market_value"
                            min="0"
                            step="1"
                            value={editingProperty.market_value ?? ""}
                            onChange={handleInputChange}
                            placeholder="Piemēram, 45000"
                        />
                    </div>

                </div>

                <div className="edit-property-actions">
                    <button
                        type="button"
                        className="edit-property-close"
                        onClick={onClose}
                    >
                        Aizvērt
                    </button>
                </div>

            </div>
        </div>
    );
}

export default EditPropertyModal;