import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setStats(await res.json());
    }
  };

  if (!stats) return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Loading Stats...</div>;

  const statCards = [
    { 
      label: 'Total Tasks', 
      value: stats.total, 
      color: '#8b5cf6', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> 
    },
    { 
      label: 'To Do', 
      value: stats.todo, 
      color: '#a1a1aa', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> 
    },
    { 
      label: 'In Progress', 
      value: stats.in_progress, 
      color: '#3b82f6', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12A10 10 0 1 1 12 2v0"></path><path d="M12 2v10l4 4"></path></svg> 
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      color: '#10b981', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 
    },
    { 
      label: 'Overdue', 
      value: stats.overdue, 
      color: '#ef4444', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> 
    }
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
          Hello, {user.full_name.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Here's an overview of your productivity today.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle glow accent line at top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: stat.color, opacity: 0.5 }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, margin: 0 }}>{stat.label}</h3>
              <div style={{ 
                color: stat.color, 
                background: `${stat.color}15`, 
                padding: '8px', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {stat.icon}
              </div>
            </div>

            <p style={{ fontSize: '32px', fontWeight: 700, color: 'white', margin: 0 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section>
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '4px solid var(--primary)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>Welcome to TaskManager</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
            You are logged in as an <span style={{ color: 'white', background: 'var(--bg-sidebar)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--border-color)', margin: '0 4px' }}>{user.role}</span>.
            {user.role === 'admin'
              ? ' As an admin, you have full access to manage projects, assign tasks to members, and oversee the entire workspace workflow.'
              : ' You can view projects you are assigned to and track your specific tasks.'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
