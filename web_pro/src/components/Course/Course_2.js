import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Nav from '../Nav';
import { useSelector } from 'react-redux';
import StarRatingComponent from 'react-star-rating-component';
import { Line } from 'react-chartjs-2';  // We will use Line chart for both datasets
import 'chart.js/auto'; // Import Chart.js
import "./Course_2.css";

function Course_2() {
  const [year, setYear] = useState(1);
  const [curriculum, setCurriculum] = useState(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [career, setCareer] = useState('');  // Hold the career from backend
  const [careerImportance, setCareerImportance] = useState({});

  const profile = useSelector(state => state.profile);
  
  

  useEffect(() => {
    if (profile && profile.email) {
      axios.get(`http://localhost:8000/api/user/${encodeURIComponent(profile.email)}`)
        .then(res => {
          setCurriculum(res.data.curriculum);
          setYear(res.data.user.year);
          setCareer(res.data.user.career || "No career selected");  // Set career from backend
          setIsReturningUser(true);

          if (res.data.user && res.data.user.ratings) {
            const updatedRatings = {};
            res.data.curriculum.subjects.forEach((subject) => {
              updatedRatings[subject.name] = res.data.user.ratings[subject.name] || 0;
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

  // Predefined importance levels based on career
  useEffect(() => {
    const careerImportanceLevels = {
      "Data Analysis": {
        "Math 101": 4,
        "Physics 101": 3,
        "Programming 101": 5,
        // Add other subjects and their importance
      },
      "Software Engineer": {
        "Math 101": 3,
        "Physics 101": 2,
        "Programming 101": 5,
      },
      "Web Development": {
        "Math 101": 2,
        "Physics 101": 1,
        "Programming 101": 5,
      },
      "Other": {
        "Math 101": 3,
        "Physics 101": 3,
        "Programming 101": 3,
      }
    };

    setCareerImportance(careerImportanceLevels[career] || {});
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

  // Generate data for the Line Chart (combined graph)
  const generateCombinedChartData = () => {
    if (!curriculum || !careerImportance) return null;

    const labels = curriculum.subjects.map(subject => subject.name);
    const userRatingsData = labels.map(subjectName => ratings[subjectName] || 0);  // User's ratings
    const careerImportanceData = labels.map(subjectName => careerImportance[subjectName] || 0);  // Career importance

    return {
      labels,
      datasets: [
        {
          label: 'User Ratings',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          data: userRatingsData
        },
        {
          label: `${career} Career Importance`,
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(153,102,255,0.4)',
          borderColor: 'rgba(153,102,255,1)',
          data: careerImportanceData
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
      <div className="App">
        <h1>Register and Get Curriculum</h1>

        {profile && (
          <>
            <label>
              Name: {profile.name} ({profile.email})
            </label>

            {isReturningUser ? (
              <>
                <p>Year: {year}, Career Interest: {career}</p>
              </>
            ) : (
              <>
                <label>
                  Select Year:
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </label>

                <label>
                  Select Career Interest:
                  <select value={career} onChange={(e) => setCareer(e.target.value)}>
                    <option value="">Select a Career</option>
                    <option value="Data Analysis">Data Analysis</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <button onClick={handleSubmit}>
                  Submit
                </button>
              </>
            )}
          </>
        )}

        {curriculum && (
          <div className="content-container">
            <div className="subject-list">
              <h2>Curriculum for Year {curriculum.year}</h2>
              <div className="subject-container">
                {curriculum.subjects && curriculum.subjects.map((subject, index) => (
                  <div key={index} className="subject-wrapper">
                    <div
                      className="subject-box"
                      onClick={() => handleSubjectClick(subject)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h3>{subject.name}</h3>
                    </div>

                    {/* Popup for subject details and rating */}
                    {showPopup && selectedSubject === subject && (
                      <div className="popup">
                        <div className="popup-content">
                          <h3>Subject Details</h3>
                          <p>Subject: {subject.name}</p>
                          <p>Description: {subject.description}</p>
                          
                          {/* Star rating inside the popup */}
                          <div className="star-rating">
                            <h3>Your Rating:</h3>
                            <StarRatingComponent
                              name={subject.name}
                              starCount={10}
                              value={ratings[subject.name] || 0}
                              onStarClick={(nextValue, prevValue) => onStarClick(nextValue, prevValue, index)}
                            />
                          </div>

                          <button onClick={handleClosePopup}>Close</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container">
              <h2>User Ratings vs {career} Importance</h2>
              {generateCombinedChartData() && (
                <Line
                  data={generateCombinedChartData()}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 10
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Course_2;