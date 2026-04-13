import React from 'react';
import { Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import Logo from '../assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <header className="main-navbar">
      <div className="navbar-top-line"></div>
      <div className="navbar-content">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <img src={Logo} alt="GoLog" />
        </div>
        <div className="navbar-actions">
          <button className="icon-btn" aria-label="Search">
            <Search size={22} color="var(--primary-color)" />
          </button>
          <button className="icon-btn" aria-label="Logout">
            <LogOut size={22} color="var(--primary-color)" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
