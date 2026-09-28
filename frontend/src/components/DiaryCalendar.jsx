import { useState } from "react";
import "./DiaryCalendar.css";

function DiaryCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = new Intl.DateTimeFormat("lv-LV", {
        month: "long",
    }).format(currentDate);

    const calendarTitle =
        `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

    const firstDay = new Date(year, month, 1);

    // Pirmdiena = 0, Svētdiena =6
    const startingDay = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = [
        ...Array(startingDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    function changeMonth(direction) {
        setCurrentDate(new Date(year, month + direction, 1));
        setSelectedDate(null);
    }

    function selectDay(day) {
        if (!day) return;

        const date = new Date(year, month, day);

        const formattedDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
        ].join("-");

        setSelectedDate(formattedDate);
    }

    return (
        <div className="diary-calendar">

            <div className="diary-calendar-header">
                <h3>{calendarTitle}</h3>

                <div className="diary-calendar-controls">
                    <button
                        type="button"
                        onClick={() => changeMonth(-1)}>
                        ←
                    </button>

                    <button
                        type="button"
                        onClick={() => changeMonth(1)}>
                        →
                    </button>
                </div>
            </div>

            <div className="diary-calendar-grid">
                {["P", "O", "T", "C", "P", "S", "Sv"].map((day, index) => (
                    <div className="diary-calendar-weekday" key={index}>
                        {day}
                    </div>
                ))}

                {calendarDays.map((day, index) => {
                    const dateKey = day
                        ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        : null;

                    return day ? (
                        <button
                            key={dateKey}
                            type="button"
                            className={
                                selectedDate === dateKey
                                    ? "diary-calendar-day selected"
                                    : "diary-calendar-day"
                            }
                            onClick={() => selectDay(day)}
                        >
                            {day}
                        </button>
                    ) : (
                        <div key={`empty-${index}`} />
                    );
                })}
            </div>

            {selectedDate && (
                <div className="diary-selected-date">
                    <h4>
                        {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                            "lv-LV",
                            {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            }
                        )}
                    </h4>

                    <p>Šajā datumā pagaidām nav ierakstu.</p>

                    <button type="button" disabled>
                        + Pievienot ierakstu
                    </button>
                </div>
            )}
        </div>
    );
}

export default DiaryCalendar;