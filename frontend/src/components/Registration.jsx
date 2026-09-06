import { useState } from "react";
import "./Registration.css";

function Registration({ onBack, onRegistered }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errors, setErrors] = useState({});

    function validateForm() {
        const newErrors = {};

        if (!username.trim()) {
            newErrors.username = "Ievadi lietotājvārdu.";
        }

        if (!email.trim()) {
            newErrors.email = "Ievadi e-pasta adresi.";
        } else if (!email.includes("@")) {
            newErrors.email = "Ievadi derīgu e-pasta adresi.";
        }

        if (!password) {
            newErrors.password = "Ievadi paroli.";
        } else if (password.length < 8) {
            newErrors.password = "Parolei jābūt vismaz 8 rakstzīmes garai.";
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
                "http://127.0.0.1:8000/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setErrors({
                    general: data.detail || "Reģistrācija neizdevās.",
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

                <div className="registration-form">
                    <div className="input-group">
                        <label>Lietotājvārds</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                        />

                        {errors.username && (
                            <p className="form-error">{errors.username}</p>
                        )}
                    </div>

                    <div className="input-group">
                        <label>E-pasts</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />

                        {errors.email && (
                            <p className="form-error">{errors.email}</p>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Parole</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />

                        {errors.password && (
                            <p className="form-error">{errors.password}</p>
                        )}
                    </div>

                    <div className="input-group">
                        <label>Atkārtot paroli</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />

                        {errors.confirmPassword && (
                            <p className="form-error">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        className="registration-submit"
                        onClick={handleSubmit}
                    >
                        Izveidot profilu
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

export default Registration;