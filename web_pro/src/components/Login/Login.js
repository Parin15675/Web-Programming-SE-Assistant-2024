import React, { useEffect } from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { gapi } from 'gapi-script';
import { useDispatch, useSelector } from 'react-redux';  // Import dispatch and selector hooks
import Nav from '../Nav';

const Login = () => {
    const clientId = "989892277796-hr8ep4fu8ecrjn84gadef7655fpoucvb.apps.googleusercontent.com";
    const dispatch = useDispatch();
    const profile = useSelector(state => state.profile);  // Get the profile from Redux store

    useEffect(() => {
      const initClient = () => {
        gapi.client.init({
          clientId: clientId,
          scope: ''
        });
      };
      gapi.load("client:auth2", initClient);
    }, []);
  
    const onSuccess = (res) => {
      dispatch({
        type: 'SET_PROFILE',
        payload: res.profileObj  // Set the profile in Redux
      });
      console.log('Success:', res);
    };
  
    const onFailure = (res) => {
      console.log('Failure:', res);
    };
  
    const logOut = () => {
      dispatch({
        type: 'LOGOUT'  // Clear the profile from Redux
      });
    };
  
    return (
      <div>
        <Nav></Nav>
        <h2>React Google Login</h2>
        <br />
        {profile ? (
          <>
            <img src={profile.imageUrl} alt="user image" onError={(e) => e.target.src = 'default-image-path.jpg'} />
            <h3>User Logged In</h3>
            <p>Name: {profile.name}</p>
            <p>Email: {profile.email}</p>
            <br />
            <GoogleLogout clientId={clientId} buttonText='Log out' onLogoutSuccess={logOut} />
          </>
        ) : (
          <GoogleLogin
            clientId={clientId}
            buttonText="Sign in with Google"
            onSuccess={onSuccess}
            onFailure={onFailure}
            cookiePolicy={'single_host_origin'}
            isSignedIn={true}
          />
        )}
      </div>
    );
}

export default Login;
