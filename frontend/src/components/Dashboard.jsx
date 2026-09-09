import { useEffect, useState } from "react";
import propfolioLogo from "../assets/propfolio-logo.svg";
import "./Dashboard.css"

function Dashboard({ user, onLogout }) {
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        async function loadProperties() {
            try {
                const response = await fetch(
                    "http://localhost:8000/properties",
                    {
                        credentials: "include",
                    }
                );

                if (!response.ok) {
                    throw new Error("Neisdevās ielādēt īpašumus.");
                }

                const data = await response.json();

                setProperties(data);
            } catch (error) {
                console.error(error);
            }
        }

        loadProperties();
    }, []);

    return (
        <div className="dashboard-shell">

            <div className="dashboard-topbar">
                <div className="dashboard-topbar-inner">
                    <img
                        src={propfolioLogo}
                        alt="Propfolio"
                        className="dashboard-logo"
                    />

                    <button
                        type="button"
                        className="profile-button"
                        aria-label="Atvērt profila izvēlni"
                    >
                        {user?.first_name?.charAt(0).toUpperCase()}
                        {user?.last_name?.charAt(0).toUpperCase()}
                    </button>
                </div>
            </div>

            <main className="dashboard-page">

                <div className="dashboard-header">
                    <div>
                        <h1>Sveiki, {user?.first_name}!</h1>
                        <p>
                            Šeit varēsi pārvaldīt savus īpašumus un investīciju analīzes.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={onLogout}
                    >
                        Iziet
                    </button>
                </div>

                <div className="dashboard-section">
                    <div className="dashboard-section-header">
                        <div>
                            <h2>Mani īpašumi</h2>
                            <p>Tavi saglabātie nekustamie īpašumi parādīsies šeit.</p>
                        </div>

                        <button
                            type="button"
                            className="add-property-button">
                            + Pievienot īpašumu
                        </button>
                    </div>

                    {properties.length === 0 ? (
                        <div className="dashboard-empty">
                            <h3>Šeit vēl nav saglabātu īpašumu</h3>
                            <p>
                                Izveido savu pirmo īpašuma analīzi un saglabā to profilā.
                            </p>
                        </div>
                    ) : (
                        <div className="property-list">
                            {properties.map((property) => (
                                <div
                                    className="property-card"
                                    key={property.property_id}
                                >
                                    <h3>{property.property_name}</h3>

                                    <p>
                                        Finansējums:{" "}
                                        {property.financing_type === "cash"
                                            ? "Paša līdzekļi"
                                            : "Hipotēka"}
                                    </p>

                                    <p>
                                        Pirkuma cena: {" "}
                                        {Number(property.purchase_price).toLocaleString("lv-LV")}  €
                                    </p>

                                    <p>Platība: {property.area} m²</p>

                                    <p>
                                        Īres maksa: {" "}
                                        {Number(property.monthly_rent).toLocaleString("lv-LV")} €/mēn.
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

export default Dashboard;
