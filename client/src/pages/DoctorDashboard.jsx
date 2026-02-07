import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { Stethoscope, LogOut, User, Clock, CheckCircle, PlayCircle, History, AlertCircle } from 'lucide-react';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [queue, setQueue] = useState([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [currentToken, setCurrentToken] = useState(null);
  const [consultationOtp, setConsultationOtp] = useState('');
  
  // Consultation Form State
  const [consultationForm, setConsultationForm] = useState({
    visitReason: '',
    problemCategory: 'Others',
    doctorNotes: ''
  });

  useEffect(() => {
    fetchProfile();
    return () => {
      socket.off('queueUpdate');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (doctorProfile) {
      fetchQueue(doctorProfile._id);
      socket.connect();
      socket.emit('joinDoctorRoom', doctorProfile._id);
      socket.on('queueUpdate', (data) => {
        fetchQueue(doctorProfile._id);
      });
    }
  }, [doctorProfile]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/doctor/profile/me');
      setDoctorProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQueue = async (doctorId) => {
    try {
      const res = await api.get(`/token/queue/${doctorId}`);
      setQueue(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (tokenId, status) => {
    try {
      await api.patch(`/token/${tokenId}/status`, { status });
    } catch (err) {
      console.error(err);
    }
  };

  const markDoneWithOtp = async (token) => {
    try {
      await api.post('/consultation-otp/generate', { tokenId: token._id });
      setCurrentToken(token);
      setConsultationOtp('');
      setShowOtpModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate consultation OTP');
    }
  };

  const checkOtpStatus = async (token) => {
    try {
      const res = await api.get(`/consultation-otp/latest?tokenId=${token._id}`);
      const { status } = res.data;
      
      setCurrentToken(token);

      if (status === 'VERIFIED') {
        setConsultationForm(prev => ({ ...prev, visitReason: token.reason || '' }));
        setShowCompleteModal(true);
      } else if (status === 'GENERATED') {
        setConsultationOtp('');
        setShowOtpModal(true);
      } else if (status === 'EXPIRED') {
        alert('Previous OTP expired. Please generate a new one.');
        markDoneWithOtp(token);
      } else {
        markDoneWithOtp(token);
      }
    } catch (err) {
      console.error(err);
      markDoneWithOtp(token);
    }
  };

  const verifyConsultationOtp = async () => {
    try {
      await api.post('/consultation-otp/verify', { 
        tokenId: currentToken._id, 
        otp: consultationOtp 
      });
      setShowOtpModal(false);
      setConsultationForm(prev => ({ ...prev, visitReason: currentToken.reason || '' }));
      setShowCompleteModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const completeConsultation = async () => {
    try {
      await api.post('/consultations/complete', {
        tokenId: currentToken._id,
        diagnosis: consultationForm.doctorNotes, // Mapping notes to diagnosis for now
        problemCategory: consultationForm.problemCategory,
        notes: consultationForm.doctorNotes
      });
      
      setShowCompleteModal(false);
      setConsultationForm({ visitReason: '', problemCategory: 'Others', doctorNotes: '' });
      fetchQueue(doctorProfile._id);
    } catch (err) {
      alert('Failed to complete consultation');
    }
  };

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-purple)', padding: '10px', borderRadius: '12px' }}>
            <Stethoscope size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Doctor Dashboard</h1>
            <span style={{ color: 'var(--text-secondary)' }}>Welcome, Dr. {user?.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/doctor/history')} className="btn-secondary">
            <History size={18} /> History
          </button>
          <NotificationBell />
          <button onClick={logout} className="btn-danger">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="var(--accent-blue)" />
                Patient Queue
            </h2>
            <div className="badge badge-info" style={{ fontSize: '14px', padding: '6px 16px' }}>
                Waiting: {queue.filter(t => t.status === 'PENDING').length}
            </div>
        </div>

        {queue.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                 <CheckCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                 <p>No patients in queue. Enjoy your break!</p>
             </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {queue.map(token => (
                    <div key={token._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: token.status === 'IN_PROGRESS' ? '4px solid var(--accent-blue)' : '4px solid transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ 
                                width: '50px', height: '50px', 
                                background: token.status === 'IN_PROGRESS' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)', 
                                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', fontSize: '20px', color: 'white'
                            }}>
                                {token.tokenNumber}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {token.patientName || 'Unknown Patient'}
                                    {token.priority === 'EMERGENCY' && (
                                        <span className="badge badge-danger" style={{ fontSize: '11px' }}>EMERGENCY</span>
                                    )}
                                    {token.paymentStatus === 'PAID' && (
                                        <span className="badge badge-success" style={{ fontSize: '11px' }}>PAID</span>
                                    )}
                                </h3>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> {new Date(token.createdAt).toLocaleTimeString()}
                                    </span>
                                    <span>{token.patientAge} yrs / {token.patientGender}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {token.status === 'PENDING' && (
                                <button onClick={() => updateStatus(token._id, 'IN_PROGRESS')} className="btn-primary">
                                    <PlayCircle size={18} /> Call Patient
                                </button>
                            )}
                            {token.status === 'IN_PROGRESS' && (
                                <button onClick={() => checkOtpStatus(token)} className="btn-success" style={{ background: 'var(--success)', border: 'none' }}>
                                    <CheckCircle size={18} /> Complete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
            <div className="glass-panel" style={{ width: '400px', maxWidth: '90%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Patient Verification</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Ask the patient for the OTP sent to their dashboard.
                </p>
                <input 
                    type="text" 
                    placeholder="Enter 6-digit OTP" 
                    value={consultationOtp}
                    onChange={(e) => setConsultationOtp(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px', marginBottom: '24px' }}
                    maxLength={6}
                />
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={() => setShowOtpModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={verifyConsultationOtp} className="btn-primary" style={{ flex: 1 }}>Verify</button>
                </div>
            </div>
        </div>
      )}

      {/* Complete Consultation Modal */}
      {showCompleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
            <div className="glass-panel" style={{ width: '600px', maxWidth: '95%' }}>
                <h2 style={{ marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>Consultation Details</h2>
                
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Reason for Visit</label>
                    <input type="text" value={consultationForm.visitReason} readOnly style={{ opacity: 0.7 }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Problem Category</label>
                    <select 
                        value={consultationForm.problemCategory}
                        onChange={(e) => setConsultationForm({...consultationForm, problemCategory: e.target.value})}
                    >
                        <option value="General">General</option>
                        <option value="Fever">Fever</option>
                        <option value="Injury">Injury</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Diagnosis & Notes</label>
                    <textarea 
                        rows="4" 
                        value={consultationForm.doctorNotes}
                        onChange={(e) => setConsultationForm({...consultationForm, doctorNotes: e.target.value})}
                        placeholder="Enter diagnosis, prescription, or notes..."
                    ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowCompleteModal(false)} className="btn-secondary">Cancel</button>
                    <button onClick={completeConsultation} className="btn-primary">Finalize & Complete</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
