import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DoctorStatsChart, PeakHoursChart, ProblemCategoryChart } from '../components/Charts';
import ExportButtons from '../components/ExportButtons';
import NotificationBell from '../components/NotificationBell';
import { LayoutDashboard, Users, Activity, LogOut, Calendar } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [consultationStats, setConsultationStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({ name: '', email: '', password: '', department: '', avgConsultTime: '10:00' });
  const [message, setMessage] = useState('');
  
  // Date Filter State
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
    fetchConsultationStats();
    fetchDoctors();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/token/analytics/opd');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConsultationStats = async () => {
    try {
      const res = await api.get(`/consultations/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setConsultationStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctor');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      // Convert MM:SS to minutes
      const [mins, secs] = newDoctor.avgConsultTime.toString().split(':').map(Number);
      const totalMinutes = mins + (secs || 0) / 60;

      await api.post('/doctor', { ...newDoctor, avgConsultTime: totalMinutes });
      setMessage('Doctor added successfully');
      setNewDoctor({ name: '', email: '', password: '', department: '', avgConsultTime: '10:00' });
      fetchDoctors();
    } catch (err) {
      setMessage('Error adding doctor');
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/doctor/${id}`);
      fetchDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--accent-blue)', padding: '10px', borderRadius: '12px' }}>
            <LayoutDashboard size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Admin Dashboard</h1>
            <span style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NotificationBell />
          <button onClick={logout} className="btn-danger">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-purple)" />
            OPD Analytics
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <Calendar size={16} color="var(--text-secondary)" />
            <input 
              type="date" 
              value={dateRange.startDate} 
              onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
              style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-primary)', width: 'auto' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>to</span>
            <input 
              type="date" 
              value={dateRange.endDate} 
              onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
              style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-primary)', width: 'auto' }}
            />
          </div>
        </div>

        <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
            <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Visits</h4>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{analytics?.totalVisits || 0}</div>
            </div>
            <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Tokens</h4>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{analytics?.activeTokens || 0}</div>
            </div>
            <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Revenue (Today)</h4>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>₹{analytics?.totalRevenue || 0}</div>
            </div>
            <div className="glass-card">
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Emergency</h4>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--danger)' }}>{analytics?.emergencyTokens || 0}</div>
            </div>
        </div>

        <div className="grid-cols-2">
            <div className="glass-card" style={{ height: '300px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Peak Hours</h3>
                {analytics && <PeakHoursChart data={analytics.peakHours} />}
            </div>
            <div className="glass-card" style={{ height: '300px' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Consultations by Category</h3>
                {consultationStats && <ProblemCategoryChart data={consultationStats.problemDistribution} />}
            </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
             <ExportButtons data={analytics} />
        </div>
      </div>

      {/* Doctor Management */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--accent-blue)" />
                Doctor Management
            </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            {/* Add Doctor Form */}
            <div className="glass-card">
                <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Add New Doctor</h3>
                {message && <div style={{ marginBottom: '16px', color: message.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>{message}</div>}
                <form onSubmit={handleAddDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input type="text" placeholder="Full Name" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} required />
                    <input type="email" placeholder="Email Address" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} required />
                    <input type="password" placeholder="Password" value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})} required />
                    <input type="text" placeholder="Specialist" value={newDoctor.department} onChange={e => setNewDoctor({...newDoctor, department: e.target.value})} required />
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Avg Consult Time (MM:SS)</label>
                        <input 
                            type="text" 
                            placeholder="10:00"
                            value={newDoctor.avgConsultTime} 
                            onChange={e => setNewDoctor({...newDoctor, avgConsultTime: e.target.value})} 
                            pattern="[0-9]{2}:[0-9]{2}"
                            title="Format: MM:SS (e.g., 10:00)"
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Add Doctor</button>
                </form>
            </div>

            {/* Doctors List */}
            <div>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Specialist</th>
                            <th>Avg Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map(doc => (
                            <tr key={doc._id}>
                                <td style={{ fontWeight: '500' }}>{doc.name}</td>
                                <td><span className="badge badge-info">{doc.department}</span></td>
                                <td>{(() => {
                                  const m = Math.floor(doc.avgConsultTime);
                                  const s = Math.round((doc.avgConsultTime - m) * 60);
                                  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                                })()}</td>
                                <td>
                                    <button onClick={() => handleDeleteDoctor(doc._id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
