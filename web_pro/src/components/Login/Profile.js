import React from 'react';
import { GoogleLogout } from 'react-google-login';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Nav from '../Nav';

const Profile = () => {
  const profile = useSelector(state => state.profile);  // ดึงข้อมูลโปรไฟล์จาก Redux store
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logOut = () => {
    dispatch({
      type: 'LOGOUT'  // เมื่อกดล้อกเอาท์จะลบข้อมูลโปรไฟล์
    });
    navigate('/login');  // หลังจากล้อกเอาท์ให้ไปที่หน้า login
  };

  return (
    <div className="profile">
    <Nav></Nav>
      {profile ? (
        <div>
          <h1>Profile</h1>
          <img src={profile.imageUrl} alt={profile.name} />
          <p>Name: {profile.name}</p>
          <p>Email: {profile.email}</p>
          <GoogleLogout clientId="YOUR_GOOGLE_CLIENT_ID" buttonText="Log out" onLogoutSuccess={logOut} />
        </div>
      ) : (
        <p>No user logged in</p>
      )}
    </div>
  );
}

export default Profile;
