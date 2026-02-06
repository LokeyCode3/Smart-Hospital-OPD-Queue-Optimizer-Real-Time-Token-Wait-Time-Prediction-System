import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '60px', height: '60px', background: 'var(--accent-blue)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <LogIn size={32} color="white" />
            </div>
            <h2 style={{ fontSize: '24px', margin: 0 }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Sign in to continue</p>
        </div>

        {error && (
            <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid var(--danger)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    placeholder="Enter your password"
                />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Login</button>
        </form>
        
        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 'bold' }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
