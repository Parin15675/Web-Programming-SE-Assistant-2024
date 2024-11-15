import React, { useState, useEffect } from 'react';
import Nav from '../Nav';
import axios from 'axios'; // Axios for making HTTP requests
import { useSelector } from 'react-redux'; // Assuming you're using Redux for user profile
import News from './News';
import CalendarYoutubeModal from '../Calendar/CalendarYoutubeModal';
import Calendar from '../Calendar/Calendar';

const YoutubeSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // To handle loading state
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const profile = useSelector(state => state.profile); // Get the profile from Redux

    // Automatically fetch videos based on user's career interest
    useEffect(() => {
        if (profile && profile.email) {
            // Fetch user's career interest and search videos based on it
            axios.get(`http://localhost:8000/career_videos?gmail=${profile.email}`)
                .then(response => {
                    setVideos(response.data);
                    setIsLoading(false); // Stop loading once videos are fetched
                })
                .catch(error => {
                    console.error('Error fetching career videos:', error);
                    setIsLoading(false); // Stop loading even on error
                });
        } else {
            setIsLoading(false); // Stop loading if no profile is available
        }
    }, [profile]);

    const handleSelectVideo = (video) => {
        setSelectedVideo(video);
        setIsModalOpen(true);
    };

    return (
        <div>
            <Nav />
            <div className="content-wrapper text-center py-10 pt-32 bg-slate-300">
                <h1 className="text-4xl font-bold mb-10 text-gray-800">Videos for Your Career Interest</h1>
                {isLoading ? (
                    <div className="loading-spinner mx-auto my-10 border-4 border-t-4 border-gray-300 rounded-full w-12 h-12 animate-spin border-t-blue-500"></div> // Loading spinner
                ) : (
                    <div className="video-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {videos.length > 0 ? (
                            videos.map((video, index) => (
                                <div key={index} className="video-card bg-white rounded-lg shadow-lg p-6 transition-transform transform hover:-translate-y-2 hover:shadow-xl">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${video.id.videoId}`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={video.snippet.title}
                                        className="w-full h-48 rounded-md"
                                    ></iframe>
                                    <button  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"onClick={() => handleSelectVideo(video)}>Schedule This </button>
                                </div>
                                
                            ))
                        ) : (
                            <p className="text-gray-500">No results found</p>
                        )}
                    </div>
                )}
            </div>
            <News />
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
