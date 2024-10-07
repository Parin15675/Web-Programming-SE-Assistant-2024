import logo from './logo.svg';
import './App.css';
import Nav from './components/Nav';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

function App() {

  const dispatch = useDispatch();

  useEffect(() => {
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile) {
          dispatch({
              type: 'SET_PROFILE',
              payload: JSON.parse(storedProfile),
          });
      }
  }, [dispatch]);

  return (
    <div className="App">
        <Nav />
    </div>
  );
}

export default App;
