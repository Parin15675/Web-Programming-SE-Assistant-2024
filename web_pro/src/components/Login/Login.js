import React, { useEffect } from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { gapi } from 'gapi-script';
import { useDispatch, useSelector } from 'react-redux';
import Nav from '../Nav';
import { Container, Card, CardContent, Typography, Button, Avatar } from '@mui/material'; // Material UI components
import './Login.css'; // Import CSS for additional styling

const Login = () => {
    const clientId = "989892277796-hr8ep4fu8ecrjn84gadef7655fpoucvb.apps.googleusercontent.com";
    const dispatch = useDispatch();
    const profile = useSelector(state => state.profile); 

    // Check if user is already logged in using localStorage
    useEffect(() => {
        const storedProfile = localStorage.getItem('profile'); // Get profile from localStorage
        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
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
        dispatch({
            type: 'SET_PROFILE',
            payload: res.profileObj
        });
        localStorage.setItem('profile', JSON.stringify(res.profileObj)); // Store profile in localStorage
    };

    const onFailure = (res) => {
        console.log('Login failure:', res); // Debug: Check failure response
    };

    const logOut = () => {
        dispatch({
            type: 'LOGOUT'
        });
        localStorage.removeItem('profile'); // Remove profile from localStorage when logged out
    };

    const handleImageError = (e) => {
        e.target.src = 'default-image-path.jpg'; // Replace this with your actual default image path
    };

    return (
        <div>
            <Nav /> {/* Navigation bar */}
            <Container className="login-container" maxWidth="sm">
                <Card className="login-card" raised>
                    <CardContent>
                        <Typography variant="h4" gutterBottom align="center">
                            React Google Login
                        </Typography>

                        {profile ? (
                            <>
                                <div className="profile-section">
                                    <Avatar
                                        src={profile.imageUrl}
                                        alt="user image"
                                        onError={handleImageError}
                                        sx={{ width: 100, height: 100 }}
                                        className="profile-avatar"
                                    />
                                    <Typography variant="h6" align="center">User Logged In</Typography>
                                    <Typography variant="body1" align="center">Name: {profile.name}</Typography>
                                    <Typography variant="body1" align="center">Email: {profile.email}</Typography>
                                    <br />
                                    <GoogleLogout
                                        clientId={clientId}
                                        buttonText='Log out'
                                        onLogoutSuccess={logOut}
                                        render={renderProps => (
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={renderProps.onClick}
                                                disabled={renderProps.disabled}
                                                fullWidth
                                            >
                                                Log out
                                            </Button>
                                        )}
                                    />
                                </div>
                            </>
                        ) : (
                            <GoogleLogin
                                clientId={clientId}
                                buttonText="Sign in with Google"
                                onSuccess={onSuccess}
                                onFailure={onFailure}
                                cookiePolicy={'single_host_origin'}
                                isSignedIn={true}
                                render={renderProps => (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={renderProps.onClick}
                                        disabled={renderProps.disabled}
                                        fullWidth
                                    >
                                        Sign in with Google
                                    </Button>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>
            </Container>
        </div>
    );
}

export default Login;
