const PasswordRecovery = lazy(() => import("./components/PasswordRecovery"));
import {calculateBasic, validateBasic, readCalculatorDraft, writeCalculatorDraft, clearCalculatorDraft} from "./components/basicAnalysis";
import {requestJson} from "./components/requestJson";
import mobileHeroBackground from "./assets/hero-mobile-v1.webp";
import aboutPropfolioImage from "./assets/about-propfolio.webp";
import { Menu, X } from "lucide-react";
import { useEffect, useState, useRef, useCallback, lazy } from "react";
import "./App.css";
import propfolioLogo from "./assets/icons/propfolio-logo-optimized.svg";
import FinancingChoice from "./components/FinancingChoice";
import PropertyInfo from "./components/PropertyInfo";
import FreeAnalysisInputs from "./components/FreeAnalysisInputs";
import FreeAnalysisResults from "./components/FreeAnalysisResults";
import MortgageInputs from "./components/MortgageInputs";
import MortgageSummary from "./components/MortgageSummary";
import EmailVerification from "./components/EmailVerification";
import Registration from "./components/Registration";
const MyProfile = lazy(() => import("./components/MyProfile"));
const Plans = lazy(() => import("./components/Plans"));
import TestPlanSwitch from "./components/TestPlanSwitch";
const Dashboard = lazy(() => import("./components/Dashboard"));
const Help = lazy(() => import("./components/Help"));
import {helpFaq,helpSteps} from "./components/helpContent";
import AccountFooter from "./components/AccountFooter";
import Login from "./components/Login";
import propfolioBackground from "./assets/propfolio-background11.webp";
import propfolioFooterLogo from "./assets/propfolio-footer-logo-traced.svg";
import propertyDataIcon from "./assets/icons/propfolio-step-01-property-data.svg";
import calculatorIcon from "./assets/icons/propfolio-step-02-calculator.svg";
import investmentIcon from "./assets/icons/propfolio-step-03-investment.svg";
const PropertyDetail = lazy(() => import("./components/PropertyDetail"));

