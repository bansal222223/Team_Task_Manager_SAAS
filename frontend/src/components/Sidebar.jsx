import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span style={{ fontWeight: 600, fontSize: '18px', color: 'white' }}>TaskManager</span>
      </div>
      
      <div style={{ padding: '16px 16px 0' }}>
        <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px' }} onClick={() => navigate('/tasks')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Task
        </button>
      </div>

      <div className="sidebar-nav">
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', fontWeight: 600, marginTop: '16px' }}>My tasks</div>
        
        <Link to="/tasks" className={`nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          All tasks
        </Link>
        
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          Dashboard
        </Link>

        <Link to="/projects" className={`nav-item ${location.pathname === '/projects' ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          Projects
        </Link>
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{user.full_name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.role}</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn-secondary" style={{ width: '100%', fontSize: '12px', padding: '4px' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
