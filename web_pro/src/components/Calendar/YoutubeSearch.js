import React, { useState } from 'react';
import './YoutubeSearch.css';
import CalendarYoutubeModal from './CalendarYoutubeModal'; // Updated import to CalendarYoutubeModal

const YoutubeSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null); // To store the selected video
    const [isModalOpen, setIsModalOpen] = useState(false); // To control modal visibility

    const handleSearch = async () => {
        try {
            // Step 1: Search videos (fetch videoId)
            const searchResponse = await fetch(`http://localhost:8000/search?query=${searchTerm}`);
            const searchData = await searchResponse.json();
            console.log('Search API Response:', searchData);

            // Extract video IDs from the search results
            const videoIds = searchData.map(video => video.id.videoId).join(',');
            console.log('Extracted Video IDs:', videoIds);

            if (videoIds) {
                // Step 2: Fetch video details (including contentDetails) from FastAPI
                const detailsResponse = await fetch(`http://localhost:8000/videos?video_ids=${videoIds}`);
                const detailsData = await detailsResponse.json();
                console.log('Video Details API Response:', detailsData);

                // Combine search results with video details
                const availableVideos = searchData.map(video => {
                    const details = detailsData.find(detail => detail.id === video.id.videoId);
                    return { ...video, contentDetails: details ? details.contentDetails : null };
                });

                setVideos(availableVideos.filter(video => video.contentDetails)); // Only set videos with contentDetails
            }
        } catch (error) {
            console.error('Error fetching YouTube data:', error);
        }
    };
    
    

    // Open the modal with the selected video
    const handleSelectVideo = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true); // Open the modal
    };

    return (
        <div>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search YouTube"
            />
            <button onClick={handleSearch}>Search</button>

            <div className="video-container">
                {videos.length > 0 ? (
                    videos.map((video) => (
                        <div key={video.id.videoId} className="video">
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