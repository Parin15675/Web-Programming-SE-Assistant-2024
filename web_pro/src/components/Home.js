import React, { useState, useEffect } from "react";
import axios from "axios";
import Nav from "./Nav";
import CalendarNotification from "./CalendarNotification/CalendarNotification";
import Calendar from "./Calendar/Calendar";
import StaticMonthCalendar from "./Calendar/StaticMonthCalendar";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Graph from "./Course/graph";

const Video = () => {
  const [curriculum, setCurriculum] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();

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
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
  <div className="min-h-screen bg-slate-300 pt-32">
    <Nav />
    {curriculum && (
      <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section: Subjects and Graph */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Course</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {curriculum.subjects.map((subject, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 cursor-pointer transition-transform transform hover:scale-105 duration-300"
                onClick={() => navigate(`/course/${encodeURIComponent(subject.name)}`)}
              >
                <h3 className="text-lg font-semibold text-gray-700 text-center">{subject.name}</h3>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Academic Progress</h3>
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

        {/* Right Section: Notifications and Calendar */}
        <div className="space-y-6">
          <CalendarNotification />
          <div className="bg-white p-6 rounded-lg shadow-md">
            <StaticMonthCalendar linkTo="/schedule" email={profile.email} />
          </div>
        </div>
      </div>
    )}
  </div>
);

};

export default Video;