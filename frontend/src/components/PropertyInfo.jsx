import { useEffect, useRef, useState } from "react";
import "./PropertyInfo.css";

function PropertyInfo({
    purchasePrice,
    setPurchasePrice,
    area,
    setArea
}) {
    const [pricePerM2, setPricePerM2] = useState(null);

    const areaInputRef = useRef(null);

    useEffect(() => {
        if (!purchasePrice || !area || Number(area) <= 0) {
            setPricePerM2(null);
            return;
        }

        async function calculate() {
            const response = await fetch(
                `http://127.0.0.1:8000/calculate/price-per-m2?purchase_price=${purchasePrice}&area=${area}`
            );

            const data = await response.json();

            setPricePerM2(data.price_per_m2);
        }

        calculate();
    }, [purchasePrice, area]);

    async function calculatePricePerM2() {
        if (!purchasePrice || !area) {
            return;
        }

        const response = await fetch(
            `http://127.0.0.1:8000/calculate/price-per-m2?purchase_price=${purchasePrice}&area=${area}`
        );

        const data = await response.json();

        setPricePerM2(data.price_per_m2);
    }

    return (
        <section className="property-info">
            <h2>Īpašuma pamatinformācija</h2>

            <div className="input-group">
                <label>Īpašuma iegādes cena (€)</label>
                <input
                    type="number"
                    min="0"
                    value={purchasePrice}
                    onChange={(event) => setPurchasePrice(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            areaInputRef.current.focus();
                        }
                    }}
                />
            </div>

            <div className="input-group">
                <label>Platība (m²)</label>
                <input
                    type="number"
                    min="0"
                    value={area}
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
        </section>
    );
}

export default PropertyInfo;