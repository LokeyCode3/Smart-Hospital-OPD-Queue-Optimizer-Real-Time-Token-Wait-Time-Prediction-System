import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Join User Room for realtime notifications
      socket.connect();
      socket.emit('joinUserRoom', user.id);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async () => {
    try {
      await api.patch('/notifications/read');
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      markAsRead();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={toggleDropdown} style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Bell size={24} color="var(--text-primary)" />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '-5px', right: '-5px', 
            background: 'var(--danger)', color: 'white', borderRadius: '50%', 
            width: '18px', height: '18px', fontSize: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', border: '2px solid rgba(16, 18, 27, 0.8)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="glass-panel" style={{ 
          position: 'absolute', right: 0, top: '40px', width: '320px', 
          padding: '0', zIndex: 1000, overflow: 'hidden',
          background: 'rgba(23, 25, 35, 0.95)'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', fontWeight: 'bold' }}>
            Notifications
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No notifications</div>
            ) : (
                notifications.map(n => (
                <div key={n._id} style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--glass-border)', 
                    background: n.read ? 'transparent' : 'rgba(58, 109, 240, 0.1)',
                    transition: 'background 0.2s'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <small style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{new Date(n.createdAt).toLocaleTimeString()}</small>
                        {!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }}></span>}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>{n.message}</p>
                </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
