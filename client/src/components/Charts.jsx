import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ProblemCategoryChart = ({ data = [] }) => {
  if (!data || !Array.isArray(data) || data.length === 0) return (
    <div style={{ height: '300px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h4>Problem Categories</h4>
      <div style={{color: 'var(--text-secondary)'}}>No data available</div>
    </div>
  );
  
  return (
    <div style={{ height: '300px', width: '100%' }}>
      <h4>Problem Categories</h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="_id"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DoctorStatsChart = ({ data = [] }) => {
  return (
    <div style={{ height: '300px', width: '100%' }}>
      <h4>Doctor Load (Queue Length)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="doctor" stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} />
          <Legend />
          <Bar dataKey="queueLength" fill="#8884d8" name="Queue Length" />
          <Bar dataKey="avgWaitTime" fill="#82ca9d" name="Wait Time (min)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PeakHoursChart = ({ data = {} }) => {
  if (!data || Object.keys(data).length === 0) return (
    <div style={{ height: '300px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h4>Peak Hours (Traffic)</h4>
      <div style={{color: 'var(--text-secondary)'}}>No data available</div>
    </div>
  );

  // Convert object { '9': 5, '10': 2 } to array [{hour: '9', count: 5}, ...]
  const chartData = Object.keys(data).map(key => ({
    hour: `${key}:00`,
    tokens: data[key]
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <h4>Peak Hours (Traffic)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="hour" stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }} />
          <Legend />
          <Line type="monotone" dataKey="tokens" stroke="#ff7300" strokeWidth={2} dot={{fill: '#ff7300'}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
