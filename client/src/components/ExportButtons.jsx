import React from 'react';
import api from '../services/api';

const ExportButtons = () => {
  const handleExport = async (type) => {
    try {
      const response = await api.get(`/token/analytics/export?type=${type}`, {
        responseType: 'blob', // Important for file download
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `opd_report.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      <button onClick={() => handleExport('csv')} style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none' }}>Export CSV</button>
      {/* PDF Not implemented fully on backend yet, but button ready */}
      {/* <button onClick={() => handleExport('pdf')} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none' }}>Export PDF</button> */}
    </div>
  );
};

export default ExportButtons;
