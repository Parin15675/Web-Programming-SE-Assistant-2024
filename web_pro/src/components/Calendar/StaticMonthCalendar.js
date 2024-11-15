import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Calendar.css";
import { Link } from "react-router-dom";

const resetTimeToMidnight = (date) => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const days = [];
    for (let i = 0; i < startOfMonth.getDay(); i++) {
        days.push(null);
    }

    for (let day = 1; day <= endOfMonth.getDate(); day++) {
        days.push(new Date(year, month, day));
    }

    return days;
};

const formatDate = (date) => {
    return date.toISOString().split("T")[0];
};

const StaticMonthCalendar = ({ linkTo = "/details", email }) => {
    const currentDate = resetTimeToMidnight(new Date());
    const currentMonthDays = getMonthDays(currentDate);
    const [events, setEvents] = useState({}); // State to store events

    useEffect(() => {
        if (email) {
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
                <div className="calendar-header-static">
                    <div className="month-tab">
                        {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                </div>

                <div className="calendar-header-month">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <div key={index} className="calendar-header-day">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="calendar-body-month">
                    {currentMonthDays.map((day, index) => (
                        <div key={index} className="calendar-day-month-static">
                            {day ? (
                                <div className="calendar-day-number">
                                    {day.getDate()}
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
