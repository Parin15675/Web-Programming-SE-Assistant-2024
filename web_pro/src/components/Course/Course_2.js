import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Nav from '../Nav';
import { useSelector } from 'react-redux';
import StarRatingComponent from 'react-star-rating-component';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Import Chart.js
import "./Course_2.css";

function Course_2() {
  const [year, setYear] = useState(1);
  const [career, setCareer] = useState('');
  const [curriculum, setCurriculum] = useState(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState({});

  const profile = useSelector(state => state.profile);

  useEffect(() => {
    if (profile && profile.email) {
      axios.get(`http://localhost:8000/api/user/${profile.email}`)
        .then(res => {
          setCurriculum(res.data.curriculum);
          setYear(res.data.user.year);
          setCareer(res.data.user.career || "No career selected");
          setIsReturningUser(true);
          setIsLoading(false);
        })
        .catch(err => {
          setIsReturningUser(false);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [profile]);

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
    setRatings({ ...ratings, [index]: nextValue });
    axios.post(`http://localhost:8000/api/user/rating`, {
      name: profile.name,
      subjectIndex: index,
      rating: nextValue,
    }).catch(err => {
      console.error('Error:', err);
    });
  };

  // Generate data for the Bar Chart
  const generateChartData = () => {
    if (!curriculum) return null;

    const labels = curriculum.subjects.map(subject => subject.name);
    const data = labels.map((_, index) => ratings[index] || 0); // Get ratings for each subject, default to 0

    return {
      labels,
      datasets: [
        {
          label: 'User Ratings',
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(75,192,192,0.6)',
          hoverBorderColor: 'rgba(75,192,192,1)',
          data
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
                          <div className="rating-section">
                            <h4>Rate this subject:</h4>
                            <StarRatingComponent 
                              name={`rating-${index}`} 
                              starCount={5}
                              value={ratings[index] || 0}
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

            {/* Display the Bar Chart on the right */}
            <div className="chart-container">
              {generateChartData() && (
                <>
                  <h3>User Rating Chart</h3>
                  <Bar
                    data={generateChartData()}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 5
                        }
                      }
                    }}
                    width={300}  // Adjust the width of the chart
                    height={200}  // Adjust the height of the chart
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Course_2;
