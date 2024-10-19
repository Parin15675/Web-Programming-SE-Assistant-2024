import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Nav from '../Nav';
import { useSelector } from 'react-redux';
import StarRatingComponent from 'react-star-rating-component';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import YoutubeSearch from '../Calendar/YoutubeSearch';

function Course_2() {
  const [year, setYear] = useState(1);
  const [curriculum, setCurriculum] = useState(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [career, setCareer] = useState('');
  const [careerRequirement, setCareerRequirement] = useState('B');

  const profile = useSelector(state => state.profile);

  useEffect(() => {
    if (profile && profile.email) {
      axios.get(`http://localhost:8000/api/user/${encodeURIComponent(profile.email)}`)
        .then(res => {
          setCurriculum(res.data.curriculum);
          setYear(res.data.user.year);
          setCareer(res.data.user.career || "No career selected");
          setIsReturningUser(true);

          if (res.data.user && res.data.user.ratings) {
            const updatedRatings = {};
            res.data.curriculum.subjects.forEach((subject) => {
              updatedRatings[subject.name] = res.data.user.ratings[subject.name] ?? -1;
            });
            setRatings(updatedRatings);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
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
      "Other": "C"
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
    setRatings({ ...ratings, [subjectName]: nextValue });

    axios.post('http://localhost:8000/api/user/rating', {
      gmail: profile.email,
      subject: subjectName,
      rating: nextValue,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('Error:', err);
    });
  };

  const handleResetRating = (subject, index) => {
    setRatings({ ...ratings, [subject.name]: -1 });

    axios.post('http://localhost:8000/api/user/rating', {
      gmail: profile.email,
      subject: subject.name,
      rating: -1,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('Error:', err);
    });
  };

  const starRatingToNumericGrade = (stars) => {
    if (stars === 10) return 4.0;
    if (stars === 9) return 3.5;
    if (stars === 8) return 3.0;
    if (stars === 7) return 2.5;
    if (stars === 6) return 2.0;
    if (stars === 5) return 1.5;
    if (stars === 4) return 1.0;
    return 0;
  };

  const letterGradeToNumeric = (grade) => {
    switch (grade) {
      case 'A': return 4.0;
      case 'B+': return 3.5;
      case 'B': return 3.0;
      case 'C+': return 2.5;
      case 'C': return 2.0;
      case 'D+': return 1.5;
      case 'D': return 1.0;
      case 'F': return 0.0;
      default: return 0.0;
    }
  };

  const calculatePredictedGrade = () => {
    const requiredAverageNumeric = letterGradeToNumeric(careerRequirement);
    let enteredGrades = 0, enteredTotal = 0;

    curriculum.subjects.forEach((subject) => {
      const stars = ratings[subject.name];
      const numericGrade = starRatingToNumericGrade(stars);
      
      if (numericGrade !== null && numericGrade !== undefined && stars !== -1) {
        enteredGrades += 1;
        enteredTotal += numericGrade;
      }
    });

    const remainingSubjects = curriculum.subjects.length - enteredGrades;
    if (remainingSubjects === 0) {
      return null;
    }

    const predictedGrade = (requiredAverageNumeric * curriculum.subjects.length - enteredTotal) / remainingSubjects;
    return predictedGrade;
  };

  const calculateCurrentAverage = () => {
    let enteredTotal = 0, enteredGrades = 0;

    curriculum.subjects.forEach((subject) => {
      const stars = ratings[subject.name];
      const numericGrade = starRatingToNumericGrade(stars);

      if (numericGrade !== null && numericGrade !== undefined && stars !== -1) {
        enteredGrades += 1;
        enteredTotal += numericGrade;
      }
    });

    return enteredGrades ? (enteredTotal / enteredGrades).toFixed(2) : 0;
  };

  const isPossibleToAchieveRequirement = () => {
    const predictedGrade = calculatePredictedGrade();
    return predictedGrade === null || predictedGrade <= 4.0;
  };

  const hasPassedRequirement = () => {
    const requiredAverageNumeric = letterGradeToNumeric(careerRequirement);
    const currentAverage = parseFloat(calculateCurrentAverage());

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

    axios.post('http://localhost:8000/api/user/', userData)
      .then(res => {
        setCurriculum(res.data.curriculum);
        setIsReturningUser(true);
      })
      .catch(err => {
        console.error('Error:', err);
      });
  };

  const generateCombinedChartData = () => {
    if (!curriculum || !careerRequirement) return null;

    const labels = curriculum.subjects.map(subject => subject.name);
    const userGradesData = labels.map(subjectName => starRatingToNumericGrade(ratings[subjectName]) || 0);
    const predictedGrade = calculatePredictedGrade();
    const predictedGradesData = labels.map(subjectName => starRatingToNumericGrade(ratings[subjectName]) || (predictedGrade ? Math.min(predictedGrade, 4) : 0));

    return {
      labels,
      datasets: [
        {
          label: 'User Grades',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          data: userGradesData
        },
        {
          label: `${career} Predicted Grade`,
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(153,102,255,0.4)',
          borderColor: 'rgba(153,102,255,1)',
          data: predictedGradesData
        }
      ]
    };
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Nav />
      <div className="App pt-32 pl-10 bg-slate-300">
        <h1 className="text-3xl font-extrabold mb-5 text-gray-800">Register and Get Curriculum</h1>

        {profile && (
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg mb-8">
            <label className="block text-lg mb-4">
              <span className="font-semibold">Name:</span> {profile.name} ({profile.email})
            </label>

            {isReturningUser ? (
              <p className="mb-4 text-gray-600">Year: {year}, Career Interest: <span className="text-blue-600">{career}</span></p>
            ) : (
              <div>
                <label className="block mb-4">
                  Select Year:
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="block mt-1 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </label>

                <label className="block mb-4">
                  Select Career Interest:
                  <select
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                    className="block mt-1 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a Career</option>
                    <option value="Data Analysis">Data Analysis</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Flexbox layout with Subject Boxes on Left and Grade Info + Graph on Right */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Side: Subject List */}
          <div className="lg:w-1/2 space-y-4">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Curriculum for Year {curriculum.year}</h2>
            {curriculum.subjects.map((subject, index) => (
              <div key={index} className="bg-slate-600 border border-gray-300 rounded-lg p-5 mb-5 transition-transform transform hover:scale-105 shadow-sm">
                <h3
                  className="cursor-pointer text-lg font-medium text-white"
                  onClick={() => handleSubjectClick(subject)}
                >
                  {subject.name}
                </h3>

                {showPopup && selectedSubject === subject && (
                  <div className="bg-white p-5 mt-5 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2">Subject Details</h3>
                    <p className="mb-2">Subject: {subject.name}</p>
                    <p className="mb-4">Description: {subject.description}</p>

                    <div className="mb-4">
                      <h3 className="text-lg">Your Rating:</h3>
                      <StarRatingComponent
                        name={subject.name}
                        starCount={10}
                        value={ratings[subject.name] === -1 ? 0 : ratings[subject.name]}
                        emptyStarColor={ratings[subject.name] === -1 ? '#ccc' : undefined}
                        onStarClick={(nextValue, prevValue) => onStarClick(nextValue, prevValue, index)}
                      />
                    </div>

                    <button
                      onClick={() => handleResetRating(subject, index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                    >
                      Reset Rating
                    </button>

                    <button
                      onClick={handleClosePopup}
                      className="ml-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all"
                    >
                      Close
                    </button>
                    <YoutubeSearch />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side: Grade Information and Graph */}
          <div className="lg:w-1/2 space-y-6">
            {/* Grade Information Box */}
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800">Grade Information</h2>
              <p className="mb-2 text-gray-600">Current Average Grade: {calculateCurrentAverage()}</p>
              {isPossibleToAchieveRequirement() && calculatePredictedGrade() !== null ? (
                <p className="text-yellow-600">
                  To meet the requirement of {careerRequirement} average, you need a grade of <strong>{Math.min(calculatePredictedGrade(), 4)}</strong> in remaining subjects.
                </p>
              ) : calculatePredictedGrade() === null ? (
                hasPassedRequirement() ? (
                  <p className="text-green-600">Congratulations! You have met the requirement of {careerRequirement} average.</p>
                ) : (
                  <p className="text-red-600">You have entered all grades, but unfortunately, you did not meet the required average of {careerRequirement}.</p>
                )
              ) : (
                <p className="text-red-600">It is impossible to meet the required average of {careerRequirement} based on your current grades.</p>
              )}
            </div>

            {/* Graph */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Grades vs {career} Predicted Grade</h2>
              {generateCombinedChartData() && (
                <Line
                  data={generateCombinedChartData()}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 4
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Course_2;
