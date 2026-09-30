import { House } from "lucide-react";
import "./FreeAnalysisOverview.css";

function FreeAnalysisOverview({ property }) {
    if (!property) return null;

    const formatCurrency = (value) =>
        new Intl.NumberFormat("lv-LV", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));

    const purchasePrice = Number(property.purchase_price || 0);
    const area = Number(property.area || 0);

    const renovationPerM2 = Number(
        property.renovation_cost_per_m2 || 0
    );

    const renovationTotal = area * renovationPerM2;

    const hasRentalData =
        property.monthly_rent !== null &&
        property.monthly_rent !== undefined &&
        property.occupancy !== null &&
        property.occupancy !== undefined;

    const monthlyRent = hasRentalData
        ? Number(property.monthly_rent)
        : null;

    const occupancy = hasRentalData
        ? Number(property.occupancy)
        : null;

    const annualRent = hasRentalData
        ? monthlyRent * 12 * (occupancy / 100)
        : null;

    const totalInvestment = purchasePrice + renovationTotal;

    const grossYield =
        hasRentalData && totalInvestment > 0
            ? (annualRent / totalInvestment) * 100
            : null;

    const pricePerM2 =
        area > 0 ? purchasePrice / area : 0;

    return (
        <div className="free-overview">

            <div className="free-overview-heading">
                <h2>Pamata analīze</h2>
                <p>Šeit redzami īpašuma ievades dati un aprēķini</p>
            </div>

            <div className="free-overview-panels">

                {/*Pamata informācija */}
                <div className="free-overview-panel">

                    <h3>Īpašuma pamatinformācija</h3>

                    <div className="free-overview-panel-body">

                        <div className="free-overview-row">
                            <span>Pirkuma cena</span>
                            <strong>{formatCurrency(purchasePrice)}</strong>
                        </div>

                        <div className="free-overview-row">
                            <span>Platība</span>
                            <strong>{area} m²</strong>
                        </div>

                        <div className="free-overview-row">
                            <span>Cena par m²</span>
                            <strong>{formatCurrency(pricePerM2)}</strong>
                        </div>

                        <div className="free-overview-row">
                            <span>Remonta izmaksas par m²</span>
                            <strong>{formatCurrency(renovationPerM2)}</strong>
                        </div>

                        <div className="free-overview-row">
                            <span>Kopējās remonta izmaksas</span>
                            <strong>{formatCurrency(renovationTotal)}</strong>
                        </div>

                        <div className="free-overview-row total">
                            <span>Kopējā investīcija</span>
                            <strong>{formatCurrency(totalInvestment)}</strong>
                        </div>

                    </div>
                </div>

                {/*Īre un ienesīgums */}
                <div className="free-overview-panel">
                    <h3>Īre un ienesīgums</h3>

                    <div className="free-overview-panel-body">

                        <div className="free-overview-row">
                            <span>Plānotā īres maksa</span>
                            <strong>
                                {monthlyRent === null
                                    ? "—"
                                    : `${formatCurrency(monthlyRent)} /mēn.`}
                            </strong>
                        </div>

                        <div className="free-overview-row">
                            <span>Gada aizpildījums</span>
                            <strong>
                                {occupancy === null
                                    ? "—"
                                    : `${occupancy}%`}
                            </strong>
                        </div>

                        <div className="free-overview-row">
                            <span>Gada bruto īres ienākumi</span>
                            <strong>
                                {annualRent === null
                                    ? "—"
                                    : formatCurrency(annualRent)}
                            </strong>
                        </div>

                        <div className="free-overview-row total">
                            <span>Bruto ienesīgums</span>
                            <strong>
                                {grossYield === null
                                    ? "—"
                                    : `${grossYield.toFixed(2)}%`}
                            </strong>
                        </div>

                    </div>
                </div>
            </div>


            {/*Hipotekārais finansējums */}
            {property.financing_type === "mortgage" && (
                <div className="free-overview-panel mortgage-panel">

                    <h3>Hipotekārais finansējums</h3>

                    <div className="free-overview-panel-body">

                        {(() => {
                            const downPaymentPercent = Number(
                                property.down_payment_percent || 0
                            );

                            const downPayment =
                                purchasePrice * downPaymentPercent / 100;

                            const loanAmount = purchasePrice - downPayment;

                            return (
                                <>
                                    <div className="free-overview-row">
                                        <span>Pirmā iemaksa</span>
                                        <strong>{downPaymentPercent}%</strong>
                                    </div>

                                    <div className="free-overview-row">
                                        <span>Pirmās iemaksas summa</span>
                                        <strong>{formatCurrency(downPayment)}</strong>
                                    </div>

                                    <div className="free-overview-row">
                                        <span>Kredīta summa</span>
                                        <strong>{formatCurrency(loanAmount)}</strong>
                                    </div>

                                    <div className="free-overview-row total">
                                        <span>Sākotnēji nepieciešamais kapitāls</span>
                                        <strong>
                                            {formatCurrency(downPayment + renovationTotal)}
                                        </strong>
                                    </div>
                                </>
                            );
                        })()}

                    </div>
                </div>
            )}

            {/* Īpašuma tirgus vērtība */}
            <div className="free-overview-market-value">

                <div className="free-overview-market-info">
                    <div className="free-overview-market-icon">
                        <House size={22} strokeWidth={1.8} />
                    </div>

                    <div>
                        <h3>Īpašuma tirgus novērtējums</h3>
                        <p>Lietotāja norādītā potenciālā tirgus vērtība</p>
                    </div>
                </div>

                <div className="free-overview-market-result">
                    <strong>
                        {property.market_value !== null &&
                            property.market_value !== undefined &&
                            property.market_value !== ""
                            ? formatCurrency(property.market_value)
                            : "Nav norādīta"}
                    </strong>
                </div>

            </div>
        </div>


    );
}

export default FreeAnalysisOverview;