function App() {
  const [resetToken,setResetToken]=useState(()=>new URLSearchParams(window.location.search).get("reset_password"));
  const [showRecovery,setShowRecovery]=useState(false);
  const sessionReturn=useRef(null);
  const [verificationToken,setVerificationToken]=useState(()=>new URLSearchParams(window.location.search).get("verify_email"));
  const [financing, setFinancing] = useState(null);
  const [calculatorError,setCalculatorError] = useState("");
  const [calculatorNotice,setCalculatorNotice] = useState("");
  const [savingProperty,setSavingProperty] = useState(false);
  const savingPropertyRef = useRef(false);

  const [purchasePrice, setPurchasePrice] = useState("");
  const [area, setArea] = useState("");

  const [renovationCostPerM2, setRenovationCostPerM2] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [occupancy, setOccupancy] = useState("");


  const [downPaymentPercent, setDownPaymentPercent] = useState("");

  const [showRegistration, setShowRegistration] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardEntry, setDashboardEntry] = useState(null);
  const [showHelp,setShowHelp]=useState(false);
  const [planReturnProperty,setPlanReturnProperty]=useState(null);
  const [planReturnProfile,setPlanReturnProfile]=useState(null);
  const [propertyInitialTab,setPropertyInitialTab]=useState("analysis");
  const [propertyInitialDiarySection,setPropertyInitialDiarySection]=useState("calendar");
  const [showPlans,setShowPlans]=useState(false);
  const [showProfile,setShowProfile] = useState(false);
  const [profileSection,setProfileSection] = useState("profile");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyLocationReady, setPropertyLocationReady] = useState(false);
  const [navigationRevision,setNavigationRevision]=useState(0);
  useEffect(()=>{const restore=()=>{setPropertyLocationReady(false);setNavigationRevision(value=>value+1);};window.addEventListener("popstate",restore);return()=>window.removeEventListener("popstate",restore);},[]);

  const [showLogin, setShowLogin] = useState(false);
  const [mobileHeroMenu, setMobileHeroMenu] = useState(false);
  const [propertyFlow, setPropertyFlow] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const restoreDraft=useCallback(draft=>{
    setPurchasePrice(draft.purchasePrice??"");setArea(draft.area??"");setRenovationCostPerM2(draft.renovationCostPerM2??"");setMonthlyRent(draft.monthlyRent??"");setOccupancy(draft.occupancy??"");setDownPaymentPercent(draft.downPaymentPercent??"");setFinancing(draft.financing);
  },[]);

  useEffect(()=>{
    const expired=()=>{
      if(!currentUser)return;
      sessionReturn.current=window.location.pathname+window.location.search;
      setCurrentUser(null);setSelectedProperty(null);setShowDashboard(false);setShowProfile(false);setShowPlans(false);setShowHelp(false);setFinancing(null);setShowRegistration(false);setShowLogin(true);
    };
    window.addEventListener("propfolio-session-expired",expired);
    return()=>window.removeEventListener("propfolio-session-expired",expired);
  },[currentUser]);

  useEffect(() => { if (financing) window.scrollTo({top:0,behavior:"instant"}); }, [financing]);

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

  const calculatorValues = {financing,purchasePrice,area,renovationCostPerM2,monthlyRent,occupancy,downPaymentPercent};
  const calculatorValidation = validateBasic(calculatorValues);
  const calculatorValid = Object.keys(calculatorValidation).length === 0;
  const freeAnalysisResults = calculateBasic(calculatorValues);
  useEffect(() => {
    if (!financing || !purchasePrice) return;
    const previous = readCalculatorDraft();
    writeCalculatorDraft({financing,purchasePrice,area,renovationCostPerM2,monthlyRent,occupancy,downPaymentPercent,ownerId:currentUser?.id ?? previous?.ownerId ?? null,pending:previous?.pending ?? false,requestId:previous?.requestId,fingerprint:previous?.fingerprint});
  },[financing,purchasePrice,area,renovationCostPerM2,monthlyRent,occupancy,downPaymentPercent,currentUser?.id]);

  useEffect(() => {
    const controller=new AbortController();
    async function checkCurrentUser() {
      try {
        const response = await fetch(
          "http://localhost:8000/me",
          {
            credentials: "include",signal:controller.signal,
          }
        );

        if (!response.ok) {
          if(controller.signal.aborted)return;
          const draft = readCalculatorDraft();
          const screen=new URLSearchParams(window.location.search).get("screen");
          setCurrentUser(null);setShowDashboard(false);setSelectedProperty(null);setShowProfile(false);setShowPlans(false);setShowHelp(false);
          setShowLogin(screen==="login");setShowRegistration(screen==="register");
          if(screen==="calculator" && draft && !draft.ownerId)restoreDraft(draft);else setFinancing(null);
          return;
        }

        const user = await response.json();

        const location = new URL(window.location.href);
        const propertyId = location.searchParams.get("property");
        let restoredProperty = null;
        if (propertyId) {
          try {
            const propertiesResponse = await fetch("http://localhost:8000/properties", {credentials:"include",signal:controller.signal});
            if (propertiesResponse.ok) {
              const properties = await propertiesResponse.json();
              restoredProperty = properties.find(property => String(property.property_id) === propertyId) || null;
            }
          } catch (error) { console.error("Neizdevās atjaunot īpašuma skatu.", error); }
        }
        if(controller.signal.aborted)return;
        const screen=location.searchParams.get("screen");
        setShowPlans(screen==="plans");setShowHelp(screen==="help");setShowProfile(screen==="profile");
        const section=location.searchParams.get("section");
        setProfileSection(["profile","password","subscription"].includes(section)?section:"profile");
        const tab = location.searchParams.get("tab");
        setPropertyInitialTab(["analysis", "diary", "advanced"].includes(tab) ? tab : "analysis");
        const diarySection=location.searchParams.get("diary");
        setPropertyInitialDiarySection(["calendar","expenses","loan","utilities","work","rent","gallery","totals"].includes(diarySection)?diarySection:"calendar");
        setSelectedProperty(restoredProperty);
        setCurrentUser(user);
        const draft = readCalculatorDraft();
        const canResume = !restoredProperty && screen==="calculator" && draft && (!draft.ownerId || draft.ownerId === user.id);
        setShowDashboard(!restoredProperty && !canResume);
        setShowLogin(false);
        setShowRegistration(false);
        if (canResume) {
          restoreDraft(draft); setPropertyFlow("dashboard");
          setCalculatorNotice("Iepriekš ievadītā analīze ir atjaunota. Pārbaudi datus un saglabā īpašumu.");
        } else setFinancing(null);
      } catch (error) {
        console.error(error);
      } finally {
        if(!controller.signal.aborted)setPropertyLocationReady(true);
      }
    }

    checkCurrentUser();
    return()=>controller.abort();
  }, [navigationRevision,restoreDraft]);

  useEffect(() => {
    if (!propertyLocationReady) return;
    const location = new URL(window.location.href);
    const screen=showPlans?"plans":showHelp?"help":showProfile?"profile":showRegistration?"register":showLogin?"login":financing?"calculator":null;
    if(screen)location.searchParams.set("screen",screen);else location.searchParams.delete("screen");
    if(screen==="profile" && profileSection!=="profile")location.searchParams.set("section",profileSection);else location.searchParams.delete("section");
    if (currentUser && selectedProperty && !showDashboard && !showProfile && !financing && !showPlans && !showHelp) {
      location.searchParams.set("property", String(selectedProperty.property_id));location.searchParams.set("tab", propertyInitialTab);
      if(propertyInitialTab==="diary" && propertyInitialDiarySection!=="calendar")location.searchParams.set("diary",propertyInitialDiarySection);else location.searchParams.delete("diary");
    } else {location.searchParams.delete("property");location.searchParams.delete("tab");location.searchParams.delete("diary");}
    if (location.href !== window.location.href) window.history.pushState({propfolio:true}, "", location);
  }, [propertyLocationReady,currentUser,selectedProperty,showDashboard,showProfile,financing,propertyInitialTab,showPlans,showHelp,profileSection,showLogin,showRegistration,propertyInitialDiarySection]);

  function resetCalculator() {
    setPurchasePrice("");
    setArea("");
    setRenovationCostPerM2("");
    setMonthlyRent("");
    setOccupancy("");
    clearCalculatorDraft();
    setCalculatorError("");
    setCalculatorNotice("");
    setDownPaymentPercent("");
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

  function goToFaq(event) {
    event.preventDefault();

    document
      .getElementById("faq")
      ?.scrollIntoView({ behaviour: "smooth" });
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
    if (savingPropertyRef.current) return;
    if (!calculatorValid) { setCalculatorError(Object.values(calculatorValidation)[0]); return; }
    savingPropertyRef.current = true; setSavingProperty(true); setCalculatorError("");
    try {
      const body={financing_type:financing,purchase_price:Number(purchasePrice),area:Number(area),renovation_cost_per_m2:Number(renovationCostPerM2||0),monthly_rent:monthlyRent===""?null:Number(monthlyRent),occupancy:occupancy===""?null:Number(occupancy),down_payment_percent:financing==="mortgage"?Number(downPaymentPercent):null};
      const fingerprint=JSON.stringify(body),previous=readCalculatorDraft();
      const requestId=previous?.fingerprint===fingerprint && previous?.requestId ? previous.requestId : crypto.randomUUID();
      writeCalculatorDraft({...calculatorValues,ownerId:currentUser?.id,requestId,fingerprint});
      await requestJson("http://localhost:8000/properties",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,client_request_id:requestId})});
      resetCalculator();setFinancing(null);setPropertyFlow(null);setShowDashboard(true);
    } catch (error) { setCalculatorError(error.message); }
    finally { savingPropertyRef.current=false;setSavingProperty(false); }
  }

  function goToDashboard(){
    setPlanReturnProfile(null);setPlanReturnProperty(null);setPropertyInitialTab("analysis");
    setShowPlans(false);setShowHelp(false);setShowProfile(false);
    setSelectedProperty(null);setShowDashboard(true);
    setShowLogin(false);setShowRegistration(false);setFinancing(null);setPropertyFlow(null);
    window.scrollTo({top:0});
  }

  async function finishVerification(){
    window.history.replaceState({},'',window.location.pathname);
    setVerificationToken(null);
    const response=await fetch('http://localhost:8000/me',{credentials:'include'});
    if(response.ok){const account=await response.json();setCurrentUser(account);setShowProfile(false);
      const draft=readCalculatorDraft();
      if(draft && (!draft.ownerId || draft.ownerId===account.id)) {restoreDraft(draft);setPropertyFlow("dashboard");setShowDashboard(false);setShowRegistration(false);setShowLogin(false);setCalculatorNotice("E-pasts apstiprināts. Tava analīze ir atjaunota — vari saglabāt īpašumu.");}
      else setShowDashboard(true);
    }
    else{setCurrentUser(null);setShowLogin(true);setShowDashboard(false);}
  }
  if(resetToken || showRecovery)return <PasswordRecovery token={resetToken} onBack={()=>{setResetToken(null);setShowRecovery(false);setCurrentUser(null);setShowDashboard(false);setShowProfile(false);setShowLogin(true);setShowRegistration(false);window.history.replaceState({},"",window.location.pathname);}}/>;
  if(verificationToken || (currentUser && currentUser.email_verified===false && !showProfile))return <EmailVerification token={verificationToken} user={currentUser} onContinue={finishVerification} onProfile={()=>{setShowProfile(true);setShowDashboard(true);}} onLogout={async()=>{const response=await fetch('http://localhost:8000/logout',{method:'POST',credentials:'include'});if(response.ok){setCurrentUser(null);setFinancing(null);setShowDashboard(false);setShowLogin(true);}}}/>;

  if(showPlans && currentUser)return <Plans user={currentUser} backLabel={planReturnProfile?"Atpakaļ uz manu profilu":planReturnProperty?(planReturnProperty.tab==="advanced"?"Atpakaļ uz padziļināto analīzi":"Atpakaļ uz dienasgrāmatu"):"Atpakaļ uz īpašumiem"} onBack={()=>{if(planReturnProfile){setProfileSection(planReturnProfile);setPlanReturnProfile(null);setShowPlans(false);setShowProfile(true);window.scrollTo({top:0});}else if(planReturnProperty && selectedProperty?.property_id===planReturnProperty.propertyId){setPropertyInitialTab(planReturnProperty.tab);setPlanReturnProperty(null);setShowPlans(false);window.scrollTo({top:0});}else goToDashboard();}}/>;

  if(showHelp && currentUser)return <Help onBack={goToDashboard} onPlans={()=>{setShowPlans(true);window.scrollTo({top:0});}}/>;

  return (
    <main
      className={`app ${showDashboard || selectedProperty ? "app-dashboard" : ""}`}
    >

      {currentUser && <TestPlanSwitch user={currentUser} onUserUpdated={setCurrentUser}/>}
      {/* Header */}

      {financing === null &&
        !showDashboard &&
        !showRegistration &&
        !showLogin &&
        !selectedProperty && (
          <div
            className="hero-background"
            style={{ "--hero-background": `url(${propfolioBackground})` }}
          >


            <img className="hero-mobile-photo" src={mobileHeroBackground} alt="" aria-hidden="true"/>
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

                {propertyFlow !== "dashboard" && <button type="button" className="hero-mobile-menu-toggle" aria-label={mobileHeroMenu ? 'Aizvērt izvēlni' : 'Atvērt izvēlni'} aria-expanded={mobileHeroMenu} aria-controls="hero-navigation" onClick={() => setMobileHeroMenu(open => !open)}>{mobileHeroMenu ? <X size={22}/> : <Menu size={22}/>}</button>}
                {propertyFlow !== "dashboard" && (
                  <nav id="hero-navigation" className={`navigation ${mobileHeroMenu ? 'mobile-is-open' : ''}`} onClick={() => setMobileHeroMenu(false)} onKeyDown={event => {if(event.key === 'Escape') setMobileHeroMenu(false);}}>

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

                    <a href="#about">
                      Par mums
                    </a>

                    <a href="#faq" onClick={goToFaq}>
                      FAQ
                    </a>

                  </nav>
                )}
              </header>
            )}

            {/*Hero */}

            {!showRegistration &&
              !showLogin &&
              !showDashboard &&
              financing === null && (
                <>
                  <section className="hero">

                    <div className="hero-content">

                      <p className="eyebrow">
                        NEKUSTAMĀ ĪPAŠUMA INVESTĪCIJU ANALĪZE
                      </p>

                      <h1>
                        Vai šis īpašums
                        <br />{" "}
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
                          setFinancing={type=>{resetCalculator();setPropertyFlow(null);setFinancing(type);}}
                        />
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


                    <a
                      href="#how-it-works"
                      className="hero-scroll-link"
                      onClick={goToHowItWorks}
                    >
                      <span className="hero-scroll-arrow">↓</span>
                      <span>Uzzini, kā tas darbojas</span>
                    </a>
                  </section>
                </>
              )}

          </div>
        )}

      {/* Kā tas darbojas sadaļa */}

      {!showRegistration &&
        !showLogin &&
        !showDashboard &&
        !selectedProperty &&
        financing === null && (
          <>
            <section className="how-it-works" id="how-it-works">

              <div className="how-header">
                <p className="section-label">
                  KĀ TAS DARBOJAS
                </p>

                <h2>
                  No īpašuma cenas līdz skaidram
                  <br />{" "}
                  investīcijas novērtējumam.
                </h2>
              </div>

              <p className="how-intro">
                Trīs vienkārši soļi, lai saprastu,
                <br />
                vai šis īpašums ir laba investīcija.
              </p>

              <div className="steps">{helpSteps.map(({title,text},index)=><div className="step" key={title}><div className="step-top"><span className="step-number">{String(index+1).padStart(2,'0')}</span><img src={[propertyDataIcon,calculatorIcon,investmentIcon][index]} alt="" className="step-icon"/><span className="step-line"/></div><h3>{title}</h3><p>{text}</p></div>)}</div>
            </section>

            <section id="about" className="about-section">

              <div className="about-heading">
                <p className="section-label">
                  PAR PROPFOLIO
                </p>

                <h2>
                  Gudrāki lēmumi.
                  <br />
                  <span>Labāki ieguldījumi.</span>
                </h2>
              </div>

              <div className="about-text">
                <h3>
                  Kapēc mēs radījām PROPFOLIO?
                </h3>

                <p className="about-description">
                  Nekustamā īpašuma investīcijas ne vienmēr ir viegli
                  izvērtēt. Cena ir tikai daļa no kopējās ainas -
                  svarīgi ir arī saprast izmaksas, nepieciešamo kapitālu
                  un potenciālo ienesīgumu.
                </p>

                <p className="about-description">
                  PROPFOLIO radīts, lai svarīgākos skaitļus varētu
                  salikt vienuviet un pieņemt datos balstītus lēmumus.
                </p>

                <div className="about-highlight">
                  Mazāk minējumu. Vairāk skaidrības pirms ieguldījuma.
                </div>
              </div>

              <div className="about-image">
                <p className="about-image-caption">
                  Labāki
                  <br />
                  ieguldījumi rītdienai.
                </p>
                <img
                  loading="lazy" decoding="async" width="1672" height="941" src={aboutPropfolioImage}
                  alt="Nekustamā īpašuma investīcijas"
                />
              </div>
            </section>

            <section id="faq" className="faq-section">

              <div className="faq-list">{helpFaq.map(({question,answer},index)=><div key={question} className={`faq-item ${openFaq===index?'open':''}`}><button type="button" className="faq-question" aria-expanded={openFaq===index} onClick={()=>setOpenFaq(openFaq===index?null:index)}><span>{question}</span><span className="faq-plus">{openFaq===index?'−':'+'}</span></button>{openFaq===index && <div className="faq-answer"><p>{answer}</p></div>}</div>)}</div>

              <div className="faq-heading">
                <p className="section-label">FAQ</p>

                <h2>
                  Biežāk uzdotie
                  <br />
                  <span>jautājumi.</span>
                </h2>

                <p className="faq-intro">
                  Atbildes uz svarīgākajiem jautājumiem par PROPFOLIO
                  un tā darbību.
                </p>
              </div>
            </section>

            <footer className="footer">
              <div className="footer-inner">

                <div className="footer-brand">
                  <img
                    src={propfolioFooterLogo}
                    alt="PROPFOLIO"
                    className="footer-logo"
                  />

                  <span>Gudrāki lēmumi. Labāki ieguldījumi.</span>
                </div>

                <nav className="footer-nav">
                  <a href="#about">Par mums</a>
                  <a href="#faq">FAQ</a>
                  <a href="/privacy">Privātuma politika</a>
                  <a href="/terms">Lietošanas noteikumi</a>
                </nav>

                <div className="footer-contact">
                  <a href="mailto:propfolio.lv@gmail.com">
                    propfolio.lv@gmail.com
                  </a>

                  <span>© 2026 PROPFOLIO</span>
                </div>
              </div>
            </footer>
          </>
        )}

      {showRegistration && (
        <Registration
          onLogin={() => {setShowRegistration(false);setShowLogin(true);}}
          onBack={() => setShowRegistration(false)}
          onRegistered={async (user) => {
            setCurrentUser(user);

            if(financing && purchasePrice) writeCalculatorDraft({...calculatorValues,ownerId:user.id,pending:true});

            setShowRegistration(false);
            setShowDashboard(true);
          }}
        />
      )}

      {propertyLocationReady && showDashboard && !showProfile && (
        <Dashboard
          initialAction={dashboardEntry}
          onActionConsumed={() => setDashboardEntry(null)}
          user={currentUser}
          onOpenPlans={()=>{setShowPlans(true);window.scrollTo({top:0});}}
          onOpenProfile={()=>{setProfileSection("profile");setShowProfile(true);setSelectedProperty(null);window.scrollTo({top:0});}}
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

            setCurrentUser(null); setShowProfile(false);
            setShowDashboard(false);
            setSelectedProperty(null);
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
          onOpenProperty={(property) => {
            setPropertyInitialTab("analysis");setPropertyInitialDiarySection("calendar");
            setSelectedProperty(property);
            setShowDashboard(false);
          }}
        />
      )}

      {showProfile && currentUser && <MyProfile onSectionChange={setProfileSection} onOpenPlans={section=>{setPlanReturnProfile(section);setPlanReturnProperty(null);setProfileSection(section);setShowPlans(true);window.scrollTo({top:0});}} onDeleted={()=>{setCurrentUser(null);setShowProfile(false);setShowDashboard(false);setSelectedProperty(null);setShowLogin(false);setShowRegistration(false);setVerificationToken(null);setFinancing(null);setPropertyFlow(null);resetCalculator();window.history.replaceState({},"",window.location.pathname);window.scrollTo({top:0});}} key={profileSection} initialSection={profileSection} user={currentUser} onUserUpdated={setCurrentUser} onBack={goToDashboard} onLogout={async()=>{const response=await fetch("http://localhost:8000/logout",{method:"POST",credentials:"include"});if(response.ok){setCurrentUser(null);setShowProfile(false);setShowDashboard(false);setSelectedProperty(null);setFinancing(null);}}}/>}
      {propertyLocationReady && selectedProperty && !showDashboard && (
        <PropertyDetail onAddProperty={financingType => {
          resetCalculator(); setPropertyFlow('dashboard'); setFinancing(financingType);
          setSelectedProperty(null); setShowDashboard(false); setShowRegistration(false); setShowLogin(false);
          window.scrollTo({top:0});
        }} onMobileNavigate={destination => {
          goToDashboard();
          setDashboardEntry(destination === 'home' ? null : destination);
        }} initialTab={propertyInitialTab} onTabChange={setPropertyInitialTab} initialDiarySection={propertyInitialDiarySection} onDiarySectionChange={setPropertyInitialDiarySection} user={currentUser} onOpenPlans={feature=>{setPlanReturnProfile(null);setPlanReturnProperty(['diary','advanced'].includes(feature)?{propertyId:selectedProperty.property_id,tab:feature}:null);setShowPlans(true);window.scrollTo({top:0});}}
          property={selectedProperty}
          onPropertyUpdated={(updatedProperty) => {
            setSelectedProperty(updatedProperty);
          }}
          onBack={() => {
            setSelectedProperty(null);
            setShowDashboard(true)
          }}
        />
      )}

      {showLogin && (
        <Login
          onForgot={()=>{setShowRecovery(true);window.scrollTo({top:0});}}
          onRegister={() => {setShowLogin(false);setShowRegistration(true);}}
          onBack={() => setShowLogin(false)}
          onLogin={(user) => {
            if(sessionReturn.current){const destination=sessionReturn.current;sessionReturn.current=null;setShowLogin(false);window.history.replaceState({},"",destination);setPropertyLocationReady(false);setNavigationRevision(value=>value+1);return;}
            setCurrentUser(user);
            setShowLogin(false);
            setShowDashboard(true);
            setShowRegistration(false);
            const draft=readCalculatorDraft();
            if(draft && (!draft.ownerId || draft.ownerId===user.id)){restoreDraft(draft);setPropertyFlow("dashboard");setShowDashboard(false);setCalculatorNotice("Analīze atjaunota. Pārbaudi datus un saglabā īpašumu.");}
            else setFinancing(null);
          }}
        />
      )}

      {/* Cash calculator */}

      {!showRegistration &&
        !showLogin &&
        !showDashboard &&
        financing === "cash" && (
          <section className={`calculator-page cash-calculator-page calculator-page--mobile-form ${propertyFlow === "dashboard" ? "calculator-page--property-create" : ""}`}>

            {calculatorError && <p className="app-status app-status-error" role="alert">{calculatorError}</p>}
            {calculatorNotice && <p className="app-status" role="status">{calculatorNotice}</p>}
            {Object.entries(calculatorValidation).some(([key]) => calculatorValues[key] !== "") && <p className="app-status app-status-error" role="alert">{Object.entries(calculatorValidation).filter(([key])=>calculatorValues[key]!=="").map(([,message])=>message).join(" ")}</p>}
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
                      !area
                    }
                  >
                    {savingProperty ? "Saglabā…" : "Saglabāt īpašumu"}
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
                  area
                )
              }
            />

            {propertyFlow === "dashboard" && <div className="calculator-mobile-actions">
              <button type="button" className="calculator-cancel-button" onClick={goBackFromCalculator}>Atcelt</button>
              <button type="button" className="calculator-save-button" onClick={saveDashboardProperty} disabled={!calculatorValid || savingProperty}>{savingProperty ? "Saglabā…" : "Saglabāt īpašumu"}</button>
            </div>}
            {propertyFlow !== "dashboard" && <div className="calculator-mobile-actions calculator-guest-actions">
              <button type="button" className="calculator-cancel-button" onClick={goBackFromCalculator}>Atpakaļ</button>
              <button type="button" className="calculator-save-button" onClick={() => {setShowRegistration(true);window.scrollTo({top:0});}} disabled={!calculatorValid || savingProperty}>Saglabāt analīzi</button>
            </div>}

          </section>
        )}


      {/* Mortgage calculator */}

      {!showRegistration &&
        !showLogin &&
        !showDashboard &&
        financing === "mortgage" && (
          <section className={`calculator-page calculator-page--mobile-form ${propertyFlow === "dashboard" ? "calculator-page--property-create" : ""}`}>

            {calculatorError && <p className="app-status app-status-error" role="alert">{calculatorError}</p>}
            {calculatorNotice && <p className="app-status" role="status">{calculatorNotice}</p>}
            {Object.entries(calculatorValidation).some(([key]) => calculatorValues[key] !== "") && <p className="app-status app-status-error" role="alert">{Object.entries(calculatorValidation).filter(([key])=>calculatorValues[key]!=="").map(([,message])=>message).join(" ")}</p>}
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
                      !downPaymentPercent
                    }
                  >
                    {savingProperty ? "Saglabā…" : "Saglabāt īpašumu"}
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
                  downPaymentPercent
                )
              }
            />
            {propertyFlow === "dashboard" && <div className="calculator-mobile-actions">
              <button type="button" className="calculator-cancel-button" onClick={goBackFromCalculator}>Atcelt</button>
              <button type="button" className="calculator-save-button" onClick={saveDashboardProperty} disabled={!calculatorValid || savingProperty}>{savingProperty ? "Saglabā…" : "Saglabāt īpašumu"}</button>
            </div>}
            {propertyFlow !== "dashboard" && <div className="calculator-mobile-actions calculator-guest-actions">
              <button type="button" className="calculator-cancel-button" onClick={goBackFromCalculator}>Atpakaļ</button>
              <button type="button" className="calculator-save-button" onClick={() => {setShowRegistration(true);window.scrollTo({top:0});}} disabled={!calculatorValid || savingProperty}>Saglabāt analīzi</button>
            </div>}

          </section>
        )}
      {currentUser && (showDashboard || selectedProperty) && <AccountFooter onHelp={()=>{setShowHelp(true);window.scrollTo({top:0});}} onPlans={()=>{setShowPlans(true);window.scrollTo({top:0});}} onPassword={()=>{setProfileSection("password");setSelectedProperty(null);setShowDashboard(true);setShowProfile(true);window.scrollTo({top:0});}} onProfile={()=>{setProfileSection("profile");setSelectedProperty(null);setShowDashboard(true);setShowProfile(true);window.scrollTo({top:0});}} onDashboard={() => { setSelectedProperty(null); setShowDashboard(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} onLogout={async () => {
        const response = await fetch("http://localhost:8000/logout", { method: "POST", credentials: "include" });
        if (response.ok) { setCurrentUser(null); setShowProfile(false); setSelectedProperty(null); setShowDashboard(false); }
      }} />}
    </main>
  );
}

export default App;
