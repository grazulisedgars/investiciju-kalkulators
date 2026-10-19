import { useLayoutEffect, useRef } from "react";
import "./PropertyDiary.css";
import DiaryCalendar from "./DiaryCalendar";
import PropertyExpenses from "./PropertyExpenses";
import PropertyLoan from "./PropertyLoan";
import PropertyUtilities from "./PropertyUtilities";
import PropertyWork from "./PropertyWork";
import PropertyRent from "./PropertyRent";
import PropertyGallery from "./PropertyGallery";
import PropertyTotals from "./PropertyTotals";
import "./DiaryMobile.css";

// Ieslēgt, ja vēlāk nepieciešams atjaunot kopsavilkuma skatu.
const showDiaryTotals = false;

function PropertyDiary({
    property,
    activeSection,
    addEntryRequest,
    onAddEntryHandled,
}) {

    const diaryRef = useRef(null);
    useLayoutEffect(() => {
        const root = diaryRef.current;
        const measure = () => {
            const list = root.querySelector('.property-expenses-table-wrapper');
            if (list) {
                root.style.setProperty('--diary-list-top', `${Math.round(list.getBoundingClientRect().top + window.scrollY)}px`);
                const nav = document.querySelector('.property-bottom-nav');
                const total = root.querySelector('.property-expenses-total, .property-loan-summary');
                if (window.matchMedia('(max-width:600px)').matches && nav) {
                    const bottom = nav.getBoundingClientRect().top;
                    const reserve = total?.getClientRects().length ? total.getBoundingClientRect().height + 12 : 0;
                    const available = Math.max(80, Math.floor(bottom - list.getBoundingClientRect().top - reserve - 12));
                    root.style.setProperty('--diary-list-available', `${available}px`);
                }
            }
            const dayContent = root.querySelector('.diary-calendar-content');
            if (dayContent && dayContent.getClientRects().length) root.style.setProperty('--diary-day-content-top', `${Math.round(dayContent.getBoundingClientRect().top + window.scrollY)}px`);
            const dayList = root.querySelector('.diary-day-entries');
            if (dayList && dayList.getClientRects().length) root.style.setProperty('--diary-day-top', `${Math.round(dayList.getBoundingClientRect().top + window.scrollY)}px`);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(root);
        const picker = document.querySelector('.diary-section-picker');
        if (picker) observer.observe(picker);
        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, {passive:true});
        return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure); };
    }, [activeSection, property.property_id]);

    const sections = [
        { id: "calendar", label: "Dienasgrāmata" },
        { id: "expenses", label: "Izmaksas" },

        ...(property.financing_type === "mortgage"
            ? [{ id: "loan", label: "Kredīts" }]
            : []),

        { id: "utilities", label: "Komunālie maksājumi" },
        { id: "work", label: "Darba dienas" },
        { id: "rent", label: "Saņemtā īre" },
        { id: "gallery", label: "Galerija" },
        // Kopā sadaļa pagaidām paslēpta; komponentes kods saglabāts.
    ];

    const selectedSection = sections.find(
        (section) => section.id === activeSection
    );

    return (
        <div className="property-diary" ref={diaryRef}>

            <div className="property-diary-body">

                {activeSection === "calendar" && (
                    <DiaryCalendar property={property} addEntryRequest={addEntryRequest} onAddEntryHandled={onAddEntryHandled} />
                )}

                {activeSection === "expenses" && (
                    <PropertyExpenses
                        property={property}
                    />
                )}

                {activeSection === "loan" && (
                    <PropertyLoan
                        property={property}
                    />
                )}

                {activeSection === "utilities" && (
                    <PropertyUtilities
                        property={property}
                    />
                )}

                {/* Atsevišķā darba dienu sadaļa ar stundu uzskaiti. */}
                {activeSection === "work" && (
                    <PropertyWork key={property.property_id} property={property} />
                )}

                {/* Saņemtās īres sadaļa ar maksājumu sarakstu un kopsummu. */}
                {activeSection === "rent" && (
                    <PropertyRent key={property.property_id} property={property} />
                )}

                {/* Galerija ar kategorijām, foto augšupielādi un priekšskatījumu. */}
                {activeSection === "gallery" && (
                    <PropertyGallery key={property.property_id} property={property} />
                )}

                {/* Kopsavilkums izmanto tikai dienasgrāmatas datus. */}
                {showDiaryTotals && activeSection === "totals" && (
                    <PropertyTotals key={property.property_id} property={property} />
                )}

                {activeSection !== "calendar" &&
                    activeSection !== "expenses" &&
                    activeSection !== "loan" &&
                    activeSection !== "utilities" &&
                    activeSection !== "work" &&
                    activeSection !== "rent" &&
                    activeSection !== "gallery" &&
                    activeSection !== "totals" && (
                        <>
                            <h3>{selectedSection?.label}</h3>

                            <p>
                                Šeit izveidosim sadaļas funkcionalitāti.
                            </p>
                        </>
                    )}

            </div>

        </div>
    );
}

export default PropertyDiary;