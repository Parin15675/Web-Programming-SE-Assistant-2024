import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './components/store'; // Import the store
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Home';
import Schedule from './components/Schedule';
import Video from './components/Video';
import Book from './components/Book';
import Course from './components/Course';

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
    element: <Course />
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
