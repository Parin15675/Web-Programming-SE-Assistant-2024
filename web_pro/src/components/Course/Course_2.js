import React, { useState, useEffect } from "react";
import axios from "axios";
import Nav from "../Nav";
import { useSelector } from "react-redux";
import StarRatingComponent from "react-star-rating-component";
import { Line } from "react-chartjs-2";
import "chart.js/auto"; 
import "./Course_2.css";

function Course_2() {
  const [year, setYear] = useState(1);
  const [curriculum, setCurriculum] = useState(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [career, setCareer] = useState(""); 
  const [careerRequirement, setCareerRequirement] = useState("B");

  const profile = useSelector((state) => state.profile);

  useEffect(() => {
    if (profile && profile.email) {
      axios
        .get(
          `http://localhost:8000/api/user/${encodeURIComponent(profile.email)}`
        )
        .then((res) => {
          setCurriculum(res.data.curriculum);
          setYear(res.data.user.year);
          setCareer(res.data.user.career || "No career selected");
          setIsReturningUser(true);

          if (res.data.user && res.data.user.ratings) {
            const updatedRatings = {};
            res.data.curriculum.subjects.forEach((subject) => {
              updatedRatings[subject.name] =
                res.data.user.ratings[subject.name] || null;
            });
            setRatings(updatedRatings);
          }
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

  useEffect(() => {
    const careerRequirements = {
      "Data Analysis": "B+",
      "Software Engineer": "B",
      "Web Development": "B",
      Other: "C",
    };

    setCareerRequirement(careerRequirements[career] || "C");
  }, [career]);

  const handleSubjectClick = (subject) => {
    if (selectedSubject === subject) {
      setShowPopup(false);
      setSelectedSubject(null);
    } else {
      setSelectedSubject(subject);
      setShowPopup(true);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedSubject(null);
  };

  const onStarClick = (nextValue, prevValue, index) => {
    const subjectName = curriculum.subjects[index].name;
    
    // Send -1 to backend when resetting (indicating "Not Rated")
    const ratingValue = nextValue === null ? -1 : nextValue;

    setRatings({ ...ratings, [subjectName]: ratingValue });

    axios
      .post(
        "http://localhost:8000/api/user/rating",
        {
          gmail: profile.email,
          subject: subjectName,
          rating: ratingValue, // Send -1 for "Not Rated"
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      )
      .catch((err) => {
        console.error("Error:", err);
      });
  };

  const starRatingToNumericGrade = (stars) => {
    if (stars === -1 || stars === null) return null; // Not rated yet
    if (stars === 10) return 4.0; // A
    if (stars === 9) return 3.5;
    if (stars === 8) return 3.0; // B
    if (stars === 7) return 2.5;
    if (stars === 6) return 2.0; // C
    if (stars === 5) return 1.5;
    if (stars === 4) return 1.0; // D
    return 0.0; // 1, 2, or 3 stars (Fail)
  };

  const letterGradeToNumeric = (grade) => {
    switch (grade) {
      case "A":
        return 4.0;
      case "B+":
        return 3.5;
      case "B":
        return 3.0;
      case "C+":
        return 2.5;
      case "C":
        return 2.0;
      case "D+":
        return 1.5;
      case "D":
        return 1.0;
      case "F":
        return 0.0;
      default:
        return 0.0;
    }
  };

  const calculatePredictedGrade = () => {
    const requiredAverageNumeric = letterGradeToNumeric(careerRequirement);
    let enteredGrades = 0,
      enteredTotal = 0;

    // Calculate based on entered grades, skipping any rated -1 (Not Rated)
    curriculum.subjects.forEach((subject) => {
      const stars = ratings[subject.name];
      const numericGrade = starRatingToNumericGrade(stars);

      if (stars !== null && stars !== undefined && stars !== -1) {
        enteredGrades += 1;
        enteredTotal += numericGrade;
      }
    });

    const remainingSubjects = curriculum.subjects.length - enteredGrades;

    // If all subjects are graded, we don't need to predict
    if (remainingSubjects === 0) {
      return null;
    }

    // Calculate how much grade is needed in remaining subjects
    const neededGradeForRemainingSubjects = 
      (requiredAverageNumeric * curriculum.subjects.length - enteredTotal) / remainingSubjects;

    return Math.min(neededGradeForRemainingSubjects, 4); 
  };

  const isPossibleToAchieveRequirement = () => {
    const requiredAverageNumeric = letterGradeToNumeric(careerRequirement);
    let enteredGrades = 0,
      enteredTotal = 0;
  
    // Calculate based on entered grades
    curriculum.subjects.forEach((subject) => {
      const stars = ratings[subject.name];
      const numericGrade = starRatingToNumericGrade(stars);
  
      if (stars !== null && stars !== undefined && stars !== -1) {
        enteredGrades += 1;
        enteredTotal += numericGrade;
      }
    });
  
    const remainingSubjects = curriculum.subjects.length - enteredGrades;
  
    // Maximum possible grade the user can get in the remaining subjects (assuming all are 4.0)
    const maximumPossibleTotal = enteredTotal + remainingSubjects * 4.0;
    
    // Calculate the maximum possible average
    const maximumPossibleAverage = maximumPossibleTotal / curriculum.subjects.length;
  
    // If the maximum possible average is still less than the required average, the user cannot pass
    if (maximumPossibleAverage < requiredAverageNumeric) {
      return false; // It's not possible to meet the requirement
    }
  
    return true;
  };
  

  const calculateCurrentAverage = () => {
    let enteredTotal = 0,
        enteredGrades = 0;

    // Only include subjects with valid ratings (not -1 or null)
    curriculum.subjects.forEach((subject) => {
        const stars = ratings[subject.name];
        const numericGrade = starRatingToNumericGrade(stars);

        if (stars !== null && stars !== -1) {
            enteredGrades += 1;
            enteredTotal += numericGrade;
        }
    });

    // Return the average of rated subjects, or 0 if no subjects are rated
    return enteredGrades ? (enteredTotal / enteredGrades).toFixed(2) : 0;
  };

  const hasPassedRequirement = () => {
    const requiredAverageNumeric = letterGradeToNumeric(careerRequirement);
    const currentAverage = parseFloat(calculateCurrentAverage());

    // Check if they have entered all grades and met the requirement
    if (calculatePredictedGrade() === null && currentAverage >= requiredAverageNumeric) {
      return true;
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!profile || !profile.name || !profile.email || !year || !career) {
      console.error("Missing profile, email, year or career information");
      return;
    }

    const userData = {
      name: profile.name,
      gmail: profile.email,
      year,
      career,
    };

    axios
      .post("http://localhost:8000/api/user/", userData)
      .then((res) => {
        setCurriculum(res.data.curriculum);
        setIsReturningUser(true);
      })
      .catch((err) => {
        console.error("Error:", err);
      });
  };

  const generateCombinedChartData = () => {
    if (!curriculum || !careerRequirement) return null;

    const labels = curriculum.subjects.map((subject) => subject.name);
    const userGradesData = labels.map(
      (subjectName) => starRatingToNumericGrade(ratings[subjectName]) || 0
    );
    const predictedGrade = calculatePredictedGrade();
    const predictedGradesData = labels.map(
      (subjectName) =>
        starRatingToNumericGrade(ratings[subjectName]) ||
        (predictedGrade ? Math.min(predictedGrade, 4) : 0)
    );

    return {
      labels,
      datasets: [
        {
          label: "User Grades",
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(75,192,192,0.4)",
          borderColor: "rgba(75,192,192,1)",
          data: userGradesData,
        },
        {
          label: `${career} Predicted Grade`,
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(153,102,255,0.4)",
          borderColor: "rgba(153,102,255,1)",
          data: predictedGradesData,
        },
      ],
    };
  };

  const renderGradeInformation = () => {
    const predictedGrade = calculatePredictedGrade();
    const currentAverage = calculateCurrentAverage();
    
    return (
      <div className="grade-info">
        <h2>Grade Information</h2>
        <p>Current Average Grade: {currentAverage}</p>
        {isPossibleToAchieveRequirement() && predictedGrade !== null ? (
          <p>
            To meet the requirement of {careerRequirement} average, you need an
            average grade of <strong>{predictedGrade.toFixed(2)}</strong> in
            remaining subjects.
          </p>
        ) : predictedGrade === null ? (
          hasPassedRequirement() ? (
            <p style={{ color: "green" }}>
              Congratulations! You have met the requirement of {careerRequirement} average.
            </p>
          ) : (
            <p style={{ color: "red" }}>
              You have entered all grades, but unfortunately, you did not meet the required average of {careerRequirement}.
            </p>
          )
        ) : (
          <p style={{ color: "red" }}>
            It is impossible to meet the required average of {careerRequirement} based on your current grades.
          </p>
        )}
      </div>
    );
  };
  

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Nav />
      <div className="App">
        <h1>Register and Get Curriculum</h1>

        {profile && (
          <>
            <label>
              Name: {profile.name} ({profile.email})
            </label>

            {isReturningUser ? (
              <p>
                Year: {year}, Career Interest: {career}
              </p>
            ) : (
              <>
                <label>
                  Select Year:
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </label>

                <label>
                  Select Career Interest:
                  <select
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

                <button onClick={handleSubmit}>Submit</button>
              </>
            )}
          </>
        )}

        {curriculum && (
          <div className="content-container">
            <div className="subject-list">
              <h2>Curriculum for Year {curriculum.year}</h2>
              <div className="subject-container">
                {curriculum.subjects &&
                  curriculum.subjects.map((subject, index) => (
                    <div key={index} className="subject-wrapper">
                      <div
                        className="subject-box"
                        onClick={() => handleSubjectClick(subject)}
                        style={{ cursor: "pointer" }}
                      >
                        <h3>{subject.name}</h3>
                      </div>

                      {showPopup && selectedSubject === subject && (
                        <div className="popup">
                          <div className="popup-content">
                            <h3>Subject Details</h3>
                            <p>Subject: {subject.name}</p>
                            <p>Description: {subject.description}</p>

                            <div className="star-rating">
                              <h3>Your Rating:</h3>
                              <StarRatingComponent
                                name={subject.name}
                                starCount={10}
                                value={ratings[subject.name] || 0} 
                                onStarClick={(nextValue, prevValue) =>
                                  onStarClick(nextValue, prevValue, index)
                                }
                              />
                            </div>

                            <button
                              onClick={() =>
                                onStarClick(null, ratings[subject.name], index)
                              }
                            >
                              Reset Rating to "Not Rated"
                            </button>

                            <button onClick={handleClosePopup}>Close</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="chart-container">
              <h2>User Grades vs {career} Predicted Grade</h2>
              {generateCombinedChartData() && (
                <Line
                  data={generateCombinedChartData()}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 4,
                      },
                    },
                  }}
                />
              )}
            </div>

            {renderGradeInformation()}
          </div>
        )}
      </div>
    </>
  );
}

export default Course_2;
