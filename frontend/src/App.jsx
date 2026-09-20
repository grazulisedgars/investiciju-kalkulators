import { useEffect, useState } from "react";
import "./App.css";
import propfolioLogo from "./assets/icons/propfolio-logo.svg";
import FinancingChoice from "./components/FinancingChoice";
import PropertyInfo from "./components/PropertyInfo";
import FreeAnalysisInputs from "./components/FreeAnalysisInputs";
import FreeAnalysisResults from "./components/FreeAnalysisResults";
import MortgageInputs from "./components/MortgageInputs";
import MortgageSummary from "./components/MortgageSummary";
import Registration from "./components/Registration";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import propfolioBackground from "./assets/propfolio-background11.png";

function App() {
  const [financing, setFinancing] = useState(null);

  const [purchasePrice, setPurchasePrice] = useState("");
  const [area, setArea] = useState("");

  const [renovationCostPerM2, setRenovationCostPerM2] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [occupancy, setOccupancy] = useState("");

  const [freeAnalysisResults, setFreeAnalysisResults] = useState(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState("");

  const [showRegistration, setShowRegistration] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const [showLogin, setShowLogin] = useState(false);
  const [propertyFlow, setPropertyFlow] = useState(null);

  const totalRenovationCosts =
    Number(area || 0) * Number(renovationCostPerM2 || 0);

  const pricePerM2AfterRenovation =
    Number(area) > 0
      ? (Number(purchasePrice || 0) + totalRenovationCosts) / Number(area)
      : 0;

  const downPaymentAmount =
    Number(purchasePrice || 0) *
    (Number(downPaymentPercent || 0) / 100);

  const loanAmount =
    Number(purchasePrice || 0) - downPaymentAmount;

  const initialCapitalNeeded =
    downPaymentAmount + totalRenovationCosts;

  useEffect(() => {
    if (!purchasePrice || Number(purchasePrice) <= 0) {
      setFreeAnalysisResults(null);
      return;
    }

    async function fetchFreeAnalysis() {
      const response = await fetch(
        `http://127.0.0.1:8000/calculate/free-analysis?purchase_price=${purchasePrice}&renovation_costs=${totalRenovationCosts}&monthly_rent=${monthlyRent || 0}&occupancy=${occupancy || 100}`
      );

      const data = await response.json();

      setFreeAnalysisResults(data);
    }

    fetchFreeAnalysis();
  }, [
    purchasePrice,
    area,
    renovationCostPerM2,
    monthlyRent,
    occupancy
  ]);

  useEffect(() => {
    async function checkCurrentUser() {
      try {
        const response = await fetch(
          "http://localhost:8000/me",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          return;
        }

        const user = await response.json();

        setCurrentUser(user);
        setShowDashboard(true);
        setShowLogin(false);
        setShowRegistration(false);
        setFinancing(null);
      } catch (error) {
        console.error(error);
      }
    }

    checkCurrentUser();
  }, []);

  function resetCalculator() {
    setPurchasePrice("");
    setArea("");
    setRenovationCostPerM2("");
    setMonthlyRent("");
    setOccupancy("");
    setFreeAnalysisResults(null);
    setDownPaymentPercent("");
  }

  async function saveCurrentProperty() {
    if (!freeAnalysisResults || !financing) {
      return;
    }

    const propertyData = {
      financing_type: financing,
      purchase_price: Number(purchasePrice || 0),
      area: Number(area || 0),
      renovation_cost_per_m2: Number(renovationCostPerM2 || 0),
      monthly_rent: Number(monthlyRent || 0),
      occupancy: Number(occupancy || 0),
      down_payment_percent:
        financing === "mortgage"
          ? Number(downPaymentPercent || 0)
          : null,
    };

    const response = await fetch(
      "http://localhost:8000/properties",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      }
    );

    if (!response.ok) {
      throw new Error("Neizdevās saglabāt īpašumu.");
    }

    return await response.json();
  }

  function goToHowItWorks(event) {
    event.preventDefault();

    resetCalculator();
    setShowRegistration(false);
    setShowLogin(false);
    setShowDashboard(false);
    setFinancing(null);

    setTimeout(() => {
      document.getElementById("how-it-works")
        ?.scrollIntoView({ behaviour: "smooth" });
    }, 0);
  }

  function goBackToHome() {
    resetCalculator();
    setFinancing(null);
    setDownPaymentPercent("");
  }

  function goBackFromCalculator() {
    resetCalculator();

    if (propertyFlow === "dashboard") {
      setShowDashboard(true);
      setFinancing(null);
      return;
    }

    setFinancing(null);
  }

  async function saveDashboardProperty() {
    try {
      const response = await fetch("http://localhost:8000/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          financing_type: financing,
          purchase_price: Number(purchasePrice),
          area: Number(area),
          renovation_cost_per_m2: Number(renovationCostPerM2 || 0),
          monthly_rent: Number(monthlyRent),
          occupancy: Number(occupancy),
          down_payment_percent:
            financing === "mortgage"
              ? Number(downPaymentPercent)
              : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Īpašuma saglabāšanas kļūda:", data);
        return;
      }

      resetCalculator();
      setFinancing(null);
      setPropertyFlow(null);
      setShowDashboard(true);
    } catch (error) {
      console.error("Īpašuma saglabāšanas kļūda:", error);
    }
  }

  return (
    <main
      className={`app ${showDashboard
        ? "app-dashboard"
        : financing === null && !showRegistration && !showLogin
          ? "app-hero"
          : ""
        }`}

      style={
        financing === null &&
          !showDashboard &&
          !showRegistration &&
          !showLogin
          ? { "--hero-background": `url(${propfolioBackground})` }
          : {}
      }
    >

      {/* Header */}

      {!showDashboard && (
        <header
          className={`header ${financing !== null ? "header-compact" : ""}`}
        >
          <div className="logo">
            <img
              src={propfolioLogo}
              alt="PROPFOLIO"
              className="header-logo-image"
            />
          </div>

          {propertyFlow !== "dashboard" && (
            <nav className="navigation">
              <a
                href="#how-it-works"
                onClick={goToHowItWorks}
              >
                Kā tas darbojas
              </a>

              <a href="#about">
                Par mums
              </a>

              <a href="#faq">
                FAQ
              </a>

              <button
                type="button"
                className="register-button"
                onClick={() => {
                  setShowRegistration(true);
                  setShowLogin(false);
                  setShowDashboard(false);
                  setFinancing(null);
                }}
              >
                Reģistrēties
              </button>

              <button
                type="button"
                className="login-button"
                onClick={() => {
                  setShowLogin(true);
                  setShowRegistration(false);
                  setShowDashboard(false);
                  setFinancing(null);
                }}
              >
                Ieiet
              </button>
            </nav>
          )}
        </header>
      )}

      {/*Hero */}

      {!showRegistration &&
        !showLogin &&
        !showDashboard &&
        financing === null && (
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

              <div className="hero-benefits">
                <div className="hero-benefit">
                  <div className="hero-benefit-icon">
                    <span className="benefit-bars">
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                  </div>

                  <div>
                    <strong>Vienkārši un saprotami</strong>
                    <span>Reālos datos balstīti aprēķini</span>
                  </div>
                </div>

                <div className="hero-benefit">
                  <div className="hero-benefit-icon">
                    <span className="benefit-clock">◷</span>
                  </div>

                  <div>
                    <strong>Pieņem labākus lēmumus</strong>
                    <span>Salīdzini scenārijus un riskus</span>
                  </div>
                </div>

                <div className="hero-benefit">
                  <div className="hero-benefit-icon">
                    <span className="benefit-shield">✓</span>
                  </div>

                  <div>
                    <strong>Tavs investora rīks</strong>
                    <span>Plāno, analizē, ieguldi gudrāk</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Calculator preview */}

            <div className="calculator-preview">

              <div className="preview-header">
                <span>
                  INVESTĪCIJAS ANALĪZE
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

              <p className="preview-example-note">
                <span className="preview-info-icon">i</span>
                Rādītie dati ir piemērs
              </p>

            </div>

          </section>
        )}


      {/* Kā tas darbojas sadaļa */}

      {!showRegistration &&
        !showLogin &&
        !showDashboard &&
        financing === null && (
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

      {showRegistration && (
        <Registration
          onBack={() => setShowRegistration(false)}
          onRegistered={async (user) => {
            setCurrentUser(user);

            try {
              await saveCurrentProperty();
            } catch (error) {
              console.error(error);
            }

            setShowRegistration(false);
            setShowDashboard(true);
          }}
        />
      )}

      {showDashboard && (
        <Dashboard
          user={currentUser}
          onLogout={async () => {
            try {
              await fetch(
                "http://localhost:8000/logout",
                {
                  method: "POST",
                  credentials: "include",
                }
              );
            } catch (error) {
              console.error(error);
            }

            setCurrentUser(null);
            setShowDashboard(false);
            setFinancing(null);
            resetCalculator();
          }}
          onAddProperty={(financingType) => {
            resetCalculator();

            setPropertyFlow("dashboard");
            setFinancing(financingType);

            setShowDashboard(false);
            setShowRegistration(false);
            setShowLogin(false);
          }
          }
        />
      )}

      {showLogin && (
        <Login
          onBack={() => setShowLogin(false)}
          onLogin={(user) => {
            setCurrentUser(user);
            setShowLogin(false);
            setShowDashboard(true);
            setShowRegistration(false);
            setFinancing(null);
          }}
        />
      )}

      {/* Cash calculator */}

      {!showRegistration &&
        !showDashboard &&
        financing === "cash" && (
          <section className="calculator-page">

            <div className="calculator-page-header">

              <div className="calculator-page-title">
                <h1>
                  Investīcija ar paša līdzekļiem
                </h1>

                <p>
                  Ievadi īpašuma datus un saņem galvenos Investīcijas
                  rādītājus dažu sekunžu laikā.
                </p>
              </div>

              {propertyFlow === "dashboard" && (
                <div className="calculator-dashboard-actions">
                  <button
                    type="button"
                    className="calculator-cancel-button"
                    onClick={goBackFromCalculator}
                  >
                    Atcelt
                  </button>

                  <button
                    type="button"
                    className="calculator-save-button"
                    onClick={saveDashboardProperty}
                    disabled={
                      !purchasePrice ||
                      !area ||
                      !monthlyRent ||
                      !occupancy
                    }
                  >
                    Saglabāt īpašumu
                  </button>
                </div>
              )}
            </div>

            {propertyFlow !== "dashboard" && (
              <button
                className="back-button"
                onClick={goBackFromCalculator}
              >
                ← Atpakaļ
              </button>
            )}

            <div className="calculator-input-grid">

              <PropertyInfo
                purchasePrice={purchasePrice}
                setPurchasePrice={setPurchasePrice}
                area={area}
                setArea={setArea}
                pricePerM2AfterRenovation={pricePerM2AfterRenovation}
                renovationCostPerM2={renovationCostPerM2}
              />

              <FreeAnalysisInputs
                renovationCostPerM2={renovationCostPerM2}
                setRenovationCostPerM2={setRenovationCostPerM2}
                totalRenovationCosts={totalRenovationCosts}
                monthlyRent={monthlyRent}
                setMonthlyRent={setMonthlyRent}
                occupancy={occupancy}
                setOccupancy={setOccupancy}
              />
            </div>

            <FreeAnalysisResults
              results={freeAnalysisResults}
              onCreateProfile={() => setShowRegistration(true)}
              propertyFlow={propertyFlow}
              canSave={
                Boolean(
                  purchasePrice &&
                  area &&
                  monthlyRent &&
                  occupancy
                )
              }
            />

          </section>
        )}


      {/* Mortgage calculator */}

      {!showRegistration &&
        !showDashboard &&
        financing === "mortgage" && (
          <section className="calculator-page">

            <div className="calculator-page-header">
              <div className="calculator-page-title">
                <h1>
                  Investīcija ar hipotēku
                </h1>

                <p>
                  Ievadi īpašuma un finansējuma datus un saņem galvenos
                  investīcijas rādītājus dažu sekunžu laikā.
                </p>
              </div>

              {propertyFlow === "dashboard" && (
                <div className="calculator-dashboard-actions">
                  <button
                    type="button"
                    className="calculator-cancel-button"
                    onClick={goBackFromCalculator}
                  >
                    Atcelt
                  </button>

                  <button
                    type="button"
                    className="calculator-save-button"
                    onClick={saveDashboardProperty}
                    disabled={
                      !purchasePrice ||
                      !area ||
                      !monthlyRent ||
                      !occupancy ||
                      !downPaymentPercent
                    }
                  >
                    Saglabāt īpašumu
                  </button>
                </div>
              )}
            </div>

            {propertyFlow !== "dashboard" && (
              <button
                className="back-button"
                onClick={goBackFromCalculator}
              >
                ← Atpakaļ
              </button>
            )}

            <div className="calculator-input-grid">
              <PropertyInfo
                purchasePrice={purchasePrice}
                setPurchasePrice={setPurchasePrice}
                area={area}
                setArea={setArea}
                pricePerM2AfterRenovation={pricePerM2AfterRenovation}
                renovationCostPerM2={renovationCostPerM2}
              />

              <MortgageInputs
                downPaymentPercent={downPaymentPercent}
                setDownPaymentPercent={setDownPaymentPercent}
                downPaymentAmount={downPaymentAmount}
                loanAmount={loanAmount}
              />

              <FreeAnalysisInputs
                renovationCostPerM2={renovationCostPerM2}
                setRenovationCostPerM2={setRenovationCostPerM2}
                totalRenovationCosts={totalRenovationCosts}
                monthlyRent={monthlyRent}
                setMonthlyRent={setMonthlyRent}
                occupancy={occupancy}
                setOccupancy={setOccupancy}
              />

              <MortgageSummary
                downPaymentPercent={downPaymentPercent}
                renovationCostPerM2={renovationCostPerM2}
                downPaymentAmount={downPaymentAmount}
                loanAmount={loanAmount}
                initialCapitalNeeded={initialCapitalNeeded}
              />
            </div>

            <FreeAnalysisResults
              results={freeAnalysisResults}
              onCreateProfile={() => setShowRegistration(true)}
              propertyFlow={propertyFlow}
              canSave={
                Boolean(
                  purchasePrice &&
                  area &&
                  monthlyRent &&
                  occupancy &&
                  downPaymentPercent
                )
              }
            />
          </section>
        )}
    </main>
  );
}

export default App;
