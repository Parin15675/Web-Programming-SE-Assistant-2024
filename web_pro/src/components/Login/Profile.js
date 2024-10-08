import React from 'react';
import { GoogleLogout } from 'react-google-login';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar, Typography, Container } from '@mui/material';
import Nav from '../Nav';
import './profile.css';

const Profile = () => {
  const profile = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logOut = () => {
    dispatch({
      type: 'LOGOUT'
    });
    navigate('/login');
  };

  return (
    <>
      <Nav />
      <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '50px' }}>
        {profile ? (
          <div>
            <Typography variant="h3" gutterBottom>Profile</Typography>
            <Avatar src={profile.imageUrl} alt={profile.name} sx={{ width: 150, height: 150, margin: '20px auto' }} />
            <Typography variant="h5">Name: {profile.name}</Typography>
            <Typography variant="h6">Email: {profile.email}</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ marginTop: 3 }}
              onClick={logOut}
            >
              Log out
            </Button>
          </div>
        ) : (
          <Typography variant="h6">No user logged in</Typography>
        )}
      </Container>
    </>
  );
}

export default Profile;
