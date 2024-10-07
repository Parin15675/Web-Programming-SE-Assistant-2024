import React, { useEffect } from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { gapi } from 'gapi-script';
import { useDispatch, useSelector } from 'react-redux';  
import Nav from '../Nav';

const Login = () => {
    const clientId = "989892277796-hr8ep4fu8ecrjn84gadef7655fpoucvb.apps.googleusercontent.com";
    const dispatch = useDispatch();
    const profile = useSelector(state => state.profile); 

    // Check if user is already logged in using localStorage
    useEffect(() => {
        const storedProfile = localStorage.getItem('profile'); // Get profile from localStorage
        console.log("Stored profile from localStorage:", storedProfile); // Debug: Check stored profile
        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            console.log("Parsed profile:", parsedProfile); // Debug: Check parsed profile
            dispatch({
                type: 'SET_PROFILE',
                payload: parsedProfile // Set profile to Redux
            });
        }
        
        const initClient = () => {
            gapi.client.init({
                clientId: clientId,
                scope: ''
            });
        };
        gapi.load("client:auth2", initClient);
    }, [dispatch]);

    const onSuccess = (res) => {
        console.log('Login success response:', res); // Debug: Check login response
        dispatch({
            type: 'SET_PROFILE',
            payload: res.profileObj
        });
        localStorage.setItem('profile', JSON.stringify(res.profileObj)); // Store profile in localStorage
        console.log('Profile saved in localStorage:', res.profileObj); // Debug: Confirm saving profile
    };

    const onFailure = (res) => {
        console.log('Login failure response:', res); // Debug: Check failure response
    };

    const logOut = () => {
        dispatch({
            type: 'LOGOUT'
        });
        localStorage.removeItem('profile'); // Remove profile from localStorage when logged out
        console.log('Profile removed from localStorage'); // Debug: Confirm profile removal
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
