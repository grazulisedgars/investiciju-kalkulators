import { useEffect, useState } from "react";
import propfolioLogo from "../assets/icons/propfolio-logo.svg";
import "./Dashboard.css"
import userIcon from "../assets/icons/user.svg";
import linkIcon from "../assets/icons/link.svg";
import logoutIcon from "../assets/icons/logout.svg";
import chevronDown from "../assets/icons/chevron-down.svg";
import portfolioPropertiesIcon from "../assets/icons/portfolio-properties.svg";
import portfolioValueIcon from "../assets/icons/portfolio-value.svg";
import portfolioRentIcon from "../assets/icons/portfolio-rent.svg";
import portfolioYieldIcon from "../assets/icons/portfolio-yield.svg";

function Dashboard({
    user,
    onLogout,
    onAddProperty,
}) {
    const [properties, setProperties] = useState([]);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [openPropertyMenu, setOpenPropertyMenu] = useState(null);
    const [editingProperty, setEditingProperty] = useState(null);
    const [propertyToDelete, setPropertyToDelete] = useState(null);
    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

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

    async function handleImageUpload(propertyId, file) {
        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(
                `http://localhost:8000/properties/${propertyId}/image`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }

            setProperties((currentProperties) =>
                currentProperties.map((property) =>
                    property.property_id === propertyId
                        ? {
                            ...property,
                            image_url: data.image_url,
                        }
                        : property
                )
            );
        } catch (error) {
            console.error("Attēla augšupielādes kļūda:", error);
        }
    }

    async function handlePropertyUpdate() {
        try {
            const response = await fetch(
                `http://localhost:8000/properties/${editingProperty.property_id}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        property_name: editingProperty.property_name,
                        address: editingProperty.address || null,
                        purchase_price: Number(editingProperty.purchase_price),
                        area: Number(editingProperty.area),
                        renovation_cost_per_m2: Number(
                            editingProperty.renovation_cost_per_m2
                        ),
                        monthly_rent: Number(editingProperty.monthly_rent),
                        occupancy: Number(editingProperty.occupancy),
                        down_payment_percent:
                            editingProperty.down_payment_percent === "" ||
                                editingProperty.down_payment_percent === null
                                ? null
                                : Number(
                                    editingProperty.down_payment_percent
                                ),
                    }),
                }
            );

            const data = await response.json();
            console.log("Updated property:", data);

            if (!response.ok) {
                console.error(data);
                return;
            }

            setProperties((currentProperties) =>
                currentProperties.map((property) =>
                    property.property_id === data.property_id
                        ? data
                        : property
                )
            );

            setEditingProperty(null);
        } catch (error) {
            console.error("Īpašuma atjaunošanas kļūda", error);
        }
    }

    async function handleDeleteProperty() {
        if (!propertyToDelete) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:8000/properties/${propertyToDelete.property_id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(data);
                return;
            }

            setProperties((currentProperties) =>
                currentProperties.filter(
                    (property) =>
                        property.property_id !== propertyToDelete.property_id
                )
            );

            setPropertyToDelete(null);
        } catch (error) {
            console.error("Īpašuma dzēšanas kļūda", error);
        }
    }

    async function handleDeleteImage(propertyId) {
        try {
            const response = await fetch(
                `http://localhost:8000/properties/${propertyId}/image`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("Bildes dzēšanas kļūda:", data);
                return;
            }

            setProperties((currentProperties) =>
                currentProperties.map((property) =>
                    property.property_id === propertyId
                        ? {
                            ...property,
                            image_url: null,
                        }
                        : property
                )
            );

            setOpenPropertyMenu(null);
        } catch (error) {
            console.error("Bildes dzēšanas kļūda:", error);
        }
    }

    const totalPortfolioValue = properties.reduce(
        (total, property) =>
            total + Number(property.purchase_price || 0),
        0
    );

    const totalMonthlyRent = properties.reduce(
        (total, property) =>
            total + Number(property.monthly_rent || 0),
        0
    );

    const averageGrossYield =
        properties.length > 0
            ? properties.reduce((total, property) => {
                const totalInvestment =
                    Number(property.purchase_price || 0) +
                    Number(property.area || 0) *
                    Number(property.renovation_cost_per_m2 || 0);

                const annualGrossRent =
                    Number(property.monthly_rent || 0) *
                    12 *
                    (Number(property.occupancy || 0) / 100);

                const grossYield =
                    totalInvestment > 0
                        ? (annualGrossRent / totalInvestment) * 100
                        : 0;

                return total + grossYield;
            }, 0) / properties.length
            : 0;

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
                        className={`add-property-button ${showProfileMenu ? "add-property-button-shifted" : ""
                            }`}
                        onClick={() => setShowAddPropertyModal(true)}
                        disabled={properties.length >= 3}
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
                                    Number(property.monthly_rent || 0) *
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
                                            {property.image_url ? (
                                                <img
                                                    src={`http://localhost:8000${property.image_url}`}
                                                    alt={property.property_name}
                                                    className="property-image"
                                                />
                                            ) : (
                                                <div className="property-image-placeholder">
                                                    Īpašuma attēls
                                                </div>
                                            )}
                                            <div className="property-card-menu-wrapper">
                                                <button
                                                    type="button"
                                                    className="property-card-menu"
                                                    aria-label="Īpašuma izvēlne"
                                                    onClick={() =>
                                                        setOpenPropertyMenu(
                                                            openPropertyMenu === property.property_id
                                                                ? null
                                                                : property.property_id
                                                        )
                                                    }
                                                >
                                                    ⋮
                                                </button>

                                                {openPropertyMenu === property.property_id && (
                                                    <div className="property-card-dropdown">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenPropertyMenu(null);

                                                                document
                                                                    .getElementById(
                                                                        `property-image-${property.property_id}`
                                                                    )
                                                                    ?.click();
                                                            }}
                                                        >
                                                            Mainīt bildi
                                                        </button>

                                                        {property.image_url && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteImage(property.property_id)
                                                                }
                                                            >
                                                                Dzēst bildi
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingProperty(property);
                                                                setOpenPropertyMenu(null);
                                                            }}
                                                        >
                                                            Rediģēt īpašumu
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="property-delete-button"
                                                            onClick={() => {
                                                                setPropertyToDelete(property);
                                                                setOpenPropertyMenu(null);
                                                            }}
                                                        >
                                                            Dzēst īpašumu
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                id={`property-image-${property.property_id}`}
                                                className="property-image-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) =>
                                                    handleImageUpload(
                                                        property.property_id,
                                                        event.target.files[0]
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="property-card-content">
                                            <h3>{property.property_name}</h3>

                                            <p className="property-address">
                                                {property.address || "Adrese nav norādīta"}
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
                                                    Pēdējo reizi atjaunots {" "}
                                                    {property.updated_at
                                                        ? new Date(property.updated_at).toLocaleDateString("lv-LV", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })
                                                        : "-"}
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

                    <section className="portfolio-summary">
                        <div className="portfolio-summary-header">
                            <div>
                                <h2>Portfeļa pārskats</h2>
                                <p>Kopējie rādītāji visiem taviem īpašumiem.</p>
                            </div>

                            <span>
                                Dati uz {new Date().toLocaleDateString("lv-LV")}
                            </span>
                        </div>

                        <div className="portfolio-summary-grid">

                            <div className="portfolio-summary-card">
                                <div className="portfolio-summary-icon">
                                    <img
                                        src={portfolioPropertiesIcon}
                                        alt=""
                                    />
                                </div>

                                <div>
                                    <span>Īpašumu skaits</span>
                                    <strong>{properties.length}</strong>
                                </div>
                            </div>

                            <div className="portfolio-summary-card">
                                <div className="portfolio-summary-icon">
                                    <img
                                        src={portfolioValueIcon}
                                        alt=""
                                    />
                                </div>

                                <div>
                                    <span>Kopējā vērtība</span>
                                    <strong>
                                        €
                                        {properties
                                            .reduce(
                                                (total, property) =>
                                                    total + Number(property.purchase_price || 0),
                                                0
                                            )
                                            .toLocaleString("lv-LV")}
                                    </strong>
                                </div>
                            </div>

                            <div className="portfolio-summary-card">
                                <div className="portfolio-summary-icon">
                                    <img
                                        src={portfolioRentIcon}
                                        alt=""
                                    />
                                </div>

                                <div>
                                    <span>Kopējā mēneša īre</span>
                                    <strong>
                                        €
                                        {properties
                                            .reduce(
                                                (total, property) =>
                                                    total + Number(property.monthly_rent || 0),
                                                0
                                            )
                                            .toLocaleString("lv-LV")}
                                    </strong>
                                </div>
                            </div>

                            <div className="portfolio-summary-card">
                                <div className="portfolio-summary-icon">
                                    <img
                                        src={portfolioYieldIcon}
                                        alt=""
                                    />
                                </div>

                                <div>
                                    <span>Vidējais bruto ienesīgums</span>

                                    <strong>
                                        {properties.length > 0
                                            ? (
                                                properties.reduce((total, property) => {
                                                    const totalInvestment =
                                                        Number(property.purchase_price || 0) +
                                                        Number(property.area || 0) *
                                                        Number(
                                                            property.renovation_cost_per_m2 || 0
                                                        );

                                                    const annualGrossRent =
                                                        Number(property.monthly_rent || 0) *
                                                        12 *
                                                        (Number(property.occupancy || 0) / 100);

                                                    const grossYield =
                                                        totalInvestment > 0
                                                            ? (annualGrossRent / totalInvestment) * 100
                                                            : 0;

                                                    return total + grossYield;
                                                }, 0) / properties.length
                                            ).toFixed(1)
                                            : "0.0"}
                                        %
                                    </strong>
                                </div>
                            </div>

                        </div>
                    </section>
                </section>
            </main >

            {editingProperty && (
                <div className="edit-property-overlay">
                    <div className="edit-property-modal">
                        <h2>Rediģēt īpašumu</h2>

                        <label>
                            Īpašuma nosaukums
                            <input
                                type="text"
                                value={editingProperty.property_name}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        property_name: event.target.value,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Adrese
                            <input
                                type="text"
                                value={editingProperty.address || ""}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        address: event.target.value,
                                    })
                                }
                                placeholder="Piemēram, Brīvības iela 102, Rīga"
                            />
                        </label>


                        <label>
                            Pirkuma cena
                            <input
                                type="number"
                                value={editingProperty.purchase_price}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        purchase_price: event.target.value,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Platība
                            <input
                                type="number"
                                value={editingProperty.area}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        area: event.target.value,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Remonts €/m²
                            <input
                                type="number"
                                value={editingProperty.renovation_cost_per_m2}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        renovation_cost_per_m2: event.target.value,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Īres maksa mēnesī
                            <input
                                type="number"
                                value={editingProperty.monthly_rent}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        monthly_rent: event.target.value,
                                    })
                                }
                            />
                        </label>

                        <label>
                            Aizpildījums %
                            <input
                                type="number"
                                value={editingProperty.occupancy}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        occupancy: event.target.value,
                                    })
                                }
                            />
                        </label>

                        {editingProperty.financing_type === "mortgage" && (
                            <label>
                                Pirmā iemaksa %
                                <input
                                    type="number"
                                    value={editingProperty.down_payment_percent || ""}
                                    onChange={(event) =>
                                        setEditingProperty({
                                            ...editingProperty,
                                            down_payment_percent: event.target.value,
                                        })
                                    }
                                />
                            </label>
                        )}

                        <div className="edit-property-actions">
                            <button
                                type="button"
                                className="edit-property-cancel"
                                onClick={() => setEditingProperty(null)}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="edit-property-save"
                                onClick={handlePropertyUpdate}
                            >
                                Saglabāt
                            </button>
                        </div>
                    </div>
                </div >
            )
            }

            {
                propertyToDelete && (
                    <div className="delete-property-overlay">
                        <div className="delete-property-modal">
                            <h2>Dzēst īpašumu?</h2>

                            <p>
                                Vai tiešām vēlies dzēst
                                {" "}
                                <strong>
                                    {propertyToDelete.property_name}
                                </strong>
                                ?
                            </p>

                            <p className="delete-property-warning">
                                Šo darbību nevarēs atsaukt.
                            </p>

                            <div className="delete-property-actions">
                                <button
                                    type="button"
                                    className="delete-property-cancel"
                                    onClick={() => setPropertyToDelete(null)}
                                >
                                    Atcelt
                                </button>

                                <button
                                    type="button"
                                    className="delete-property-confirm"
                                    onClick={handleDeleteProperty}
                                >
                                    Dzēst īpašumu
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showAddPropertyModal && (
                    <div className="add-property-overlay">
                        <div className="add-property-modal">
                            <h2>Pievienot īpašumu</h2>

                            <p>
                                Kā plāno finansēt šo investīciju?
                            </p>

                            <div className="add-property-options">
                                <button
                                    type="button"
                                    className="add-property-option"
                                    onClick={() => {
                                        setShowAddPropertyModal(false);
                                        onAddProperty("cash");
                                    }}
                                >
                                    <strong>Par saviem līdzekļiem</strong>
                                    <span>
                                        Īpašums tiek iegādāts bez hipotekārā kredīta.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="add-property-option"
                                    onClick={() => {
                                        setShowAddPropertyModal(false);
                                        onAddProperty("mortgage");
                                    }}
                                >
                                    <strong>Ar hipotēku</strong>
                                    <span>
                                        Daļa no pirkuma tiek finansēta ar bankas kredītu.
                                    </span>
                                </button>
                            </div>
                            <button
                                type="button"
                                className="add-property-cancel-button"
                                onClick={() => setShowAddPropertyModal(false)}
                            >
                                Atcelt
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default Dashboard;
