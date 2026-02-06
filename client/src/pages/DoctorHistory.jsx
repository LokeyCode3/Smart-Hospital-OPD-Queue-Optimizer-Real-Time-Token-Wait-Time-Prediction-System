import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Calendar, Filter, History, Users, Activity, X } from 'lucide-react';

const DoctorHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [count, setCount] = useState(0);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    problemCategory: 'All'
  });
  const [categoryStats, setCategoryStats] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.problemCategory && filters.problemCategory !== 'All') queryParams.append('problemCategory', filters.problemCategory);

      const res = await api.get(`/consultations/doctor/history?${queryParams.toString()}`);
      setHistory(res.data.history);
      setCount(res.data.count);
      
      // Client-side aggregation for the chart (since API returns list)
      const stats = res.data.history.reduce((acc, curr) => {
        const cat = curr.problemCategory || 'Others';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      const chartData = Object.keys(stats).map(key => ({ name: key, value: stats[key] }));
      setCategoryStats(chartData);

    } catch (err) {
      console.error(err);
    }
  };

  const COLORS = ['#3a6df0', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ background: 'var(--accent-purple)', padding: '10px', borderRadius: '12px' }}>
                <History size={24} color="white" />
             </div>
             <div>
                <h1 style={{ margin: 0, fontSize: '24px' }}>Consultation History</h1>
                <span style={{ color: 'var(--text-secondary)' }}>View and analyze your past records</span>
             </div>
        </div>
        <button onClick={() => navigate('/doctor')} className="btn-secondary">
          <ArrowLeft size={18} /> Back to Live Queue
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(58, 109, 240, 0.2)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
                <Users size={40} color="var(--accent-blue)" />
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Patients Seen</h3>
            <p style={{ fontSize: '48px', margin: '10px 0', fontWeight: 'bold', color: 'white' }}>{count}</p>
        </div>
        <div className="glass-panel" style={{ height: '300px' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-primary)' }}>Problem Category Distribution</h4>
            {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie
                            data={categoryStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {categoryStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(23, 25, 35, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                            itemStyle={{ color: 'white' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : <p style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text-secondary)' }}>No data available for selected period</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
        <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Calendar size={12} style={{ marginRight: '4px' }}/> Start Date
            </label>
            <input 
                type="date" 
                value={filters.startDate} 
                onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
        </div>
        <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Calendar size={12} style={{ marginRight: '4px' }}/> End Date
            </label>
            <input 
                type="date" 
                value={filters.endDate} 
                onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
        </div>
        <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <Activity size={12} style={{ marginRight: '4px' }}/> Category
            </label>
            <select 
                value={filters.problemCategory}
                onChange={e => setFilters({...filters, problemCategory: e.target.value})}
                style={{ minWidth: '150px' }}
            >
                <option value="All">All Categories</option>
                <option value="Fever">Fever</option>
                <option value="Cold">Cold</option>
                <option value="Headache">Headache</option>
                <option value="Injury">Injury</option>
                <option value="Others">Others</option>
            </select>
        </div>
        <button 
            onClick={() => setFilters({ startDate: '', endDate: '', problemCategory: 'All' })}
            className="btn-secondary"
            style={{ marginBottom: '2px' }}
        >
            <X size={14} /> Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Patient Name</th>
                        <th>Category</th>
                        <th>Visit Reason</th>
                        <th>Diagnosis/Notes</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {history.length === 0 ? (
                        <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No records found matching your filters.</td></tr>
                    ) : (
                        history.map(record => (
                            <tr key={record._id}>
                                <td>
                                    <div style={{ fontWeight: 'bold' }}>{new Date(record.date).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(record.date).toLocaleTimeString()}</div>
                                </td>
                                <td>{record.patientId?.name || 'Guest'}</td>
                                <td>
                                    <span className="badge badge-primary">
                                        {record.problemCategory}
                                    </span>
                                </td>
                                <td style={{ maxWidth: '200px' }}>{record.visitReason}</td>
                                <td style={{ maxWidth: '250px' }}>{record.doctorNotes}</td>
                                <td>{record.consultationDuration?.toFixed(1)} min</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorHistory;
