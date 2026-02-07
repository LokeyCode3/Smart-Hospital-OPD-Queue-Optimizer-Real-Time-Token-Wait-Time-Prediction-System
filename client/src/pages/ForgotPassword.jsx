import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Key, Mail, Lock, ArrowLeft, ShieldAlert, UserCheck } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = ({ role = 'PATIENT' }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isAdmin = role === 'ADMIN';

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const endpoint = isAdmin ? '/auth/admin/forgot-password' : '/auth/patient/forgot-password';
      const res = await api.post(endpoint, { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isAdmin ? '/auth/admin/reset-password' : '/auth/patient/reset-password';
      const res = await api.post(endpoint, { token, newPassword });
      alert('Password reset successfully! Please login.');
      navigate(isAdmin ? '/admin/login' : '/login'); // Redirect to appropriate login
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '40px' }}>
        <Link 
            to={isAdmin ? "/admin/login" : "/login"} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '24px', fontSize: '14px' }}
        >
            <ArrowLeft size={16} /> Back to Login
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '60px', height: '60px', background: isAdmin ? 'var(--danger)' : 'var(--accent-blue)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                {isAdmin ? <ShieldAlert size={32} color="white" /> : <UserCheck size={32} color="white" />}
            </div>
            <h2 style={{ fontSize: '24px', margin: 0 }}>{isAdmin ? 'Admin Recovery' : 'Patient Recovery'}</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                {step === 1 ? `Enter your ${isAdmin ? 'admin' : 'account'} email to receive a reset code` : 'Enter the code sent to your email'}
            </p>
        </div>

        {message && (
            <div style={{ background: 'rgba(46, 204, 113, 0.2)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                {message}
            </div>
        )}

        {error && (
            <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid var(--danger)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
                {error}
            </div>
        )}

        {step === 1 ? (
            <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px', background: isAdmin ? 'var(--danger)' : 'var(--accent-blue)' }}>
                    {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Reset Code</label>
                    <div style={{ position: 'relative' }}>
                        <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            required
                            style={{ paddingLeft: '36px' }}
                            placeholder="Enter code from email"
                        />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ paddingLeft: '36px' }}
                            placeholder="Min 6 characters"
                        />
                    </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px', background: isAdmin ? 'var(--danger)' : 'var(--accent-blue)' }}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
