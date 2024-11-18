import React from 'react'
import Nav from './Nav'
import Calendar from './Calendar/Calendar'

const schedule = () => {
  return (
    <div className="bg-slate-300 min-h-screen pt-32">
      <Nav></Nav>
      <div className="mt-6">
        <div className="main-calendar">
          <Calendar showAddVideoButton={true} />
        </div>
      </div>
    </div>
  )
}

export default schedule