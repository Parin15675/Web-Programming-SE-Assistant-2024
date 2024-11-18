import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'; // Import useSelector to access Redux store
import axios from 'axios';
import './CalendarNotification.css'; // Import the CSS file for styling

const CalendarNotification = () => {
    const [message, setMessage] = useState('');
    const [schedules, setSchedules] = useState([]);

    // Get profile (including Gmail) from Redux  
    const profile = useSelector((state) => state.profile);

    // Function to get today's date in the format 'YYYY-MM-DD'
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero
        const day = String(today.getDate()).padStart(2, '0'); // Add leading zero
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchSchedules = async () => {
            if (profile && profile.email) {  // Check if profile and Gmail are available
                try {
                    const response = await axios.get(`http://localhost:8000/get_schedules/${profile.email}`);
                    const fetchedSchedules = response.data;
                    const today = getCurrentDate();

                    console.log('Fetched Schedules:', fetchedSchedules[today]);  // Debug: Log fetched schedule for today

                    if (fetchedSchedules[today]) {
                        // Convert the object to an array of schedule events
                        const eventsArray = Object.values(fetchedSchedules[today]);

                        // Filter unique events by their title and details to avoid showing duplicates
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
                    <h1>{message}</h1>
                    {schedules && schedules.length > 0 ? (
                        <ul>
                            {/* Display each unique event */}
                            {schedules.map((event, index) => (
                                <li key={index}>
                                    <strong>{event.title}</strong> - {event.details}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <h1>No events for today.</h1>
                    )}
                </div>
            ) : (
                <div>
                    <h1>No events for today.</h1>
                </div>
            )}
        </div>
    );
};

export default CalendarNotification;
