import React from 'react'
import Nav from './Nav'

const Course = () => {
  return (
    <div >
      <Nav></Nav>
      <div style={{ width: '100vw', height: '100vh', display: 'flex', background: '#FF9F66', flexDirection: 'row' }}>
       
        <div style={{ width: '83vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#FF9F66' }}>
          <div style={{ width: 596, height: 116, color: 'black', fontSize: 96, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>Your Course</div>

          <div style={{ width: 915, height: 124, background: '#FF5F00', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px'}}>
            <div style={{ width: 800, height: 81, color: 'white', fontSize: 32, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>
              DATA STRUCTURE AND ALGORITHM<br />TEACHER:
            </div>
          </div>

          <div style={{ width: 915, height: 124, background: '#FF5F00', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',  marginBottom: '40px' }}>
            <div style={{ width: 800, height: 81, color: 'white', fontSize: 32, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>
              PROBABILITY AND STATISTIC<br />TEACHER:
            </div>
          </div>

          <div style={{ width: 915, height: 124, background: '#FF5F00', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',  marginBottom: '40px' }}>
            <div style={{ width: 800, height: 81, color: 'white', fontSize: 32, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>
              WEB PROGRAMMING<br />TEACHER:
            </div>
          </div>

          <div style={{ width: 915, height: 124, background: '#FF5F00', borderRadius: 16, display: 'flex', alignItems: 'center',  justifyContent: 'center', marginBottom: '40px' }}>
            <div style={{ width: 800, height: 81, color: 'white', fontSize: 32, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>
              COMPUTER ARCHITECTURE AND ORGANIZATION<br />TEACHER:
            </div>
          </div>

          
        </div>
      </div>
    </div>
  )
}

export default Course
