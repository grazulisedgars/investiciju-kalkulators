import { useState } from "react";
import "./Login.css";
import AuthField from "./AuthField";
import "./AuthMobile.css";

function Login({ onBack, onLogin, onRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});

    async function handleLogin() {
        if (!email || !password) {
            setErrors({
                general: "Ievadi e-pastu un paroli."
            });

            return;
        }

        try {
            const response = await fetch(
                "http://localhost:8000/login",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErrors({
                    general: data.detail || "Ielogošanās neizdevās.",
                });

                return;
            }

            onLogin(data.user);
        } catch (error) {
            console.error(error);

            setErrors({
                general: "Neizdevās savienoties ar serveri.",
            });
        }
    }

    return (
        <section className="login-page">
            <button
                type="button"
                className="back-button"
                onClick={onBack}
            >
                ← Atpakaļ
            </button>

            <div className="login-card">
                <div className="login-header">
                    <p className="login-eyebrow">PROPFOLIO</p>

                    <h1>Ieiet savā profilā</h1>

                    <p>
                        Piekļūsti saviem saglabātajiem īpašumiem un investīciju
                        analīzēm.
                    </p>
                </div>

                <form
                    className="login-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        handleLogin();
                    }}
                >

                    <div className="input-group">
                        <label htmlFor="login-email">E-pasts</label>

                        <AuthField
                            id="login-email" autoComplete="email" placeholder="Ievadi savu e-pastu" type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Parole</label>

                        <AuthField
                            id="login-password" autoComplete="current-password" placeholder="Ievadi paroli" type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-submit"
                    >
                        Ieiet profilā
                    </button>

                    {errors.general && (
                        <p className="form-error">
                            {errors.general}
                        </p>
                    )}
                {onRegister && <p className="auth-switch">Vēl nav konta? <button type="button" onClick={onRegister}>Reģistrēties</button></p>}
                </form>
            </div>
        </section>
    );
}

export default Login;