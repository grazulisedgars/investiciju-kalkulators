import "./FinancingChoice.css";
import mortgageIcon from "../assets/icons/mortgage-icon.svg";
import cashIcon from "../assets/icons/cash-icon.svg";

function FinancingChoice({ setFinancing }) {
    return (
        <div className="financing-choice">
            <button
                className="financing-option financing-option-mortgage"
                onClick={() => setFinancing("mortgage")}
            >
                <img
                    src={mortgageIcon}
                    alt=""
                    className="financing-icon"
                />

                <span className="financing-title">
                    Ar hipotēku
                </span>

                <span className="financing-arrow">→</span>
            </button>


            <button
                className="financing-option financing-option-cash"
                onClick={() => setFinancing("cash")}
            >
                <img
                    src={cashIcon}
                    alt=""
                    className="financing-icon"
                />

                <span className="financing-title">
                    Ar saviem līdzekļiem
                </span>

                <span className="financing-arrow">→</span>
            </button>
        </div>
    );
}

export default FinancingChoice;