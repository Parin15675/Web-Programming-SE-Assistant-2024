import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Nav from "../Nav";

const Profile = () => {
  const profile = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({
    year: "",
    career: "",
    field: "",
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const careers = [
    "Data Analysis",
    "Software Engineer",
    "Web Development",
    "Other",
  ];
  const fields = ["AI", "Metaverse", "IoT", "Do Abroad"];

  const logOut = () => {
    dispatch({
      type: "LOGOUT",
    });
    navigate("/login");
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (profile && profile.email) {
        try {
          setLoading(true);
          const response = await fetch(
            `http://localhost:8000/api/user/${profile.email}`
          );
          if (response.ok) {
            const data = await response.json();
            setUserDetails({
              year: data.year || "",
              career: data.career || "",
              field: data.field || "",
            });
          } else {
            console.error("Failed to fetch user details");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserDetails();
  }, [profile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setUserDetails((prevDetails) => ({
      ...prevDetails,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/user/${profile.email}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            year: userDetails.year || undefined,
            career: userDetails.career || undefined,
            field: userDetails.field || undefined,
          }),
        }
      );

      if (response.ok) {
        alert("Profile updated successfully");
        setIsEditing(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  return (
    <>
      <Nav />
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-navy-800 via-navy-600 to-navy-900">
        <div className="bg-navy-500/80 shadow-lg rounded-lg w-3/4 max-w-2xl p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent border-solid rounded-full animate-spin"></div>
            </div>
          ) : profile ? (
            <div>
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden shadow-md">
                  <img
                    src={profile.imageUrl || "/default-avatar.png"}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-2xl font-bold mt-4 text-white">
                  {profile.name}
                </h1>
                <p className="text-white">{profile.email}</p>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Year
                      </label>
                      <select
                        value={userDetails.year}
                        onChange={(e) =>
                          handleInputChange("year", e.target.value)
                        }
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="" disabled>
                          Select Year
                        </option>
                        {[1, 2, 3, 4].map((year) => (
                          <option key={year} value={year}>
                            Year {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Career
                      </label>
                      <select
                        value={userDetails.career}
                        onChange={(e) =>
                          handleInputChange("career", e.target.value)
                        }
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="" disabled>
                          Select Career
                        </option>
                        {careers.map((career) => (
                          <option key={career} value={career}>
                            {career}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Field
                      </label>
                      <select
                        value={userDetails.field}
                        onChange={(e) =>
                          handleInputChange("field", e.target.value)
                        }
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="" disabled>
                          Select Field
                        </option>
                        {fields.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="text-gray-700">
                        <span className="font-semibold">Year:</span>{" "}
                        {userDetails.year || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="text-gray-700">
                        <span className="font-semibold">Career:</span>{" "}
                        {userDetails.career || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="text-gray-700">
                        <span className="font-semibold">Field:</span>{" "}
                        {userDetails.field || "Not specified"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditToggle}
                      class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={logOut}
                  class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-700">No user logged in</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
