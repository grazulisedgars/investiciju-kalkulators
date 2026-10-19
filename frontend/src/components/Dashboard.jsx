import { propertyGrossYield, propertyMonthlyRent } from "./propertyYield";
import { useEffect, useRef, useState } from "react";
import {
    ImagePlus,
    ImageOff,
    Pencil,
    Trash2,
    House,
    Building2,
    CirclePlus,
    CircleHelp,
    ChevronRight,
    Wallet,
    Landmark,
    Crown,
    X,
} from "lucide-react";
import propfolioLogo from "../assets/icons/propfolio-logo.svg";
import "./Dashboard.css"
import userIcon from "../assets/icons/user.svg";
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
    onOpenProperty,
    onOpenProfile,
    onOpenPlans,
    initialAction,
    onActionConsumed,
}) {
    const isPro=user?.plan==="pro";
    const [properties, setProperties] = useState([]);
    const [propertiesLoaded, setPropertiesLoaded] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [openPropertyMenu, setOpenPropertyMenu] = useState(null);

    const profileMenuRef = useRef(null);
    const propertyMenuRef = useRef(null);

    useEffect(() => {
        if (!showProfileMenu && openPropertyMenu === null) return;

        function handleClickOutside(event) {
            const clickedProfileMenu =
                profileMenuRef.current?.contains(event.target);

            const clickedPropertyMenu =
                propertyMenuRef.current?.contains(event.target);

            if (!clickedProfileMenu && !clickedPropertyMenu) {
                setShowProfileMenu(false);
                setOpenPropertyMenu(null);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setShowProfileMenu(false);
                setOpenPropertyMenu(null);
            }
        }

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [showProfileMenu, openPropertyMenu]);

    const [editingProperty, setEditingProperty] = useState(null);

    useEffect(() => {
        if (!editingProperty) return;

        function handleEscape(event) {
            if (event.key === "Escape") {
                setEditingProperty(null);
            }
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [editingProperty]);

    const [propertyToDelete, setPropertyToDelete] = useState(null);
    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches);
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const limitDialogRef = useRef(null);
    const limitReached = !isPro && properties.length >= 3;
    useEffect(() => {
        const media = window.matchMedia('(max-width: 600px)');
        const update = () => { setIsMobile(media.matches); if (!media.matches) setShowLimitDialog(false); };
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        if (!showLimitDialog) return;
        const dialog = limitDialogRef.current;
        const overflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = 'hidden';
        return () => { dialog.close(); document.body.style.overflow = overflow; };
    }, [showLimitDialog]);
    function handleAddProperty() {
        if (limitReached) {
            if (isMobile) setShowLimitDialog(true);
            return;
        }
        setShowAddPropertyModal(true);
    }

    useEffect(() => {
        if (!showAddPropertyModal) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const modal = document.querySelector('.add-property-modal');
        const controls = [...modal.querySelectorAll('button:not(:disabled)')];
        controls[0]?.focus();
        function onKey(event) {
            if (event.key === 'Escape') setShowAddPropertyModal(false);
            if (event.key !== 'Tab') return;
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
    }, [showAddPropertyModal]);
    const [showFaq, setShowFaq] = useState(false);
    const [mobileSection, setMobileSection] = useState('home');
    useEffect(() => {
        let frame = null;
        function updateSection() {
            frame = null;
            const marker = Math.min(window.innerHeight * .3, 180);
            const propertiesHeading = document.getElementById('dashboard-properties');
            const faq = document.getElementById('dashboard-faq');
            const next = faq && faq.getBoundingClientRect().top <= marker ? 'faq'
                : propertiesHeading && propertiesHeading.getBoundingClientRect().top <= marker ? 'properties' : 'home';
            setMobileSection(next);
        }
        function scheduleUpdate() {
            if (frame === null) frame = requestAnimationFrame(updateSection);
        }
        const observer = new ResizeObserver(scheduleUpdate);
        const page = document.querySelector('.dashboard-page');
        if (page) observer.observe(page);
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);
        updateSection();
        return () => {
            window.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
            observer.disconnect();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, [showFaq, properties.length]);

    const [openFaq, setOpenFaq] = useState(null);

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
                setPropertiesLoaded(true);
            } catch (error) {
                console.error(error);
            }
        }

        loadProperties();
    }, [user?.plan]);

    useEffect(() => {
        if (!initialAction || !propertiesLoaded) return;
        if (initialAction === 'add') {
            if (!isPro && properties.length >= 3) setShowLimitDialog(true);
            else setShowAddPropertyModal(true);
        } else if (initialAction === 'faq') {
            setShowFaq(true);
            requestAnimationFrame(() => document.getElementById('dashboard-faq')?.scrollIntoView({block:'start'}));
        } else if (initialAction === 'properties') {
            requestAnimationFrame(() => document.getElementById('dashboard-properties')?.scrollIntoView({block:'start'}));
        }
        onActionConsumed?.();
    }, [initialAction, propertiesLoaded, properties.length, isPro, onActionConsumed]);

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
                        market_value:
                            editingProperty.market_value === ""
                                ? null
                                : Number(editingProperty.market_value),
                        renovation_cost_per_m2: Number(
                            editingProperty.renovation_cost_per_m2
                        ),
                        monthly_rent:
                            editingProperty.monthly_rent === "" ||
                                editingProperty.monthly_rent === null ||
                                editingProperty.monthly_rent === undefined
                                ? null
                                : Number(editingProperty.monthly_rent),

                        occupancy:
                            editingProperty.occupancy === "" ||
                                editingProperty.occupancy === null ||
                                editingProperty.occupancy === undefined
                                ? null
                                : Number(editingProperty.occupancy),
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

    const monthlyRentValues = properties.map(property => propertyMonthlyRent(property, isPro)).filter(value => value !== null);
    const totalMonthlyRent = monthlyRentValues.reduce((sum, value) => sum + value, 0);

    const yieldValues = properties.map(property => propertyGrossYield(property, isPro)).filter(value => value !== null);
    const averageGrossYield = yieldValues.length ? yieldValues.reduce((sum, value) => sum + value, 0) / yieldValues.length : null;

    const propertiesWithMarketValue = properties.filter(
        (property) =>
            property.market_value !== null &&
            property.market_value !== undefined &&
            property.market_value !== ""
    );

    const totalMarketValue = propertiesWithMarketValue.reduce(
        (total, property) =>
            total + Number(property.market_value),
        0
    );

    function handleFaqToggle() {
        if (showFaq) {
            setShowFaq(false);
            return;
        }

        setShowFaq(true);

        setTimeout(() => {
            document
                .getElementById("dashboard-faq")
                ?.scrollIntoView({
                    behaviour: "smooth",
                    block: "start",
                });
        }, 0);
    }

    return (
        <div className="dashboard-shell">

            <div className="dashboard-topbar">
                <div className="dashboard-topbar-inner">
                    <img
                        src={propfolioLogo}
                        alt="Propfolio"
                        className="dashboard-logo"
                    />

                    <div className="profile-menu-wrapper" ref={profileMenuRef}>
                        <button
                            type="button"
                            className="profile-toggle"
                            aria-label="Atvērt profila izvēlni"
                            onClick={() => {
                                if(window.matchMedia('(max-width:600px)').matches){setShowProfileMenu(false);onOpenProfile();return;}
                                setShowProfileMenu((previous) => !previous);
                                setOpenPropertyMenu(null);
                            }}
                        >
                            <span className="profile-button">
                                {user?.avatar_url ? <img className="dashboard-profile-photo" src={`http://localhost:8000${user.avatar_url}`} alt=""/> : <>{user?.first_name?.charAt(0).toUpperCase()}{user?.last_name?.charAt(0).toUpperCase()}</>}
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
                                <button type="button" onClick={()=>{setShowProfileMenu(false);onOpenProfile();}}>
                                    <img
                                        src={userIcon}
                                        alt=""
                                        className="profile-menu-icon"
                                    />
                                    Mans profils
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

            <nav className="dashboard-mobile-nav" aria-label="Mobilā navigācija">
                <button type="button" aria-current={mobileSection==='home'?'location':undefined} onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}><House size={21}/><span>Sākums</span></button>
                <button type="button" aria-current={mobileSection==='properties'?'location':undefined} onClick={()=>{document.getElementById('dashboard-properties')?.scrollIntoView({block:'start'});}}><Building2 size={21}/><span>Īpašumi</span></button>
                <button type="button" disabled={limitReached && !isMobile} data-limit-reached={limitReached || undefined} onClick={handleAddProperty}><CirclePlus size={21}/><span>Pievienot</span></button>
                <button type="button" aria-current={mobileSection==='faq'?'location':undefined} onClick={()=>{setShowFaq(true);requestAnimationFrame(()=>document.getElementById('dashboard-faq')?.scrollIntoView({block:'start'}));}}><CircleHelp size={21}/><span>FAQ</span></button>
            </nav>
            <main className="dashboard-page">
                <section className="dashboard-welcome" id="dashboard-home">
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
                        onClick={handleAddProperty}
                        data-limit-reached={limitReached || undefined}
                        disabled={limitReached && !isMobile}
                    >
                        <span>+</span>
                        Pievienot īpašumu
                    </button>
                </section>

                <section className="properties-section">
                    <div className={`properties-section-header ${isPro?"properties-section-header-pro":""}`}>
                        <div className="properties-section-title" id="dashboard-properties"><h2>Tavi īpašumi ({properties.length})</h2>{isPro && <span className="property-plan-badge">PRO</span>}</div>


                        {!isPro && <div className="property-limit">
                            <div className="property-limit-usage">
                                <span>
                                    {properties.length>3?`Saglabāti ${properties.length} īpašumi · Basic limits: 3`:`Izmantoti ${properties.length} no 3 īpašumiem`}
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
                                {properties.length>3?'Vēlies pievienot vairāk? ':'Ja vēlies pievienot vairāk, '}
                                <a href="#plans" onClick={event=>{event.preventDefault();onOpenPlans();}}>
                                    {properties.length>3?'Atjauno PRO →':'apskati Pro plānu →'}
                                </a>
                            </span>
                        </div>}
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
                                const grossYield = propertyGrossYield(property, isPro);

                                return (
                                    <article
                                        className="property-card"
                                        key={property.property_id}
                                    >
                                        <div className="property-card-image">
                                            <span
                                                className={`property-status-badge property-status-${property.status || "planned"}`}
                                            >
                                                {property.status === "renovating"
                                                    ? "Renovācijā"
                                                    : property.status === "ready_to_rent"
                                                        ? "Gatavs izīrēšanai"
                                                        : property.status === "rented"
                                                            ? "Izīrēts"
                                                            : "Plānots"}
                                            </span>
                                            {property.image_url ? (
                                                <img
                                                    src={`http://localhost:8000${property.image_url}`}
                                                    alt={property.property_name}
                                                    className="property-image"
                                                />
                                            ) : (
                                                <div className="property-image-placeholder">
                                                    <House size={50} strokeWidth={1.5} />
                                                </div>
                                            )}
                                            <div
                                                className="property-card-menu-wrapper"
                                                ref={
                                                    openPropertyMenu === property.property_id
                                                        ? propertyMenuRef
                                                        : null
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className="property-card-menu"
                                                    aria-label="Īpašuma izvēlne"
                                                    onClick={() => {
                                                        setOpenPropertyMenu((previous) =>
                                                            previous === property.property_id
                                                                ? null
                                                                : property.property_id
                                                        );

                                                        setShowProfileMenu(false);
                                                    }}
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
                                                            <ImagePlus size={17} strokeWidth={1.8} />
                                                            <span>Mainīt bildi</span>
                                                        </button>

                                                        {property.image_url && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteImage(property.property_id)
                                                                }
                                                            >
                                                                <ImageOff size={17} strokeWidth={1.8} />
                                                                <span>Dzēst bildi</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingProperty(property);
                                                                setOpenPropertyMenu(null);
                                                            }}
                                                        >
                                                            <Pencil size={17} strokeWidth={1.8} />
                                                            <span>Rediģēt īpašumu</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="property-delete-button"
                                                            onClick={() => {
                                                                setPropertyToDelete(property);
                                                                setOpenPropertyMenu(null);
                                                            }}
                                                        >
                                                            <Trash2 size={17} strokeWidth={1.8} />
                                                            <span>Dzēst īpašumu</span>
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
                                                        {grossYield === null
                                                            ? "—"
                                                            : `${grossYield.toFixed(1)}%`}
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

                                                <button
                                                    type="button"
                                                    className="property-card-arrow"
                                                    onClick={() => onOpenProperty(property)}
                                                    aria-label={`Atvērt īpašumu ${property.property_name}`}
                                                >
                                                    <span className="property-card-arrow-desktop">→</span>
                                                    <ChevronRight className="property-card-arrow-mobile" size={22} strokeWidth={1.8}/>
                                                </button>
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
                                    <span>Kopējā tirgus vērtība</span>

                                    <strong
                                        className={
                                            propertiesWithMarketValue.length === 0
                                                ? "portfolio-value-missing"
                                                : ""
                                        }
                                    >
                                        {propertiesWithMarketValue.length > 0
                                            ? `€${totalMarketValue.toLocaleString("lv-LV")}`
                                            : "Nav norādīta"}
                                    </strong>

                                    {propertiesWithMarketValue.length > 0 &&
                                        propertiesWithMarketValue.length < properties.length && (
                                            <small className="portfolio-summary-note">
                                                Tirgus vērtība norādīta{" "}
                                                {propertiesWithMarketValue.length} no{" "}
                                                {properties.length} īpašumiem
                                            </small>
                                        )}

                                    {properties.length > 0 &&
                                        propertiesWithMarketValue.length === 0 && (
                                            <small className="portfolio-summary-note">
                                                Pievieno tirgus vērtību īpašuma datos
                                            </small>
                                        )}
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
                                        {monthlyRentValues.length > 0
                                            ? `€${totalMonthlyRent.toLocaleString("lv-LV")}`
                                            : "—"}
                                    </strong>

                                    {monthlyRentValues.length > 0 &&
                                        monthlyRentValues.length < properties.length && (
                                            <small className="portfolio-summary-note">
                                                Īres dati norādīti{" "}
                                                {monthlyRentValues.length} no{" "}
                                                {properties.length} īpašumiem
                                            </small>
                                        )}

                                    {properties.length > 0 &&
                                        monthlyRentValues.length === 0 && (
                                            <small className="portfolio-summary-note">
                                                Pievieno īres datus īpašuma datos
                                            </small>
                                        )}
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
                                        {averageGrossYield === null
                                            ? "—"
                                            : `${averageGrossYield.toFixed(1)}%`}
                                    </strong>

                                    {yieldValues.length > 0 &&
                                        yieldValues.length < properties.length && (
                                            <small className="portfolio-summary-note">
                                                Aprēķināts {" "}
                                                {yieldValues.length} no{" "}
                                                {properties.length} īpašumiem
                                            </small>
                                        )}

                                    {properties.length > 0 &&
                                        yieldValues.length === 0 && (
                                            <small className="portfolio-summary-note">
                                                Pievieno īres datus īpašuma datos
                                            </small>
                                        )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="dashboard-help">
                        <div className="dashboard-help-content">
                            <div className="dashboard-help-icon">
                                ?
                            </div>

                            <div className="dashboard-help-text">
                                <strong>Jautājumi vai nepieciešama palīdzība?</strong>
                                <p>
                                    Apskati mūsu biežāk uzdotos jautājumus vai sazinies ar mums.
                                </p>
                            </div>
                        </div>

                        <div className="dashboard-help-actions">
                            <button
                                type="button"
                                className="faq-button"
                                onClick={handleFaqToggle}
                            >
                                {showFaq ? "Aizvērt FAQ" : "Apskatīt FAQ"}
                            </button>

                            <a
                                href="mailto:propfolio.lv@gmail.com?subject=Jautājums par PROPFOLIO"
                                className="contact-link"
                            >
                                Sazināties
                                <span>→</span>
                            </a>
                        </div>
                    </div>

                    {showFaq && (
                        <section
                            id="dashboard-faq"
                            className="dashboard-faq"
                        >
                            <div className="dashboard-faq-header">
                                <h2>Biežāk uzdotie jautājumi</h2>
                                <p>
                                    Atbildes uz biežāk uzdotajiem jautājumiem par PROPFOLIO
                                    un investīciju aprēķiniem.
                                </p>
                            </div>

                            <div className="dashboard-faq-list">

                                <div className="dashboard-faq-entry">
                                    <button
                                        type="button"
                                        className={`dashboard-faq-item ${openFaq === "what-is-propfolio"
                                            ? "dashboard-faq-item-open"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setOpenFaq(
                                                openFaq === "what-is-propfolio"
                                                    ? null
                                                    : "what-is-propfolio"
                                            )
                                        }
                                    >
                                        <span>Kas ir PROPFOLIO?</span>
                                        <span>
                                            {openFaq === "what-is-propfolio" ? "-" : "+"}
                                        </span>
                                    </button>

                                    {openFaq === "what-is-propfolio" && (
                                        <div className="dashboard-faq-answer">
                                            <p>
                                                PROPFOLIO ir nekustamā īpašuma investīciju analīzes
                                                rīks, kas palīdz vienuviet apkopot īpašumu datus un
                                                izvērtēt to potenciālo ienesīgumu.
                                            </p>
                                        </div>
                                    )}
                                </div>


                                <div className="dashboard-faq-entry">
                                    <button
                                        type="button"
                                        className={`dashboard-faq-item ${openFaq === "gross-yield"
                                            ? "dashboard-faq-item-open"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setOpenFaq(
                                                openFaq === "gross-yield"
                                                    ? null
                                                    : "gross-yield"
                                            )
                                        }
                                    >
                                        <span>Kas ir bruto ienesīgums?</span>

                                        <span>
                                            {openFaq === "gross-yield" ? "−" : "+"}
                                        </span>
                                    </button>

                                    {openFaq === "gross-yield" && (
                                        <div className="dashboard-faq-answer">
                                            <p>
                                                Tas parāda, cik lielus gada īres ieņēmumus īpašums
                                                potenciāli rada attiecībā pret kopējo investīciju.
                                            </p>

                                            <p>
                                                Gada bruto īres ieņēmumi ÷ kopējā investīcija × 100.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="dashboard-faq-entry">
                                    <button
                                        type="button"
                                        className={`dashboard-faq-item ${openFaq === "total-investment"
                                            ? "dashboard-faq-item-open"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setOpenFaq(
                                                openFaq === "total-investment"
                                                    ? null
                                                    : "total-investment"
                                            )
                                        }
                                    >
                                        <span>Kā tiek aprēķināta kopējā investīcija?</span>

                                        <span>
                                            {openFaq === "total-investment" ? "−" : "+"}
                                        </span>
                                    </button>

                                    {openFaq === "total-investment" && (
                                        <div className="dashboard-faq-answer">
                                            <p>
                                                Kopējā investīcija ir īpašuma pirkuma cena un
                                                plānotās remonta izmaksas, ja tādas ir.
                                            </p>

                                            <p>
                                                Piemēram, ja īpašums maksā €50 000 un remontam
                                                nepieciešami €10 000, kopējā investīcija ir €60 000.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="dashboard-faq-entry">
                                    <button
                                        type="button"
                                        className={`dashboard-faq-item ${openFaq === "purchase-vs-market-value"
                                            ? "dashboard-faq-item-open"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setOpenFaq(
                                                openFaq === "purchase-vs-market-value"
                                                    ? null
                                                    : "purchase-vs-market-value"
                                            )
                                        }
                                    >
                                        <span>
                                            Kāda ir atšķirība starp pirkuma cenu un tirgus vērtību?
                                        </span>

                                        <span>
                                            {openFaq === "purchase-vs-market-value" ? "−" : "+"}
                                        </span>
                                    </button>

                                    {openFaq === "purchase-vs-market-value" && (
                                        <div className="dashboard-faq-answer">
                                            <p>
                                                Pirkuma cena ir summa, par kuru īpašums tika iegādāts.
                                                Tirgus vērtība ir īpašuma aptuvenā pašreizējā vērtība tirgū.
                                            </p>

                                            <p>
                                                Tirgus vērtība laika gaitā var mainīties un var būt
                                                gan augstāka, gan zemāka par sākotnējo pirkuma cenu.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="dashboard-faq-entry">
                                    <button
                                        type="button"
                                        className={`dashboard-faq-item ${openFaq === "mortgage-gross-yield"
                                            ? "dashboard-faq-item-open"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setOpenFaq(
                                                openFaq === "mortgage-gross-yield"
                                                    ? null
                                                    : "mortgage-gross-yield"
                                            )
                                        }
                                    >
                                        <span>Vai hipotēka maina bruto ienesīgumu?</span>

                                        <span>
                                            {openFaq === "mortgage-gross-yield" ? "−" : "+"}
                                        </span>
                                    </button>

                                    {openFaq === "mortgage-gross-yield" && (
                                        <div className="dashboard-faq-answer">
                                            <p>
                                                Nē. Bruto ienesīgums raksturo paša īpašuma potenciālo
                                                ienesīgumu, tāpēc tas nemainās atkarībā no tā, vai
                                                īpašums iegādāts par saviem līdzekļiem vai ar hipotēku.
                                            </p>

                                            <p>
                                                Tomēr finansējuma nosacījumi ietekmē investora faktisko
                                                naudas plūsmu un ieguldītā kapitāla atdevi. Šie rādītāji
                                                tiek analizēti atsevišķi no bruto ienesīguma.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="dashboard-faq-entry">
                                    <button
                                        type="button"
                                        className={`dashboard-faq-item ${openFaq === "occupancy"
                                            ? "dashboard-faq-item-open"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setOpenFaq(
                                                openFaq === "occupancy"
                                                    ? null
                                                    : "occupancy"
                                            )
                                        }
                                    >
                                        <span>Kā īpašuma aizpildījums ietekmē aprēķinus?</span>

                                        <span>
                                            {openFaq === "occupancy" ? "−" : "+"}
                                        </span>
                                    </button>

                                    {openFaq === "occupancy" && (
                                        <div className="dashboard-faq-answer">
                                            <p>
                                                Aizpildījums parāda, cik lielu daļu no gada īpašumu
                                                paredzēts izīrēt. Tas ļauj aprēķinos ņemt vērā periodus,
                                                kad īpašums varētu būt bez īrnieka.
                                            </p>

                                            <p>
                                                Piemēram, ja mēneša īres maksa ir €500 un aizpildījums
                                                ir 90%, paredzamie gada bruto īres ieņēmumi ir
                                                €500 × 12 × 90% = €5 400.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="dashboard-faq-entry">
                                    <button
                                        type="button"
                                        className={`dashboard-faq-item ${openFaq === "free-property-limit"
                                            ? "dashboard-faq-item-open"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setOpenFaq(
                                                openFaq === "free-property-limit"
                                                    ? null
                                                    : "free-property-limit"
                                            )
                                        }
                                    >
                                        <span>Cik īpašumus varu pievienot bezmaksas profilā?</span>

                                        <span>
                                            {openFaq === "free-property-limit" ? "−" : "+"}
                                        </span>
                                    </button>

                                    {openFaq === "free-property-limit" && (
                                        <div className="dashboard-faq-answer">
                                            <p>
                                                Bezmaksas PROPFOLIO profilā vari pievienot un saglabāt
                                                līdz 3 īpašumiem.
                                            </p>

                                            <p>
                                                Ja vēlies analizēt vairāk īpašumu, būs nepieciešams
                                                PRO abonements, kas ļaus pievienot neierobežotu
                                                īpašumu skaitu.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </section>
            </main >

            {editingProperty && (
                <div
                    className="edit-property-overlay"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setEditingProperty(null);
                        }
                    }}
                >
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
                            Pirkuma cena (€)
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
                            Tirgus vērtība (€)
                            <input
                                type="number"
                                min="0"
                                placeholder="Piemēram, 25000"
                                value={editingProperty.market_value ?? ""}
                                onChange={(event) =>
                                    setEditingProperty({
                                        ...editingProperty,
                                        market_value: event.target.value,
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
                                value={editingProperty.monthly_rent ?? ""}
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
                                value={editingProperty.occupancy ?? ""}
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
                        <div className="add-property-modal" role="dialog" aria-modal="true" aria-labelledby="add-property-title">
                            <h2 id="add-property-title">Pievienot īpašumu</h2>

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
                                    <span className="add-property-option-icon"><Wallet size={24}/></span><div className="add-property-option-copy"><strong>Par saviem līdzekļiem</strong>
                                    <span>
                                        Īpašums tiek iegādāts bez hipotekārā kredīta.
                                    </span></div>
                                </button>

                                <button
                                    type="button"
                                    className="add-property-option"
                                    onClick={() => {
                                        setShowAddPropertyModal(false);
                                        onAddProperty("mortgage");
                                    }}
                                >
                                    <span className="add-property-option-icon"><Landmark size={24}/></span><div className="add-property-option-copy"><strong>Ar hipotēku</strong>
                                    <span>
                                        Daļa no pirkuma tiek finansēta ar bankas kredītu.
                                    </span></div>
                                </button>
                            </div>
                            <button
                                type="button"
                                className="add-property-cancel-button"
                                aria-label="Aizvērt pievienošanas izvēli"
                                onClick={() => setShowAddPropertyModal(false)}
                            >
                                <X className="add-property-close-icon" size={20}/><span className="add-property-cancel-label">Atcelt</span>
                            </button>
                        </div>
                    </div>
                )
            }
            {showLimitDialog && (
                <dialog ref={limitDialogRef} className="mobile-property-limit-dialog" aria-labelledby="property-limit-title"
                    onCancel={() => setShowLimitDialog(false)}
                    onClick={event => { if (event.target === event.currentTarget) setShowLimitDialog(false); }}>
                    <div className="property-limit-crown"><Crown size={28} aria-hidden="true"/></div>
                    <h2 id="property-limit-title">Tu izmanto bezmaksas plānu</h2>
                    <p>Esi saglabājis <strong>{properties.length} no 3 īpašumiem.</strong></p>
                    <p>Lai pievienotu vairāk īpašumu,<br/>apskati PRO plānu.</p>
                    <button type="button" className="property-limit-upgrade" onClick={() => { setShowLimitDialog(false); onOpenPlans(); }}>Apskatīt PRO plānu</button>
                    <button type="button" className="property-limit-later" onClick={() => setShowLimitDialog(false)}>Vēlāk</button>
                </dialog>
            )}
        </div >
    );
}

export default Dashboard;
