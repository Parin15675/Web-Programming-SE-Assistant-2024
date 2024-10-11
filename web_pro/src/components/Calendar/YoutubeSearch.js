import React, { useState } from 'react';
import './YoutubeSearch.css';
import CalendarYoutubeModal from './CalendarYoutubeModal'; // Updated import to CalendarYoutubeModal

const YoutubeSearch = () => {
    const [videos, setVideos] = useState([
        {
            id: { videoId: 'mockVideo1' },
            snippet: {
                title: 'Mock Lecture 1',
            },
            contentDetails: {
                duration: 'PT1H20M', // Mock duration
            }
        },
        {
            id: { videoId: 'mockVideo2' },
            snippet: {
                title: 'Mock Lecture 2',
            },
            contentDetails: {
                duration: 'PT55M', // Mock duration
            }
        },
        {
            id: { videoId: 'mockVideo3' },
            snippet: {
                title: 'Mock Lecture 3',
            },
            contentDetails: {
                duration: 'PT45M', // Mock duration
            }
        }
    ]); // Mock-up video data
    const [selectedVideo, setSelectedVideo] = useState(null); // To store the selected video
    const [isModalOpen, setIsModalOpen] = useState(false); // To control modal visibility

    // Open the modal with the selected video
    const handleSelectVideo = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true); // Open the modal
    };

    return (
        <div>
            <div className="video-container">
                {videos.length > 0 ? (
                    videos.map((video) => (
                        <div key={video.id.videoId} className="video">
                            {/* Mock iframe for video */}
                            <iframe
                                src={`https://www.youtube.com/embed/${video.id.videoId}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={video.snippet.title}
                            ></iframe>
                            {/* Button to open modal */}
                            <button onClick={() => handleSelectVideo(video)}>Schedule This</button>
                        </div>
                    ))
                ) : (
                    <p>No results found</p>
                )}
            </div>

            {/* Show Calendar Youtube Modal when a video is selected */}
            {isModalOpen && selectedVideo && (
                <CalendarYoutubeModal 
                    video={selectedVideo} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default YoutubeSearch;
