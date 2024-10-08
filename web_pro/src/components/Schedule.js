import React from 'react'
import Nav from './Nav'
import Calendar from './Calendar/Calendar'
import YoutubeSearch from './Calendar/YoutubeSearch'

const schedule = () => {
  return (
    <div class="banner">
      <Nav></Nav>
      <Calendar/>
      <YoutubeSearch/>
    </div>
  )
}

export default schedule