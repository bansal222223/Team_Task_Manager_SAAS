import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'member'
  });
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await signup(formData.email, formData.password, formData.fullName, formData.role);
    if (success) {
      navigate('/login');
    } else {
      setError('Registration failed. Email might already exist.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = { 
    display: 'block', 
    marginBottom: '8px', 
    color: 'var(--text-main)', 
    fontSize: '14px', 
    fontWeight: 500 
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
      backgroundPosition: 'center',
      padding: '2rem 0'
    }}>
      <div style={{
        background: 'rgba(24, 24, 27, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Join TaskManager today</p>
        </div>

        {error && <div style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Full Name</label>
            <input 
              type="text" 
              value={formData.fullName} 
              onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
              required 
              placeholder="John Doe" 
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
              placeholder="name@company.com" 
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Password</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
              placeholder="••••••••" 
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Role</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={{...inputStyle, cursor: 'pointer', appearance: 'none'}}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <option value="member" style={{background: '#18181b', color: 'white'}}>Member</option>
              <option value="admin" style={{background: '#18181b', color: 'white'}}>Admin</option>
            </select>
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
            Get Started
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
