import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import '../styles/header.css';
import { authService } from '../services/auth';

function Header() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="brand-container" onClick={() => navigate('/')}>
        <ShieldAlert size={32} className="logo-icon" />
        <span className="brand-text">QR LIFE <span>CARE</span></span>
      </div>

      <nav className="nav-menu">
        <a href="#features" className="nav-link">Features</a>
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#about" className="nav-link">About</a>
      </nav>

      <div className="header-actions">
        {isAuthenticated ? (
          <>
            <button className="btn-secondary-glass" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
            <button className="btn-secondary-glass" onClick={() => navigate('/profile')}>
              My Profile
            </button>
            <button className="btn-login-ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="btn-login-ghost" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="btn-register-small" onClick={() => navigate('/register')}>
              Register
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;