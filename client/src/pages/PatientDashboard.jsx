import React, { useEffect, useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { User, LogOut, Clock, Calendar, CheckCircle, AlertTriangle, Phone, Activity, FileText } from 'lucide-react';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [myToken, setMyToken] = useState(null);
  const [queue, setQueue] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    patientMobile: '',
    reason: '',
    visitDate: new Date().toISOString().split('T')[0],
    priority: 'NORMAL'
  });
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [consultationCode, setConsultationCode] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeOtp, setActiveOtp] = useState(null);

  useEffect(() => {
    if (user) {
      setBookingForm(prev => ({ ...prev, patientName: user.name }));
      fetchHistory();
      fetchLastOtp();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/consultations/patient/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLastOtp = async () => {
    try {
      const res = await api.get('/consultation-otp/patient/last-otp');
      if (res.data && res.data.status !== 'NONE') {
        setActiveOtp(res.data);
        if (res.data.status === 'GENERATED') {
             // Calculate remaining time for countdown if needed
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
    return () => {
      socket.off('queueUpdate');
      socket.off('consultationOtp');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchQueue(selectedDoctor._id);
      
      socket.disconnect();
      socket.connect();
      socket.emit('joinDoctorRoom', selectedDoctor._id);
      if (user?.id) {
        socket.emit('joinUserRoom', user.id);
      }
      
      socket.on('queueUpdate', () => {
        fetchQueue(selectedDoctor._id);
        fetchLastOtp(); 
      });
      socket.on('consultationOtp', (data) => {
        if (data?.code) {
          setConsultationCode(data.code);
          fetchLastOtp();
        }
      });
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctor');
      setDoctors(res.data);
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

  const handleBookClick = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const bookToken = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      const res = await api.post('/token/book', {
        doctorId: selectedDoctor._id,
        ...bookingForm
      });
      
      setMyToken(res.data.token);
      setSuggestion(res.data.suggestion);
      fetchQueue(selectedDoctor._id);
      setShowBookingModal(false);
      alert(`Token Booked! Token #${res.data.token.tokenNumber}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error booking token');
    }
  };

  const sendPhoneOtp = async () => {
    try {
      await api.post('/otp/send', { phoneNumber: bookingForm.patientMobile });
      setPhoneOtpSent(true);
      alert('OTP sent to your mobile number');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const verifyPhoneOtp = async () => {
    try {
      await api.post('/otp/verify', { phoneNumber: bookingForm.patientMobile, code: phoneOtpCode });
      setPhoneOtpVerified(true);
      alert('Phone verified successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const getMyPosition = () => {
    if (!myToken || !queue.length) return null;
    const index = queue.findIndex(t => t._id === myToken._id);
    return index === -1 ? 'Not in queue (Completed?)' : index + 1;
  };

  const getWaitTime = () => {
    if (!myToken || !selectedDoctor) return 0;
    const pos = getMyPosition();
    if (typeof pos !== 'number') return 0;
    return (pos - 1) * selectedDoctor.avgConsultTime;
  };

  const formatWaitTime = (avgTime) => {
    if (!avgTime) return '0 mins 00 secs';
    const totalSeconds = Math.round(avgTime * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins} mins ${secs.toString().padStart(2, '0')} secs`;
  };

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-blue)', padding: '10px', borderRadius: '12px' }}>
            <User size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Patient Dashboard</h1>
            <span style={{ color: 'var(--text-secondary)' }}>Welcome, {user?.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NotificationBell />
          <button onClick={logout} className="btn-danger">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Active OTP Section */}
            {activeOtp && activeOtp.status !== 'NONE' && (activeOtp.status === 'GENERATED' || activeOtp.status === 'VERIFIED') && (
                <div className="glass-panel" style={{ background: 'rgba(58, 109, 240, 0.15)', borderColor: 'var(--accent-blue)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={20} /> Current Consultation OTP
                            </h3>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <span className={`badge ${activeOtp.status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>
                                    {activeOtp.status}
                                </span>
                                {activeOtp.status === 'GENERATED' && consultationCode && (
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', letterSpacing: '2px' }}>
                                        {consultationCode}
                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                Generated: {new Date(activeOtp.generatedAt).toLocaleTimeString()}
                            </p>
                        </div>
                        <div style={{ fontSize: '40px' }}>
                            {activeOtp.status === 'VERIFIED' ? <CheckCircle size={48} color="var(--success)" /> : <Clock size={48} color="var(--warning)" />}
                        </div>
                    </div>
                </div>
            )}

            {/* Doctor Selection */}
            <div className="glass-panel">
                <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} color="var(--accent-purple)" />
                    Book Appointment
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {doctors.map(doc => (
                        <div key={doc._id} className="glass-card">
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Dr. {doc.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>{doc.department}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                                <Clock size={14} /> Avg Wait: {formatWaitTime(doc.avgConsultTime)}
                            </div>
                            <button onClick={() => handleBookClick(doc)} className="btn-primary" style={{ width: '100%' }}>
                                Book Appointment
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* History */}
            <div className="glass-panel">
                <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="var(--text-secondary)" />
                    Previous Appointments
                </h2>
                {history.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No previous appointments.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {history.map(app => (
                            <div key={app._id} className="glass-card" style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <h4 style={{ margin: 0 }}>{new Date(app.date).toLocaleDateString()} - Dr. {app.doctorId?.name}</h4>
                                    <span className={`badge ${app.otpVerified ? 'badge-success' : 'badge-warning'}`}>
                                        {app.otpVerified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <div><strong>Reason:</strong> {app.visitReason}</div>
                                    <div><strong>Category:</strong> {app.problemCategory}</div>
                                    <div style={{ gridColumn: 'span 2' }}><strong>Diagnosis:</strong> {app.doctorNotes}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar / Queue Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             <div className="glass-panel" style={{ height: 'fit-content' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)' }}>Live Queue Status</h3>
                
                {selectedDoctor ? (
                    <>
                        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Selected Doctor</span>
                            <div style={{ fontWeight: 'bold' }}>Dr. {selectedDoctor.name}</div>
                        </div>

                        {suggestion && (
                            <div className="glass-card" style={{ background: 'rgba(255, 165, 2, 0.1)', borderColor: 'var(--warning)', marginBottom: '16px' }}>
                                <strong style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertTriangle size={14} /> Suggestion
                                </strong>
                                <p style={{ fontSize: '13px', margin: '4px 0' }}>{suggestion.message || suggestion}</p>
                            </div>
                        )}

                        {myToken && (
                            <div className="glass-card" style={{ background: 'rgba(46, 213, 115, 0.1)', borderColor: 'var(--success)', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h4 style={{ margin: 0, color: 'var(--success)' }}>Token #{myToken.tokenNumber}</h4>
                                    <span className="badge badge-success">{myToken.status}</span>
                                </div>
                                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div>Position: <strong>{getMyPosition()}</strong></div>
                                    <div>Est. Wait: <strong>{formatWaitTime(getWaitTime())}</strong></div>
                                </div>
                                {consultationCode && (
                                    <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Verification Code</div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>{consultationCode}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Queue List</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                            {queue.map((t) => (
                                <div key={t._id} style={{ 
                                    padding: '8px 12px', 
                                    borderRadius: '8px',
                                    background: myToken && myToken._id === t._id ? 'rgba(58, 109, 240, 0.2)' : 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)',
                                    fontSize: '13px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', color: 'white' }}>#{t.tokenNumber}</span>
                                        <span style={{ marginLeft: '8px', opacity: 0.8 }}>{t.patientName}</span>
                                    </div>
                                    <span className={`badge ${t.priority === 'EMERGENCY' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                        {t.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                        Select a doctor to view the live queue.
                    </p>
                )}
             </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '450px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>Book Appointment</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>with Dr. {selectedDoctor?.name}</p>
            
            <form onSubmit={bookToken} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Patient Name</label>
                    <input type="text" value={bookingForm.patientName} onChange={e => setBookingForm({...bookingForm, patientName: e.target.value})} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Age</label>
                    <input type="number" value={bookingForm.patientAge} onChange={e => setBookingForm({...bookingForm, patientAge: e.target.value})} required />
                  </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Gender</label>
                    <select value={bookingForm.patientGender} onChange={e => setBookingForm({...bookingForm, patientGender: e.target.value})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Visit Date</label>
                    <input type="date" value={bookingForm.visitDate} onChange={e => setBookingForm({...bookingForm, visitDate: e.target.value})} required />
                  </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Mobile Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="tel" value={bookingForm.patientMobile} onChange={e => setBookingForm({...bookingForm, patientMobile: e.target.value})} required style={{ flex: 1 }} />
                    <button type="button" onClick={sendPhoneOtp} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                        <Phone size={14} /> Send OTP
                    </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>OTP Verification</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={phoneOtpCode} onChange={e => setPhoneOtpCode(e.target.value)} placeholder="Enter code" style={{ flex: 1 }} />
                    <button type="button" onClick={verifyPhoneOtp} className="btn-success" style={{ whiteSpace: 'nowrap', background: 'var(--success)', border: 'none' }}>
                        Verify
                    </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Reason for Visit</label>
                <textarea value={bookingForm.reason} onChange={e => setBookingForm({...bookingForm, reason: e.target.value})} required placeholder="Briefly describe..." rows="2"></textarea>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Priority</label>
                <select value={bookingForm.priority} onChange={e => setBookingForm({...bookingForm, priority: e.target.value})}>
                    <option value="NORMAL">Normal</option>
                    <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={!phoneOtpVerified} className="btn-primary" style={{ flex: 1, opacity: phoneOtpVerified ? 1 : 0.5, cursor: phoneOtpVerified ? 'pointer' : 'not-allowed' }}>Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
