import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Schedule from './components/Schedule';
import Video from './components/Video';
import Book from './components/Book';
import Coe from './components/Coe';

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
    path: "coe",
    element: <Coe />
  },

])

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
