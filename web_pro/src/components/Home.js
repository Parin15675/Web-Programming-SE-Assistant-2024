import React from 'react'
import Nav from './Nav'
import CalendarNotification from './CalendarNotification/CalendarNotification'
import Calendar from './Calendar/Calendar'

const Video = () => {
  return (
    <div class="banner">
      <Nav></Nav>
      <h1>Good Morning</h1>
      <CalendarNotification/>
      <Calendar/>
    </div>
  )
}

export default Video