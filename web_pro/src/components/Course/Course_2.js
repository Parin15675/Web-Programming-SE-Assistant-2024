import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Nav from '../Nav';
import { useSelector } from 'react-redux'; // Import the Redux selector

function Course_2() {
  const [year, setYear] = useState(1);
  const [career, setCareer] = useState(''); // เปลี่ยนค่าเริ่มต้นของ career เป็นค่าว่าง
  const [curriculum, setCurriculum] = useState(null);  // Store curriculum data
  const [isReturningUser, setIsReturningUser] = useState(false);  // Check if the user is returning
  const [selectedSubject, setSelectedSubject] = useState(null);  // Store selected subject for popup
  const [showPopup, setShowPopup] = useState(false);  // Control popup visibility
  const [isLoading, setIsLoading] = useState(true);  // Track loading state

  // Get the profile from Redux (from Google Login)
  const profile = useSelector(state => state.profile);

  useEffect(() => {
    if (profile && profile.email) {  // ตรวจสอบว่ามี profile และ email ถูกต้อง
      console.log('Profile:', profile);  // ตรวจสอบข้อมูลที่ดึงมาได้
      axios.get(`http://localhost:8000/api/user/${profile.email}`)  // ใช้ email แทน name
        .then(res => {
          console.log('User and Curriculum Data:', res.data);
          setCurriculum(res.data.curriculum);  // Set curriculum data
          setYear(res.data.user.year);  // Set year from the user data in database
          setCareer(res.data.user.career || "No career selected");  // Set career จากฐานข้อมูล หากไม่มีให้ใช้ "No career selected"
          setIsReturningUser(true);  // Mark as returning user
          setIsLoading(false);  // Set loading state to false
        })
        .catch(err => {
          console.error('Error:', err);
          setIsReturningUser(false);  // If user not found, mark as new user
          setIsLoading(false);  // Set loading state to false
        });
    } else {
      setIsLoading(false);  // ถ้าไม่มีโปรไฟล์ ให้หยุดโหลด
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
      gmail: profile.email,  // ดึง email จาก profile
      year,
      career,  // ส่งข้อมูลสายอาชีพไปด้วย
    };

    axios.post('http://localhost:8000/api/user/', userData)
      .then(res => {
        console.log('User and Curriculum Data:', res.data);
        setCurriculum(res.data.curriculum);  // ตั้งค่า curriculum
        setIsReturningUser(true);  // Set user as returning user
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

  if (isLoading) {
    return <div>Loading...</div>;  // แสดงข้อความขณะโหลด
  }

  return (
    <>
      <Nav></Nav>
      <div className="App">
        <h1>Register and Get Curriculum</h1>

        {profile && (
          <>
            <label>
              Name: {profile.name} ({profile.email}) {/* Show both name and email */}
            </label>

            {/* If the user already exists, display their year and career */}
            {isReturningUser ? (
              <>
                <p>Year: {year}, Career Interest: {career}</p> {/* แสดงอาชีพที่เลือก */}
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
                  Select Career Interest: {/* New career selection */}
                  <select value={career} onChange={(e) => setCareer(e.target.value)}>
                    <option value="">Select a Career</option>
                    <option value="Data Analysis">Data Analysis</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                {/* Button for manual submit (if needed in case of new user) */}
                <button onClick={handleSubmit}>
                  Submit
                </button>
              </>
            )}
          </>
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
