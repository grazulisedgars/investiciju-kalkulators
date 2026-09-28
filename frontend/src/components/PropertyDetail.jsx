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
} from "lucide-react";
import EditPropertyModal from "./EditPropertyModal";

function PropertyDetail({ property, onBack, onPropertyUpdated }) {
    const [activeTab, setActiveTab] = useState("analysis");
    const [editingProperty, setEditingProperty] = useState(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

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
                    area: Number(updatedProperty.area),
                    market_value:
                        updatedProperty.market_value === "" ||
                            updatedProperty.market_value == null
                            ? null
                            : Number(updatedProperty.market_value),
                    renovation_cost_per_m2: Number(
                        updatedProperty.renovation_cost_per_m2
                    ),
                    monthly_rent: Number(updatedProperty.monthly_rent),
                    occupancy: Number(updatedProperty.occupancy),
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

    if (!property) return null;

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

    const monthlyRent = Number(property.monthly_rent || 0);
    const occupancy = Number(property.occupancy ?? 100);

    const annualRent = monthlyRent * 12 * (occupancy / 100);
    const totalInvestment = purchasePrice + renovationTotal;

    const grossYield =
        totalInvestment > 0
            ? (annualRent / totalInvestment) * 100
            : 0;

    return (
        <div className="property-detail">

            {/* Īpašuma galvene */}
            <div className="property-detail-header">

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

                                <button type="button">
                                    <ImagePlus size={17} strokeWidth={1.8} />
                                    <span>Mainīt bildi</span>
                                </button>

                                {property.image_url && (
                                    <button type="button">
                                        <ImageOff size={17} strokeWidth={1.8} />
                                        <span>Dzēst bildi</span>
                                    </button>
                                )}

                                <div className="property-detail-dropdown-divider" />

                                <button
                                    type="button"
                                    className="property-detail-delete-option"
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
                            <span>⌂</span>
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
                                <strong>{grossYield.toFixed(2)}%</strong>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* Galvenā navigācija */}
            <div className="property-detail-tabs">

                <button
                    type="button"
                    className={activeTab === "analysis" ? "active" : ""}
                    onClick={() => setActiveTab("analysis")}
                >
                    <Calculator size={17} strokeWidth={2} />
                    <span>Analīze</span>
                </button>

                <button
                    type="button"
                    className={activeTab === "diary" ? "active" : ""}
                    onClick={() => setActiveTab("diary")}
                >
                    <CalendarDays size={17} strokeWidth={2} />
                    <span>Dienasgrāmata</span>
                    <LockKeyhole size={14} className="property-tab-lock" />
                    <span className="pro-badge">PRO</span>
                </button>

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

            </div>

            {/*Sadaļu saturs */}

            <div className="property-detail-content">

                {activeTab === "analysis" && (
                    <FreeAnalysisOverview property={property} />
                )}

                {activeTab === "diary" && (
                    <PropertyDiary property={property} />
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
        </div>
    );
}

export default PropertyDetail;