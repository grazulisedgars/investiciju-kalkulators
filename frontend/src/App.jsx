import { useEffect, useState } from "react";
import "./App.css";
import FinancingChoice from "./components/FinancingChoice";
import PropertyInfo from "./components/PropertyInfo";
//import PurchaseCosts from "./components/PurchaseCosts";
import FreeAnalysisInputs from "./components/FreeAnalysisInputs";
import FreeAnalysisResults from "./components/FreeAnalysisResults";

function App() {
  const [financing, setFinancing] = useState(null);

  const [purchasePrice, setPurchasePrice] = useState("");
  const [area, setArea] = useState("");

  const [renovationCosts, setRenovationCosts] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [occupancy, setOccupancy] = useState("");

  const [freeAnalysisResults, setFreeAnalysisResults] = useState(null);

  useEffect(() => {
    if (!purchasePrice || Number(purchasePrice) <= 0) {
      setFreeAnalysisResults(null);
      return;
    }

    async function fetchFreeAnalysis() {
      const response = await fetch(
        `http://127.0.0.1:8000/calculate/free-analysis?purchase_price=${purchasePrice}&renovation_costs=${renovationCosts || 0}&monthly_rent=${monthlyRent || 0}&occupancy=${occupancy || 100}`
      );

      const data = await response.json();

      setFreeAnalysisResults(data);
    }

    fetchFreeAnalysis();
  }, [
    purchasePrice,
    renovationCosts,
    monthlyRent,
    occupancy
  ]);

  return (
    <main className="app">

      {/* Header */}

      <header className="header">
        <div className="logo">
          PROPFOLIO
        </div>

        <nav className="navigation">
          <a href="#how-it-works">
            Kā tas darbojas
          </a>
        </nav>
      </header>

      {/*Hero */}

      {financing === null && (
        <section className="hero">

          <div className="hero-content">

            <p className="eyebrow">
              NEKUSTAMĀ ĪPAŠUMA INVESTĪCIJU ANALĪZE
            </p>

            <h1>
              Vai šis īpašums
              <br />
              ir  <span className="hero-highlight">laba investīcija?</span>
            </h1>

            <p className="hero-description">
              Izvērtē īpašuma potenciālo ienesīgumu,
              izmaksas un nepieciešamo sākuma kapitālu.
            </p>

            <div className="financing-section">

              <h2>
                Kā plāno finansēt šo investīciju?
              </h2>

              <FinancingChoice
                setFinancing={setFinancing}
              />
            </div>

          </div>

          {/* Calculator preview */}

          <div className="calculator-preview">

            <div className="preview-header">
              <span>
                INVESTĪCIJAS ANALĪZE
              </span>

              <span>
                ●
              </span>
            </div>

            <div className="preview-property">

              <div>
                <span className="preview-label">
                  Iegādes cena
                </span>

                <strong>
                  €27,900
                </strong>
              </div>

              <div>
                <span className="preview-label">
                  Platība
                </span>

                <strong>
                  39 m²
                </strong>
              </div>

            </div>

            <div className="preview-divider"></div>

            <div className="preview-kpis">

              <div>
                <span>
                  Cena par m²
                </span>

                <strong>
                  715 €/m²
                </strong>
              </div>

              <div>
                <span>
                  Gada bruto īre
                </span>

                <strong>
                  3 600 €
                </strong>
              </div>

            </div>

          </div>

        </section>
      )}


      {/* Kā tas darbojas sadaļa */}

      {financing === null && (
        <section className="how-it-works" id="how-it-works">

          <div className="how-header">
            <p className="section-label">
              KĀ TAS DARBOJAS
            </p>

            <h2>
              No īpašuma cenas līdz skaidram
              <br />
              investīcijas novērtējumam.
            </h2>
          </div>

          <div className="steps">

            <div className="step">
              <span className="step-number">01</span>

              <h3>Ievadi īpašuma datus</h3>

              <p>
                Norādi iegādes cenu, platību, remonta izmaksas,
                īres maksu un citus nepieciešamos datus.
              </p>
            </div>

            <div className="step">
              <span className="step-number">02</span>

              <h3>Saņem aprēķinus</h3>

              <p>
                Propfolio automātiski aprēķina iegādes izmaksas,
                nepieciešamo kapitālu un potenciālo ienesīgumu.
              </p>
            </div>

            <div className="step">
              <span className="step-number">03</span>
              <h3>Izvērtē investīciju</h3>

              <p>
                Salīdzini galvenos rādītājus un pieņem datos
                balstītu lēmumu par īpašuma iegādi.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Cash calculator */}

      {financing === "cash" && (
        <section className="calculator-page">

          <button
            className="back-button"
            onClick={() => setFinancing(null)}
          >
            ← Atpakaļ
          </button>

          <div className="calculator-page-header">
            <p className="eyebrow">
              BEZMAKSAS ANALĪZE
            </p>

            <h1>
              Investīcija ar paša līdzekļiem
            </h1>

            <p>
              Ievadi īpašuma datus un saņem galvenos Investīcijas
              rādītājus dažu sekunžu laikā.
            </p>
          </div>

          <PropertyInfo
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            area={area}
            setArea={setArea}
          />

          <FreeAnalysisInputs
            renovationCosts={renovationCosts}
            setRenovationCosts={setRenovationCosts}
            monthlyRent={monthlyRent}
            setMonthlyRent={setMonthlyRent}
            occupancy={occupancy}
            setOccupancy={setOccupancy}
          />

          <FreeAnalysisResults
            results={freeAnalysisResults}
          />
        </section>

        /*<PurchaseCosts
          purchasePrice={purchasePrice}
        />*/
      )}


      {/* Mortgage calculator */}

      {financing === "mortgage" && (
        <section className="mortgage-section">

          <h2>
            Investīcija ar hipotēku
          </h2>

          <p>
            Hipotēkas kalkulatora sadaļa būs pieejama
            nākamajā solī.
          </p>

        </section>
      )}

    </main>
  );
}

export default App;
