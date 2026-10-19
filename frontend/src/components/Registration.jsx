import { useState } from "react";
import "./Registration.css";
import {passwordRules} from "./passwordRules";

function Registration({ onBack, onRegistered }) {
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
            setErrors("Lūdzu, ievadi vārdu.");
            return false;
        }

        if (!lastName.trim()) {
            setErrors("Lūdzu, ievadi uzvārdu.");
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

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        const isValid = validateForm();

        if (!isValid) {
            return;
        }

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
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErrors({
                    general: typeof data.detail === "string" ? data.detail : "Pārbaudi ievadītos datus un paroles prasības.",
                });

                return;
            }

            onRegistered(data)
        } catch (error) {
            console.error(error);

            setErrors({
                general: "Neizdevās savienoties ar serveri.",
            });
        }
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
                        <input
                            id="firstName"
                            type="text"
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="lastName">Uzvārds</label>
                        <input
                            id="lastName"
                            type="text"
                            value={lastName}
                            onChange={(event) => setLastName(event.target.value)}
                        />
                    </div>



                    <div className="input-group">
                        <label htmlFor="email">E-pasts</label>
                        <input
                            id="email"
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
                        <input
                            id="password"
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
                        <input
                            id="confirmPassword"
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

                    <button
                        type="submit"
                        className="registration-submit"
                    >
                        Izveidot profilu
                    </button>

                    {errors.general && (
                        <p className="form-error registration-general-error">
                            {errors.general}
                        </p>
                    )}
                </form>
            </div>
        </section>
    );
}

export default Registration;