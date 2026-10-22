import terms from "../content/termsVersion.json";
import { useState, useRef } from "react";
import "./Registration.css";
import AuthField from "./AuthField";
import "./AuthMobile.css";
import {passwordRules} from "./passwordRules";

function Registration({ onBack, onRegistered, onLogin }) {
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [busy,setBusy]=useState(false);
    const submitting=useRef(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");


    const [errors, setErrors] = useState({});
    const [passwordTouched,setPasswordTouched]=useState(false);
    const missingPasswordRules=passwordRules.map(([,test],index)=>test(password)?null:index).filter(index=>index!==null);
    const missingLabels=['vismaz 8 rakstzīmes','lielais burts','mazais burts','cipars','speciālais simbols'];
    const passwordError=!password?'Ievadi paroli.':missingPasswordRules.length?'Parolē nepieciešams: '+missingPasswordRules.map(index=>missingLabels[index]).join(', ')+'.':'';

    function validateForm() {
        const newErrors = {};
        setPasswordTouched(true);

        if (!firstName.trim()) {
            setErrors({general:"Lūdzu, ievadi vārdu."});
            return false;
        }

        if (!lastName.trim()) {
            setErrors({general:"Lūdzu, ievadi uzvārdu."});
            return false;
        }



        if (!email.trim()) {
            newErrors.email = "Ievadi e-pasta adresi.";
        } else if (!email.includes("@")) {
            newErrors.email = "Ievadi derīgu e-pasta adresi.";
        }

        if (!password) {
            newErrors.password = "Ievadi paroli.";
        } else if (!passwordRules.every(([,test])=>test(password))) {
            newErrors.password = passwordError;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Atkārto paroli.";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Paroles nesakrīt";
        }

        if (!termsAccepted) newErrors.terms = "Lai izveidotu profilu, piekrīti lietošanas noteikumiem.";

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        if(submitting.current)return;
        const isValid = validateForm();

        if (!isValid) {
            return;
        }

        submitting.current=true;setBusy(true);
        try {
            const response = await fetch(
                "http://localhost:8000/register",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        email: email.trim(),
                        password,
                        terms_accepted: termsAccepted,
                        terms_version: terms.version,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErrors({
                    general: typeof data.detail === "string" ? data.detail : data.detail?.some?.(item => item.loc?.includes("terms_version")) ? "Noteikumi ir atjaunināti. Pārlādē lapu un iepazīsties ar aktuālo redakciju." : "Pārbaudi ievadītos datus un paroles prasības.",
                });

                return;
            }

            onRegistered(data)
        } catch (error) {
            console.error(error);

            setErrors({
                general: "Neizdevās savienoties ar serveri.",
            });
        } finally {submitting.current=false;setBusy(false);}
    }

    return (
        <section className="registration-page">
            <button
                type="button"
                className="back-button"
                onClick={onBack}
            >
                ← Atpakaļ
            </button>

            <div className="registration-card">
                <div className="registration-header">
                    <p className="registration-eyebrow">PROPFOLIO</p>

                    <h1>Izveido savu profilu</h1>

                    <p>
                        Saglabā analizētos īpašumus un turpini ar detalizētāku
                        investīciju analīzi.
                    </p>
                </div>

                <form
                    className="registration-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmit();
                    }}
                >
                    <div className="input-group">
                        <label htmlFor="firstName">Vārds</label>
                        <AuthField
                            id="firstName" autoComplete="given-name" placeholder="Tavs vārds"
                            type="text"
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="lastName">Uzvārds</label>
                        <AuthField
                            id="lastName" autoComplete="family-name" placeholder="Tavs uzvārds"
                            type="text"
                            value={lastName}
                            onChange={(event) => setLastName(event.target.value)}
                        />
                    </div>



                    <div className="input-group">
                        <label htmlFor="email">E-pasts</label>
                        <AuthField
                            id="email" autoComplete="email" placeholder="Ievadi savu e-pastu"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />

                        {errors.email && (
                            <p className="form-error">{errors.email}</p>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Parole</label>
                        <AuthField
                            id="password" placeholder="Izveido paroli"
                            autoComplete="new-password"
                            maxLength={128}
                            aria-describedby={passwordTouched && passwordError?"registration-password-help registration-password-error":"registration-password-help"}
                            aria-invalid={passwordTouched && !!passwordError}
                            onBlur={()=>setPasswordTouched(true)}
                            type="password"
                            value={password}
                            onChange={(event) => {setPassword(event.target.value);setErrors(current=>({...current,password:null,confirmPassword:null}));}}
                        />

                        <p className="registration-password-help" id="registration-password-help">Vismaz 8 rakstzīmes, lielais un mazais burts, cipars un speciālais simbols.</p>
                        {passwordTouched && passwordError && <p className="form-error" id="registration-password-error" aria-live="polite">{passwordError}</p>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Atkārtot paroli</label>
                        <AuthField
                            id="confirmPassword" placeholder="Atkārto paroli"
                            autoComplete="new-password"
                            maxLength={128}
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => {setConfirmPassword(event.target.value);setErrors(current=>({...current,confirmPassword:null}));}}
                        />

                        {(errors.confirmPassword || (confirmPassword && password!==confirmPassword)) && (
                            <p className="form-error">{errors.confirmPassword || "Paroles nesakrīt."}</p>
                        )}
                    </div>

                    <div className="registration-consent">
                        <div className="registration-consent-row">
                            <input id="registration-terms" type="checkbox" required
                                onInvalid={event => {
                                    event.preventDefault();
                                    setErrors(current => ({...current, terms: "Lai izveidotu profilu, piekrīti lietošanas noteikumiem."}));
                                    event.currentTarget.focus();
                                }}
                                checked={termsAccepted} disabled={busy}
                                aria-invalid={!!errors.terms}
                                aria-describedby={errors.terms ? "registration-terms-error" : undefined}
                                onChange={event => {setTermsAccepted(event.target.checked);setErrors(current => ({...current, terms: null}));}} />
                            <label htmlFor="registration-terms">Esmu izlasījis un piekrītu <a href="/terms" target="_blank" rel="noopener noreferrer">Lietošanas noteikumiem<span className="registration-new-tab"> (atveras jaunā cilnē)</span></a>.</label>
                        </div>
                        {errors.terms && <p className="form-error" id="registration-terms-error" role="alert">{errors.terms}</p>}
                    </div>

                    <button
                        type="submit"
                        className="registration-submit" disabled={busy}
                    >
                        Izveidot profilu
                    </button>

                    {errors.general && (
                        <p className="form-error registration-general-error">
                            {errors.general}
                        </p>
                    )}
                {onLogin && <p className="auth-switch">Jau ir konts? <button type="button" onClick={onLogin}>Ieiet</button></p>}
                </form>
            </div>
        </section>
    );
}

export default Registration;