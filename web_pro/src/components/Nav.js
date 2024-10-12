import './Nav.css'; 
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import React, { useEffect } from 'react';

const Nav = () => {
  const dispatch = useDispatch();
  const profile = useSelector(state => state.profile);

  useEffect(() => {
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile) {
          dispatch({
              type: 'SET_PROFILE',
              payload: JSON.parse(storedProfile),
          });
      }
  }, [dispatch]);

  return (
    <div className="banner">
      <div className="navbar">
        <img src="/se.png" className="logo" alt="Logo" />
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/course">Course</Link></li>
          <li><Link to="/schedule">Schedule</Link></li>
          <li><Link to="/video">video</Link></li>
          <li><Link to="/book">Book</Link></li>
          
          <li>
            {profile ? (
              // ถ้าล็อกอินแล้ว จะแสดงชื่อผู้ใช้และรูปภาพพร้อมลิงก์ไปยังโปรไฟล์
              <Link to="/profile">
                {profile.name} 
                {/* <img 
                  src={profile.imageUrl} 
                  alt="user"
                  onError={(e) => e.target.src = 'default-image-path.jpg'} 
                  style={{ width: '30px', borderRadius: '50%', marginLeft: '10px' }}
                /> */}
              </Link>
            ) : (
              // ถ้ายังไม่ล็อกอิน จะแสดงลิงก์ไปยังหน้าล็อกอิน
              <Link to="/login">You are not logged in</Link>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Nav;