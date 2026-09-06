import { useState } from "react";
import "./Login.css";

function Login({ onBack }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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
                    >
                        Ielogoties
                    </button>
                </div>
            </div>
        </section>
    );
}

export default Login;