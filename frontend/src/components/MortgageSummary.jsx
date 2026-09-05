import "./MortgageSummary.css";

function MortgageSummary({
    downPaymentPercent,
    renovationCostPerM2,
    downPaymentAmount,
    loanAmount,
    initialCapitalNeeded

}) {
    return (
        <section className="mortgage-summary">
            <h2>Finansējuma kopsavilkums</h2>

            <div className="summary-result">
                <p>Pirmā iemaksa</p>
                <strong>
                    {downPaymentPercent !== ""
                        ? `${Math.round(downPaymentAmount).toLocaleString("lv-LV")} €`
                        : "-"}
                </strong>
            </div>

            <div className="summary-result">
                <p>Kredīta summa</p>
                <strong>
                    {downPaymentPercent !== ""
                        ? `${Math.round(loanAmount).toLocaleString("lv-LV")} €`
                        : "-"}
                </strong>
            </div>

            <div className="summary-result">
                <p>Sākotnēji nepieciešamais kapitāls</p>
                <strong>
                    {downPaymentPercent !== "" && renovationCostPerM2 !== ""
                        ? `${Math.round(initialCapitalNeeded).toLocaleString("lv-LV")} €`
                        : "-"}
                </strong>
            </div>
        </section>
    );
}

export default MortgageSummary;