import { propertyGrossYield } from "./propertyYield";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import "./PropertyDetail.css";
import FreeAnalysisOverview from "./FreeAnalysisOverview";
import PropertyDiary from "./PropertyDiary";
import AdvancedAnalysis from "./AdvancedAnalysis";
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
    Check,
    X,
    Building2,
    CirclePlus,
    CircleHelp,
} from "lucide-react";
import ProFeatureGate from "./ProFeatureGate";
import EditPropertyModal from "./EditPropertyModal";

function PropertyDetail({ property, onBack, onPropertyUpdated, user, onOpenPlans, onAddProperty, onMobileNavigate, initialTab="analysis" }) {
    const isPro=user?.plan==="pro";
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width:600px)').matches);
    useEffect(() => {
        const media = window.matchMedia('(max-width:600px)');
        const update = () => setIsMobile(media.matches);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    // Reset after the property view mounts; do not retain the dashboard's scroll.
    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [property?.property_id]);

    const [activeTab, setActiveTab] = useState(initialTab);
    const [advancedMetric, setAdvancedMetric] = useState(null);
    const receiveAnalysis = useCallback(data => {
        setAdvancedMetric({ propertyId: property.property_id, value: data?.results?.gross_yield ?? null });
    }, [property.property_id]);
    useEffect(() => {
        if (!isPro) return;
        const controller = new AbortController();
        fetch(`http://localhost:8000/properties/${property.property_id}/advanced-analysis`, { credentials: "include", signal: controller.signal })
            .then(async response => {
                if (response.ok) receiveAnalysis(await response.json());
            }).catch(error => { if (error.name !== "AbortError") console.error("Yield load error", error); });
        return () => controller.abort();
    }, [property.property_id, isPro, activeTab, receiveAnalysis]);
    const [activeDiarySection, setActiveDiarySection] = useState("calendar");
    const [showDiarySections, setShowDiarySections] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const tabsRef = useRef(null);
    useEffect(() => {
        if (!window.matchMedia('(max-width:600px)').matches) return;
        const tabs = tabsRef.current;
        const active = tabs?.querySelector('button.active');
        if (tabs && active) {
            const left = active.offsetLeft - tabs.offsetLeft;
            if (left < tabs.scrollLeft || left + active.offsetWidth > tabs.scrollLeft + tabs.clientWidth)
                tabs.scrollTo({left:Math.max(0,left - (tabs.clientWidth-active.offsetWidth)/2),behavior:'instant'});
        }
    }, [activeTab, activeDiarySection, showDiarySections]);
    const [propertyAddDialog, setPropertyAddDialog] = useState(null);
    const propertyAddDialogRef = useRef(null);
    useEffect(() => {
        if (!propertyAddDialog) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const dialog = propertyAddDialogRef.current;
        dialog.showModal();
        return () => { dialog.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
    }, [propertyAddDialog]);
    async function openPropertyAdd() {
        setPropertyAddDialog('loading');
        try {
            if (isPro) { setPropertyAddDialog('funding'); return; }
            const response = await fetch('http://localhost:8000/properties', {credentials:'include'});
            if (!response.ok) throw new Error('Property load failed');
            const properties = await response.json();
            setPropertyAddDialog(properties.length >= 3 ? 'limit' : 'funding');
        } catch { setPropertyAddDialog('error'); }
    }
    const [diaryPickerOpen, setDiaryPickerOpen] = useState(false);
    const [diaryPickerHidden, setDiaryPickerHidden] = useState(false);
    useEffect(() => {
        setDiaryPickerHidden(false);
        if (!isMobile || activeTab !== 'diary' || activeDiarySection === 'calendar') return;
        let distance = 0;
        let touchY = null;
        const reactToGesture = (delta, target) => {
            if (!(target instanceof Element) || !target.closest('.property-detail') ||
                target.closest('.diary-section-picker, [role="dialog"], [role="alertdialog"], .diary-modal-overlay, .gallery-overlay')) return;
            if (Math.sign(distance) !== Math.sign(delta)) distance = 0;
            distance += delta;
            if (Math.abs(distance) < 24) return;
            const hidden = distance > 0;
            distance = 0;
            setDiaryPickerHidden(hidden);
            if (hidden) setDiaryPickerOpen(false);
        };
        const onWheel = event => reactToGesture(event.deltaY, event.target);
        const onTouchStart = event => { touchY = event.touches[0]?.clientY ?? null; distance = 0; };
        const onTouchMove = event => {
            const y = event.touches[0]?.clientY;
            if (touchY !== null && y !== undefined) reactToGesture(touchY - y, event.target);
            touchY = y ?? null;
        };
        const onKey = event => {
            if (event.target instanceof Element && event.target.closest('input, textarea, select, [role="menu"]')) return;
            if (['ArrowUp','PageUp','Home'].includes(event.key)) { setDiaryPickerHidden(false); distance = 0; }
            if (['ArrowDown','PageDown','End'].includes(event.key)) { setDiaryPickerHidden(true); setDiaryPickerOpen(false); }
        };
        document.addEventListener('wheel', onWheel, {passive:true});
        document.addEventListener('touchstart', onTouchStart, {passive:true});
        document.addEventListener('touchmove', onTouchMove, {passive:true});
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('wheel', onWheel);
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('keydown', onKey);
        };
    }, [isMobile, activeTab, activeDiarySection]);
    const diaryPickerRef = useRef(null);
    const diaryPickerTriggerRef = useRef(null);
    const diarySections = [
        {id:'calendar',label:'Kalendārs',Icon:CalendarDays},
        {id:'expenses',label:'Izmaksas',Icon:Receipt},
        ...(property.financing_type === 'mortgage' ? [{id:'loan',label:'Kredīta maksājumi',Icon:Landmark}] : []),
        {id:'utilities',label:'Komunālie maksājumi',Icon:HousePlug},
        {id:'work',label:'Darba dienas',Icon:Hammer},
        {id:'rent',label:'Saņemtā īre',Icon:Banknote},
        {id:'gallery',label:'Galerija',Icon:Images},
    ];
    const selectedDiarySection = diarySections.find(item => item.id === activeDiarySection) || diarySections[0];
    const DiarySectionIcon = selectedDiarySection.Icon;
    useEffect(() => {
        if (!diaryPickerOpen) return;
        const closeOutside = event => { if (!diaryPickerRef.current?.contains(event.target)) setDiaryPickerOpen(false); };
        diaryPickerRef.current?.querySelector('[aria-checked="true"]')?.focus();
        document.addEventListener('pointerdown', closeOutside);
        return () => document.removeEventListener('pointerdown', closeOutside);
    }, [diaryPickerOpen]);
    useEffect(() => { setDiaryPickerOpen(false); }, [activeTab, isMobile]);
    const moreMenuRef = useRef(null);
    const statusMenuRef = useRef(null);

    useEffect(() => {
        if (!showStatusMenu) return;
        function closeOutside(event) {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
                setShowStatusMenu(false);
            }
        }
        function closeOnEscape(event) {
            if (event.key === "Escape") setShowStatusMenu(false);
        }
        document.addEventListener("pointerdown", closeOutside);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOutside);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [showStatusMenu]);

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
    const grossYield = propertyGrossYield({ ...property, advanced_gross_yield:
        advancedMetric?.propertyId === property.property_id ? advancedMetric.value : property.advanced_gross_yield,
    }, isPro);

    return (
        <div className="property-detail">
            <nav className="property-bottom-nav" aria-label="Mobilā navigācija">
                <button type="button" onClick={() => onMobileNavigate('home')}><House size={21}/><span>Sākums</span></button>
                <button type="button" aria-current="page" onClick={() => onMobileNavigate('properties')}><Building2 size={21}/><span>Īpašumi</span></button>
                <button type="button" onClick={openPropertyAdd}><CirclePlus size={21}/><span>Pievienot</span></button>
                <button type="button" onClick={() => onMobileNavigate('faq')}><CircleHelp size={21}/><span>FAQ</span></button>
            </nav>

            {propertyAddDialog && <dialog ref={propertyAddDialogRef} className="add-property-modal"
                style={{position:'fixed',inset:'auto 0 0',margin:'0 auto',border:'1px solid #dce7e1',maxWidth:'100%',width:'100%',boxSizing:'border-box',boxShadow:'0 0 0 100vmax rgb(0 0 0 / 42%)'}}
                aria-labelledby="property-add-title" onCancel={() => setPropertyAddDialog(null)}>
                <h2 id="property-add-title">{propertyAddDialog === 'limit' ? 'Tu izmanto bezmaksas plānu' : 'Pievienot īpašumu'}</h2>
                {propertyAddDialog === 'loading' && <p>Ielādē...</p>}
                {propertyAddDialog === 'error' && <p role="alert">Neizdevās ielādēt īpašumus. Lūdzu, mēģini vēlreiz.</p>}
                {propertyAddDialog === 'limit' && <><p>Sasniegts 3 īpašumu limits. Lai pievienotu vairāk īpašumu, apskati PRO plānu.</p><button type="button" className="property-expenses-add" onClick={() => {setPropertyAddDialog(null);onOpenPlans('diary');}}>Apskatīt PRO plānu</button></>}
                {propertyAddDialog === 'funding' && <><p>Kā plāno finansēt šo investīciju?</p><div className="add-property-options">
                    <button type="button" className="add-property-option" onClick={() => {setPropertyAddDialog(null);onAddProperty('cash');}}><span className="add-property-option-icon"><Wallet size={24}/></span><div className="add-property-option-copy"><strong>Par saviem līdzekļiem</strong><span>Īpašums tiek iegādāts bez hipotekārā kredīta.</span></div></button>
                    <button type="button" className="add-property-option" onClick={() => {setPropertyAddDialog(null);onAddProperty('mortgage');}}><span className="add-property-option-icon"><Landmark size={24}/></span><div className="add-property-option-copy"><strong>Ar hipotēku</strong><span>Daļa no pirkuma tiek finansēta ar bankas kredītu.</span></div></button>
                </div></>}
                <button type="button" className="add-property-cancel-button" aria-label="Aizvērt pievienošanas izvēli" onClick={() => setPropertyAddDialog(null)}><X className="add-property-close-icon" size={20}/><span className="add-property-cancel-label">Atcelt</span></button>
            </dialog>}
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
                        <span>←</span><span className="property-back-label-desktop">Atpakaļ uz maniem īpašumiem</span><span className="property-back-label-mobile">Atpakaļ</span>
                    </button>

                    <div className="property-detail-actions">

                        {/*Rediģēt īpašumu */}
                        <button
                            type="button"
                            className="property-detail-edit"
                            aria-label="Rediģēt īpašumu"
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
                                <button type="button" className="property-mobile-menu-edit" onClick={()=>{setShowMoreMenu(false);setEditingProperty({...property});}}>
                                    <Pencil size={17}/><span>Rediģēt īpašumu</span>
                                </button>

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
                                        : `${grossYield.toFixed(1)}%`}
                                </strong>
                            </div>

                        </div>

                    </div>

                    <div className="property-detail-badges">

                        <div className="property-detail-status" ref={statusMenuRef}>
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
                <div className="property-detail-tabs" ref={tabsRef}>

                    {!(isPro && activeTab === "diary" && showDiarySections && !isMobile) && (
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
                                (isMobile || activeDiarySection === "calendar")
                                ? "active"
                                : ""}
                        onClick={() => {
                            const currentScrollY = window.scrollY;
                            if (isMobile) { setActiveTab("diary"); return; }

                            if (!isPro) {
                                setActiveTab("diary");setShowDiarySections(false);return;
                            }
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
                        {!isPro && <span className="property-tab-premium"><LockKeyhole size={14} className="property-tab-lock" /><span className="pro-badge">PRO</span></span>}
                    </button>

                    {isPro && activeTab === "diary" && showDiarySections && !isMobile && (
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

                            {/* Kopā sadaļa paslēpta; saglabāta PropertyTotals komponentē. */}
                        </>
                    )}

                    {!(isPro && activeTab === "diary" && showDiarySections && !isMobile) && (
                        <button
                            type="button"
                            className={activeTab === "advanced" ? "active" : ""}
                            onClick={() => setActiveTab("advanced")}
                        >
                            <ChartNoAxesCombined size={17} strokeWidth={2} />
                            <span>Padziļinātā analīze</span>
                            {!isPro && <span className="property-tab-premium"><LockKeyhole size={14} className="property-tab-lock" /><span className="pro-badge">PRO</span></span>}
                        </button>
                    )}
                </div>
            </div>

            {isMobile && isPro && activeTab === "diary" && (
                <div className={`diary-section-picker ${diaryPickerHidden ? "is-scroll-hidden" : ""}`} ref={diaryPickerRef}>
                    <span id="mobile-diary-section-label">Sadaļa</span>
                    <div className="diary-section-picker-control">
                        <button type="button" ref={diaryPickerTriggerRef} className="diary-section-trigger"
                            aria-haspopup="menu" aria-expanded={diaryPickerOpen} aria-controls={diaryPickerOpen ? 'mobile-diary-section-menu' : undefined}
                            aria-labelledby="mobile-diary-section-label mobile-diary-section-value"
                            onClick={() => setDiaryPickerOpen(open => !open)}
                            onKeyDown={event => { if (['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); setDiaryPickerOpen(true); } }}>
                            <DiarySectionIcon size={17} aria-hidden="true"/><span id="mobile-diary-section-value">{selectedDiarySection.label}</span>
                            <ChevronDown size={16} className={diaryPickerOpen ? 'is-open' : ''} aria-hidden="true"/>
                        </button>
                        {diaryPickerOpen && <div id="mobile-diary-section-menu" className="diary-section-options" role="menu" aria-labelledby="mobile-diary-section-label"
                            onKeyDown={event => {
                                const items = [...event.currentTarget.querySelectorAll('[role="menuitemradio"]')];
                                const index = items.indexOf(document.activeElement);
                                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setDiaryPickerOpen(false); diaryPickerTriggerRef.current?.focus(); }
                                if (event.key === 'Tab') setDiaryPickerOpen(false);
                                if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
                                    event.preventDefault();
                                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
                                    items[next]?.focus();
                                }
                            }}>
                            {diarySections.map(({id,label,Icon}) => <button key={id} type="button" role="menuitemradio" aria-checked={activeDiarySection === id}
                                onClick={() => { handleDiarySectionChange(id); setDiaryPickerOpen(false); diaryPickerTriggerRef.current?.focus(); }}>
                                <Icon size={17} aria-hidden="true"/><span>{label}</span>{activeDiarySection === id && <Check size={16} aria-hidden="true"/>}
                            </button>)}
                        </div>}
                    </div>
                </div>
            )}
            {/*Sadaļu saturs */}

            <div
                className={`property-detail-content ${activeTab === "diary" || (activeTab === "advanced" && !isPro)
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

                {activeTab === "diary" && !isPro && <ProFeatureGate feature="diary" onOpenPlans={onOpenPlans}/>}
                {activeTab === "diary" && isPro && (
                    <PropertyDiary
                        property={property}
                        activeSection={activeDiarySection}
                        setActiveSection={setActiveDiarySection}
                    />
                )}

                {activeTab === "advanced" && !isPro && <ProFeatureGate feature="advanced" onOpenPlans={onOpenPlans}/>}
                {activeTab === "advanced" && isPro && (
                    <AdvancedAnalysis key={property.property_id} property={property} onAnalysisChanged={receiveAnalysis} />
                )}

            </div>

            {activeTab === "analysis" && <div className="property-mobile-actions">
                <button type="button" onClick={()=>setEditingProperty({...property})}><Pencil size={18}/>Rediģēt</button>
                <button type="button" onClick={()=>{setDeleteError("");setShowDeleteModal(true);}}><Trash2 size={18}/>Dzēst</button>
            </div>}

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
