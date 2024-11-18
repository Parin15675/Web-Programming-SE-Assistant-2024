import Calendar from './Calendar';
import './CalendarYoutubeModal.css';
import React from 'react';

// Helper function to parse ISO 8601 duration to minutes
const parseISO8601DurationToMinutes = (isoDuration) => {
    // If the input is already a number (e.g., MP4 duration in seconds)
    if (typeof isoDuration === 'number') {
        return Math.ceil(isoDuration / 60); // Convert seconds to minutes, rounding up
    }

    // If the input is an ISO 8601 string
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);

    if (!matches) {
        throw new Error('Invalid ISO 8601 duration format');
    }

    const hours = matches[1] ? parseInt(matches[1], 10) : 0;
    const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
    const seconds = matches[3] ? parseInt(matches[3], 10) : 0;

    // Convert the parsed hours, minutes, and seconds to total minutes
    let totalMinutes = (hours * 60) + minutes;

    // If seconds are greater than or equal to 30, round up the minutes
    if (seconds >= 30) {
        totalMinutes += 1;
    }

    return totalMinutes;
};


const CalendarYoutubeModal = ({ video, onClose }) => {
    // Parse the duration safely
    const videoDuration = parseISO8601DurationToMinutes(video.contentDetails.duration);
    
    console.log(video); // Ensure `id.file` exists


    const handleSave = (startTime) => {
        const endTime = startTime + videoDuration;

        // Log scheduling information
        console.log(`Scheduling ${video.snippet.title}: Start Time: ${startTime}, End Time: ${endTime}`);

        // Add your scheduling logic here, including saving MP4-specific data

        onClose(); // Close the modal after scheduling
    };

    return (
        <div className="youtube-modal-overlay">
            <div className="youtube-modal-content">
                <div className="top-section">
                    {video.id.videoId ? (
                        // Render YouTube video
                        <iframe
                            src={`https://www.youtube.com/embed/${video.id.videoId}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.snippet.title}
                            className="video-display"
                        ></iframe>
                    ) : video.id.file ? (
                        // Render MP4 video
                        <video
                            controls
                            className="video-display"
                            style={{
                                maxWidth: '300px', // Set a maximum width
                                height: '100%', // Maintain aspect ratio
                                margin: '10px auto', // Center the video
                                display: 'block',
                            }}
                        >
                            <source src={URL.createObjectURL(video.id.file)} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                    ) : (
                        <p>Unable to load video.</p>
                    )}
                    <h3 className="video-title">{video.snippet.title}</h3>
                    <p className="video-duration">Video Duration: {videoDuration} minutes</p>
                </div>
                <div className="bottom-section">
                    <Calendar
                        view="week"
                        onSelectSlot={(startTime) => handleSave(startTime)} // Call handleSave when a time slot is selected
                        videoTitle={video.snippet.title}
                        videoDuration={videoDuration}
                        videoId={video.id.videoId || null}
                        videoFile={video.id.file || null} // Pass MP4 file reference to Calendar
                    />
                </div>
                <button className="cancel-button" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};




export default CalendarYoutubeModal;