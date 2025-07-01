import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logoImage from './LOGO.png'
import Profile from './components/UserProfile';

const Header = ({ signOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef();

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const toggleProfile = () => {
    setShowProfile(prev => !prev);
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
    <header className="fitbit-header">
      <div className="logo">
        <img src={logoImage} alt="Awesome Nutrition Logo" className="logo-img" />
      </div>
      <nav className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/diet">Diet-Generator</Link>
          <Link to="#">Community</Link>
      </nav>
      <div className="profile-wrapper" ref={menuRef}>
        <div className="profile-icon" onClick={toggleMenu}>👤</div>
        {menuOpen && (
          <div className="profile-dropdown">
            <p onClick={toggleProfile}>User Profile</p>
            <p onClick={signOut} style={{cursor:'pointer'}}>Logout</p>
          </div>
        )}
      </div>
    </header>

    {showProfile && (
      <div className="profile-slideout">
        <button className="close-profile" onClick={() => setShowProfile(false)}>✖</button>
        <Profile />
      </div>
    )}
    </>
  );
};

export default Header;