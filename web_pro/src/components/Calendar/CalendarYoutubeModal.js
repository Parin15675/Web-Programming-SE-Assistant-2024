import Calendar from './Calendar';
import './CalendarYoutubeModal.css';
import React from 'react';

const parseISO8601DurationToMinutes = (isoDuration) => {
    // If the input is already a number
    if (typeof isoDuration === 'number') {
        return Math.ceil(isoDuration / 60);
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

    let totalMinutes = (hours * 60) + minutes;

    if (seconds >= 30) {
        totalMinutes += 1;
    }

    return totalMinutes;
};


const CalendarYoutubeModal = ({ video, onClose }) => {
    const videoDuration = parseISO8601DurationToMinutes(video.contentDetails.duration);

    const handleSave = (startTime) => {
        const endTime = startTime + videoDuration;

        onClose();
    };

    return (
        <div className="youtube-modal-overlay">
            <div className="youtube-modal-content">
                <div className="top-section">
                    {video.id.videoId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${video.id.videoId}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.snippet.title}
                            className="video-display"
                        ></iframe>
                    ) : video.id.file ? (
                        <video
                            controls
                            className="video-display"
                            style={{
                                maxWidth: '300px',
                                height: '100%',
                                margin: '10px auto',
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
                        onSelectSlot={(startTime) => handleSave(startTime)}
                        videoTitle={video.snippet.title}
                        videoDuration={videoDuration}
                        videoId={video.id.videoId || null}
                        videoFile={video.id.file || null}
                    />
                </div>
                <button className="cancel-button" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};




export default CalendarYoutubeModal;
