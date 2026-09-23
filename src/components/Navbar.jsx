import React from 'react';
import { Menu, X, LogOut, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import Logo from '../assets/logo.png';
import { authService } from '../services/authService';

const Navbar = ({ onToggleMobileMenu, isMobileOpen }) => {
  const navigate = useNavigate();
  const userRole = authService.getUserRole();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="main-navbar">
      <div className="navbar-accent-bar"></div>
      <div className="navbar-content">
        <div className="navbar-left">
          <button 
            className="mobile-menu-toggle" 
            onClick={onToggleMobileMenu} 
            aria-label="Toggle Menu"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <img src={Logo} alt="GoLog TMS" />
            <span className="brand-badge">TMS</span>
          </div>
        </div>

        <div className="navbar-actions">
          {userRole && (
            <div className="user-profile-badge">
              <ShieldCheck size={16} className="role-icon" />
              <span className="role-name">{userRole}</span>
            </div>
          )}

          <button className="logout-btn" onClick={handleLogout} title="Sair do sistema">
            <LogOut size={18} />
            <span className="logout-text">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
