import React, { useState, useEffect } from "react";
import axios from "axios";
import Nav from "../Nav";
import { useSelector } from "react-redux";
import StarRatingComponent from "react-star-rating-component";
import { Line, Bar } from "react-chartjs-2";
import "chart.js/auto";
import YoutubeSearch from "../Calendar/YoutubeSearch";

function Course_2() {
  const [curriculum, setCurriculum] = useState({
    subjects: [{ name: "No Subjects Available", topics: [] }],
  });

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [gpaError, setGpaError] = useState("");
  const [targetGpa, setTargetGpa] = useState(3.5);
  const [ratings, setRatings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [year, setYear] = useState(1);
  const [career, setCareer] = useState("");
  const [field, setField] = useState("");
  const [name, setName] = useState("");
  const [semester, setSemester] = useState(1);
  const [gradeInfo, setGradeInfo] = useState({
    status: "",
    message: "",
    gpa: 0,
  });

  const profile = useSelector((state) => state.profile);

  const gradeRequirements = {
    Metaverse: {
      "Database Systems": 2.0,
      "Software Engineering Principles": 2.0,
    },
    IoT: {
      "Computer Networks": 2.0,
      "Computer Architecture and Organization": 2.0,
    },
    AI: {
      "Introduction to Logic": 2.0,
      "Probability Models and Data Analysis": 2.0,
    },
  };

  const gradeToLetter = (grade) => {
    if (grade >= 4.0) return "A";
    if (grade >= 3.5) return "B+";
    if (grade >= 3.0) return "B";
    if (grade >= 2.5) return "C+";
    if (grade >= 2.0) return "C";
    if (grade >= 1.5) return "D+";
    if (grade >= 1.0) return "D";
    return "F";
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
          )}?semester=${semester}`
        )
        .then((res) => {
          if (res.data.curriculum.subjects.length === 0) {
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
          fetchCurriculum();

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
  }, [profile, semester]);

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

  useEffect(() => {
    if (profile && profile.email && !isReturningUser) {
      fetchCurriculum();
    }
  }, [semester]);

  useEffect(() => {
    if (profile && profile.email) {
      // Fetch the current targetGpa from the backend
      axios
        .get(
          `http://localhost:8000/api/user/target_gpa/${encodeURIComponent(
            profile.email
          )}`
        )
        .then((res) => {
          setTargetGpa(res.data.target_gpa || 3.5);
        })
        .catch((err) => {
          console.error("Error fetching target GPA:", err);
        });
    }
  }, [profile]);

  const fetchCurriculum = () => {
    setIsLoading(true);
    axios
      .get(
        `http://localhost:8000/api/user/schedules/${encodeURIComponent(
          profile.email
        )}?semester=${semester}`
      )
      .then((res) => {
        setCurriculum(res.data.curriculum || { subjects: [] });
        setYear(res.data.user.year);
        setCareer(res.data.user.career);
        setField(res.data.user.field);

        const updatedRatings = {};
        res.data.curriculum?.subjects.forEach((subject) => {
          updatedRatings[subject.name] = {};
          (subject.topics || []).forEach((topic) => {
            updatedRatings[subject.name][topic.name] = topic.rating || 0;
          });
        });
        setRatings(updatedRatings);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching curriculum:", err);
        setIsLoading(false);
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

    const requiredGPA = targetGpa;

    if (remainingSubjects === 0) {
      // If all subjects are rated, return actual grades
      return averageGrades;
    }

    // Calculate the average grade required for unrated subjects
    const remainingRequiredGrade =
      (requiredGPA * curriculum.subjects.length - currentSum) /
      remainingSubjects;

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
        return null;
      }
    });
  };

  const calculateAverageGrades = () => {
    return curriculum.subjects.map((subject) => {
      const topicRatings = Object.values(ratings[subject.name] || {}).filter(
        (rating) => rating > 0
      );
      const total = topicRatings.reduce(
        (sum, rating) => sum + starToGrade(rating),
        0
      );
      return topicRatings.length > 0 ? total / topicRatings.length : 0;
    });
  };

  const calculateProgress = (subject) => {
    const totalTopics = subject.topics.length || 0;
    if (totalTopics === 0) {
      return 0;
    }
    const ratedTopics = Object.values(ratings[subject.name] || {}).filter(
      (rating) => rating > 0 
    ).length;
    return Math.round((ratedTopics / totalTopics) * 100);
  };

  const calculateGPA = () => {
    let totalWeightedGrade = 0;
    let totalCredits = 0;
  
    curriculum.subjects.forEach((subject) => {
      const topicRatings = Object.values(ratings[subject.name] || {});
      const allTopicsRated = topicRatings.length > 0 && topicRatings.every((rating) => rating > 0);
  
      if (allTopicsRated) {
        const averageGrade =
          topicRatings.reduce((sum, rating) => sum + starToGrade(rating), 0) /
          topicRatings.length;
  
        totalWeightedGrade += averageGrade * subject.credit;
        totalCredits += subject.credit;
      }
    });
  
    const gpa = totalCredits > 0 ? (totalWeightedGrade / totalCredits).toFixed(2) : "0.00";
  
    console.log("Calculated GPA:", gpa);
    return gpa;
  };
  

  const calculateGradeInfo = (updatedTargetGpa) => {
    const averageGrades = calculateAverageGrades();
    const currentSum = averageGrades.reduce(
      (sum, grade) => sum + (grade > 0 ? grade : 0), 
      0
    );
  
    const ratedSubjects = averageGrades.filter((grade) => grade > 0).length;
    const remainingSubjects = curriculum.subjects.length - ratedSubjects;
  
    const requiredGPA = updatedTargetGpa || targetGpa;
    const currentGPA = ratedSubjects > 0 ? currentSum / ratedSubjects : 0;
  
    // Check if the user has failed any requirement subject
    const requirementSubjects = Object.keys(gradeRequirements[field] || {});
    for (const subjectName of requirementSubjects) {
      const requiredGrade = gradeRequirements[field][subjectName];
      const subjectIndex = curriculum.subjects.findIndex(
        (subject) => subject.name === subjectName
      );
  
      if (subjectIndex !== -1) {
        const topicRatings = Object.values(ratings[subjectName] || {});
        const allTopicsRated = topicRatings.length > 0 && topicRatings.every(
          (rating) => rating !== null && rating !== undefined && rating > 0
        );
  
        if (allTopicsRated) {
          const averageGrade =
            topicRatings.reduce((sum, rating) => sum + starToGrade(rating), 0) /
            topicRatings.length;
  
          if (averageGrade < requiredGrade) {
            // Automatically fail if requirement is not met
            setGradeInfo({
              status: "fail",
              gpa: currentGPA.toFixed(2),
              message: `You failed the requirement for ${subjectName}. Minimum grade required: ${requiredGrade}`,
            });
            return;
          }
        } else {
          // Requirement subject is incomplete
          setGradeInfo({
            status: "fail",
            gpa: currentGPA.toFixed(2),
            message: `Incomplete ratings for ${subjectName}. Complete all topics to proceed.`,
          });
          return;
        }
      }
    }
  
    // Calculate the required grade for remaining subjects
    const remainingRequiredGrade =
      (requiredGPA * curriculum.subjects.length - currentSum) /
      remainingSubjects;
  
    if (remainingSubjects === 0) {
      if (currentGPA >= requiredGPA) {
        setGradeInfo({
          status: "pass",
          gpa: currentGPA.toFixed(2),
          message: "You have passed all requirements!",
        });
      } else {
        setGradeInfo({
          status: "fail",
          gpa: currentGPA.toFixed(2),
          message: "You did not meet the GPA requirement.",
        });
      }
    } else if (remainingRequiredGrade > 4) {
      // Impossible case: Remaining required grade exceeds 4
      setGradeInfo({
        status: "impossible",
        gpa: currentGPA.toFixed(2),
        message:
          "It is impossible to pass the requirement with the remaining subjects.",
      });
    } else {
      // Progress case: Calculate required grade for remaining subjects
      setGradeInfo({
        status: "progress",
        gpa: currentGPA.toFixed(2),
        message: `You need an average grade of ${remainingRequiredGrade.toFixed(
          2
        )} in the remaining subjects to pass the requirement.`,
      });
    }
  };
  

  useEffect(() => {
    calculateGradeInfo(targetGpa);
  }, [targetGpa]);

  useEffect(() => {
    calculateGradeInfo();
  }, [ratings, field]);

  const handleGpaChange = (value) => {
    const gpa = Number(value);
    if (gpa < 0 || gpa > 4) {
      setGpaError("Target GPA must be between 0 and 4.");
    } else {
      setGpaError("");
      setTargetGpa(gpa);

      axios
        .post("http://localhost:8000/api/user/target_gpa/", {
          gmail: profile.email,
          target_gpa: gpa,
        })
        .then(() => {
          console.log("Target GPA updated successfully!");
        })
        .catch((err) => {
          console.error("Error updating target GPA:", err);
        });
    }
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject === selectedSubject ? null : subject);
  };

  const resetSubjectRatings = (subjectName) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [subjectName]: Object.keys(prevRatings[subjectName] || {}).reduce(
        (acc, topicName) => {
          acc[topicName] = -1;
          return acc;
        },
        {}
      ),
    }));

    axios
      .post("http://localhost:8000/api/user/reset-rating", {
        gmail: profile.email,
        subject: subjectName,
      })
      .then((response) => {
        console.log("Ratings reset successfully:", response.data);
      })
      .catch((err) => {
        console.error("Error resetting ratings:", err);
      });
  };

  const filteredSubjects = curriculum.subjects.filter((subject) =>
    Object.keys(gradeRequirements[field] || {}).includes(subject.name)
  );

  const barGraphData = {
    labels: filteredSubjects.map((subject) => subject.name),
    datasets: [
      {
        label: "Required Grade",
        data: filteredSubjects.map(
          (subject) => gradeRequirements[field][subject.name]
        ),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Your Expected Grade",
        data: filteredSubjects.map((subject) => {
          const topicRatings = Object.values(ratings[subject.name] || {});
          const isFullyRated = topicRatings.every(
            (rating) => rating !== null && rating !== undefined && rating !== -1
          );

          if (isFullyRated) {
            const total = topicRatings.reduce(
              (sum, rating) => sum + starToGrade(rating),
              0
            );
            return total / topicRatings.length; // Average grade
          }
          return null;
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
        max: 4,
        ticks: {
          stepSize: 0.5,
          font: {
            size: 16,
          },
        },
        title: {
          display: true,
          text: "Grades",
          font: {
            size: 16,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 16,
          },
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        bodyFont: {
          size: 12,
        },
        titleFont: {
          size: 14,
        },
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile || !profile.email || !field || !career || !year) {
      console.error(
        "Missing profile, email, field, career, or year information"
      );
      return;
    }

    const userData = {
      name: profile.name || "Anonymous",
      gmail: profile.email,
      year,
      career,
      field,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/api/user/",
        userData
      );
      if (response.data && response.data.curriculum) {
        setCurriculum(response.data.curriculum);
        setYear(response.data.user.year);
        setCareer(response.data.user.career);
        setField(response.data.user.field);
        setName(response.data.user.name);

        // Automatically reset grades for all subjects and topics
      const initialRatings = {};
      response.data.curriculum.subjects.forEach((subject) => {
        initialRatings[subject.name] = {};
        (subject.topics || []).forEach((topic) => {
          initialRatings[subject.name][topic.name] = -1;
        });
      });

      setRatings(initialRatings);

      await axios.post("http://localhost:8000/api/user/reset-ratings", {
        gmail: profile.email,
        ratings: initialRatings,
      });

      console.log("Grades successfully reset for the new user.");
      } else {
        window.location.reload();
        console.error("No curriculum data returned from the server.");
      }
    } catch (err) {
      console.error("Error saving user data:", err);
    }
  };

  useEffect(() => {
    if (isReturningUser && curriculum) {
      console.log("Curriculum updated:", curriculum);
    }
  }, [curriculum, isReturningUser]);

  const lineGraphData = {
    labels: curriculum.subjects.map((subject) => subject.name),
    datasets: [
      {
        label: "Your Expected Grades",
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
          return null;
        }),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
      },
      {
        label: "Target Grades",
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
        max: 4,
        ticks: {
          stepSize: 0.5,
          font: {
            size: 16,
          },
        },
        title: {
          display: true,
          text: "Grades",
          font: {
            size: 16,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 16,
          },
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        bodyFont: {
          size: 12,
        },
        titleFont: {
          size: 14,
        },
      },
    },
  };

  return (
    <>
      <Nav />
      <div className="p-6 pt-32 bg-customGray min-h-screen">
        {!isReturningUser ? (
          <div className="max-w-md mx-auto mt-10 p-6 bg-gradient-to-br from-sky-200 via-white to-sky-100 rounded-lg shadow-md">
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
            <div className="bg-coursebg p-6 rounded-lg text-center text-white mb-8">
              <h1 className="text-4xl font-extrabold text-white">
                Your Academic Journey
              </h1>
              <p className="text-white mt-2">
                Track your progress and see how you are performing across all
                subjects.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-100 via-white to-blue-50 p-6 rounded-lg shadow-lg border border-gray-300">
                {/* Title */}
                <h2 className="text-xl font-bold text-customBlue mb-4 border-b border-blue-200 pb-2 text-center">
                  User Information
                </h2>

                {/* User Details */}
                <div className="space-y-2 text-lg">
                  <p className="text-gray-700 ">
                    <span className="font-semibold">Name:</span> {name}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Year:</span> {year}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Career:</span> {career}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Field:</span> {field}
                  </p>
                </div>

                {/* Semester Selector */}
                <div className="mt-6 pt-2">
                  <label className="block text-lg font-bold text-gray-700">
                    Select Semester:
                  </label>
                  <select
                    className="mt-2 block w-full p-3 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>
                </div>
              </div>

              <div
                className={` space-y-2 bg-gradient-to-r from-blue-100 via-white to-blue-50 p-4 rounded shadow-md ${
                  gradeInfo.status === "pass"
                    ? "border-green-500 text-green-700"
                    : gradeInfo.status === "fail"
                    ? "border-red-500 text-red-700"
                    : gradeInfo.status === "impossible"
                    ? "border-orange-500 text-orange-700"
                    : "border-gray-300 text-gray-700"
                }`}
                style={{
                  borderWidth: "2px",
                }}
              >
                <h2 className="text-2xl font-bold text-center border-b border-blue-200 pb-2 ">
                  Grade Information
                </h2>
                <p className="text-lg font-semibold">
                  Current GPA: {calculateGPA()}
                </p>
                <p className="text-lg font-semibold">Target GPA: {targetGpa}</p>{" "}
                <p className="text-lg  font-semibold">{gradeInfo.message}</p>
                {/* Target GPA Input */}
                <div className="mt-6 pt-20">
                  <label className="block text-lg font-bold text-gray-700">
                    Enter Your Target GPA:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    value={targetGpa}
                    onChange={(e) => handleGpaChange(e.target.value)}
                    className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                  />
                  {gpaError && (
                    <p className="text-red-500 text-sm mt-2">{gpaError}</p>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold mt-6 pt-8 ">Subjects</h2>
            <div className="flex flex-col space-y-4 pt-10">
              {curriculum.subjects.map((subject, index) => {
                const progressPercent = calculateProgress(subject);

                return (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 relative"
                  >
                    {/* Top-right corner grade */}
                    {(() => {
                      const topicRatings = Object.values(
                        ratings[subject.name] || {}
                      );
                      const allTopicsRated = subject.topics.every(
                        (topic) =>
                          ratings[subject.name]?.[topic.name] !== undefined &&
                          ratings[subject.name]?.[topic.name] !== -1
                      );

                      if (allTopicsRated) {
                        const total = topicRatings.reduce(
                          (sum, rating) => sum + starToGrade(rating),
                          0
                        );
                        const averageGrade = total / topicRatings.length;

                        return (
                          <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 font-bold text-2xl rounded-full px-3 py-1 shadow">
                            {gradeToLetter(averageGrade)}
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Subject Name and Details */}
                    <div
                      className="cursor-pointer"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      <h3 className="text-xl font-bold">{subject.name}</h3>
                      <p className="text-lg text-gray-600">
                        {subject.topics?.length
                          ? `${calculateProgress(subject)}% completed`
                          : "No topics available"}
                      </p>

                      {/* Render the progress bar */}
                      <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out "
                          style={{ width: `${calculateProgress(subject)}%` }}
                        ></div>
                      </div>
                    </div>

                    {selectedSubject === subject && subject.topics?.length && (
                      <div className="mt-4 bg-gray-100 p-4 rounded shadow flex flex-col lg:flex-row lg:items-start lg:gap-8">
                        {/* Left Section: Ratings */}
                        <div className="flex-1">
                          <h4 className="text-xl font-bold">
                            Details for {subject.name}
                          </h4>
                          <p className="text-lg">
                            {subject.description || "No description available."}
                          </p>

                          <h4 className="text-lg font-bold mt-4">Topics</h4>
                          {subject.topics.map((topic, idx) => (
                            <div key={idx} className="mt-2">
                              <h5>{topic.name}</h5>
                              <StarRatingComponent
                                name={`${subject.name}-${topic.name}`}
                                starCount={10}
                                value={
                                  ratings[subject.name]?.[topic.name] || -1
                                }
                                onStarClick={(nextValue) =>
                                  onTopicRatingChange(
                                    subject.name,
                                    topic.name,
                                    nextValue
                                  )
                                }
                                starDimension="40px"
                                starSpacing="10px"
                                renderStarIcon={(index, value) => (
                                  <span
                                    style={{
                                      fontSize: "30px",
                                      marginRight: "10px",
                                      color: index <= value ? "gold" : "gray",
                                    }}
                                  >
                                    ★
                                  </span>
                                )}
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

                        {/* Right Section: Videos */}
                        <div
                          className="flex flex-col gap-2 lg:w-1/2 text-center text-xl"
                          style={{ marginLeft: "-20px" }}
                        >
                          <h4 className="text-md font-bold ">Watch Lectures</h4>

                          <YoutubeSearch />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-6 mt-10">
              {/* Conditionally render the bar graph */}
              {filteredSubjects.length > 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-bold mb-4">
                    Subject Requirements
                  </h2>
                  <Bar data={barGraphData} options={barGraphOptions} />
                </div>
              ) : null}

              {/* Line graph */}
              <div
                className={`bg-white p-6 rounded-lg shadow-md ${
                  filteredSubjects.length === 0 ? "col-span-2" : ""
                }`}
              >
                <h2 className="text-3xl font-bold mb-4 text-center">Overall Progress</h2>
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
