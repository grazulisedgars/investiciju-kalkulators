import "./PropertyDiary.css";
import DiaryCalendar from "./DiaryCalendar";
import PropertyExpenses from "./PropertyExpenses";
import PropertyLoan from "./PropertyLoan";
import PropertyUtilities from "./PropertyUtilities";
import PropertyWork from "./PropertyWork";
import PropertyRent from "./PropertyRent";
import PropertyGallery from "./PropertyGallery";
import PropertyTotals from "./PropertyTotals";

function PropertyDiary({
    property,
    activeSection,
}) {

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
        { id: "totals", label: "Kopā" },
    ];

    const selectedSection = sections.find(
        (section) => section.id === activeSection
    );

    return (
        <div className="property-diary">

            <div className="property-diary-body">

                {activeSection === "calendar" && (
                    <DiaryCalendar property={property} />
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
                {activeSection === "totals" && (
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