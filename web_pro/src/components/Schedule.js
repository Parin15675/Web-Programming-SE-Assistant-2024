import React from 'react'
import Nav from './Nav'
import Calendar from './Calendar/Calendar'
import YoutubeSearch from './Calendar/YoutubeSearch'

const schedule = () => {
  return (
    <div className="bg-slate-300 pt-32">
      <Nav></Nav>
      <Calendar/>
      <YoutubeSearch/>
    </div>
  )
}

export default schedule