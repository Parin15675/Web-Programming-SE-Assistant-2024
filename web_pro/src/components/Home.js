import React, { useState, useEffect } from "react";
import axios from "axios";
import Nav from "./Nav";
import CalendarNotification from "./CalendarNotification/CalendarNotification";
import StaticMonthCalendar from "./Calendar/StaticMonthCalendar";
import { useSelector } from "react-redux";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";

const Video = () => {
  const [curriculum, setCurriculum] = useState(null);
  const [ratings, setRatings] = useState({});
  const [tasks, setTasks] = useState(["Finish Math Homework", "Review AI Notes"]);
  const [searchQuery, setSearchQuery] = useState("");
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.email) {
      axios
        .get(
          `http://localhost:8000/api/user/schedules/${encodeURIComponent(
            profile.email
          )}`
        )
        .then((res) => {
          const { curriculum: userCurriculum } = res.data;
          setCurriculum(userCurriculum);

          const updatedRatings = {};
          userCurriculum.subjects.forEach((subject) => {
            updatedRatings[subject.name] = {};
            subject.topics.forEach((topic) => {
              updatedRatings[subject.name][topic.name] =
                topic.rating || -1; // Default to -1 for no rating
            });
          });
          setRatings(updatedRatings);
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
        });
    }
  }, [profile]);

  const starToGrade = (stars) => {
    if (stars === 10) return 4.0;
    if (stars === 9) return 3.5;
    if (stars === 8) return 3.0;
    if (stars === 7) return 2.5;
    if (stars === 6) return 2.0;
    if (stars === 5) return 1.5;
    if (stars === 4) return 1.0;
    if (stars === 3) return 0.5;
    return 0.0;
  };

  const calculateAverageGrades = () => {
    return curriculum.subjects.map((subject) => {
      const topicRatings = Object.values(ratings[subject.name] || {}).filter(
        (rating) => rating !== -1
      );
      const total = topicRatings.reduce(
        (sum, rating) => sum + starToGrade(rating),
        0
      );
      return topicRatings.length > 0 ? total / topicRatings.length : 0;
    });
  };

  const calculatePredictedGrades = () => {
    const averageGrades = calculateAverageGrades();
    const currentSum = averageGrades.reduce(
      (sum, grade) => sum + (grade > 0 ? grade : 0),
      0
    );
    const ratedSubjects = averageGrades.filter((grade) => grade > 0).length;
    const remainingSubjects = curriculum.subjects.length - ratedSubjects;
    const requiredGPA = 3.0;

    if (remainingSubjects === 0) return averageGrades;

    const remainingRequiredGrade =
      (requiredGPA * curriculum.subjects.length - currentSum) /
      remainingSubjects;

    return curriculum.subjects.map((_, index) => {
      return averageGrades[index] > 0
        ? averageGrades[index]
        : remainingRequiredGrade <= 4 && remainingRequiredGrade >= 0
        ? remainingRequiredGrade
        : null;
    });
  };

  const calculateGPA = () => {
    const averageGrades = calculateAverageGrades();
    const ratedGrades = averageGrades.filter((grade) => grade > 0);
    const totalGPA = ratedGrades.reduce((sum, grade) => sum + grade, 0);
    return ratedGrades.length > 0
      ? (totalGPA / ratedGrades.length).toFixed(2)
      : "0.00";
  };

  const lineGraphData = {
    labels: curriculum ? curriculum.subjects.map((subject) => subject.name) : [],
    datasets: [
      {
        label: "Average Grades",
        data: curriculum ? calculateAverageGrades() : [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Predicted Grades",
        data: curriculum ? calculatePredictedGrades() : [],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderDash: [5, 5],
        borderWidth: 2,
      },
    ],
  };

  const lineGraphOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.raw.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 4,
        ticks: {
          stepSize: 0.5,
        },
      },
    },
  };

  const handleAddTask = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      setTasks([...tasks, e.target.value.trim()]);
      e.target.value = "";
    }
  };

  if (!curriculum) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-white to-sky-100 pt-32">
      <Nav />
      <div className="container mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-400 p-6 rounded-lg text-center text-white mb-8">
          <h1 className="text-4xl font-bold">Welcome, {profile.name || "Student"}!</h1>
          <p className="text-lg mt-2">Track your academic progress and unlock achievements!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Subjects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {curriculum.subjects
                .filter((subject) =>
                  subject.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((subject, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer"
                    onClick={() =>
                      navigate(`/course/${encodeURIComponent(subject.name)}`)
                    }
                  >
                    <h3 className="text-lg font-bold text-gray-700 text-center">
                      {subject.name}
                    </h3>
                  </div>
                ))}
            </div>

            {/* Academic Progress */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Academic Progress
              </h3>
              <p className="text-lg font-semibold text-gray-600 mb-4">
                Current GPA: {calculateGPA()}
              </p>
              <Line data={lineGraphData} options={lineGraphOptions} />
            </div>
          </div>

          {/* Right Section */}
          <div>
            {/* To-Do List */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-700 mb-4">To-Do List</h3>
              <ul>
                {tasks.map((task, index) => (
                  <li key={index} className="text-gray-700 mb-2">
                    {task}
                  </li>
                ))}
              </ul>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md mt-4"
                placeholder="Add a new task..."
                onKeyDown={handleAddTask}
              />
            </div>

            {/* Calendar Notification */}
            <CalendarNotification />

            {/* Static Month Calendar */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <StaticMonthCalendar linkTo="/schedule" email={profile.email} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
