import { useState } from "react";
import FinancingChoice from "./components/FinancingChoice";
import PropertyInfo from "./components/PropertyInfo";

function App() {
  const [financing, setFinancing] = useState(null);

  return (
    <main>
      <h1>Vai šis īpašums ir labs ieguldījums?</h1>

      <p>
        Aprēķini potenciālo atdevi no nekustamā īpašuma
        iegādes un izvērtē, cik izdevīgs ir šis ieguldījums.
      </p>

      <FinancingChoice setFinancing={setFinancing} />

      {financing === "cash" && <PropertyInfo />}

      {financing === "mortgage" && (
        < h2 > investīcija ar hipotēku</h2>
      )
      }
    </main >
  );
}

export default App;