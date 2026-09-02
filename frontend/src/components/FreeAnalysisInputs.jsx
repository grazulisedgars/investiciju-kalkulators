import "./FreeAnalysisInputs.css";

function FreeAnalysisInputs({
    renovationCosts,
    setRenovationCosts,
    monthlyRent,
    setMonthlyRent,
    occupancy,
    setOccupancy
}) {

    return (
        <section className="free-analysis-inputs">
            <h2>Investīcijas pieņēmumi</h2>
            <div className="input-group">
                <label>Remonta izmaksas (€)</label>
                <input
                    type="number"
                    min="0"
                    value={renovationCosts}
                    onChange={(event) => setRenovationCosts(event.target.value)}
                />
            </div>

            <div className="input-group">
                <label>Īres maksa mēnesī (€)</label>
                <input
                    type="number"
                    min="0"
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(event.target.value)}
                />
            </div>

            <div className="input-group">
                <label>Plānotais aizpildījums (%)</label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    value={occupancy}
                    onChange={(event) => setOccupancy(event.target.value)}
                />
            </div>
        </section>
    );
}

export default FreeAnalysisInputs;