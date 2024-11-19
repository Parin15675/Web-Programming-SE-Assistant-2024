import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

const Nav = () => {
  const dispatch = useDispatch();
  const profile = useSelector(state => state.profile);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
        // Scroll down - hide navbar with fade and slide up effect
        setShowNavbar(false);
      } else {
        // Scroll up - show navbar with fade and slide down effect
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div className={`w-full py-8 flex items-center justify-between bg-customBlue text-white p-6 shadow-lg border-b-2 border-black/10 fixed top-0 left-0 right-0 z-50 transition-transform duration-700 ease-in-out ${showNavbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
      {/* Flex container for logo and text */}
      <div className="flex items-center">
        {/* Logo */}
        <img src="/se.png" className="w-20 cursor-pointer" alt="Logo" />
        {/* Text next to logo */}
        <span className="ml-4 text-white text-2xl font-semibold">SE KMITL</span>
      </div>
      <ul className="list-none flex m-0">
        <li className="mx-5 relative">
          <NavLink exact to="/home" activeClassName="bg-teal-700 text-white" className="uppercase no-underline text-white py-2 px-4 bg-white/10 rounded-xl transition-all duration-500 ease-in-out hover:text-teal-400 hover:bg-white/20 shadow-sm">Home</NavLink>
        </li>
        <li className="mx-5 relative">
          <NavLink to="/course" activeClassName="bg-teal-700 text-white" className="uppercase no-underline text-white py-2 px-4 bg-white/10 rounded-xl transition-all duration-500 ease-in-out hover:text-teal-400 hover:bg-white/20 shadow-sm">Course</NavLink>
        </li>
        <li className="mx-5 relative">
          <NavLink to="/schedule" activeClassName="bg-teal-700 text-white" className="uppercase no-underline text-white py-2 px-4 bg-white/10 rounded-xl transition-all duration-500 ease-in-out hover:text-teal-400 hover:bg-white/20 shadow-sm">Schedule</NavLink>
        </li>
        <li className="mx-5 relative">
          <NavLink to="/video" activeClassName="bg-teal-700 text-white" className="uppercase no-underline text-white py-2 px-4 bg-white/10 rounded-xl transition-all duration-500 ease-in-out hover:text-teal-400 hover:bg-white/20 shadow-sm">Video</NavLink>
        </li>
        <li className="mx-5 relative">
          <NavLink to="/book" activeClassName="bg-teal-700 text-white" className="uppercase no-underline text-white py-2 px-4 bg-white/10 rounded-xl transition-all duration-500 ease-in-out hover:text-teal-400 hover:bg-white/20 shadow-sm">Book</NavLink>
        </li>
        <li className="mx-5 relative">
          {profile ? (
            <NavLink to="/" activeClassName="bg-teal-700 text-white" className="uppercase no-underline text-white py-2 px-4 bg-white/10 rounded-xl transition-all duration-500 ease-in-out hover:text-teal-400 hover:bg-white/20 shadow-sm">
              {profile.name}
            </NavLink>
          ) : (
            <NavLink to="/login" activeClassName="bg-teal-700 text-white" className="uppercase no-underline text-white py-2 px-4 bg-white/10 rounded-xl transition-all duration-500 ease-in-out hover:text-teal-400 hover:bg-white/20 shadow-sm">
              You are not logged in
            </NavLink>
          )}
        </li>
      </ul>
    </div>
  );
}

export default Nav;