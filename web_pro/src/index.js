import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './components/store'; // Import the store
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Home';
import Schedule from './components/Schedule';
import Video from './components/Video';
import Book from './components/Book';
import Course_2 from './components/Course/Course_2';
import Login from './components/Login/Login';
import Profile from './components/Login/Profile';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "schedule",
    element: <Schedule />
  },
  {
    path: "video",
    element: <Video />
  },
  {
    path: "book",
    element: <Book />
  },
  {
    path: "course",
    element: <Course_2 />
  },
  {
    path: "login",
    element: <Login />
  },
  {
    path: "profile",
    element: <Profile />
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);

// Performance logging
reportWebVitals();
