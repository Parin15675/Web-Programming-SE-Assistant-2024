import React, { useEffect } from "react";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import { gapi } from "gapi-script";
import { useDispatch, useSelector } from "react-redux";
import Nav from "../Nav";

const Login = () => {
  const clientId =
    "989892277796-hr8ep4fu8ecrjn84gadef7655fpoucvb.apps.googleusercontent.com";
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);

  // Check if user is already logged in using localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      dispatch({
        type: "SET_PROFILE",
        payload: parsedProfile,
      });
    }

    const initClient = () => {
      gapi.client.init({
        clientId: clientId,
        scope: "",
      });
    };
    gapi.load("client:auth2", initClient);
  }, [dispatch]);

  const onSuccess = (res) => {
    dispatch({
      type: "SET_PROFILE",
      payload: res.profileObj,
    });
    localStorage.setItem("profile", JSON.stringify(res.profileObj));
  };

  const onFailure = (res) => {
    console.log("Login failure:", res);
  };

  const logOut = () => {
    dispatch({
      type: "LOGOUT",
    });
    localStorage.removeItem("profile");
  };

  const handleImageError = (e) => {
    e.target.src = "default-image-path.jpg";
  };

  return (
    <div>
      <Nav />
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-orange-400 to-red-500">
        <div className="bg-white shadow-lg rounded-lg w-3/4 max-w-lg p-6">
          <h1 className="text-center text-2xl font-extrabold text-gray-800 mb-6">
            React Google Login
          </h1>
          {profile ? (
            <div className="text-center">
              <div className="flex justify-center">
                <img
                  src={profile.imageUrl}
                  alt="user"
                  onError={handleImageError}
                  className="w-24 h-24 rounded-full shadow-md mb-4"
                />
              </div>
              <h2 className="text-lg font-bold text-gray-700">
                {profile.name}
              </h2>
              <p className="text-sm text-gray-600 mb-6">{profile.email}</p>
              <GoogleLogout
                clientId={clientId}
                buttonText="Log out"
                onLogoutSuccess={logOut}
                render={(renderProps) => (
                  <button
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold"
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled}
                  >
                    Log out
                  </button>
                )}
              />
            </div>
          ) : (
            <GoogleLogin
              clientId={clientId}
              buttonText="Sign in with Google"
              onSuccess={onSuccess}
              onFailure={onFailure}
              cookiePolicy={"single_host_origin"}
              isSignedIn={true}
              render={(renderProps) => (
                <button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold"
                  onClick={renderProps.onClick}
                  disabled={renderProps.disabled}
                >
                  Sign in with Google
                </button>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
