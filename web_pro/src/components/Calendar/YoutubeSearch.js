import React, { useState } from 'react';
import './YoutubeSearch.css';
import CalendarYoutubeModal from './CalendarYoutubeModal';

const YoutubeSearch = () => {
    const [videos, setVideos] = useState([
        {
            id: { videoId: 'mockVideo1' },
            snippet: {
                title: 'Mock Lecture 1',
            },
            contentDetails: {
                duration: 'PT1H20M',
            },
        },
        {
            id: { videoId: 'mockVideo2' },
            snippet: {
                title: 'Mock Lecture 2',
            },
            contentDetails: {
                duration: 'PT55M',
            },
        },
        {
            id: { videoId: 'mockVideo3' },
            snippet: {
                title: 'Mock Lecture 3',
            },
            contentDetails: {
                duration: 'PT45M',
            },
        },
    ]);

    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSelectVideo = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="video-container">
                {videos.length > 0 ? (
                    videos.map((video) => (
                        <div key={video.id.videoId} className="video-box">
                            <div className="video-content">
                                <iframe
                                    src={`https://www.youtube.com/embed/${video.id.videoId}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={video.snippet.title}
                                ></iframe>
                                <h3>{video.snippet.title}</h3>
                                <p>{video.contentDetails.duration}</p>
                                <button onClick={() => handleSelectVideo(video)}>Schedule This</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No results found</p>
                )}
            </div>

            {isModalOpen && selectedVideo && (
                <CalendarYoutubeModal video={selectedVideo} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default YoutubeSearch;
