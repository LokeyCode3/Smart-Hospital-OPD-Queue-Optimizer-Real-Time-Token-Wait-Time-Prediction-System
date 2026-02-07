import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Key, Shield } from 'lucide-react';
import api from '../services/api';

const Login = ({ role = 'PATIENT' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempUser, setTempUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password, role);
      
      // Check if user needs to change password
      if (data.user.mustChangePassword) {
        setTempUser(data);
        setShowChangePassword(true);
        return;
      }

      redirectUser(data.user.role);
    } catch (err) {
      console.error("Login Error in Component:", err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const redirectUser = (userRole) => {
    if (userRole === 'ADMIN') navigate('/admin');
    else if (userRole === 'DOCTOR') navigate('/doctor');
    else navigate('/patient');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
    }
    if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
    }

    try {
        await api.post('/auth/change-password', { newPassword });
        alert("Password updated successfully! You will be logged in now.");
        redirectUser(tempUser.user.role);
    } catch (err) {
        setError(err.response?.data?.message || 'Failed to update password');
    }
  };

  if (showChangePassword) {
    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '60px', height: '60px', background: 'var(--danger)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <Key size={32} color="white" />
                </div>
                <h2 style={{ fontSize: '24px', margin: 0 }}>Change Password</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>You must change your password to continue.</p>
            </div>
    
            {error && (
                <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid var(--danger)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                    {error}
                </div>
            )}
    
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ paddingLeft: '36px' }}
                        placeholder="Enter new password"
                    />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ paddingLeft: '36px' }}
                        placeholder="Confirm new password"
                    />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Update Password</button>
            </form>
          </div>
        </div>
      );
  }

  const isPatient = role === 'PATIENT';
  const isAdmin = role === 'ADMIN';

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '60px', height: '60px', background: isAdmin ? 'var(--danger)' : 'var(--accent-blue)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                {isAdmin ? <Shield size={32} color="white" /> : <LogIn size={32} color="white" />}
            </div>
            <h2 style={{ fontSize: '24px', margin: 0 }}>{isAdmin ? 'Admin Portal' : 'Patient Login'}</h2>
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
                    placeholder={isAdmin ? "admin@hospital.com" : "patient@example.com"}
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
                    placeholder="Enter password"
                />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <Link 
                to={isAdmin ? "/admin/forgot-password" : "/patient/forgot-password"} 
                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
                Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '8px', background: isAdmin ? 'var(--danger)' : 'var(--accent-blue)' }}>
            Sign In
          </button>
        </form>
        
        {isPatient && (
             <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '500' }}>Register</Link>
            </div>
        )}
      </div>
    </div>
  );
};

export default Login;
