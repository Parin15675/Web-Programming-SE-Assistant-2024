import React from 'react'
import Nav from './Nav'
import CalendarNotification from './AlertComponent/CalendarNotification'

const Video = () => {
  const gmail = "parin561a@gmail.com";
  return (
    <div class="banner">
      <Nav></Nav>
      <CalendarNotification gmail={gmail} />
      Home
    </div>
  )
}

export default Video