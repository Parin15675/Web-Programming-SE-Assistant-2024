import React, { useState, useEffect } from "react";
import Nav from "../Nav";
import axios from "axios";
import { useSelector } from "react-redux";
import News from "./News";
import CalendarYoutubeModal from "../Calendar/CalendarYoutubeModal";

const YoutubeSearch = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const profile = useSelector((state) => state.profile);

  useEffect(() => {
    if (profile && profile.email) {
      axios
        .get(`http://localhost:8000/career_videos?gmail=${profile.email}`)
        .then((response) => {
          setVideos(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching career videos:", error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [profile]);

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  return (
    <div>
      <Nav />
      {/* Hero Section with Box Cover */}
      <header
        className="relative text-center py-24 pt-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.8) 70%, #1E3A8A 100%), url('https://source.unsplash.com/1600x900/?technology')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-extrabold drop-shadow-lg text-white-800">
            Videos for Your Career Interest
          </h1>
          <p className="text-lg mt-4 text-white-600">
            Explore curated videos tailored to your career goals.
          </p>
        </div>
      </header>

      {/* Content Section */}
      <div className="bg-slate-300 py-10 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Curated Videos
          </h2>
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
              {videos.length > 0 ? (
                videos.map((video, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transform transition duration-500 hover:-translate-y-2"
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id.videoId}`}
                      title={video.snippet.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-48 rounded-t-xl"
                    ></iframe>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-800 truncate">
                        {video.snippet.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {video.snippet.description ||
                          "No description available."}
                      </p>
                      <button
                        onClick={() => handleSelectVideo(video)}
                        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full"
                      >
                        Schedule This
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">
                  No videos found. Try updating your career preferences.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* News Section */}
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
