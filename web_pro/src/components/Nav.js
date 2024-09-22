import React from 'react';
import './homestyle.css'; 
import Login from './Login';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Nav = () => {

  const profile = useSelector(state => state.profile);  // Get the profile from Redux store

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
          <li>{profile ? <p>{profile.name} <img src={profile.imageUrl} alt="user image" onError={(e) => e.target.src = 'default-image-path.jpg'} /></p> : <p>You are not logged in.</p>}</li>
          
        </ul>
      </div>
    </div>
  );
}

export default Nav;
