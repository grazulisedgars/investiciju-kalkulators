import { useState, useEffect, useRef } from "react";
import "./PropertyDetail.css";
import FreeAnalysisOverview from "./FreeAnalysisOverview";
import PropertyDiary from "./PropertyDiary";
import {
    Calculator,
    CalendarDays,
    ChartNoAxesCombined,
    LockKeyhole,
    Pencil,
    EllipsisVertical,
    ImagePlus,
    ImageOff,
    Trash2,
    House,
    Landmark,
    Wallet,
    ChevronDown,
    Receipt,
    HousePlug,
    Hammer,
    Banknote,
    Images,
} from "lucide-react";
import EditPropertyModal from "./EditPropertyModal";

function PropertyDetail({ property, onBack, onPropertyUpdated }) {
    const [activeTab, setActiveTab] = useState("analysis");
    const [activeDiarySection, setActiveDiarySection] = useState("calendar");
    const [showDiarySections, setShowDiarySections] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const moreMenuRef = useRef(null);

    useEffect(() => {
        if (!showMoreMenu) return;

        function handleClickOutside(event) {
            if (
                moreMenuRef.current &&
                !moreMenuRef.current.contains(event.target)
            ) {
                setShowMoreMenu(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setShowMoreMenu(false);
            }
        }

        document.addEventListener("pointerdown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [showMoreMenu]);

    // Dzēšanas modal aizvēršana ar Escape
    useEffect(() => {
        if (!showDeleteModal) return;

        function handleDeleteModalEscape(event) {
            if (event.key === "Escape" && !isDeleting) {
                setShowDeleteModal(false);
                setDeleteError("");
            }
        }

        document.addEventListener("keydown", handleDeleteModalEscape);

        return () => {
            document.removeEventListener("keydown", handleDeleteModalEscape);
        };
    }, [showDeleteModal, isDeleting]);

    async function handlePropertyUpdate(updatedProperty) {
        const response = await fetch(
            `http://localhost:8000/properties/${updatedProperty.property_id}`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    property_name: updatedProperty.property_name.trim(),
                    address: updatedProperty.address?.trim() || null,
                    purchase_price: Number(updatedProperty.purchase_price),
                    status: updatedProperty.status || "planned",
                    area: Number(updatedProperty.area),
                    market_value:
                        updatedProperty.market_value === "" ||
                            updatedProperty.market_value == null
                            ? null
                            : Number(updatedProperty.market_value),
                    renovation_cost_per_m2: Number(
                        updatedProperty.renovation_cost_per_m2
                    ),
                    monthly_rent:
                        updatedProperty.monthly_rent === "" ||
                            updatedProperty.monthly_rent == null
                            ? null
                            : Number(updatedProperty.monthly_rent),

                    occupancy:
                        updatedProperty.occupancy === "" ||
                            updatedProperty.occupancy == null
                            ? null
                            : Number(updatedProperty.occupancy),
                    down_payment_percent:
                        updatedProperty.financing_type === "mortgage"
                            ? Number(updatedProperty.down_payment_percent)
                            : null,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Neizdevās saglabāt īpašuma izmaiņas.")
        }

        const savedProperty = await response.json();

        onPropertyUpdated(savedProperty);
    }

    async function handleStatusChange(newStatus) {
        const response = await fetch(
            `http://localhost:8000/properties/${property.property_id}`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    property_name: property.property_name,
                    address: property.address || null,
                    status: newStatus,
                    purchase_price: Number(property.purchase_price),
                    market_value:
                        property.market_value == null
                            ? null
                            : Number(property.market_value),
                    area: Number(property.area),
                    renovation_cost_per_m2: Number(
                        property.renovation_cost_per_m2
                    ),
                    monthly_rent:
                        property.monthly_rent == null
                            ? null
                            : Number(property.monthly_rent),
                    occupancy:
                        property.occupancy == null
                            ? null
                            : Number(property.occupancy),
                    down_payment_percent:
                        property.financing_type === "mortgage"
                            ? Number(property.down_payment_percent)
                            : null,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Neizdev'as mainīt īpašuma statusu.");
        }

        const savedProperty = await response.json();

        onPropertyUpdated(savedProperty);
    }

    async function handleImageUpload(file) {
        if (!file || !property) return;

        const formData = new FormData();
        formData.append("image", file);

        setShowMoreMenu(false);

        try {
            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/image`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Neizdevās augšupielādēt attēlu.");
            }

            const data = await response.json();

            onPropertyUpdated({
                ...property,
                image_url: data.image_url,
            });

        } catch (error) {
            console.error("Attēla augšupielādes kļūda:", error);
            alert(error.message);
        }

    }

    async function handleDeleteImage() {
        if (!property || !property.image_url) return;

        setShowMoreMenu(false);

        try {
            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}/image`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Neizdevās izdzēst īpašuma attēlu.");
            }

            onPropertyUpdated({
                ...property,
                image_url: null,
            });

        } catch (error) {
            console.error("Attēla dzēšanas kļūda:", error);
            alert(error.message);
        }
    }

    async function handleDeleteProperty() {
        if (!property || isDeleting) return;

        setIsDeleting(true);
        setDeleteError("");

        try {
            const response = await fetch(
                `http://localhost:8000/properties/${property.property_id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Neizdevās izdzēst īpašumu.");
            }

            setShowDeleteModal(false);

            // Atgriežamies Dashboard skatā
            onBack();

        } catch (error) {
            console.error("Īpašuma dzēšanas kļūda:", error);
            setDeleteError(error.message || "Radās neparadzēta kļūda.");
        } finally {
            setIsDeleting(false);
        }
    }

    if (!property) return null;

    const handleDiarySectionChange = (section) => {
        const currentScrollY = window.scrollY;

        setActiveDiarySection(section);

        requestAnimationFrame(() => {
            window.scrollTo(0, currentScrollY);
        })
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("lv-LV", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));
    };

    const purchasePrice = Number(property.purchase_price || 0);
    const area = Number(property.area || 0);
    const renovationPerM2 = Number(property.renovation_cost_per_m2 || 0);
    const renovationTotal = area * renovationPerM2;

    const hasRentalData =
        property.monthly_rent !== null &&
        property.monthly_rent !== undefined &&
        property.occupancy !== null &&
        property.occupancy !== undefined;

    const monthlyRent = hasRentalData
        ? Number(property.monthly_rent)
        : null;

    const occupancy = hasRentalData
        ? Number(property.occupancy)
        : null;

    const annualRent = hasRentalData
        ? monthlyRent * 12 * (occupancy / 100)
        : null;

    const totalInvestment = purchasePrice + renovationTotal;

    const grossYield =
        hasRentalData && totalInvestment > 0
            ? (annualRent / totalInvestment) * 100
            : null;

    return (
        <div className="property-detail">

            {/* Īpašuma galvene */}
            <div
                className={`property-detail-header ${activeTab === "diary" &&
                    ["expenses", "loan", "utilities", "work", "rent", "gallery", "totals"].includes(activeDiarySection)
                    ? "property-detail-header-expenses"
                    : ""
                    }`}
            >

                <div className="property-detail-header-top">

                    <button
                        type="button"
                        className="property-detail-back"
                        onClick={onBack}
                    >
                        <span>←</span> Atpakaļ uz maniem īpašumiem
                    </button>

                    <div className="property-detail-actions">

                        {/*Rediģēt īpašumu */}
                        <button
                            type="button"
                            className="property-detail-edit"
                            onClick={() => setEditingProperty({ ...property })}
                        >
                            <Pencil size={16} strokeWidth={1.8} />
                            Rediģēt īpašumu
                        </button>
                    </div>

                    {/*Papildu darbības */}
                    <input
                        id={`detail-property-image-${property.property_id}`}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(event => {
                            const file = event.target.files?.[0];

                            if (file) {
                                handleImageUpload(file);
                            }

                            event.target.value = "";
                        })}
                    />
                    <div
                        className="property-detail-more-wrapper"
                        ref={moreMenuRef}>

                        <button
                            type="button"
                            className="property-detail-more"
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            aria-label="Papildu darbības"
                            aria-expanded={showMoreMenu}
                        >
                            <EllipsisVertical size={20} strokeWidth={2} />
                        </button>

                        {showMoreMenu && (
                            <div className="property-detail-dropdown">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMoreMenu(false);

                                        document
                                            .getElementById(
                                                `detail-property-image-${property.property_id}`
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
                                        onClick={handleDeleteImage}
                                    >
                                        <ImageOff size={17} strokeWidth={1.8} />
                                        <span>Dzēst bildi</span>
                                    </button>
                                )}

                                <div className="property-detail-dropdown-divider" />

                                <button
                                    type="button"
                                    className="property-detail-delete-option"
                                    onClick={() => {
                                        setShowMoreMenu(false);
                                        setDeleteError("");
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    <Trash2 size={17} strokeWidth={1.8} />
                                    <span>Dzēst īpašumu</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="property-detail-header-main">
                    {/*Īpašuma attēls*/}
                    <div className="property-detail-image">
                        {property.image_url ? (
                            <img
                                src={
                                    property.image_url.startsWith("http")
                                        ? property.image_url
                                        : `http://localhost:8000${property.image_url}`
                                }
                                alt={property.property_name || "Īpašuma attēls"}
                            />
                        ) : (
                            <House size={28} strokeWidth={1.5} />
                        )}
                    </div>

                    {/*Nosaukums un informācija */}
                    <div className="property-detail-heading">

                        <h1>{property.property_name || "Mans īpašums"}</h1>

                        <p>{property.address || "Adrese nav norādīta"}</p>

                        <div className="property-detail-info">

                            <div>
                                <span>Pirkuma cena</span>
                                <strong>{formatCurrency(purchasePrice)}</strong>
                            </div>

                            <div>
                                <span>Platība</span>
                                <strong>{area} m²</strong>
                            </div>

                            <div>
                                <span>Bruto ienesīgums</span>
                                <strong>
                                    {grossYield === null
                                        ? "—"
                                        : `${grossYield.toFixed(2)}%`}
                                </strong>
                            </div>

                        </div>

                    </div>

                    <div className="property-detail-badges">

                        <div className="property-detail-status">
                            <button
                                type="button"
                                className="property-detail-status-button"
                                onClick={() => setShowStatusMenu((previous) => !previous)}
                                aria-expanded={showStatusMenu}
                            >
                                <span>
                                    {property.status === "renovating"
                                        ? "Renovācijā"
                                        : property.status === "ready_to_rent"
                                            ? "Gatavs izīrēšanai"
                                            : property.status === "rented"
                                                ? "Izīrēts"
                                                : "Plānots"}
                                </span>

                                <ChevronDown
                                    className="property-detail-status-arrow"
                                    size={17}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />
                            </button>

                            {showStatusMenu && (
                                <div className="property-detail-status-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleStatusChange("planned");
                                            setShowStatusMenu(false);
                                        }}
                                    >
                                        Plānots
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleStatusChange("renovating");
                                            setShowStatusMenu(false);
                                        }}
                                    >
                                        Renovācijā
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleStatusChange("ready_to_rent");
                                            setShowStatusMenu(false);
                                        }}
                                    >
                                        Gatavs izīrēšanai
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleStatusChange("rented");
                                            setShowStatusMenu(false);
                                        }}
                                    >
                                        Izīrēts
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="property-detail-financing">
                            {property.financing_type === "mortgage" ? (
                                <>
                                    <Landmark size={17} strokeWidth={1.8} />
                                    <span>Ar hipotēku</span>
                                </>
                            ) : property.financing_type === "cash" ? (
                                <>
                                    <Wallet size={17} strokeWidth={1.8} />
                                    <span>Par saviem līdzekļiem</span>
                                </>
                            ) : null}
                        </div>
                    </div>

                </div>

                {/* Galvenā navigācija */}
                <div className="property-detail-tabs">

                    {!(activeTab === "diary" && showDiarySections) && (
                        <button
                            type="button"
                            className={activeTab === "analysis" ? "active" : ""}
                            onClick={() => setActiveTab("analysis")}
                        >
                            <Calculator size={17} strokeWidth={2} />
                            <span>Analīze</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className={
                            activeTab === "diary" &&
                                activeDiarySection === "calendar"
                                ? "active"
                                : ""}
                        onClick={() => {
                            const currentScrollY = window.scrollY;

                            if (activeTab !== "diary") {
                                setActiveTab("diary");
                                setActiveDiarySection("calendar");
                                setShowDiarySections(true);
                            } else if (showDiarySections) {
                                setActiveDiarySection("calendar");
                                setShowDiarySections(false);
                            } else {
                                setActiveDiarySection("calendar");
                                setShowDiarySections(true);
                            }

                            requestAnimationFrame(() => {
                                window.scrollTo(0, currentScrollY);
                            });
                        }}
                    >
                        <CalendarDays size={17} strokeWidth={2} />
                        <span>Dienasgrāmata</span>
                        <LockKeyhole size={14} className="property-tab-lock" />
                        <span className="pro-badge">PRO</span>
                    </button>

                    {activeTab === "diary" && showDiarySections && (
                        <>
                            <button
                                type="button"
                                className={activeDiarySection === "expenses" ? "active" : ""}
                                onClick={() => handleDiarySectionChange("expenses")}
                            >
                                <Receipt size={17} strokeWidth={2} />
                                <span>Izmaksas</span>
                            </button>

                            {property.financing_type === "mortgage" && (
                                <button
                                    type="button"
                                    className={activeDiarySection === "loan" ? "active" : ""}
                                    onClick={() => handleDiarySectionChange("loan")}
                                >
                                    <Landmark size={17} strokeWidth={2} />
                                    <span>Kredīts</span>
                                </button>
                            )}

                            <button
                                type="button"
                                className={activeDiarySection === "utilities" ? "active" : ""}
                                onClick={() => handleDiarySectionChange("utilities")}
                            >
                                <HousePlug size={17} strokeWidth={2} />
                                <span>Komunālie maksājumi</span>
                            </button>

                            <button
                                type="button"
                                className={activeDiarySection === "work" ? "active" : ""}
                                onClick={() => handleDiarySectionChange("work")}
                            >
                                <Hammer size={17} strokeWidth={2} />
                                <span>Darba dienas</span>
                            </button>

                            <button
                                type="button"
                                className={activeDiarySection === "rent" ? "active" : ""}
                                onClick={() => handleDiarySectionChange("rent")}
                            >
                                <Banknote size={17} strokeWidth={2} />
                                <span>Saņemtā īre</span>
                            </button>

                            <button
                                type="button"
                                className={activeDiarySection === "gallery" ? "active" : ""}
                                onClick={() => handleDiarySectionChange("gallery")}
                            >
                                <Images size={17} strokeWidth={2} />
                                <span>Galerija</span>
                            </button>

                            {/* Noslēdzošais dienasgrāmatas kopsavilkums. */}
                            <button type="button" className={activeDiarySection === "totals" ? "active" : ""}
                                onClick={() => handleDiarySectionChange("totals")}>
                                <ChartNoAxesCombined size={17} strokeWidth={2} />
                                <span>Kopā</span>
                            </button>
                        </>
                    )}

                    {!(activeTab === "diary" && showDiarySections) && (
                        <button
                            type="button"
                            className={activeTab === "advanced" ? "active" : ""}
                            onClick={() => setActiveTab("advanced")}
                        >
                            <ChartNoAxesCombined size={17} strokeWidth={2} />
                            <span>Padziļinātā analīze</span>
                            <LockKeyhole size={14} className="property-tab-lock" />
                            <span className="pro-badge">PRO</span>
                        </button>
                    )}
                </div>
            </div>

            {/*Sadaļu saturs */}

            <div
                className={`property-detail-content ${activeTab === "diary"
                    ? "property-detail-content-diary"
                    : ""
                    } ${activeTab === "diary" &&
                        ["expenses", "loan", "utilities", "work", "rent", "gallery", "totals"].includes(activeDiarySection)
                        ? "property-detail-content-expenses"
                        : ""
                    }`}
            >

                {activeTab === "analysis" && (
                    <FreeAnalysisOverview property={property} />
                )}

                {activeTab === "diary" && (
                    <PropertyDiary
                        property={property}
                        activeSection={activeDiarySection}
                        setActiveSection={setActiveDiarySection}
                    />
                )}

                {activeTab === "advanced" && (
                    <div>
                        <h2>Padziļinātā analīze</h2>
                        <p>
                            Šeit vēlāk pievienosim PRO investīciju analīzi.
                        </p>
                    </div>
                )}

            </div>

            <EditPropertyModal
                editingProperty={editingProperty}
                setEditingProperty={setEditingProperty}
                onClose={() => setEditingProperty(null)}
                onSave={handlePropertyUpdate}
            />

            {showDeleteModal && (
                <div
                    className="property-delete-overlay"
                    onClick={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isDeleting
                        ) {
                            setShowDeleteModal(false);
                            setDeleteError("");
                        }
                    }}
                >
                    <div
                        className="property-delete-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="property-delete-title"
                    >
                        <div className="property-delete-icon">
                            <Trash2 size={24} strokeWidth={1.8} />
                        </div>

                        <h2 id="property-delete-title">
                            Dzēst īpašumu?
                        </h2>

                        <p>
                            Vai tiešām vēlies dzēst īpašumu
                            <strong> {property.property_name}</strong>?
                        </p>

                        <p className="property-delete-warning">
                            Šo darbību nevarēs atsaukt.
                        </p>

                        {deleteError && (
                            <p className="property-delete-error" role="alert">
                                {deleteError}
                            </p>
                        )}

                        <div className="property-delete-actions">
                            <button
                                type="button"
                                className="property-delete-cancel"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Atcelt
                            </button>

                            <button
                                type="button"
                                className="property-delete-confirm"
                                onClick={handleDeleteProperty}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Dzēš..." : "Dzēst īpašumu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PropertyDetail;