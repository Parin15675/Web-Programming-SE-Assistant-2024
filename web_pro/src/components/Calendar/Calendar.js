import React, { useState, useEffect } from 'react';
import './Calendar.css';
import axios from 'axios';
import { useSelector } from 'react-redux';
import CalendarYoutubeModal from './CalendarYoutubeModal';


const resetTimeToMidnight = (date) => {
    const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
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
    const [schedules, setSchedules] = useState({});
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [youtubeVideoId, setYoutubeVideoId] = useState(videoId || null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [isMp4ModalOpen, setIsMp4ModalOpen] = useState(false);
    const [mp4File, setMp4File] = useState(videoFile || null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isVideoTypeModalOpen, setIsVideoTypeModalOpen] = useState(false);

    

    // Auto-calculate endTime if videoDuration is provided
    useEffect(() => {
        if (videoDuration && startTime && startTime.minute !== undefined) {
            const calculatedEndTime = startTime.minute + Math.floor(videoDuration);
            setEndTime({ minute: calculatedEndTime });
        }
    }, [videoDuration, startTime]); 


    useEffect(() => {
        const storedSchedules = localStorage.getItem('calendarSchedules');
        if (storedSchedules) {
            setSchedules(JSON.parse(storedSchedules));
        }
    }, []);


    // Fetch the schedules for the logged-in user
    useEffect(() => {
        if (profile && profile.email) {
            axios.get(`http://localhost:8000/get_schedules/${profile.email}`)
                .then(response => {
                    setSchedules(response.data);
                })
                .catch(error => {
                    console.error('Error fetching schedules:', error);
                });
        }
    }, [profile]);
    
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
                setIsVideoModalOpen(true);
            }
            else {
                setIsModalOpen(true);
            }
        }
        else{
            if (!startTime) {
                // Set start time if it's not set yet
                setStartTime({ minute, day });
                setColor('#e81416');
            } else if (videoDuration) {
                // Calculate end time based on the duration and start time
                const calculatedEndTime = minute + Math.floor(videoDuration);
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
                const nextHourMinute = Math.ceil(minute / 60) * 60;
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
        let endMinute = endTime?.minute || startMinute;

        // Enforce minimum duration of 20 minutes
        if (endMinute - startMinute < 20) {
            endMinute = startMinute + 20;
        }
    
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
                youtubeVideoId: youtubeVideoId || null,
                videoFile: mp4File || null,
            };
        }
    
        setSchedules(newSchedules);
    
        const formData = new FormData();
        formData.append("gmail", profile.email);
        formData.append("schedules", JSON.stringify(newSchedules));
        if (mp4File) {
            formData.append("videoFile", mp4File);
        }

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
                day: formatDate(selectedSlot.day),
                start_minute: startTime.minute
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
    

            setSchedules(newSchedules);
            
            setIsModalOpen(false);
            setMp4File(null);

            window.location.reload();
        })
        .catch(error => {
            console.error("Error deleting schedule:", error);
        });
    };
    

    const getDaySchedules = (day) => {
        const dayKey = formatDate(day);
        const events = schedules[dayKey] || {};
        const uniqueEvents = [];

        // Track titles we've already displayed
        let seenTitles = new Set();

        // Loop through all the minutes of the day, only taking the first event for each title
        Object.keys(events).forEach((minuteKey) => {
            const event = events[minuteKey];
            if (!seenTitles.has(event.title)) {
                uniqueEvents.push(event);

                seenTitles.add(event.title);
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
        return schedules[dayKey]?.[minute] || {};
    };

    const resetForm = () => {
        setTitle("");
        setDetails("");
        setColor("#e81416");
        setStartTime(null);
        setEndTime(null);
        setMp4File(null);
    };
    

    const onModalClose = () => {
        setIsModalOpen(false);

        setStartTime(null);
        setEndTime(null);
        setTitle("");
        setDetails("");
        setColor("#c13336");
        setMp4File(null);
    };

    const onVideoModalClose = () => {
        setIsVideoModalOpen(false);

        setIsModalOpen(false);
        setStartTime(null);
        setEndTime(null);
        setTitle("");
        setDetails("");
        setColor("#c13336"); 
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
                    key: YoutubeAPIkey,
                },
            });

            if (response.data.items.length === 0) {
                alert("Video not found");
                return;
            }

            const videoData = response.data.items[0];
            const videoTitle = videoData.snippet.title;
            const videoDuration = parseDuration(videoData.contentDetails.duration);

            setSelectedVideo({
                id: { videoId },
                snippet: { title: videoTitle },
                contentDetails: { duration: videoData.contentDetails.duration },
            });

            setIsUrlModalOpen(false);
            setIsCalendarModalOpen(true);
        } catch (error) {
            console.error("YouTube API Error:", error);
            alert("Failed to fetch video details. Please check the URL or try again later.");
        }
    };

    const parseDuration = (duration) => {
        // If the input is already a number
        if (typeof duration === 'number') {
            return duration;
        }

        // If the input is a string
        if (typeof duration === 'string') {
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
            const hours = parseInt(match[1] || '0', 10) || 0;
            const minutes = parseInt(match[2] || '0', 10) || 0;
            const seconds = parseInt(match[3] || '0', 10) || 0;
            return hours * 3600 + minutes * 60 + seconds;
        }

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
            const duration = await getVideoDuration(file);
    
            setSelectedVideo({
                id: { file },
                snippet: { title: videoTitle },
                contentDetails: { duration },
            });
    
            setMp4File(file);
            setIsMp4ModalOpen(false);
            setIsCalendarModalOpen(true);
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
                resolve(Math.floor(videoElement.duration));
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
                <button  style={{ width: '5%',}} onClick={prevPeriod}>&lt;</button>
                <div style={{ display: 'flex', justifyContent: 'center',marginTop: '1.5%',marginLeft: '1.5%',marginRight:'1.5%',width: '15%',color: 'black', fontSize: '14px', backgroundColor: 'transparent' }}>
                {view === 'week' 
                    ? `${currentWeek[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                    : view === 'day' 
                    ? currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) 
                    : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button style={{ width: '5%', margin: 'none'}} onClick={nextPeriod}>&gt;</button>
            </div>
            {(view === 'day' || view === 'week') && (
                <div className="calendar-header">
                    {view === 'week' && <div className="empty-column"></div>}
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
                        {isPublicHoliday(currentDate) && (
                            <div
                                style={{
                                    backgroundColor: '#ff9800',
                                    padding: '5px',
                                    fontSize: '14px',                                
                                    color: 'black',
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
                            <div
                                key={index}
                                className="calendar-day-month"
                                style={{
                                    backgroundColor: day && isPublicHoliday(resetTimeToMidnight(day)) ? '#ffe0b2' : 'transparent',
                                    borderRadius: '5px',
                                }}
                            >
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
                                                    <div className="month-event-title">{event.title}</div>
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
                    videoFile={mp4File}
                    onSave={handleSaveSchedule}
                    onDelete={handleDeleteSchedule}
                />
            )}

            {isVideoModalOpen && (
                <VideoShowcaseModal
                    isOpen={isVideoModalOpen}
                    onClose={onVideoModalClose}
                    youtubeVideoId={youtubeVideoId}
                    onEdit={() => {
                        setIsVideoModalOpen(false);
                        setIsModalOpen(true);
                    }}
                />
            )}

            {isVideoTypeModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="addvideo-button" onClick={() => { setIsUrlModalOpen(true); setIsVideoTypeModalOpen(false); }}>Insert YouTube URL</button>
                        <button className="addvideo-button" onClick={() => { setIsMp4ModalOpen(true); setIsVideoTypeModalOpen(false); }}>Insert MP4</button>
                        <button className="addvideo-button" onClick={() => setIsVideoTypeModalOpen(false)}>Cancel</button>
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

            {isMp4ModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Insert MP4</h3>
                        <input
                            type="file"
                            accept="video/mp4"
                            onChange={handleMp4Upload}
                        />
                        <button className="addvideo-button" onClick={() => setIsMp4ModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {isCalendarModalOpen && selectedVideo && (
                <CalendarYoutubeModal
                    video={selectedVideo}
                    onClose={() => {
                        setIsCalendarModalOpen(false);
                        window.location.reload();
                    }}
                />
            )}


            {showAddVideoButton && (
                <button className="addvideo-button" onClick={() => setIsVideoTypeModalOpen(true)}>Add Video</button>
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
                        setMp4File(blob);
                        console.log("Blob fetched successfully:", blob);
                    } else {
                        console.error("Unexpected response type:", response.data);
                    }
                })
                .catch((error) => console.error("Error fetching video blob:", error));
        } else {
            setMp4File(videoFile || null);
        }
    }, [videoFile, isOpen]);
    

    const hourOptions = Array.from({ length: 24 }, (_, index) => index);
    const minuteOptions = Array.from({ length: 60 }, (_, index) => index);

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

    

    const colorPresets = ['#c13336', '#eaa81b', '#79c314', '#487de7', '#4b369d', '#70369d'];
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

                    {youtubeVideoId && (
                        <div className="video-container">
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
