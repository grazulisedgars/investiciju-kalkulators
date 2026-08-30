function PurchaseCosts({ purchasePrice }) {
    return (
        <section className="purchase-costs">
            <h2>Īpašuma iegādes papildu izdevumi</h2>

            <div>
                <p>Notārs</p>
                <strong>-</strong>
            </div>

            <div>
                <p>Notāra PVN</p>
                <strong>-</strong>
            </div>

            <div>
                <label>Kancelejas nodeva (€)</label>
                <input type="number" min="0" />
            </div>

            <div>
                <label>Īpašuma vērtējums (€)</label>
                <input type="number" min="0" />
            </div>

            <div>
                <p>Valsts nodeva</p>
                <strong>-</strong>
            </div>

            <div>
                <p>Kopā</p>
                <strong>-</strong>
            </div>

            <div>
                <h3>Kopējā nepieciešamā summa īpašuma iegādei</h3>
                <strong>-</strong>
            </div>
        </section>
    );
}

export default PurchaseCosts;