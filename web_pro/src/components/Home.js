import React, { useState, useEffect } from "react";
import axios from "axios";
import Nav from "./Nav";
import CalendarNotification from "./CalendarNotification/CalendarNotification";
import Calendar from "./Calendar/Calendar";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Graph from "./Course/graph"; // Import the Graph component
import "./homestyle.css";

const Video = () => {
  const [curriculum, setCurriculum] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate(); // Use useNavigate for navigation

  useEffect(() => {
    if (profile && profile.email) {
      axios
        .get(`http://localhost:8000/api/user/${encodeURIComponent(profile.email)}`)
        .then((res) => {
          const { curriculum: userCurriculum, user } = res.data;
          setCurriculum(userCurriculum);

          if (user && user.ratings) {
            const updatedRatings = {};
            userCurriculum.subjects.forEach((subject) => {
              updatedRatings[subject.name] = user.ratings[subject.name] || null;
            });
            setRatings(updatedRatings);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [profile]);

  const starRatingToNumericGrade = (stars) => {
    if (stars === -1 || stars === null) return null;
    if (stars === 10) return 4.0;
    if (stars === 9) return 3.5;
    if (stars === 8) return 3.0;
    if (stars === 7) return 2.5;
    if (stars === 6) return 2.0;
    if (stars === 5) return 1.5;
    if (stars === 4) return 1.0;
    return 0.0;
  };

  const calculatePredictedGrade = () => {
    const requiredAverageNumeric = 3.0;
    let enteredGrades = 0,
      enteredTotal = 0;

    curriculum.subjects.forEach((subject) => {
      const stars = ratings[subject.name];
      const numericGrade = starRatingToNumericGrade(stars);

      if (stars !== null && stars !== undefined && stars !== -1) {
        enteredGrades += 1;
        enteredTotal += numericGrade;
      }
    });

    const remainingSubjects = curriculum.subjects.length - enteredGrades;

    if (remainingSubjects === 0) {
      return null;
    }

    const neededGradeForRemainingSubjects =
      (requiredAverageNumeric * curriculum.subjects.length - enteredTotal) /
      remainingSubjects;

    return Math.min(neededGradeForRemainingSubjects, 4);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="banner">
      <Nav />
      {curriculum && (
        <div className="content-layout">
          <div className="left-section">
            <h2>Your Course</h2>
            <div className="subject-container2">
              {curriculum.subjects.map((subject, index) => (
                <div key={index} className="subject-wrapper">
                  <div
                    className="subject-box2"
                    onClick={() => navigate(`/course/${encodeURIComponent(subject.name)}`)}
                  >
                    <h3>{subject.name}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="academic-progress">
              <h3>Academic Progress</h3>
              <Graph
                curriculum={curriculum}
                career={profile.career}
                ratings={ratings}
                careerRequirement="B"
                calculatePredictedGrade={calculatePredictedGrade}
                starRatingToNumericGrade={starRatingToNumericGrade}
              />
            </div>
          </div>

          <div className="right-section">
            <CalendarNotification />
            {/* Calendar wrapped in a div to apply custom styles */}
            <div className="calendar-container">
              <Calendar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Video;
