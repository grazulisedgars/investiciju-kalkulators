import "./FinancingChoice.css";

function FinancingChoice({ setFinancing }) {
    return (
        <div className="financing-choice">
            <button
                className="financing-option"
                onClick={() => setFinancing("mortgage")}
            >
                <span className="financing-kicker">
                    BANKAS FINANSĒJUMS
                </span>

                <span className="financing-title">
                    Ar hipotēku
                </span>

                <span className="financing-description">
                    Aprēķini pirmo iemaksu, kredīta izmaksas un
                    investīcijas atdevi ar bankas finansējumu.
                </span>
            </button>


            <button
                className="financing-option"
                onClick={() => setFinancing("cash")}
            >
                <span className="financing-kicker">
                    SAVS KAPITĀLS
                </span>

                <span className="financing-title">
                    Ar saviem līdzekļiem
                </span>

                <span className="financing-description">
                    Izvērtē ieguldījumu bez kredīta un nosaki kopējo
                    nepieciešamo sākuma kapitālu.
                </span>
            </button>
        </div>
    );
}

export default FinancingChoice;