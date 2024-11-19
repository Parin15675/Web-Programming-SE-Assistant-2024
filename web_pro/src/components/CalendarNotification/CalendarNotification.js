import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CalendarNotification = () => {
  const [message, setMessage] = useState("");
  const [schedules, setSchedules] = useState([]);
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Check if there are events for today
  const hasEventToday = schedules.length > 0;

  const handleClick = () => {
    if (hasEventToday) {
      navigate("/schedule"); // Navigate to the schedule page
    } else {
      alert("No events today."); // Optional feedback for the user
    }
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      if (profile && profile.email) {
        try {
          const response = await axios.get(
            `http://localhost:8000/get_schedules/${profile.email}`
          );
          const fetchedSchedules = response.data;
          const today = getCurrentDate();

          if (fetchedSchedules[today]) {
            const eventsArray = Object.values(fetchedSchedules[today]);

            const uniqueEvents = eventsArray.filter(
              (event, index, self) =>
                index ===
                self.findIndex(
                  (e) => e.title === event.title && e.details === event.details
                )
            );

            setSchedules(uniqueEvents);
            setMessage("Events for today");
          } else {
            setSchedules([]); // Clear schedules if none exist for today
            setMessage("No events for today.");
          }
        } catch (error) {
          console.error("Error fetching schedules:", error);
          setMessage("Error fetching events.");
        }
      } else {
        setMessage("Invalid date or email.");
      }
    };

    fetchSchedules();
  }, [profile]);

  return (
    <div
      className="bg-white border border-gray-300 rounded-lg shadow-md p-6 max-w-lg mx-auto text-center cursor-pointer"
      onClick={handleClick}
    >
      {message ? (
        <div>
          <h1 className="text-lg font-semibold text-black mb-4">{message}</h1>
          {schedules && schedules.length > 0 ? (
            <ul className="space-y-2">
              {schedules.map((event, index) => (
                <li
                  key={index}
                  className="bg-gray-800 text-white rounded-lg p-3 border border-gray-400 text-left"
                >
                  <strong className="text-white">{event.title}</strong> -{" "}
                  <span className="italic">{event.details}</span>
                </li>
              ))}
            </ul>
          ) : (
            <h1 className="text-gray-600">No events for today.</h1>
          )}
        </div>
      ) : (
        <h1 className="text-gray-600">No events for today.</h1>
      )}
    </div>
  );
};

export default CalendarNotification;
