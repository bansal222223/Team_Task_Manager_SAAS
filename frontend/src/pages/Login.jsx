import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundImage: "url('/bg.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div style={{
        background: 'rgba(24, 24, 27, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign in to continue to TaskManager</p>
        </div>
        
        {error && <div style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="name@company.com" 
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••" 
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
          
          <button type="submit" style={{
            width: '100%',
            padding: '12px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '0.5rem',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'var(--primary-hover)'}
          onMouseOut={(e) => e.target.style.background = 'var(--primary)'}
          >
            Sign In
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
