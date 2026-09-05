import "./MortgageInputs.css";

function MortgageInputs({
    downPaymentPercent,
    setDownPaymentPercent,
    downPaymentAmount,
    loanAmount
}) {
    return (
        <section className="mortgage-inputs">
            <h2>Finansējuma informācija</h2>

            <div className="input-group">
                <label>Pirmā iemaksa (%)</label>

                <input
                    type="number"
                    min="0"
                    max="100"
                    value={downPaymentPercent}
                    onKeyDown={(event) => {
                        if (["-", "+", "e", "E"].includes(event.key)) {
                            event.preventDefault();
                        }
                    }}
                    onChange={(event) => {
                        const value = event.target.value;

                        if (value === "") {
                            setDownPaymentPercent("");
                            return;
                        }

                        const number = Number(value);

                        if (number >= 0 && number <= 100) {
                            setDownPaymentPercent(value);
                        }
                    }}
                />
            </div>


            <div className="mortgage-result">
                <p>Pirmā iemaksa</p>

                <strong>
                    {downPaymentPercent !== ""
                        ? `${Math.round(downPaymentAmount).toLocaleString("lv-LV")} €`
                        : "-"}
                </strong>
            </div>



            <div className="mortgage-result">
                <p>Kredīta summa</p>

                <strong>
                    {downPaymentPercent !== ""
                        ? `${Math.round(loanAmount).toLocaleString("lv-LV")} €`
                        : "-"}
                </strong>
            </div>
        </section>
    );
}

export default MortgageInputs;