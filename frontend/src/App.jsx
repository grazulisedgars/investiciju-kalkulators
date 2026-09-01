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

      {financing == null && (
        <section className="hero">

          <div className="hero-content">

            <p className="eyebrow">
              NEKUSTAMĀ ĪPAŠUMA INVESTĪCIJU ANALĪZE
            </p>

            <h1>
              Vai šis īpašums
              <br />
              ir laba investīcija?
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
                  Net Yield
                </span>

                <strong>
                  6.8%
                </strong>
              </div>

              <div>
                <span>
                  Cash-on-Cash
                </span>

                <strong>
                  8.2%
                </strong>
              </div>

            </div>

          </div>

        </section>
      )}


      {/* Cash calculator */}

      {financing === "cash" && (
        <>
          <PropertyInfo
            purchasePrice={purchasePrice}
            setPurchasePrice={setPurchasePrice}
            area={area}
            setArea={setArea}
          />

          <PurchaseCosts
            purchasePrice={purchasePrice}
          />
        </>
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

/*
        </section>
      )}

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
*/