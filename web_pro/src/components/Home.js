import React from 'react';
import './homestyle.css'; 
import Login from './Login';
import { useSelector } from 'react-redux'; 

const Home = () => {

  const profile = useSelector(state => state.profile);  // Get the profile from Redux store

  return (
    <div className="banner">
      <div className="navbar">
        <img src="/se.png" className="logo" alt="Logo" />
        <ul>
          <li><a href="video">Home</a></li>
          <li><a href="#">Course</a></li>
          <li><a href="#">Schedule</a></li>
          <li><a href="#">Video</a></li>
          <li><a href="#">Book</a></li>
          <li>{profile ? <p>{profile.name} <img src={profile.imageUrl} alt="user image" onError={(e) => e.target.src = 'default-image-path.jpg'} /></p> : <p>You are not logged in.</p>}</li>
          
        </ul>
      </div>
      <div className="content">
        <Login/>
      </div>
    </div>
  );
}

export default Home;
