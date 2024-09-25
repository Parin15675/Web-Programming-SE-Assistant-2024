import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Nav from '../Nav';
import { useSelector } from 'react-redux'; // Import the Redux selector

function Course_2() {
  const [year, setYear] = useState(1);
  const [curriculum, setCurriculum] = useState(null);  // Store curriculum data
  const [isReturningUser, setIsReturningUser] = useState(false);  // Check if the user is returning
  const [selectedSubject, setSelectedSubject] = useState(null);  // Store selected subject for popup
  const [showPopup, setShowPopup] = useState(false);  // Control popup visibility


  // Get the profile from Redux (from Google Login)
  const profile = useSelector(state => state.profile);

  useEffect(() => {
    if (profile) {
      // Check if the user already exists in the database
      axios.get(`http://localhost:8000/api/user/${profile.name}`)
        .then(res => {
          console.log('User and Curriculum Data:', res.data);
          setCurriculum(res.data.curriculum);  // Set curriculum data
          setIsReturningUser(true);  // Mark as returning user
        })
        .catch(err => {
          console.error('Error:', err);
          setIsReturningUser(false);  // If user not found, mark as new user
        });
    }
  }, [profile]);

  // Handle form submit to create new user and get curriculum
  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = { name: profile.name, year };

    // Post new user data
    axios.post('http://localhost:8000/api/user/', userData)
      .then(res => {
        console.log('User and Curriculum Data:', res.data);
        setCurriculum(res.data.curriculum);  // Set curriculum data
      })
      .catch(err => {
        console.error('Error:', err);
      });
  };

  // Handle subject click to show popup with details
  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);  // Set selected subject
    setShowPopup(true);  // Show popup
  };

  // Handle closing the popup
  const handleClosePopup = () => {
    setShowPopup(false);  // Hide popup
  };

  return (
    <>
    <Nav></Nav>
    <div className="App">
      <h1>Register and Get Curriculum</h1>

      {profile && (
        <form onSubmit={handleSubmit}>
          <label>
            Name: {profile.name}
          </label>

          {!isReturningUser && (
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

              <button type="submit">Submit</button>
            </>
          )}
        </form>
      )}

      {/* Display curriculum */}
      {curriculum && (
        <div>
          <h2>Curriculum for Year {curriculum.year}</h2>
          <ul>
            {curriculum.subjects.map((subject, index) => (
              <li key={index} onClick={() => handleSubjectClick(subject)} style={{ cursor: 'pointer' }}>
                {subject.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popup for subject details */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Subject Details</h3>
            <p>Subject: {selectedSubject.name}</p>
            <p>Description: {selectedSubject.description}</p>
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default Course_2;
