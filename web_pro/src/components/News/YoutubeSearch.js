import React, { useState, useEffect } from 'react';
import './YoutubeSearch.css';
import Nav from '../Nav';
import axios from 'axios'; // Axios for making HTTP requests
import { useSelector } from 'react-redux'; // Assuming you're using Redux for user profile
import News from './News';

const YoutubeSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // To handle loading state
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

    return (
        <div>
            <Nav />
            <h1>Videos for Your Career Interest</h1>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className="video-container">
                    {videos.length > 0 ? (
                        videos.map((video, index) => (
                            <div key={index} className="video">
                                <iframe
                                    src={`https://www.youtube.com/embed/${video.id.videoId}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={video.snippet.title}
                                ></iframe>
                                <p>{video.snippet.title}</p>
                            </div>
                        ))
                    ) : (
                        <p>No results found</p>
                    )}
                </div>

            )}
            <News/>
        </div>
    );
};

export default YoutubeSearch;
