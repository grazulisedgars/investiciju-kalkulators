import "./FreeAnalysisResults.css";

function FreeAnalysisResults({ results }) {
    if (!results) {
        return null;
    }

    return (
        <section className="free-analysis-results">
            <h2>Investīcijas kopsavilkums</h2>

            <div>
                <p>Gada bruto īres ienākumi</p>
                <strong>
                    {results.annual_gross_rent.toFixed(2)} €
                </strong>
            </div>

            <div>
                <p>Kopējā investīcija</p>
                <strong>
                    {results.total_investment.toFixed(2)} €
                </strong>
            </div>

            <div>
                <p>Bruto ienesīgums</p>
                <strong>
                    {results.gross_yield.toFixed(2)} %
                </strong>
            </div>

            <div className="premium-teaser">
                <div className="teaser-copy">
                    <p className="teaser-label">
                        AR BEZMAKSAS PROFILU
                    </p>

                    <h3>
                        Iegūsti detalizētāku investīcijas analīzi
                    </h3>

                    <p className="teaser-description">
                        Piekļūsti papildu rādītājiem, detalizētākām izmaksām
                        un saglabā īpašumus savā profilā.
                    </p>
                </div>

                <div className="teaser-metrics">
                    <span>Neto ienesīgums</span>
                    <span>Iegādes papildu izmaksas</span>
                    <span>Izdevumu analīze</span>
                    <span>Saglabā īpašumus profilā</span>

                </div>
            </div>

            <div className="analysis-cta">
                <h3>Vēlies detalizētāku analīzi?</h3>

                <p>
                    Izveido  bezmaksas profilu un analizē īpašuma izmaksas,
                    neto ienesīgumu un citus svarīgus investīcijas rādītājus.
                </p>

                <button type="button">
                    Izveidot profilu
                </button>
            </div>
        </section>
    );
}

export default FreeAnalysisResults;