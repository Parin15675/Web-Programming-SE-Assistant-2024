import React, { useState, useEffect } from "react";
import axios from "axios";
import "./News.css";
import { useSelector } from "react-redux"; // Assuming you're using Redux for user profile

const News = () => {
  const [news, setNews] = useState([]); // State to store news articles
  const [isLoading, setIsLoading] = useState(true); // To handle loading state
  const [career, setCareer] = useState("Software Engineering"); // Default to Software Engineering
  const profile = useSelector((state) => state.profile); // Get the profile from Redux (e.g., contains user email)

  // Fetch user's career interest from backend based on email
  useEffect(() => {
    if (profile && profile.email) {
      // Fetch the user's career interest from the backend
      axios
        .get(`http://localhost:8000/api/user/${profile.email}`)
        .then((response) => {
          const userCareer =
            response.data.user.career || "Software Engineering"; // Default if no career
          setCareer(userCareer); // Set career based on the user data
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setCareer("Software Engineering"); // Default if an error occurs
        });
    } else {
      setCareer("Software Engineering"); // Default if no profile
    }
  }, [profile]);

  // Fetch news articles based on the career interest
  useEffect(() => {
    if (career) {
      axios
        .get(`http://localhost:8000/news?query=${encodeURIComponent(career)}`)
        .then((response) => {
          setNews(response.data);
          setIsLoading(false); // Stop loading once news are fetched
        })
        .catch((error) => {
          console.error("Error fetching news articles:", error);
          setIsLoading(false); // Stop loading even on error
        });
    }
  }, [career]);

  return (
    <div className="news-section">
      {/* Hero Section */}
      <div className="news-hero">
        <h2>Stay Updated with the Latest in {career}</h2>
        <p>
          Explore the most recent news articles that match your career
          interests.
        </p>
      </div>

      {/* News Articles */}
      {isLoading ? (
        <div className="loading-spinner"></div> // Loading spinner
      ) : (
        <div className="news-container">
          {news.length > 0 ? (
    news.map((article, index) => (
        <a 
            key={index} 
            className="news-article-link" 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
        >
            <div className="news-article">
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                {article.urlToImage && (
                    <img 
                        src={article.urlToImage} 
                        alt={article.title} 
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} 
                    />
                )}
            </div>
        </a>
    ))
) : (
    <p>No news articles found</p>
)}

        </div>
      )}
    </div>
  );
};

export default News;