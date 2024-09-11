import React from 'react'
import Nav from './Nav'

const Video = () => {
  return (
    <>
      <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#FF9F66', flexDirection: 'row' }}>
        <div style={{ width: '17vw', height: '100vh',  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Cluebox
        </div>
        <div style={{ width: '70vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#FF9F66', alignItems: 'center', justifyContent: 'center' }}>
          Video
          <Nav />
        </div>
      </div>
    </>
  )
}

export default Video
