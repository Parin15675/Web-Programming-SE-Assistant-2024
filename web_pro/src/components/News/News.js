import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const News = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [career, setCareer] = useState("Software Engineering");
  const profile = useSelector((state) => state.profile);

  // Fetch user's career interest from backend based on email
  useEffect(() => {
    if (profile && profile.email) {
      axios
        .get(`http://localhost:8000/api/user/schedules/${profile.email}`)
        .then((response) => {
          const userCareer =
            response.data.user.career || "Software Engineering";
          setCareer(userCareer);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setCareer("Software Engineering");
        });
    } else {
      setCareer("Software Engineering");
    }
  }, [profile]);

  // Fetch news articles based on the career interest
  useEffect(() => {
    if (career) {
      axios
        .get(`http://localhost:8000/news?query=${encodeURIComponent(career)}`)
        .then((response) => {
          setNews(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching news articles:", error);
          setIsLoading(false);
        });
    }
  }, [career]);

  const scrollToNews = () => {
    const newsSection = document.getElementById("news-section");
    newsSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header
        className="relative text-white text-center py-20"
        style={{
          background: `
      radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.9) 70%, #1E3A8A 100%), 
      url('https://source.unsplash.com/1600x900/?technology,news')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: "white",
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto p-8">
          <h1 className="text-6xl font-extrabold drop-shadow-md">
            Latest News for {career}
          </h1>
          <p className="text-2xl mt-4 text-gray-200">
            Stay updated with the most recent news in your field of interest.
          </p>
          <div className="mt-8">
            <button
              className="px-8 py-4 text-xl font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-500 transition duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              onClick={scrollToNews}
            >
              Explore More
            </button>
          </div>
        </div>
      </header>

      {/* News Articles Section */}
      <div id="news-section" className="container mx-auto py-10 px-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">News Articles</h2>
        {isLoading ? (
          <div className="text-center">
            <div className="border-4 border-gray-200 border-t-4 border-t-blue-500 rounded-full w-10 h-10 mx-auto animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
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
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-gray-800">
                        {article.title}
                      </h3>
                      <p className="text-gray-600">{article.description}</p>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-center text-gray-600">
                No news articles found for {career}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
