import { useState } from "react";
import "./PurchaseCosts.css"

function PurchaseCosts({ purchasePrice }) {
    // Kancelejas nodeva
    const [officeFee, setOfficeFee] = useState("");
    // Īpašuma vērtējums
    const [valuation, setValuation] = useState("");
    const price = Number(purchasePrice);
    const notary = Math.max(price * 0.005, 140);
    const purchaseCosts = price > 0 ? {notary, notary_vat:notary*0.21, state_fee:price*0.015, total_additional_costs:notary*1.21+price*0.015+Number(officeFee||0)+Number(valuation||0), total_purchase_cost:price+notary*1.21+price*0.015+Number(officeFee||0)+Number(valuation||0)} : null;

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
                <label htmlFor="purchase-office-fee">Kancelejas nodeva (€)</label>
                <input
                    type="number"
                    min="0"
                    id="purchase-office-fee" value={officeFee}
                    onChange={(event) => setOfficeFee(event.target.value)}
                />
            </div>

            <div className="cost-input">
                <label htmlFor="purchase-valuation">Īpašuma vērtējums (€)</label>
                <input
                    type="number"
                    min="0"
                    id="purchase-valuation" value={valuation}
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