import React, { useState, useEffect } from 'react';
import './Calendar.css';
import axios from 'axios';
import { useSelector } from 'react-redux';
import CalendarYoutubeModal from './CalendarYoutubeModal';

// Helper function to reset the time of a Date object to midnight
const resetTimeToMidnight = (date) => {
    const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); // Reset to midnight UTC
    return newDate;
};

const YoutubeAPIkey = "AIzaSyDZJJ0q2rPDqIgzkHFCdfT85iVZar2guI0"


const Calendar = ({ onSelectSlot = () => {}, videoTitle = null, videoDuration = null , videoId = null , videoFile = null, showAddVideoButton = false }) => {

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
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false); // To control URL input modal
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false); // To control scheduling modal
    const [youtubeUrl, setYoutubeUrl] = useState(""); // To store YouTube URL input
    const [isMp4ModalOpen, setIsMp4ModalOpen] = useState(false); // To upload MP4 file
    const [mp4File, setMp4File] = useState(videoFile || null); // Store MP4 file
    const [selectedVideo, setSelectedVideo] = useState(null); // To store video details
    const [isVideoTypeModalOpen, setIsVideoTypeModalOpen] = useState(false); // To open the modal with two options

    

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
    


        if (event) {
            setTitle(event.title);
            setDetails(event.details);
            setColor(event.color);
            setStartTime({ minute: event.startMinute, day });
            setEndTime({ minute: event.endMinute });
            setSelectedSlot({ startMinute: event.startMinute, endMinute: event.endMinute, day });
            setYoutubeVideoId(event.youtubeVideoId || null);
            setMp4File(event.videoFile || null);

            console.log("videoFile:", event.videoFile); 

            if (event.youtubeVideoId) {
                setMp4File(null);
                setIsVideoModalOpen(true); // Open YouTube video modal
            }
            else {
                setIsModalOpen(true); // Open normal modal
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
                setMp4File(mp4File);
                console.log("mp4 uploaded to modal")
                setIsModalOpen(true);
            }
            
            else if (!endTime) {
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
        const dayKey = formatDate(resetTimeToMidnight(selectedSlot?.day || currentDate));
        const newSchedules = { ...schedules };
    
        const startMinute = startTime?.minute || 0;
        const endMinute = endTime?.minute || startMinute;
    
        for (let i = startMinute; i <= endMinute; i++) {
            if (!newSchedules[dayKey]) {
                newSchedules[dayKey] = {};
            }
            newSchedules[dayKey][i] = {
                title,
                details,
                color,
                startMinute,
                endMinute,
                youtubeVideoId: youtubeVideoId || null, // Handle YouTube video ID
                videoFile: mp4File || null, // Handle MP4 file reference
            };
        }
    
        setSchedules(newSchedules);
    
        // Prepare FormData for backend
        const formData = new FormData();
        formData.append("gmail", profile.email);
        formData.append("schedules", JSON.stringify(newSchedules)); // Serialize schedules to JSON
        if (mp4File) {
            formData.append("videoFile", mp4File); // Append the actual MP4 file
        }

        // Save to backend
        axios
            .post("http://localhost:8000/save_schedules/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(() => console.log("Schedules saved successfully!"))
            .catch((error) => console.error("Error saving schedules:", error));
            
        setIsModalOpen(false);
        resetForm();
    };

    
    

    const handleDeleteSchedule = () => {
        axios.delete(`http://localhost:8000/delete_schedule/`, {
            params: {
                gmail: profile.email,
                day: formatDate(selectedSlot.day), // Ensure proper date formatting
                start_minute: startTime.minute // Ensure the minute is sent correctly
            }
        })
        .then(response => {
            console.log("Schedule deleted:", response.data);
    
            // Remove the schedule from frontend UI as well
            const dayKey = formatDate(selectedSlot.day);
            const newSchedules = { ...schedules };
            delete newSchedules[dayKey][startTime.minute];
    
            if (Object.keys(newSchedules[dayKey]).length === 0) {
                delete newSchedules[dayKey];
            }
    
            setSchedules(newSchedules); // Update the state after deletion
            
            // Close the modal
            setIsModalOpen(false);
            setMp4File(null);
    
            // Reload the page to update the calendar
            window.location.reload(); // This will refresh the page to fetch the latest schedules
        })
        .catch(error => {
            console.error("Error deleting schedule:", error);
        });
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
        setMp4File(null);
    };
    

    const onModalClose = () => {
        setIsModalOpen(false);

        // Reset modal state when closing
        setStartTime(null);
        setEndTime(null);
        setTitle("");
        setDetails("");
        setColor("#e81416"); // Reset to default color
        setMp4File(null);
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

    // Function to extract video ID from the YouTube URL
    const extractVideoIdFromUrl = (url) => {
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/) ||
                      url.match(/(?:https?:\/\/)?youtu\.be\/([^?&]+)/);
        return match ? match[1] : null;
    };

    // Function to handle YouTube URL submission
    const handleYoutubeUrlSubmit = async () => {
        const videoId = extractVideoIdFromUrl(youtubeUrl);

        if (!videoId) {
            alert("Invalid YouTube URL");
            return;
        }

        try {
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                params: {
                    part: "snippet,contentDetails",
                    id: videoId,
                    key: YoutubeAPIkey, // Replace with your API key
                },
            });

            if (response.data.items.length === 0) {
                alert("Video not found");
                return;
            }

            const videoData = response.data.items[0];
            const videoTitle = videoData.snippet.title;
            const videoDuration = parseDuration(videoData.contentDetails.duration);

            // Pass video details to the modal
            setSelectedVideo({
                id: { videoId },
                snippet: { title: videoTitle },
                contentDetails: { duration: videoData.contentDetails.duration },
            });

            setIsUrlModalOpen(false); // Close URL input modal
            setIsCalendarModalOpen(true); // Open scheduling modal
        } catch (error) {
            console.error("YouTube API Error:", error);
            alert("Failed to fetch video details. Please check the URL or try again later.");
        }
    };

    const parseDuration = (duration) => {
        // If the input is already a number (e.g., for MP4 files)
        if (typeof duration === 'number') {
            return duration; // Assume duration is in seconds
        }

        // If the input is a string (e.g., ISO8601 format for YouTube videos)
        if (typeof duration === 'string') {
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
            const hours = parseInt(match[1] || '0', 10) || 0;
            const minutes = parseInt(match[2] || '0', 10) || 0;
            const seconds = parseInt(match[3] || '0', 10) || 0;
            return hours * 3600 + minutes * 60 + seconds; // Return duration in seconds
        }

        // If input is invalid
        throw new Error('Invalid duration format');
    };

    const handleMp4Upload = async (event) => {
        const file = event.target.files[0];
    
        if (!file) {
            alert('No file selected');
            return;
        }
    
        const videoTitle = file.name;
    
        try {
            const duration = await getVideoDuration(file); // Duration in seconds
    
            setSelectedVideo({
                id: { file }, // Store the file directly
                snippet: { title: videoTitle },
                contentDetails: { duration }, // Use numeric duration
            });
    
            setMp4File(file);
            setIsMp4ModalOpen(false);
            setIsCalendarModalOpen(true); // Open scheduling modal
        } catch (error) {
            console.error('Error getting video duration:', error);
            alert('Failed to get video duration');
        }
    };
    

    const getVideoDuration = (file) => {
        return new Promise((resolve, reject) => {
            const videoElement = document.createElement('video');
            videoElement.src = URL.createObjectURL(file);

            videoElement.onloadedmetadata = () => {
                resolve(Math.floor(videoElement.duration)); // Duration in seconds
            };

            videoElement.onerror = () => {
                reject(new Error('Error loading video metadata'));
            };
        });
    };

    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/public_holidays/')
            .then((response) => {
                console.log('Holidays fetched:', response.data);
                setHolidays(response.data.holidays);
            })
            .catch((error) => {
                console.error('Error fetching public holidays:', error);
            });
    }, []);


    const isPublicHoliday = (date) => {
        const formattedDate = date.toISOString().split('T')[0];
        const holiday = holidays.find((holiday) => holiday.date === formattedDate);
        return holiday;
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
                            <div 
                                key={index} 
                                className="calendar-header-day" 
                            >
                                <div
                                    style={{
                                        display: 'inline-block',
                                        color: isPublicHoliday(resetTimeToMidnight(day)) ? '#ff9800' : 'white',
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
                        {/* Check if the current day is a holiday */}
                        {isPublicHoliday(currentDate) && (
                            <div
                                style={{
                                    backgroundColor: '#ff9800',
                                    padding: '5px',
                                    borderRadius: '5px',
                                    fontSize: '14px',
                                    marginBottom: '10px',
                                    color: 'white',
                                    textAlign: 'center',
                                }}
                            >
                                Holiday: {isPublicHoliday(currentDate).title}
                            </div>
                        )}
                        {Array.from({ length: 24 }).map((_, hour) => (
                            <div className="calendar-hour-row day-view-row" key={hour}>
                                <div className="calendar-hour-label day-view-label">{hour}:00</div>
                                <div className="calendar-minute-slots day-view-slots">
                                    {Array.from({ length: 60 }).map((_, minute) => {
                                        const minuteKey = hour * 60 + minute;
                                        const schedule = getSchedule(currentDate, minuteKey);
                                        const isStartMinute = schedule.startMinute === minuteKey;

                                        return (
                                            <div
                                                key={minuteKey}
                                                style={{
                                                    backgroundColor: schedule.color || 'transparent',
                                                    position: 'relative',
                                                }}
                                                onClick={() => handleSlotClick(minuteKey, currentDate)}
                                            >
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
                                                    <div
                                                        key={minuteKey}
                                                        className="calendar-minute-slot"
                                                        style={{
                                                            backgroundColor: schedule.color || 'transparent',
                                                            position: 'relative',
                                                            height: '0.1em',
                                                        }}
                                                        onClick={() => handleSlotClick(minuteKey, day)}
                                                    >
                                                        {/* Show title only at the start minute */}
                                                        {isStartMinute && <div className="event-title">{schedule.title}</div>}
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
                                    <div
                                        className={`calendar-day-number ${isPublicHoliday(resetTimeToMidnight(day)) ? "calendar-day-holiday" : ""}`}
                                        style={{
                                            cursor: 'pointer',
                                            color: 'black',
                                            backgroundColor: isPublicHoliday(resetTimeToMidnight(day)) ? '#ffe0b2' : 'transparent',
                                        }}
                                        onClick={() => {
                                            setCurrentDate(resetTimeToMidnight(day));
                                            setView('day');
                                        }}
                                    >
                                        {day.getDate()}

                                        {/* Display Holiday */}
                                        {isPublicHoliday(resetTimeToMidnight(day)) && (
                                            <div
                                                style={{
                                                    backgroundColor: '#ff9800',
                                                    padding: '2px',
                                                    borderRadius: '3px',
                                                    fontSize: '10px',
                                                    marginTop: '5px',
                                                }}
                                            >
                                                {isPublicHoliday(resetTimeToMidnight(day)).title}
                                            </div>
                                        )}

                                        {/* Display Events */}
                                        <div className="calendar-day-events">
                                            {Object.values(getDaySchedules(resetTimeToMidnight(day))).map((event, eventIndex) => (
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
                    videoFile={mp4File} // For MP4 files
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

            {/* Video Type Modal */}
            {isVideoTypeModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Select Video Type</h3>
                        <button onClick={() => { setIsUrlModalOpen(true); setIsVideoTypeModalOpen(false); }}>Insert YouTube URL</button>
                        <button onClick={() => { setIsMp4ModalOpen(true); setIsVideoTypeModalOpen(false); }}>Insert MP4</button>
                        <button onClick={() => setIsVideoTypeModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}


            {isUrlModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Schedule a YouTube Video</h3>
                        <input
                            className="youtube-url-input"
                            type="text"
                            placeholder="Enter YouTube URL"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                        <div className="modal-actions-container">
                            <div className="modal-actions-left">
                            </div>
                            <div className='modal-actions-right'>
                                <button onClick={() => setIsUrlModalOpen(false)}>Cancel</button>
                                <button onClick={handleYoutubeUrlSubmit}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MP4 File Upload Modal */}
            {isMp4ModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Insert MP4</h3>
                        <input
                            type="file"
                            accept="video/mp4"
                            onChange={handleMp4Upload}
                        />
                        <button onClick={() => setIsMp4ModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Calendar YouTube Modal for Scheduling */}
            {isCalendarModalOpen && selectedVideo && (
                <CalendarYoutubeModal
                    video={selectedVideo}
                    onClose={() => setIsCalendarModalOpen(false)}
                />
            )}

            {showAddVideoButton && (
                <button onClick={() => setIsVideoTypeModalOpen(true)}>Add Video</button>
            )}
        </div>
        
        
    );
};


const Modal = ({ isOpen, onClose, title, setTitle, details, setDetails, color, setColor, startTime, setStartTime, endTime, setEndTime, youtubeVideoId, videoFile, onSave, onDelete }) => {
    const [mp4File, setMp4File] = useState(null);
    useEffect(() => {
        // Fetch the video file as a blob only when videoFile is a string
        if (isOpen && typeof videoFile === 'string') {
            console.log("Fetching video blob for:", videoFile);
            axios
                .get(`http://localhost:8000/videos/${videoFile}`, { responseType: 'blob',  })
                .then((response) => {
                    if (response.data instanceof Blob) {
                        const blob = new Blob([response.data], { type: 'video/mp4' });
                        setMp4File(blob); // Update state with Blob
                        console.log("Blob fetched successfully:", blob);
                    } else {
                        console.error("Unexpected response type:", response.data);
                    }
                })
                .catch((error) => console.error("Error fetching video blob:", error));
        } else {
            setMp4File(videoFile || null); // Handle cases where videoFile is already a Blob or null
        }
    }, [videoFile, isOpen]); // Re-run only when videoFile or isOpen changes
    


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

                    {/* Render video based on the type */}
                    {youtubeVideoId && (
                        <div className="video-container">
                            {/* Display YouTube video */}
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

                    {videoFile ? (
                        !mp4File ? (
                            <div className="LoadingVideo">Loading video...</div>
                        ) : (
                            <video
                                controls
                                className="video-display"
                                style={{
                                    width: "50%",
                                    maxHeight: "300px",
                                    borderRadius: "8px",
                                    marginTop: "10px",
                                }}
                            >
                                <source src={URL.createObjectURL(mp4File)} type="video/mp4" />
                            </video>
                        )
                    ) : (
                        <div></div>
                    )}



                </div>

                <label>Start Time:</label>
                <div className="time-selection-container">
                    <select
                        value={startHour}
                        onChange={(e) => handleStartTimeChange(parseInt(e.target.value), startMinute)}
                    >
                        <option value="" disabled>
                            Select Hour
                        </option>
                        {hourOptions.map((hour) => (
                            <option key={hour} value={hour}>
                                {hour}
                            </option>
                        ))}
                    </select>
                    <select
                        value={startMinute}
                        onChange={(e) => handleStartTimeChange(startHour, parseInt(e.target.value))}
                    >
                        <option value="" disabled>
                            Select Minute
                        </option>
                        {minuteOptions.map((minute) => (
                            <option key={minute} value={minute}>
                                {minute}
                            </option>
                        ))}
                    </select>
                </div>

                <label>End Time:</label>
                <div className="time-selection-container">
                    <select
                        value={endHour}
                        onChange={(e) => handleEndTimeChange(parseInt(e.target.value), endMinute)}
                    >
                        <option value="" disabled>
                            Select Hour
                        </option>
                        {hourOptions.map((hour) => (
                            <option key={hour} value={hour}>
                                {hour}
                            </option>
                        ))}
                    </select>
                    <select
                        value={endMinute}
                        onChange={(e) => handleEndTimeChange(endHour, parseInt(e.target.value))}
                    >
                        <option value="" disabled>
                            Select Minute
                        </option>
                        {minuteOptions.map((minute) => (
                            <option key={minute} value={minute}>
                                {minute}
                            </option>
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
                                border: color === preset ? '2px solid black' : 'none',
                            }}
                            onClick={() => setColor(preset)}
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
                        <button onClick={onClose} style={{ width: '100%' }}>
                            Cancel
                        </button>
                    </div>
                    <div className="modal-actions-right">
                        <button onClick={onDelete} style={{ width: '40%' }}>
                            Delete
                        </button>
                        <button onClick={onSave} style={{ width: '40%' }}>
                            Save
                        </button>
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