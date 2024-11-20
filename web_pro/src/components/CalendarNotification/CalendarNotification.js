import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './CalendarNotification.css';

const CalendarNotification = () => {
    const [message, setMessage] = useState('');
    const [schedules, setSchedules] = useState([]);

    const profile = useSelector((state) => state.profile);

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchSchedules = async () => {
            if (profile && profile.email) {
                try {
                    const response = await axios.get(`http://localhost:8000/get_schedules/${profile.email}`);
                    const fetchedSchedules = response.data;
                    const today = getCurrentDate();

                    console.log('Fetched Schedules:', fetchedSchedules[today]);

                    if (fetchedSchedules[today]) {
                        const eventsArray = Object.values(fetchedSchedules[today]);

                        const uniqueEvents = eventsArray.filter((event, index, self) =>
                            index === self.findIndex((e) => (
                                e.title === event.title && e.details === event.details
                            ))
                        );

                        setSchedules(uniqueEvents);
                        setMessage('You have events for today.');
                    } else {
                        setMessage('No events for today.');
                    }
                } catch (error) {
                    console.error("Error fetching schedules:", error);
                    setMessage("Error fetching events.");
                }
            } else {
                setMessage("Invalid date or email.");
            }
        };

        fetchSchedules();
    }, [profile]);

    return (
        <div className="calendar-notification-box">
            {message ? (
                <div>
                    {schedules && schedules.length > 0 ? (
                        <ul>
                            {schedules.map((event, index) => (
                                <a href="/schedule">
                                <li key={index} className="flex items-center space-x-2 cursor-pointer p-2 rounded">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-yellow-500 flex-shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V11a6.002 6.002 0 00-5-5.917V4a2 2 0 10-4 0v1.083A6.002 6.002 0 004 11v3c0 .417-.152.816-.405 1.116L2 17h5m5 0a3.001 3.001 0 01-6 0m6 0H9"
                                        />
                                    </svg>
                                    <span>
                                        <strong>{event.title}</strong> - {event.details}
                                    </span>
                                </li>
                            </a>
                            
                            ))}
                        </ul>
                    ) : (
                        <h1>No events for today</h1>
                    )}
                </div>
            ) : (
                <div>
                    <h1>No events for today</h1>
                </div>
            )}
        </div>
    );
};

export default CalendarNotification;
