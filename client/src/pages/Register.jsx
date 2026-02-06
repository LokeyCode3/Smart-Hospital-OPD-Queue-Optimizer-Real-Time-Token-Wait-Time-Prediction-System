import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Shield } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      // Redirect based on role
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '60px', height: '60px', background: 'var(--success)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <UserPlus size={32} color="white" />
            </div>
            <h2 style={{ fontSize: '24px', margin: 0 }}>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Join Smart Hospital today</p>
        </div>

        {error && (
            <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid var(--danger)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ paddingLeft: '36px' }}
                    placeholder="Enter your full name"
                />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '36px' }}
                    placeholder="Enter your email"
                />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '36px' }}
                    placeholder="Create a password"
                />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Role</label>
            <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ paddingLeft: '36px' }}>
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor (Demo)</option>
                    <option value="ADMIN">Admin (Demo)</option>
                </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '8px', background: 'linear-gradient(135deg, var(--success), #2ecc71)' }}>Register</button>
        </form>
        
        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--success)', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
