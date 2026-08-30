function FinancingChoice({ setFinancing }) {
    return (
        <section>
            <h2>Kā plāno finansēt šo investīciju?</h2>

            <button onClick={() => setFinancing("mortgage")}>
                🏦 Ar hipotēku
            </button>

            <button onClick={() => setFinancing("cash")}>
                💶 Par saviem līdzekļiem
            </button>
        </section>
    );
}

export default FinancingChoice;