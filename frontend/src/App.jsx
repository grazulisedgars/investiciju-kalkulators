import { useState } from "react";
import FinancingChoice from "./components/FinancingChoice";

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

      {financing === "cash" && (
        <h2>Investīcija saviem līdzekļiem</h2>
      )}

      {financing === "mortgage" && (
        < h2 > investīcija ar hipotēku</h2>
      )
      }
    </main >
  );
}

export default App;