import { useState } from "react";
import "./Login.css";

function Login({ onBack, onLogin }) {
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
                "http://127.0.0.1:8000/login",
                {
                    method: "POST",
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

            onLogin(data);
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

                    <h1>Ielogojies savā profilā</h1>

                    <p>
                        Piekļūsti saviem saglabātajiem īpašumiem un investīciju
                        analīzēm.
                    </p>
                </div>

                <div className="login-form">
                    <div className="input-group">
                        <label>E-pasts</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Parole</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="login-submit"
                        onClick={handleLogin}
                    >
                        Ielogoties
                    </button>

                    {errors.general && (
                        <p className="form-error">
                            {errors.general}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}

export default Login;