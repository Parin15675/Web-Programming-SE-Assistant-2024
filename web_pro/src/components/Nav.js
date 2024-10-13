import './Nav.css'; 
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

const Nav = () => {
  const dispatch = useDispatch();
  const profile = useSelector(state => state.profile);
  const [showNavbar, setShowNavbar] = useState(true); // State to control navbar visibility
  const [lastScrollY, setLastScrollY] = useState(0);  // To track the last scroll position

  useEffect(() => {
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile) {
          dispatch({
              type: 'SET_PROFILE',
              payload: JSON.parse(storedProfile),
          });
      }
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll down - hide navbar if scrolled more than 100px
        setShowNavbar(false);
      } else {
        // Scroll up - show navbar
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY); // Update lastScrollY with the current value
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll); // Clean up event listener on component unmount
    };
  }, [lastScrollY]);

  return (
    <div className={`navbar ${showNavbar ? '' : 'navbar-hidden'}`}>  {/* Add class based on scroll */}
      <img src="/se.png" className="logo" alt="Logo" />
      <ul>
        <li>
          <NavLink exact to="/" activeClassName="active">Home</NavLink>
        </li>
        <li>
          <NavLink to="/course" activeClassName="active">Course</NavLink>
        </li>
        <li>
          <NavLink to="/schedule" activeClassName="active">Schedule</NavLink>
        </li>
        <li>
          <NavLink to="/video" activeClassName="active">Video</NavLink>
        </li>
        <li>
          <NavLink to="/book" activeClassName="active">Book</NavLink>
        </li>
        <li>
          {profile ? (
            <NavLink to="/profile" activeClassName="active">
              {profile.name}
            </NavLink>
          ) : (
            <NavLink to="/login" activeClassName="active">You are not logged in</NavLink>
          )}
        </li>
      </ul>
    </div>
  );
}

export default Nav;
