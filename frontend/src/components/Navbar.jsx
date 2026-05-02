import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-card" style={{ margin: '1rem 2rem', padding: '1rem 2rem', borderRadius: '24px' }}>
      <div className="flex-between">
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TaskManager
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {user ? (
            <>
              <Link to="/" className="nav-link">Dashboard</Link>
              <Link to="/projects" className="nav-link">Projects</Link>
              <Link to="/tasks" className="nav-link">Tasks</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{user.full_name} ({user.role})</span>
                <button onClick={handleLogout} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
      <style>{`
        .nav-link {
          color: var(--text-muted);
          transition: color 0.3s;
          font-weight: 500;
        }
        .nav-link:hover {
          color: var(--text-main);
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
