import { useEffect, useState } from "react";
import "./PurchaseCosts.css"

function PurchaseCosts({ purchasePrice }) {
    // Kancelejas nodeva
    const [officeFee, setOfficeFee] = useState("");
    // Īpašuma vērtējums
    const [valuation, setValuation] = useState("");
    const [purchaseCosts, setPurchaseCosts] = useState(null);

    useEffect(() => {
        if (!purchasePrice || Number(purchasePrice) <= 0) {
            setPurchaseCosts(null);
            return;
        }

        async function calculatePurchaseCosts() {
            const response = await fetch(
                `http://127.0.0.1:8000/calculate/purchase-costs?purchase_price=${purchasePrice}&office_fee=${officeFee || 0}&valuation=${valuation || 0}`
            );

            const data = await response.json();

            setPurchaseCosts(data);
        }

        calculatePurchaseCosts();
    }, [purchasePrice, officeFee, valuation]);

    return (
        <section className="purchase-costs">
            <h2>Īpašuma iegādes papildu izdevumi</h2>

            <div className="cost-row">
                <p>Notārs</p>
                <strong>
                    {purchaseCosts !== null
                        ? `${purchaseCosts.notary.toFixed(2)} €`
                        : "-"}
                </strong>
            </div>

            <div className="cost-row">
                <p>Notāra PVN</p>
                <strong>
                    {purchaseCosts !== null
                        ? `${purchaseCosts.notary_vat.toFixed(2)} €`
                        : "-"}
                </strong>
            </div>

            <div className="cost-input">
                <label>Kancelejas nodeva (€)</label>
                <input
                    type="number"
                    min="0"
                    value={officeFee}
                    onChange={(event) => setOfficeFee(event.target.value)}
                />
            </div>

            <div className="cost-input">
                <label>Īpašuma vērtējums (€)</label>
                <input
                    type="number"
                    min="0"
                    value={valuation}
                    onChange={(event) => setValuation(event.target.value)}
                />
            </div>

            <div className="cost-row">
                <p>Valsts nodeva</p>
                <strong>
                    {purchaseCosts !== null
                        ? `${purchaseCosts.state_fee.toFixed(2)} €`
                        : "-"}
                </strong>
            </div>

            <div className="total-row">
                <p>Kopā</p>
                <strong>
                    {purchaseCosts !== null
                        ? `${purchaseCosts.total_additional_costs.toFixed(2)} €`
                        : "-"}
                </strong>
            </div>

            <div className="purchase-total">
                <h3>Kopējā nepieciešamā summa īpašuma iegādei</h3>
                <strong>
                    {purchaseCosts != null
                        ? `${purchaseCosts.total_purchase_cost.toFixed(2)} €`
                        : "-"}
                </strong>
            </div>
        </section>
    );
}

export default PurchaseCosts;