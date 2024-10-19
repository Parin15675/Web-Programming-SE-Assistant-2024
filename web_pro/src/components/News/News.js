import React, { useState, useEffect } from "react";
import axios from "axios";
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
    <div className="bg-slate-300 p-5">
      {/* Hero Section */}
      <div className="bg-slate-400 text-white text-center py-20 mb-10 ">
        <h2 className="text-4xl font-bold mb-4">Stay Updated with the Latest in {career}</h2>
        <p className="text-lg">Explore the most recent news articles that match your career interests.</p>
      </div>

      {/* News Articles */}
      {isLoading ? (
        <div className="border-4 border-gray-200 border-t-4 border-t-blue-500 rounded-full w-10 h-10 mx-auto animate-spin"></div> // Loading spinner
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.length > 0 ? (
            news.map((article, index) => (
              <a
                key={index}
                className="block hover:transform hover:-translate-y-2 transition-transform duration-300"
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                    <p className="text-gray-600">{article.description}</p>
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="mt-4 w-full h-48 object-cover rounded-md"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              </a>
            ))
          ) : (
            <p className="text-center text-gray-600">No news articles found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default News;
