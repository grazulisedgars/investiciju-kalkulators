import { useState } from "react";
import "./PropertyDiary.css";
import DiaryCalendar from "./DiaryCalendar";
import PropertyExpenses from "./PropertyExpenses";

function PropertyDiary({
    property,
    activeSection,
    setActiveSection,
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

                {activeSection !== "calendar" &&
                    activeSection !== "expenses" && (
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