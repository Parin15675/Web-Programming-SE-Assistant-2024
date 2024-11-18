import React, { useState, useEffect } from "react";
import axios from "axios";
import Nav from "../Nav";
import { useSelector } from "react-redux";
import StarRatingComponent from "react-star-rating-component";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";

function Course_2() {
  const [curriculum, setCurriculum] = useState({
    subjects: [{ name: "No Subjects Available", topics: [] }],
  });

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [ratings, setRatings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [year, setYear] = useState(1);
  const [career, setCareer] = useState("");
  const [field, setField] = useState("");
  const [name, setName] = useState("");
  const [gradeInfo, setGradeInfo] = useState({
    status: "",
    message: "",
    gpa: 0,
  });

  const profile = useSelector((state) => state.profile);

  const gradeRequirements = {
    Metaverse: { "Database Systems": 2.0 },
    "Data Analysis": { Statistics: 2.5, "Machine Learning": 3.0 },
    IoT: { Networking: 2.5, "Embedded Systems": 3.0 },
    AI: { "Deep Learning": 3.5, "Neural Networks": 3.5 },
  };

  const targetGPA = {
    Metaverse: 3.0,
    "Data Analysis": 3.5,
    IoT: 3.2,
    AI: 3.5,
  };

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

  useEffect(() => {
    if (profile && profile.email) {
      axios
        .get(
          `http://localhost:8000/api/user/schedules/${encodeURIComponent(
            profile.email
          )}`
        )
        .then((res) => {
          if (res.data.curriculum.subjects.length === 0) {
            // If no subjects are returned, set a placeholder
            setCurriculum({
              subjects: [{ name: "No Subjects Available", topics: [] }],
            });
          } else {
            setCurriculum(res.data.curriculum);
          }
          setYear(res.data.user.year);
          setCareer(res.data.user.career);
          setField(res.data.user.field);
          setName(res.data.user.name);
          setIsReturningUser(true);

          const updatedRatings = {};
          res.data.curriculum.subjects.forEach((subject) => {
            updatedRatings[subject.name] = {};
            (subject.topics || []).forEach((topic) => {
              updatedRatings[subject.name][topic.name] = topic.rating || 0;
            });
          });
          setRatings(updatedRatings);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
          setIsReturningUser(false);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [profile]);

  const onTopicRatingChange = (subjectName, topicName, nextValue) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [subjectName]: {
        ...prevRatings[subjectName],
        [topicName]: nextValue,
      },
    }));

    // Send the updated rating to the backend
    axios
      .post("http://localhost:8000/api/user/rating", {
        gmail: profile.email,
        subject: subjectName,
        topic: topicName,
        rating: nextValue,
      })
      .catch((err) => {
        console.error("Error updating rating:", err);
      });
  };

  const calculatePredictedGrades = () => {
    const averageGrades = calculateAverageGrades();
    const currentSum = averageGrades.reduce(
      (sum, grade) => sum + (grade > 0 ? grade : 0),
      0
    ); // Sum only rated grades
    const ratedSubjects = averageGrades.filter((grade) => grade > 0).length;
    const remainingSubjects = curriculum.subjects.length - ratedSubjects;
    const requiredGPA = targetGPA[field] || 3.0;

    if (remainingSubjects === 0) return averageGrades; // If all subjects are rated, no prediction is needed

    const remainingRequiredGrade =
      (requiredGPA * curriculum.subjects.length - currentSum) /
      remainingSubjects;

    // Build predicted grades: Use rated grades and predict for unrated subjects
    return curriculum.subjects.map((_, index) => {
      return averageGrades[index] > 0 // Use current grade for rated subjects
        ? averageGrades[index]
        : remainingRequiredGrade <= 4 && remainingRequiredGrade >= 0 // Predict only if valid
        ? remainingRequiredGrade
        : null; // If prediction is invalid or not needed, leave as null
    });
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

  const getFullyRatedSubjects = () => {
    return curriculum.subjects.filter((subject) =>
      subject.topics.every(
        (topic) =>
          ratings[subject.name]?.[topic.name] !== undefined &&
          ratings[subject.name]?.[topic.name] !== -1
      )
    );
  };

  const renderProgressBar = (percent) => (
    <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
      <div
        className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );

  const calculateProgress = (subject) => {
    const totalTopics = subject.topics.length;
    const ratedTopics = Object.values(ratings[subject.name] || {}).filter(
      (rating) => rating !== -1
    ).length;
    return Math.round((ratedTopics / totalTopics) * 100);
  };

  const calculateGradeInfo = () => {
    const fullyRatedSubjects = getFullyRatedSubjects(); // Only fully rated subjects
    const currentSum = fullyRatedSubjects.reduce((sum, subject) => {
      const topicRatings = Object.values(ratings[subject.name] || {}).filter(
        (rating) => rating !== -1
      );
      const total = topicRatings.reduce(
        (sum, rating) => sum + starToGrade(rating),
        0
      );
      return sum + (topicRatings.length > 0 ? total / topicRatings.length : 0);
    }, 0);

    const ratedSubjects = fullyRatedSubjects.length;
    const remainingSubjects = curriculum.subjects.length - ratedSubjects;
    const requiredGPA = targetGPA[field] || 3.0;

    const currentGPA = ratedSubjects > 0 ? currentSum / ratedSubjects : 0;

    // Check if the user fails any specific subject requirement
    const fieldRequirements = gradeRequirements[field] || {};
    for (const [subject, requiredGrade] of Object.entries(fieldRequirements)) {
      const subjectIndex = curriculum.subjects.findIndex(
        (s) => s.name === subject
      );
      if (
        subjectIndex !== -1 &&
        fullyRatedSubjects.some(
          (s) =>
            s.name === subject &&
            calculateAverageGrades()[subjectIndex] < requiredGrade
        )
      ) {
        setGradeInfo({
          status: "fail",
          gpa: currentGPA,
          message: `Failed to meet the minimum grade requirement for ${subject}.`,
        });
        return;
      }
    }

    // Calculate the required grade for the remaining subjects
    const requiredGrade =
      remainingSubjects > 0
        ? (requiredGPA * curriculum.subjects.length - currentSum) /
          remainingSubjects
        : 0;

    // Determine the status based on the required grade
    if (remainingSubjects === 0) {
      if (currentGPA >= requiredGPA) {
        setGradeInfo({
          status: "pass",
          gpa: currentGPA,
          message: "You have passed the requirement!",
        });
      } else {
        setGradeInfo({
          status: "fail",
          gpa: currentGPA,
          message: "You did not meet the GPA requirement.",
        });
      }
    } else if (requiredGrade > 4) {
      // "Impossible" condition: required grade exceeds the maximum grade
      setGradeInfo({
        status: "impossible",
        gpa: currentGPA,
        message:
          "It is impossible to pass the requirement with the remaining subjects.",
      });
    } else {
      setGradeInfo({
        status: "progress",
        gpa: currentGPA,
        message: `You need an average grade of ${requiredGrade.toFixed(
          2
        )} in the remaining subjects to pass the requirement.`,
      });
    }
  };

  useEffect(() => {
    calculateGradeInfo();
  }, [ratings, field]);

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject === selectedSubject ? null : subject);
  };

  const resetSubjectRatings = (subjectName) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [subjectName]: Object.keys(prevRatings[subjectName] || {}).reduce(
        (acc, topicName) => {
          acc[topicName] = -1; // Reset to -1
          return acc;
        },
        {}
      ),
    }));

    // Optional: Send reset data to the backend
    axios
      .post("http://localhost:8000/api/user/reset-rating", {
        gmail: profile.email,
        subject: subjectName,
      })
      .catch((err) => {
        console.error("Error resetting ratings:", err);
      });
  };

  const barGraphData = {
    labels: Object.keys(gradeRequirements[field] || {}),
    datasets: [
      {
        label: "Required Grade",
        data: Object.keys(gradeRequirements[field] || {}).map(
          (subject) => gradeRequirements[field][subject]
        ),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Your Grade",
        data: Object.keys(gradeRequirements[field] || {}).map((subject) => {
          const subjectIndex = curriculum.subjects.findIndex(
            (s) => s.name === subject
          );
          if (subjectIndex !== -1) {
            const topicRatings = Object.values(ratings[subject] || {});
            const isFullyRated = topicRatings.every(
              (rating) =>
                rating !== null && rating !== undefined && rating !== -1
            );

            if (isFullyRated) {
              const total = topicRatings.reduce(
                (sum, rating) => sum + starToGrade(rating),
                0
              );
              return total / topicRatings.length; // Average grade
            }
          }
          return null; // Return null for unrated subjects
        }),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const barGraphOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 4, // Set max to 4
        ticks: {
          stepSize: 0.5, // Optional: Add steps of 0.5 for clarity
        },
      },
    },
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!profile || !profile.email || !field || !career || !year) {
      console.error(
        "Missing profile, email, field, career, or year information"
      );
      return;
    }

    const userData = {
      name: profile.name || "Anonymous", // Fallback for name
      gmail: profile.email,
      year,
      career,
      field, // Include the field property
    };

    axios
      .post("http://localhost:8000/api/user/", userData)
      .then((res) => {
        if (res.data && res.data.curriculum) {
          setCurriculum(res.data.curriculum);
          setIsReturningUser(true);
          console.log(isReturningUser);
        } else {
          console.error("No curriculum data returned from the server.");
        }
      })
      .catch((err) => {
        console.error("Error saving user data:", err);
      });
  };

  const lineGraphData = {
    labels: curriculum.subjects.map((subject) => subject.name),
    datasets: [
      {
        label: "Average Grades",
        data: curriculum.subjects.map((subject) => {
          const topicRatings = Object.values(ratings[subject.name] || {});
          const isFullyRated = topicRatings.every(
            (rating) => rating !== null && rating !== -1
          );

          if (isFullyRated) {
            const total = topicRatings.reduce(
              (sum, rating) => sum + starToGrade(rating),
              0
            );
            return total / topicRatings.length; // Average grade
          }
          return null; // Leave the point empty if not fully rated
        }),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
      },
      {
        label: "Predicted Grades",
        data: calculatePredictedGrades(),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderDash: [5, 5],
        borderWidth: 2,
      },
    ],
  };

  const lineGraphOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 4, // Set max to 4
        ticks: {
          stepSize: 0.5, // Optional: Add steps of 0.5 for clarity
        },
      },
    },
  };

  return (
    <>
      <Nav />
      <div className="p-6 pt-32 bg-gradient-to-r from-orange-400 to-red-500">
        {!isReturningUser ? (
          <div className="max-w-md mx-auto mt-10 p-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-center mb-6">
              Welcome! Complete Your Profile
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-gray-700">
                Select Year:
                <select
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
              </label>
              <label className="block text-gray-700">
                Select Career:
                <select
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                >
                  <option value="">Select a Career</option>
                  <option value="Data Analysis">Data Analysis</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="block text-gray-700">
                Field of Interest:
                <select
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                >
                  <option value="">Select a Field</option>
                  <option value="AI">AI</option>
                  <option value="Metaverse">Metaverse</option>
                  <option value="IoT">IoT</option>
                  <option value="Do Abroad">Do Abroad</option>
                </select>
              </label>
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full w-full"
              >
                Submit
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="text-center mb-10 ">
              <h1 className="text-4xl font-extrabold text-gray-800">
                Your Academic Journey
              </h1>
              <p className="text-gray-600 mt-2">
                Track your progress and see how you are performing across all
                subjects.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow-md">
                <h2 className="text-lg font-bold">User Information</h2>
                <p>Name: {name}</p>
                <p>Year: {year}</p>
                <p>Career: {career}</p>
                <p>Field: {field}</p>
              </div>
              <div
                className={`bg-white p-4 rounded shadow-md ${
                  gradeInfo.status === "pass"
                    ? "border-green-500 text-green-700"
                    : gradeInfo.status === "fail"
                    ? "border-red-500 text-red-700"
                    : gradeInfo.status === "impossible"
                    ? "border-orange-500 text-orange-700"
                    : "border-gray-300 text-gray-700"
                }`}
                style={{
                  borderWidth: "2px", // Optional: Add a thicker border for visual clarity
                }}
              >
                <h2 className="text-lg font-bold">Grade Information</h2>
                <p>Current GPA: {gradeInfo.gpa.toFixed(2)}</p>
                <p>{gradeInfo.message}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-6 pt-6">Subjects</h2>
            <div className="flex flex-col space-y-4 pt-3">
              {curriculum.subjects.map((subject, index) => {
                const progressPercent = subject.topics?.length
                  ? calculateProgress(subject)
                  : 0; // Set progress to 0 if no topics exist

                return (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      <h3 className="text-lg font-bold">{subject.name}</h3>
                      <p className="text-sm text-gray-600">
                        {subject.topics?.length
                          ? `${progressPercent}% completed`
                          : "No topics available"}
                      </p>
                      {subject.topics?.length &&
                        renderProgressBar(progressPercent)}
                    </div>
                    {selectedSubject === subject && subject.topics?.length && (
                      <div className="mt-4 bg-gray-100 p-4 rounded shadow">
                        <h4 className="text-md font-bold">
                          Details for {subject.name}
                        </h4>
                        <p>
                          {subject.description || "No description available."}
                        </p>
                        <h4 className="text-md font-bold mt-4">Topics</h4>
                        {subject.topics.map((topic, idx) => (
                          <div key={idx} className="mt-2">
                            <h5>{topic.name}</h5>
                            <StarRatingComponent
                              name={`${subject.name}-${topic.name}`}
                              starCount={10}
                              value={ratings[subject.name]?.[topic.name] || -1}
                              onStarClick={(nextValue) =>
                                onTopicRatingChange(
                                  subject.name,
                                  topic.name,
                                  nextValue
                                )
                              }
                            />
                          </div>
                        ))}

                        {/* Reset Button */}
                        <button
                          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
                          onClick={() => resetSubjectRatings(subject.name)}
                        >
                          Reset Ratings for {subject.name}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-6 mt-10">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold mb-4">Subject Requirements</h2>
                <Bar data={barGraphData} options={barGraphOptions} />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold mb-4">Overall Progress</h2>
                <Line data={lineGraphData} options={lineGraphOptions} />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Course_2;
