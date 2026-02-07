import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorHistory from './pages/DoctorHistory';
import PatientDashboard from './pages/PatientDashboard';
import Background from './components/Background';
import LoadingSwitch from './components/LoadingSwitch';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on root or login path
    const path = window.location.pathname;
    return path === '/' || path === '/login';
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  return (
    <AuthProvider>
      <Background />
      {showSplash ? (
        <LoadingSwitch />
      ) : (
        <Router>
          <Routes>
          <Route path="/login" element={<Login role="PATIENT" />} />
          <Route path="/patient/forgot-password" element={<ForgotPassword role="PATIENT" />} />
          <Route path="/admin/login" element={<Login role="ADMIN" />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword role="ADMIN" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<Navigate to="/patient/forgot-password" replace />} />
          
          <Route 
            path="/admin" 
            element={
              <PrivateRoute roles={['ADMIN']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/doctor" 
            element={
              <PrivateRoute roles={['DOCTOR']}>
                <DoctorDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/doctor/history" 
            element={
              <PrivateRoute roles={['DOCTOR']}>
                <DoctorHistory />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/patient" 
            element={
              <PrivateRoute roles={['PATIENT']}>
                <PatientDashboard />
              </PrivateRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
      )}
    </AuthProvider>
  );
}

export default App;
