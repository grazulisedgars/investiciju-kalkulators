import { useState } from "react";
import "./App.css";
import FinancingChoice from "./components/FinancingChoice";
import PropertyInfo from "./components/PropertyInfo";
import PurchaseCosts from "./components/PurchaseCosts";

function App() {
  const [financing, setFinancing] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [area, setArea] = useState("");

  return (
    <main className="app">
      <h1>Vai šis īpašums ir labs ieguldījums?</h1>

      <p>
        Aprēķini potenciālo atdevi no nekustamā īpašuma
        iegādes un izvērtē, cik izdevīgs ir šis ieguldījums.
      </p>

      <FinancingChoice setFinancing={setFinancing} />

      {financing === "cash" && (
        <>
          <PropertyInfo
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            area={area}
            setArea={setArea}
          />

          <PurchaseCosts purchasePrice={purchasePrice} />
        </>
      )}

      {
        financing === "mortgage" && (
          <h2> investīcija ar hipotēku</h2>
        )
      }
    </main >
  );
}

export default App;