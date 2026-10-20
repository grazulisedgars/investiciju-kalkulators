import { useRef } from "react";
import "./PropertyInfo.css";

function PropertyInfo({
    purchasePrice,
    setPurchasePrice,
    area,
    setArea,
    pricePerM2AfterRenovation,
    renovationCostPerM2
}) {
    const areaInputRef = useRef(null);
    const pricePerM2 = Number(purchasePrice) > 0 && Number(area) > 0 ? Number(purchasePrice)/Number(area) : null;

    return (
        <section className="property-info">
            <h2>Īpašuma pamatinformācija</h2>

            <div className="input-group">
                <label htmlFor="property-purchase-price">
                    Īpašuma iegādes cena (€)
                    <span className="required-mark">*</span>
                </label>
                <input
                    type="number"
                    min="0"
                    id="property-purchase-price" aria-invalid={purchasePrice !== "" && Number(purchasePrice) <= 0} value={purchasePrice}
                    onChange={(event) => setPurchasePrice(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            areaInputRef.current.focus();
                        }
                    }}
                />
            </div>

            <div className="input-group">
                <label htmlFor="property-area">
                    Platība (m²)
                    <span className="required-mark">*</span>
                </label>
                <input
                    type="number"
                    min="0"
                    id="property-area" aria-invalid={area !== "" && Number(area) <= 0} value={area}
                    onChange={(event) => setArea(event.target.value)}
                    ref={areaInputRef}
                />
            </div>

            <div className="calculation-result">
                <p>Cena par m²</p>

                <strong>
                    {pricePerM2 !== null
                        ? `${pricePerM2.toFixed(2)} €/m²`
                        : "-"}
                </strong>
            </div>

            {Number(renovationCostPerM2) > 0 && (
                <div className="calculation-result">
                    <p>Cena par m² pēc remonta</p>

                    <strong>
                        {pricePerM2AfterRenovation > 0
                            ? `${pricePerM2AfterRenovation.toFixed(2)} €/m²`
                            : "-"}
                    </strong>
                </div>
            )}

        </section>
    );
}

export default PropertyInfo;