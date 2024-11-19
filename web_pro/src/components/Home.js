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
  const [semester, setSemester] = useState(1); // Default to Semester 1
  const [targetGpa, setTargetGpa] = useState(3.0);
  const profile = useSelector((state) => state.profile);
  const navigate = useNavigate();

  const fetchCurriculum = (semester) => {
    if (profile && profile.email) {
      axios
        .get(
          `http://localhost:8000/api/user/schedules/${encodeURIComponent(
            profile.email
          )}?semester=${semester}` // Fetch data for selected semester
        )
        .then((res) => {
          console.log("API Response:", res.data); // ดูข้อมูลที่ได้รับ
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
  };

  
  useEffect(() => {
    if (profile && profile.email) {
      // Fetch the current targetGpa from the backend
      axios
        .get(`http://localhost:8000/api/user/target_gpa/${encodeURIComponent(profile.email)}`)
        .then((res) => {
          console.log(res.data.target_gpa)
          setTargetGpa(res.data.target_gpa); // Update targetGpa from backend
          console.log(targetGpa)
        })
        .catch((err) => {
          console.error("Error fetching target GPA:", err);
          // Default value remains 3.5 if API fails
        });
    }
  }, [profile]);
  

  useEffect(() => {
    fetchCurriculum(semester); // Fetch data for the default semester on load
  }, [profile, semester]);

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
        (rating) => rating > 0 // Only consider rated topics
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
      (sum, grade) => sum + (grade > 0 ? grade : 0), // Include only valid grades
      0
    );

    const ratedSubjects = averageGrades.filter((grade) => grade > 0).length;
    const remainingSubjects = curriculum.subjects.length - ratedSubjects;

    // Use the user-defined targetGpa
    const requiredGPA = targetGpa;

    if (remainingSubjects === 0) {
      // If all subjects are rated, return actual grades
      return averageGrades;
    }

    // Calculate the average grade required for unrated subjects
    const remainingRequiredGrade =
      (requiredGPA * curriculum.subjects.length - currentSum) /
      remainingSubjects;

    // Ensure the required grade is valid (0 to 4)
    const isFeasible =
      remainingRequiredGrade <= 4 && remainingRequiredGrade >= 0;

    return curriculum.subjects.map((_, index) => {
      if (averageGrades[index] > 0) {
        // Use actual grade for rated subjects
        return averageGrades[index];
      } else if (isFeasible) {
        // Use predicted grade for unrated subjects
        return remainingRequiredGrade;
      } else {
        // If not feasible, leave as null
        return null;
      }
    });
  };

  const calculateGPA = () => {
    let totalWeightedGrade = 0;
    let totalCredits = 0;

    curriculum.subjects.forEach((subject) => {
      const topicRatings = Object.values(ratings[subject.name] || {}).filter(
        (rating) => rating > 0 // Only consider rated topics
      );

      if (topicRatings.length > 0) {
        const averageGrade =
          topicRatings.reduce((sum, rating) => sum + starToGrade(rating), 0) /
          topicRatings.length;

        totalWeightedGrade += averageGrade * subject.credit; // Weighted by credits
        totalCredits += subject.credit;
      }
    });

    const gpa =
      totalCredits > 0
        ? (totalWeightedGrade / totalCredits).toFixed(2)
        : "0.00";

    console.log("Calculated GPA:", gpa);
    console.log("Ratings Structure:", ratings);
    curriculum.subjects.forEach((subject) => {
      const topicRatings = Object.values(ratings[subject.name] || {}).filter(
        (rating) => rating > 0
      );
      console.log(`Subject: ${subject.name}`);
      console.log(`Topic Ratings: ${topicRatings}`);
      console.log(`Subject Credit: ${subject.credit}`);
    });

    return gpa;
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

  if (!curriculum) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-customGray text-black p-6 pt-32">
      <Nav />
      <div className="container mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#1a2a49] via-[#457b9d] to-[#a8dadc] p-6 rounded-lg text-center text-white mb-8">
          <h1 className="text-4xl font-bold">
            Welcome, {profile.name || "Student"}!
          </h1>
          <p className="text-lg mt-2">
            Track your academic progress and unlock achievements!
          </p>
        </div>

        {/* Semester Selection */}
        <div className="mb-6 flex justify-center">
          <label className="text-lg font-bold text-gray-700 mr-4">
            Select Semester:
          </label>
          <select
            className="border border-gray-300 rounded-md shadow-sm p-2"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
          >
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section */}
          <div className="lg:col-span-2">
            {/* Subjects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {curriculum.subjects.map((subject, index) => (
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
  <p className="text-lg font-semibold text-gray-600 mb-4">
    Target GPA: {targetGpa}
  </p>
  <Line data={lineGraphData} options={lineGraphOptions} />
</div>

          </div>

          {/* Right Section */}
          <div className="-mt-5">
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
