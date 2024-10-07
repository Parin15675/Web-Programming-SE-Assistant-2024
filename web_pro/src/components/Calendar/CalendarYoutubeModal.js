import Calendar from './Calendar';
import './CalendarYoutubeModal.css';

// Helper function to parse ISO 8601 duration to minutes
const parseISO8601DurationToMinutes = (isoDuration) => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
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
    // Parse the video duration from ISO 8601 format to minutes
    const videoDuration = parseISO8601DurationToMinutes(video.contentDetails.duration);

    const handleSave = (startTime) => {
        // Calculate the end time based on start time and the parsed video duration
        const endTime = startTime + videoDuration;

        // Log or handle the result
        console.log(`Saving ${video.snippet.title} with start time ${startTime} and end time ${endTime}`);
        
        // Handle actual scheduling and saving logic...
        
        onClose(); // Close the modal after saving
    };

    return (
        <div className="youtube-modal-overlay">
            <div className="youtube-modal-content">
                <div className="left">
                    {/* Display the YouTube video in an iframe */}
                    <iframe
                        src={`https://www.youtube.com/embed/${video.id.videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.snippet.title}
                        className="video-display"
                    ></iframe>
                    <h3>{video.snippet.title}</h3>
                    <p>Video Duration: {videoDuration.toFixed(2)} minutes</p>
                </div>
                <div className="right">
                    <Calendar
                        view="week"
                        onSelectSlot={(startTime) => handleSave(startTime)} // Call handleSave when a time slot is selected
                        videoTitle={video.snippet.title}
                        videoDuration={videoDuration}
                        videoId={video.id.videoId}
                    />
                </div>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};



export default CalendarYoutubeModal;