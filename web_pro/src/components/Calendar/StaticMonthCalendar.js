import React, { useState, useEffect } from "react"; // React hooks
import axios from "axios"; // Axios for API requests
import "./Calendar.css";
import { Link } from "react-router-dom"; // For navigation

// Helper function to reset the time of a Date object to midnight
const resetTimeToMidnight = (date) => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

// Helper function to get all days of the current month
const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const days = [];
    for (let i = 0; i < startOfMonth.getDay(); i++) {
        days.push(null); // Fill in empty days at the start
    }

    for (let day = 1; day <= endOfMonth.getDate(); day++) {
        days.push(new Date(year, month, day));
    }

    return days;
};

// Helper function to format a date as YYYY-MM-DD
const formatDate = (date) => {
    return date.toISOString().split("T")[0];
};

const StaticMonthCalendar = ({ linkTo = "/details", email }) => {
    const currentDate = resetTimeToMidnight(new Date()); // Current date reset to midnight
    const currentMonthDays = getMonthDays(currentDate); // Get all days in the current month
    const [events, setEvents] = useState({}); // State to store events

    useEffect(() => {
        if (email) {
            // Fetch schedules for the user based on email
            axios
                .get(`http://localhost:8000/get_schedules/${email}`)
                .then((response) => {
                    setEvents(response.data || {});
                })
                .catch((error) => {
                    console.error("Error fetching events:", error);
                });
        }
    }, [email]);

    return (
        <Link to={linkTo} className="calendar-link">
            <div className="calendar">
                {/* Month and Year Header */}
                <div className="calendar-header-static">
                    <div className="month-tab">
                        {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                </div>

                {/* Weekday Headers */}
                <div className="calendar-header-month">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <div key={index} className="calendar-header-day">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days of the Month */}
                <div className="calendar-body-month">
                    {currentMonthDays.map((day, index) => (
                        <div key={index} className="calendar-day-month-static">
                            {day ? (
                                <div className="calendar-day-number">
                                    {day.getDate()}
                                    {/* Events for this day */}
                                    <div className="calendar-day-events">
                                        {events[formatDate(day)] &&
                                            Object.values(events[formatDate(day)]).map(
                                                (event, eventIndex) => (
                                                    <div
                                                        key={eventIndex}
                                                        className="calendar-event"
                                                        style={{
                                                            backgroundColor: event.color,
                                                            fontSize: "6px",
                                                            margin: "1px 0",
                                                            padding: "1px",
                                                            borderRadius: "3px",
                                                        }}
                                                    >
                                                        {event.title}
                                                    </div>
                                                )
                                            )}
                                    </div>
                                </div>
                            ) : (
                                ""
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Link>
    );
};

export default StaticMonthCalendar;
