import "./FreeAnalysisInputs.css";

function FreeAnalysisInputs({
    renovationCostPerM2,
    setRenovationCostPerM2,
    totalRenovationCosts,
    monthlyRent,
    setMonthlyRent,
    occupancy,
    setOccupancy
}) {

    return (
        <section className="free-analysis-inputs">
            <h2>Investīcijas pieņēmumi</h2>
            <div className="input-group">
                <label>Plānotās remonta izmaksas par m² (€)</label>
                <input
                    type="number"
                    min="0"
                    value={renovationCostPerM2}
                    onChange={(event) =>
                        setRenovationCostPerM2(event.target.value)}
                />
            </div>

            <div className="renovation-result">
                <p>Kopējās remonta izmaksas</p>

                <strong>
                    {Math.round(totalRenovationCosts).toLocaleString("lv-LV")} €
                </strong>
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
                    onKeyDown={(event) => {
                        if (["-", "+", "e", "E"].includes(event.key)) {
                            event.preventDefault();
                        }
                    }}
                    onChange={(event) => {
                        const value = event.target.value;

                        if (value === "") {
                            setOccupancy("");
                            return;
                        }

                        const number = Number(value);

                        if (number >= 0 && number <= 100) {
                            setOccupancy(value);
                        }
                    }}
                />
                <p className="input-hint">
                    * 100% = izīrēts 12 mēnešus gadā, 50% = 6 mēnešus.
                </p>
            </div>
        </section>
    );
}

export default FreeAnalysisInputs;