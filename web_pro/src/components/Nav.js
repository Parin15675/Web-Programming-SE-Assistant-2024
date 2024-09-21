import { Link } from 'react-router-dom'

import React from 'react';

const Nav = () => {

    return (
        <div style={{ width: 255, height: 936, left: 30, top: 45, position: 'absolute', background: '#002379', borderRadius: 16, textAlign: 'center' }} >
            <Link to='/' style={{ width: 255, height: 57, textAlign: 'center', color: 'white', fontSize: 40, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>adddfdfsdfddHOME</Link>
            <br />
            <Link to='/coe' style={{ width: 255, height: 57, left: 107, top: 381, textAlign: 'center', color: 'white', fontSize: 40, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>COURSE</Link>
            <br />
            <Link to='/schedule' style={{ width: 255, height: 61, left: 68, top: 451, textAlign: 'center', color: 'white', fontSize: 40, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>SCHEDULE</Link>
            <br />
            <Link to='/video' style={{ width: 255, height: 61, left: 107, top: 525, textAlign: 'center', color: 'white', fontSize: 40, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>VIDEO</Link>
            <br />
            <Link to='/book' style={{ width: 255, height: 55, left: 124, top: 599, textAlign: 'center', color: 'white', fontSize: 40, fontFamily: 'Koulen', fontWeight: '400', wordWrap: 'break-word' }}>BOOK</Link>
        </div>
    )
}

export default Nav