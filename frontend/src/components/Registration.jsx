import { useState } from "react";
import "./Registration.css";

function Registration({ onBack }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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

                <div className="registration-form">
                    <div className="input-group">
                        <label>Lietotājvārds</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                        />
                    </div>

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

                    <div className="input-group">
                        <label>Atkārtot paroli</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="registration-submit"
                    >
                        Izveidot profilu
                    </button>
                </div>
            </div>
        </section>
    );
}

export default Registration;