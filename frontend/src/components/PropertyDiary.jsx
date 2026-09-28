import { useState } from "react";
import "./PropertyDiary.css";
import PropertyCalendar from "./DiaryCalendar";
import DiaryCalendar from "./DiaryCalendar";

function PropertyDiary({ property }) {
    const [activeSection, setActiveSection] = useState("calendar");

    const sections = [
        { id: "calendar", label: "Dienasgrāmata" },
        { id: "expenses", label: "Izmaksas" },

        ...(property.financing_type === "mortgage"
            ? [{ id: "loan", label: "Kredīts" }]
            : []),

        { id: "utilities", label: "Komunālie maksājumi" },
        { id: "work", label: "Darba dienas" },
        { id: "gallery", labe: "Galerija" },
    ];

    const selectedSection = sections.find(
        (section) => section.id === activeSection
    );

    return (
        <div className="property-diary">

            <div className="property-diary-heading">
                <h2>Īpašuma dienasgrāmata</h2>

                <p>
                    Pārvaldi īpašuma izmaksas, paveiktos darbus
                    un renovācijas vēsturi.
                </p>
            </div>

            <div className="property-diary-navigation">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        className={
                            activeSection === section.id ? "active" : ""
                        }
                        onClick={() => setActiveSection(section.id)}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            <div className="property-diary-body">

                {activeSection === "calendar" ? (
                    <DiaryCalendar />
                ) : (
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