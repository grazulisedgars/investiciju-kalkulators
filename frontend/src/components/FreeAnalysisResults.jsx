import "./FreeAnalysisResults.css";

function FreeAnalysisResults({ results }) {
    if (!results) {
        return null;
    }

    return (
        <section className="free-analysis-results">

            <div className="results-header">
                <h2>Investīcijas kopsavilkums</h2>
            </div>

            <div className="results-grid">

                <div className="result-item">
                    <span>Gada bruto īres ienākumi</span>
                    <strong>
                        {results.annual_gross_rent.toFixed(2)} €
                    </strong>
                </div>

                <div className="result-item">
                    <span>Kopējā investīcija</span>
                    <strong>
                        {results.total_investment.toFixed(2)} €
                    </strong>
                </div>

                <div className="result-item result-highlight">
                    <span>Bruto ienesīgums</span>
                    <strong>
                        {results.gross_yield.toFixed(2)} %
                    </strong>
                </div>

            </div>

            <div className="analysis-cta">

                <div className="cta-content">
                    <h3>Vēlies detalizētāku analīzi?</h3>

                    <p>
                        Izveido bezmaksas profilu un iegūsti neto ienesīgumu,
                        iegādes papildu izmaksas, izdevumu analīzi un iespēju
                        saglabāt īpašumus.
                    </p>
                </div>

                <button type="button">
                    Izveidot bezmaksas profilu
                </button>

            </div>

        </section>
    );
}

export default FreeAnalysisResults;