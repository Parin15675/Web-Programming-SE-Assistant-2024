import React, { useState, useEffect } from 'react';
import './Calendar.css';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Helper function to reset the time of a Date object to midnight
const resetTimeToMidnight = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0); // Set time to 00:00:00
    return newDate;
};


const Calendar = ({ onSelectSlot = () => {}, videoTitle = null, videoDuration = null , videoId = null}) => {

    const profile = useSelector(state => state.profile);

    const [currentDate, setCurrentDate] = useState(resetTimeToMidnight(new Date()));
    const [view, setView] = useState('week');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [title, setTitle] = useState(videoTitle || "");
    const [details, setDetails] = useState("");
    const [color, setColor] = useState("#e81416");
    const [schedules, setSchedules] = useState({}); // Store schedules in an object
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [youtubeVideoId, setYoutubeVideoId] = useState(videoId || null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false); // State for the video modal


    // Auto-calculate endTime if videoDuration is provided
    useEffect(() => {
        if (videoDuration && startTime && startTime.minute !== undefined) {
            const calculatedEndTime = startTime.minute + Math.floor(videoDuration); // Ensure videoDuration is in minutes
            setEndTime({ minute: calculatedEndTime });
        }
    }, [videoDuration, startTime]); 

    // Load schedules from local storage when component mounts
    useEffect(() => {
        const storedSchedules = localStorage.getItem('calendarSchedules');
        if (storedSchedules) {
            setSchedules(JSON.parse(storedSchedules));
        }
    }, []);

    useEffect(() => {
        if (profile && profile.email) {
            // Fetch the schedules for the logged-in user
            axios.get(`http://localhost:8000/get_schedules/${profile.email}`)
                .then(response => {
                    setSchedules(response.data);  // Load schedules from the server
                })
                .catch(error => {
                    console.error('Error fetching schedules:', error);
                });
        }
    }, [profile]);
    

    // Helper function to format date as YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    // Helper function to get the week for the current date
    const getCurrentWeek = (currentDate) => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const week = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            week.push(day);
        }
        return week;
    };

    // Helper function to get days in a specific month
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

    const currentMonth = getMonthDays(currentDate);
    const currentWeek = getCurrentWeek(currentDate);

    // Handle when a time slot is clicked
    const handleSlotClick = (minute, day) => {
        const dayKey = formatDate(day);
        const event = schedules[dayKey]?.[minute]; 

        if(event){
            setTitle(event.title);
            setDetails(event.details);
            setColor(event.color);
            setStartTime({ minute: event.startMinute, day });
            setEndTime({ minute: event.endMinute });
            setSelectedSlot({ startMinute: event.startMinute, endMinute: event.endMinute, day });
            setYoutubeVideoId(event.youtubeVideoId || null);
            
            if (event.youtubeVideoId) {
                setIsVideoModalOpen(true);  // Open video modal if there is a YouTube video
            } else {
                setIsModalOpen(true);  // Open the normal modal directly if there's no video
            }
        }
        else{
            if (!startTime) {
                // Set start time if it's not set yet
                setStartTime({ minute, day });
                setColor('#e81416');
            } else if (videoDuration) {
                // Calculate end time based on the duration and start time
                const calculatedEndTime = minute + Math.floor(videoDuration);  // Make sure we're adding in minutes
                setEndTime({ minute: calculatedEndTime });
                setSelectedSlot({ startMinute: minute, endMinute: calculatedEndTime, day });
                setColor('#e81416');
                setYoutubeVideoId(videoId);
                setIsModalOpen(true);

            } else if (!endTime) {
                // For non-video scheduling
                const nextHourMinute = Math.ceil(minute / 60) * 60; // Round to the next hour
                setEndTime({ minute: nextHourMinute });
                setSelectedSlot({ startMinute: startTime.minute, endMinute: minute, day });
                setColor('#e81416');
                setYoutubeVideoId(videoId);
                setIsModalOpen(true);
            }
        }
        
    };
    

    const handleSaveSchedule = () => {
        const dayKey = formatDate(selectedSlot?.day || currentDate);
        const newSchedules = { ...schedules };
    
        const startMinute = startTime?.minute || 0;
        const endMinute = endTime?.minute || startMinute;
    
        for (let i = startMinute; i <= endMinute; i++) {
            if (!newSchedules[dayKey]) {
                newSchedules[dayKey] = {};
            }
            newSchedules[dayKey][i] = {
                title: title,
                details,
                color,
                startMinute,
                endMinute,
                youtubeVideoId,
            };
        }
    
        setSchedules(newSchedules);
    
        // Save to backend
        axios.post('http://localhost:8000/save_schedules/', {
            gmail: profile.email,
            schedules: newSchedules
        })
        .then(response => {
            console.log("Schedules saved successfully!");
        })
        .catch(error => {
            console.error("Error saving schedules:", error);
        });
    
        setIsModalOpen(false);
        resetForm();
    };
    

    const handleDeleteSchedule = () => {
        const dayKey = formatDate(selectedSlot.day);
        const newSchedules = { ...schedules };

        const startMinute = startTime.minute;
        const endMinute = endTime.minute;

        // Remove the schedule from the selected minutes
        for (let i = startMinute; i <= endMinute; i++) {
            if (newSchedules[dayKey]) {
                delete newSchedules[dayKey][i];
            }
        }

        // If the day has no more events, delete the day entry
        if (Object.keys(newSchedules[dayKey]).length === 0) {
            delete newSchedules[dayKey];
        }

        setSchedules(newSchedules);
        localStorage.setItem('calendarSchedules', JSON.stringify(newSchedules)); // Update local storage
        setIsModalOpen(false);
        setStartTime(null);
        setEndTime(null);
        setTitle("");
        setDetails("");
        setColor("#e81416"); // Reset to default color
    };

    const clearAllSchedules = () => {
        localStorage.removeItem('calendarSchedules'); // Remove from localStorage
        setSchedules({}); // Clear schedules from state
    };

    const getDaySchedules = (day) => {
        const dayKey = formatDate(day);
        const events = schedules[dayKey] || {}; // Get all events for the day
        const uniqueEvents = [];

        let seenTitles = new Set(); // Track titles we've already displayed

        // Loop through all the minutes of the day, only taking the first event for each title
        Object.keys(events).forEach((minuteKey) => {
            const event = events[minuteKey];
            if (!seenTitles.has(event.title)) {
                uniqueEvents.push(event);
                seenTitles.add(event.title); // Mark this event as seen
            }
        });

        return uniqueEvents;
    };

    const prevPeriod = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(currentDate.getDate() - 1);
        } else if (view === 'week') {
            newDate.setDate(currentDate.getDate() - 7);
        } else if (view === 'month') {
            newDate.setMonth(currentDate.getMonth() - 1);
        }
        setCurrentDate(resetTimeToMidnight(newDate));
    };

    const nextPeriod = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(currentDate.getDate() + 1);
        } else if (view === 'week') {
            newDate.setDate(currentDate.getDate() + 7);
        } else if (view === 'month') {
            newDate.setMonth(currentDate.getMonth() + 1);
        }
        setCurrentDate(resetTimeToMidnight(newDate));
    };

    const getSchedule = (day, minute) => {
        const dayKey = formatDate(day);
        return schedules[dayKey]?.[minute] || {}; // Access the minute's schedule
    };

    const resetForm = () => {
        setTitle("");       // Reset title
        setDetails("");     // Reset details
        setColor("#e81416"); // Reset color
        setStartTime(null); // Reset start time
        setEndTime(null);   // Reset end time
    };
    

    const onModalClose = () => {
        setIsModalOpen(false);

        // Reset modal state when closing
        setStartTime(null);
        setEndTime(null);
        setTitle("");
        setDetails("");
        setColor("#e81416"); // Reset to default color
    };

    const onVideoModalClose = () => {
        setIsVideoModalOpen(false);
        // Reset video-related state if necessary, or keep the values to carry into the normal modal
        setIsModalOpen(false);
        setStartTime(null);
        setEndTime(null);
        setTitle("");
        setDetails("");
        setColor("#e81416"); // Reset to default color
    };
    

    return (
        <div className="calendar">
            <div className="calendar-controls">
                <div className="view-buttons">
                    <button onClick={() => setView('day')}>Day</button>
                    <button onClick={() => setView('week')}>Week</button>
                    <button onClick={() => setView('month')}>Month</button>
                </div>
                <button style={{ width: '10%',}} onClick={prevPeriod}>&lt;</button>
                <div style={{ display: 'flex', justifyContent: 'center',marginTop: '1.5%',marginLeft: '1.5%',marginRight:'1.5%',width: '20%',color: 'black', fontSize: '14px', backgroundColor: 'transparent' }}>
                {view === 'week' 
                    ? `${currentWeek[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                    : view === 'day' 
                    ? currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) 
                    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button style={{ width: '10%', margin: 'none'}} onClick={nextPeriod}>&gt;</button>
            </div>
            {(view === 'day' || view === 'week') && (
            <div className="calendar-header">
                {view === 'week' && <div className="empty-column"></div>} {/* Only show empty column for 'week' view */}
                {view === 'week' ? (
                currentWeek.map((day, index) => (
                    <div key={index} className="calendar-header-day">
                    <div
                        style={{
                        display: 'inline-block',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                        }}
                        className="calendar-day-number"
                        onClick={() => {
                        setCurrentDate(resetTimeToMidnight(day));
                        setView('day');
                        }}
                    >
                        {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                    </div>
                    </div>
                ))
                ) : (
                <div className="calendar-header-day-day">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                </div>
                )}
            </div>
            )}
            {view === 'month' && (
            <div className="calendar-header-month">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={index} className="calendar-header-day">{day}</div>
                ))}
            </div>
            )}

            <div className="calendar-body-container">
                {view === 'day' ? (
                    <div className="calendar-body day-view">
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div className="calendar-hour-row day-view-row" key={hour}>
                                <div className="calendar-hour-label day-view-label">
                                    {hour}:00
                                </div>
                                <div className="calendar-minute-slots day-view-slots">
                                    {Array.from({ length: 60 }).map((_, minute) => {
                                        const minuteKey = hour * 60 + minute;
                                        const schedule = getSchedule(currentDate, minuteKey);
                                        const isStartMinute = schedule.startMinute === minuteKey;

                                        return (
                                            <div key={minuteKey}
                                                style={{
                                                    backgroundColor: schedule.color || 'transparent',
                                                    position: 'relative'
                                                }}
                                                onClick={() => handleSlotClick(minuteKey, currentDate)}>
                                                {isStartMinute && <div className="event-title">{schedule.title}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : view === 'week' ? (
                    <div className="calendar-body">
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <React.Fragment key={hour}>
                                <div className="calendar-hour-row">
                                    <div className="calendar-hour-label">{hour}:00</div>
                                    {currentWeek.map((day, dayIndex) => (
                                        <div key={dayIndex} className="calendar-day-column">
                                            {Array.from({ length: 60 }).map((_, minute) => {
                                                const minuteKey = hour * 60 + minute;
                                                const schedule = getSchedule(day, minuteKey);
                                                const isStartMinute = schedule.startMinute === minuteKey;

                                                return (
                                                    <div key={minuteKey} className="calendar-minute-slot"
                                                        style={{
                                                            backgroundColor: schedule.color || 'transparent',
                                                            position: 'relative',
                                                            height: '0.1em',
                                                        }}
                                                        onClick={() => handleSlotClick(minuteKey, day)}>
                                                        {isStartMinute && <div className="event-title">{schedule.title}</div>} {/* Show title only at the start minute */}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="calendar-body-month">
                {currentMonth.map((day, index) => (
                    <div key={index} className="calendar-day-month">
                        {day ? (
                            <div className="calendar-day-number" style={{ cursor: 'pointer', color: 'black' }}  onClick={() => {
                                setCurrentDate(resetTimeToMidnight(day));
                                setView('day');
                            }}>
                                {day.getDate()}
                                <div className="calendar-day-events" >
                                    {/* Display all events for this day */}
                                    {Object.values(getDaySchedules(day)).map((event, eventIndex) => (
                                        <div
                                            key={eventIndex}
                                            className="calendar-day-event"
                                            style={{
                                                backgroundColor: event.color,
                                                fontSize: '10px',
                                                marginTop: '2px',
                                                padding: '2px',
                                                borderRadius: '3px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : ''}
                    </div>
                ))}
            </div>
                )}
            </div>
            

            {/* Modal */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={onModalClose}
                    selectedSlot={selectedSlot}
                    title={title}
                    setTitle={setTitle}
                    details={details}
                    setDetails={setDetails}
                    color={color}
                    setColor={setColor}
                    startTime={startTime}
                    setStartTime={setStartTime}
                    endTime={endTime}
                    setEndTime={setEndTime}
                    youtubeVideoId={youtubeVideoId}
                    onSave={handleSaveSchedule}
                    onDelete={handleDeleteSchedule}
                />
            )}

            {isVideoModalOpen && (
                <VideoShowcaseModal
                    isOpen={isVideoModalOpen}
                    onClose={onVideoModalClose} // Close the video modal
                    youtubeVideoId={youtubeVideoId}
                    onEdit={() => {
                        setIsVideoModalOpen(false);  // Close the video modal
                        setIsModalOpen(true);  // Open the normal modal
                    }}
                />
            )}


        </div>
        
        
    );
};


const Modal = ({ isOpen, onClose, title, setTitle, details, setDetails, color, setColor, startTime, setStartTime, endTime, setEndTime, youtubeVideoId, onSave, onDelete }) => {
    

    // Define the available hour and minute options
    const hourOptions = Array.from({ length: 24 }, (_, index) => index); // 0-23 hours
    const minuteOptions = Array.from({ length: 60 }, (_, index) => index); // 0-59 minutes

    const handleStartTimeChange = (hour, minute) => {
        const startMinute = hour * 60 + minute;
        setStartTime({ minute: startMinute });
    };

    const handleEndTimeChange = (hour, minute) => {
        const endMinute = hour * 60 + minute;
        setEndTime({ minute: endMinute });
    };

    const getHourAndMinute = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return { hours, minutes };
    };

    // If startTime and endTime are set, extract the hours and minutes
    const { hours: startHour, minutes: startMinute } = startTime ? getHourAndMinute(startTime.minute) : { hours: '', minutes: '' };
    const { hours: endHour, minutes: endMinute } = endTime ? getHourAndMinute(endTime.minute) : { hours: '', minutes: '' };

    const colorPresets = ['#e81416', '#ffa500', '#faeb36', '#79c314', '#487de7', '#4b369d', '#70369d'];
    useEffect(() => {
        if (!color) {
            setColor('#e81416');
        }
    }, [color, setColor]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Schedule for {title || "Untitled"}</h2>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event Title"
                />

                <div className="textarea_youtube_container">
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Enter event details"
                    ></textarea>

                    {youtubeVideoId && (
                        <div className="youtube-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={title}
                                className="video-display"
                            ></iframe>
                        </div>
                    )}
                </div>
                
                <label>Start Time:</label>
                <div className="time-selection-container">
                    <select
                        value={startHour}
                        onChange={(e) => handleStartTimeChange(parseInt(e.target.value), startMinute)}
                    >
                        <option value="" disabled>Select Hour</option>
                        {hourOptions.map((hour) => (
                            <option key={hour} value={hour}>{hour}</option>
                        ))}
                    </select>
                    <select
                        value={startMinute}
                        onChange={(e) => handleStartTimeChange(startHour, parseInt(e.target.value))}
                    >
                        <option value="" disabled>Select Minute</option>
                        {minuteOptions.map((minute) => (
                            <option key={minute} value={minute}>{minute}</option>
                        ))}
                    </select>
                </div>

                <label>End Time:</label>
                <div className="time-selection-container">
                    <select
                        value={endHour}
                        onChange={(e) => handleEndTimeChange(parseInt(e.target.value), endMinute)}
                    >
                        <option value="" disabled>Select Hour</option>
                        {hourOptions.map((hour) => (
                            <option key={hour} value={hour}>{hour}</option>
                        ))}
                    </select>
                    <select
                        value={endMinute}
                        onChange={(e) => handleEndTimeChange(endHour, parseInt(e.target.value))}
                    >
                        <option value="" disabled>Select Minute</option>
                        {minuteOptions.map((minute) => (
                            <option key={minute} value={minute}>{minute}</option>
                        ))}
                    </select>
                </div>

                <div className="color-preset-container">
                    {colorPresets.map((preset, index) => (
                        <div
                            key={index}
                            className="color-preset"
                            style={{
                                backgroundColor: preset,
                                border: color === preset ? '2px solid black' : 'none' // Highlight selected color
                            }}
                            onClick={() => setColor(preset)} // Set selected color
                        ></div>
                    ))}
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </div>

                <div className="modal-actions-container">
                    <div className="modal-actions-left">
                        <button onClick={onClose} style={{ width: '100%'}}>Cancel</button>
                    </div>
                    <div className='modal-actions-right'>
                        <button onClick={onDelete} style={{ width: '40%'}}>Delete</button>
                        <button onClick={onSave} style={{ width: '40%'}}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VideoShowcaseModal = ({ isOpen, onClose, youtubeVideoId, onEdit }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay-youtube">
            <div className="modal-content-youtube">
                <div className="youtube-video">
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Event Video"
                        className="video-display2"
                    ></iframe>
                </div>

                <div className="modal-actions-container">
                    <div className="modal-actions-left">
                    </div>
                    <div className='modal-actions-right'>
                        <button onClick={onClose} style={{ width: '30%' }}>Cancel</button>
                        <button onClick={onEdit} style={{ width: '30%' }}>Edit</button>
                    </div>
                </div>
            </div>
        </div>
    );
};



export default Calendar;