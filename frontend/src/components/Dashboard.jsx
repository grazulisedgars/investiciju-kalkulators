import { useEffect, useState } from "react";
import propfolioLogo from "../assets/icons/propfolio-logo.svg";
import "./Dashboard.css"
import userIcon from "../assets/icons/user.svg";
import linkIcon from "../assets/icons/link.svg";
import logoutIcon from "../assets/icons/logout.svg";
import chevronDown from "../assets/icons/chevron-down.svg";

function Dashboard({ user, onLogout }) {
    const [properties, setProperties] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

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

                    <div className="profile-menu-wrapper">
                        <button
                            type="button"
                            className="profile-toggle"
                            aria-label="Atvērt profila izvēlni"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            <span className="profile-button">
                                {user?.first_name?.charAt(0).toUpperCase()}
                                {user?.last_name?.charAt(0).toUpperCase()}
                            </span>

                            {showProfileMenu && (
                                <img
                                    src={chevronDown}
                                    alt=""
                                    className="profile-chevron"
                                />
                            )}
                        </button>

                        {showProfileMenu && (
                            <div className="profile-menu">
                                <button type="button">
                                    <img
                                        src={userIcon}
                                        alt=""
                                        className="profile-menu-icon"
                                    />
                                    Mans profils
                                </button>

                                <button type="button">
                                    <img
                                        src={linkIcon}
                                        alt=""
                                        className="profile-menu-icon"
                                    />
                                    Mainīt paroli
                                </button>

                                <button
                                    type="button"
                                    onClick={onLogout}
                                >
                                    <img
                                        src={logoutIcon}
                                        alt=""
                                        className="profile-menu-icon"
                                    />
                                    Iziet
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="dashboard-page">
                <section className="dashboard-welcome">
                    <div>
                        <h1>Sveiki, {user?.first_name}!</h1>
                        <p>
                            Šeit ir tavs nekustamā īpašuma portfelis.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-property-button"
                    >
                        <span>+</span>
                        Pievienot īpašumu
                    </button>
                </section>

                <section className="properties-section">
                    <div className="properties-section-header">
                        <h2>Tavi īpašumi ({properties.length})</h2>

                        <div className="property-limit">
                            <div className="property-limit-usage">
                                <span>
                                    Izmantoti {properties.length} no 3 īpašumiem
                                </span>

                                <div className="property-limit-bar">
                                    <div
                                        className="property-limit-progress"
                                        style={{
                                            width: `${Math.min(
                                                (properties.length / 3) * 100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <span className="property-limit-pro">
                                Ja vēlies pievienot vairāk,{" "}
                                <a href="#">
                                    apskati Pro plānu →
                                </a>
                            </span>
                        </div>
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
                            {properties.map((property) => {
                                const renovationCosts =
                                    Number(property.area || 0) *
                                    Number(property.renovation_cost_per_m2 || 0);

                                const totalInvestment =
                                    Number(property.purchase_price || 0) +
                                    renovationCosts;

                                const annualGrossRent =
                                    Number(property.month_rent || 0) *
                                    12 *
                                    (Number(property.occupancy || 0) / 100);

                                const grossYield =
                                    totalInvestment > 0
                                        ? (annualGrossRent / totalInvestment) * 100
                                        : 0;

                                return (
                                    <article
                                        className="property-card"
                                        key={property.property_id}
                                    >
                                        <div className="property-card-image">
                                            <div className="property-image-placeholder">
                                                Īpašuma attēls
                                            </div>

                                            <button
                                                type="button"
                                                className="property-card-menu"
                                                aria-label="Īpašuma izvēlne"
                                            >
                                                ⋮
                                            </button>
                                        </div>

                                        <div className="property-card-content">
                                            <h3>{property.property_name}</h3>

                                            <p className="property-address">
                                                Adrese nav norādīta
                                            </p>

                                            <div className="property-card-divider" />

                                            <div className="property-stats">
                                                <div>
                                                    <span>Pirkuma cena</span>
                                                    <strong>
                                                        €
                                                        {Number(
                                                            property.purchase_price
                                                        ).toLocaleString("lv-LV")}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Platība</span>
                                                    <strong>
                                                        {property.area} m²
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Bruto ienesīgums</span>
                                                    <strong>
                                                        {grossYield.toFixed(1)}%
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="property-card-footer">
                                                <span>
                                                    Pēdējo reizi atjaunots
                                                </span>

                                                <span className="property-card-arrow">
                                                    →
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main >
        </div >
    );
}

export default Dashboard;
