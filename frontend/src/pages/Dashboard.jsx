import React, { useState, useEffect, useCallback } from 'react';
import { authService, aiService } from '../services/auth';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import AIChat from '../components/AIChat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, User, Droplet, Clock, Bell, Download, Printer,
  Upload, Bot, X, Pill, Calendar, AlertTriangle, ShieldAlert
} from 'lucide-react';
import "../styles/dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRUpload, setShowQRUpload] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [latestInsights, setLatestInsights] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  const loadInsights = useCallback(async (userId) => {
    try {
      const response = await api.get(`/reports/user/${userId}`);
      if (response.data?.data?.length > 0) {
        const reportsWithAI = response.data.data.filter(r => r.aiAnalysis && r.aiAnalysis.summary);
        if (reportsWithAI.length > 0) {
          setLatestInsights(reportsWithAI[0].aiAnalysis);
        }
      }
    } catch (error) {
      console.error("Error loading insights", error);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data);
      if (response.data && response.data.userId) {
        loadInsights(response.data.userId);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      authService.logout();
      navigate('/');
    }
  }, [navigate, loadInsights]);

  const loadReminders = useCallback(async () => {
    try {
      const response = await aiService.getReminders();
      setReminders(response.data || []);
    } catch (error) {
      console.error('Error loading reminders', error);
      // Fallback or empty if error
    }
  }, []);

  useEffect(() => {
    loadUserData();
    loadReminders();
  }, [loadUserData, loadReminders]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const downloadQR = () => {
    const canvas = document.querySelector('.qr-canvas-wrapper canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${user.userId}_QR_Code.png`;
      link.href = url;
      link.click();
    }
  };

  const printQR = () => {
    const canvas = document.querySelector('.qr-canvas-wrapper canvas');
    if (canvas) {
      const imgUrl = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${user.userId}</title>
            <style>
              body { text-align: center; font-family: sans-serif; padding: 50px; }
              img { border: 5px solid #000; padding: 10px; border-radius: 10px; }
              .info { margin-top: 20px; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <h1>Emergency Medical Access</h1>
            <img src="${imgUrl}" width="300" />
            <div class="info">
              <p>User: ${user.fullName}</p>
              <p>Blood Group: ${user.bloodGroup}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Interface...</p>
      </div>
    );
  }

  if (!user) return null;

  const qrValue = `${window.location.origin}/emergency/${user.userId}`;

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <motion.header
        className="dashboard-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="header-brand">
          <ShieldAlert className="text-accent" size={28} />
          <h1>QR Life Care</h1>
        </div>
        <div className="header-profile">
          <span className="user-welcome">Hi, {user.fullName.split(' ')[0]}</span>
          <button onClick={() => navigate('/profile')} className="btn-icon" title="My Profile" style={{ marginRight: '0.5rem' }}>
            <User size={20} />
          </button>
          <button onClick={handleLogout} className="btn-icon" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </motion.header>

      <div className="dashboard-main">
        {/* GRID LAYOUT */}
        <div className="dashboard-grid">

          {/* COL 1: PROFILE & REMINDERS */}
          <div className="left-col">

            {/* PROFILE CARD */}
            <motion.div
              className="neo-glass profile-card"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="card-header">
                <h2><User size={20} /> Identity</h2>
              </div>
              <div className="profile-details">
                <div className="detail-item">
                  <span className="label">Start ID</span>
                  <span className="value monospace">{user.userId}</span>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="label"><Droplet size={14} className="text-red" /> Blood</span>
                    <span className="value highlight-red">{user.bloodGroup}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label"><Clock size={14} /> Age</span>
                    <span className="value">{user.age}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* REMINDERS CARD */}
            <motion.div
              className="neo-glass reminders-card"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card-header">
                <h2><Bell size={20} /> Alerts</h2>
                <span className="badge-count">{reminders.length}</span>
              </div>
              <div className="reminders-list">
                {reminders.length === 0 ? (
                  <p className="empty-msg">All clear. No active alerts.</p>
                ) : (
                  reminders.map((rem, idx) => (
                    <div key={idx} className={`reminder-item ${rem.type}`}>
                      <div className="icon">
                        {rem.type === 'medication' ? <Pill size={16} /> :
                          rem.type === 'appointment' ? <Calendar size={16} /> :
                            rem.type === 'lifestyle' ? <Droplet size={16} /> : <AlertTriangle size={16} />}
                      </div>
                      <div className="info">
                        <h4>{rem.title}</h4>
                        <p>{rem.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* AI HEALTH INSIGHTS LIST */}
            {latestInsights && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#ff8a80', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, paddingLeft: '5px' }}>
                  <AlertTriangle size={18} /> Critical Alerts
                </h3>

                {latestInsights.riskFactors?.map((risk, idx) => (
                  <motion.div
                    key={`risk-${idx}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    style={{
                      background: 'rgba(255, 60, 60, 0.1)',
                      borderLeft: '4px solid #ff5252',
                      padding: '0.8rem 1rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    <AlertTriangle size={16} color="#ff5252" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#e0e0e0', fontSize: '0.85rem', lineHeight: '1.3' }}>{risk}</span>
                  </motion.div>
                ))}

                {latestInsights.recommendations?.map((rec, idx) => (
                  <motion.div
                    key={`rec-${idx}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * (idx + (latestInsights.riskFactors?.length || 0)) }}
                    style={{
                      background: 'rgba(255, 183, 77, 0.1)',
                      borderLeft: '4px solid #ffb74d',
                      padding: '0.8rem 1rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                    <span style={{ color: '#e0e0e0', fontSize: '0.85rem', lineHeight: '1.3' }}>{rec}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* COL 2: QR COMMAND CENTER */}
          <motion.div
            className="center-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="neo-glass qr-command-card">
              <div className="qr-header">
                <h2>Access Key</h2>
                <p>Scan for Emergency Data</p>
              </div>

              <div className="qr-canvas-wrapper">
                <div className="scan-line"></div>
                <QRCode
                  value={qrValue}
                  size={220}
                  level="H"
                  includeMargin={true}
                  renderAs="canvas"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              <div className="qr-actions-grid">
                <button onClick={downloadQR} className="action-btn">
                  <Download size={18} />
                  <span>Save</span>
                </button>
                <button onClick={printQR} className="action-btn">
                  <Printer size={18} />
                  <span>Print</span>
                </button>
                <button onClick={() => setShowQRUpload(true)} className="action-btn featured">
                  <Upload size={18} />
                  <span>Upload / Scan</span>
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* FLOATING AI CHAT */}
      <motion.button
        className="fab-chat"
        onClick={() => setShowChat(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot size={28} />
      </motion.button>

      {/* CHAT MODAL */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="chat-window neo-glass"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <div className="chat-header-bar">
                <div className="bot-info">
                  <Bot size={20} />
                  <span>AI Health Assistant</span>
                </div>
                <button onClick={() => setShowChat(false)}><X size={20} /></button>
              </div>
              <AIChat />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPLOAD MODAL */}
      {showQRUpload && (
        <div className="modal-overlay" onClick={() => setShowQRUpload(false)}>
          <div className="upload-modal" onClick={e => e.stopPropagation()}>
            <h3>Scan or Upload QR</h3>
            <div className="upload-file-wrapper">
              <input
                type="file"
                className="upload-file-input"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const html5QrCode = new Html5Qrcode('qr-hidden-scanner');
                  try {
                    const decodedText = await html5QrCode.scanFile(file, true);
                    const url = new URL(decodedText);
                    const userId = url.pathname.split('/').pop();
                    setShowQRUpload(false);
                    navigate(`/emergency/${userId}`);
                  } catch (err) {
                    alert('Could not read QR code. Please try a clearer image.');
                  }
                }}
              />
            </div>
            <div id="qr-hidden-scanner" style={{ display: 'none' }}></div>
            <button className="upload-cancel-btn" onClick={() => setShowQRUpload(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
