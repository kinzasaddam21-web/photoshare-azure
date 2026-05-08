import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </span>
          <span className="brand-text">PhotoShare</span>
        </Link>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Feed
          </NavLink>
          {user && user.role === 'admin' && (
            <NavLink to="/upload" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Upload
            </NavLink>
          )}

          <span className="nav-divider" aria-hidden="true" />

          {user ? (
            <div className="user-pill">
              <span className={`badge ${user.role === 'admin' ? 'creator' : 'user'}`}>
                {user.role === 'admin' ? 'Creator' : 'User'}
              </span>
              <span className="user-name">{user.username}</span>
              <button onClick={handleLogout} className="btn-icon" aria-label="Logout" title="Logout">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          ) : (
            <div className="auth-actions">
              <NavLink to="/login" className="nav-link">Login</NavLink>
              <Link to="/register" className="btn btn-sm">Sign up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
