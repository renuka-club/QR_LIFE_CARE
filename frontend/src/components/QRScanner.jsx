import React, { useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import { QrCode, UploadCloud, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { startAuthentication } from '@simplewebauthn/browser';
import "../styles/qrscan.css";

function QRScanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const isBiometricMode = queryParams.get('mode') === 'biometric';

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setIsScanning(true);

    const html5QrCode = new Html5Qrcode("qr-reader");

    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      const url = new URL(decodedText);
      const userId = url.pathname.split('/').pop();

      if (isBiometricMode) {
        try {
          const optResp = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/webauthn/generate-authentication-options`, { userId });

          let asseResp;
          try {
            asseResp = await startAuthentication({ optionsJSON: optResp.data });
          } catch (e) {
            console.error(e);
            setError('Biometric verification cancelled or failed.');
            return;
          }

          const verifyResp = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/webauthn/verify-authentication`, {
            response: asseResp,
            userId
          });

          if (verifyResp.data && verifyResp.data.success) {
            localStorage.setItem('token', verifyResp.data.data.token);
            localStorage.setItem('userId', verifyResp.data.data.userId);
            navigate(`/view-records/${userId}`);
          } else {
            setError('Biometric verification failed.');
          }
        } catch (err) {
          if (err.response?.status === 400 && err.response.data.message.includes('No biometrics registered')) {
            setError('No biometrics registered. Please setup Biometrics in your Profile first.');
          } else {
            console.error(err);
            setError('Biometric authentication error. User may not exist or network issue.');
          }
        }
      } else {
        navigate(`/emergency/${userId}`);
      }
    } catch (err) {
      setError("Invalid or unreadable QR Code. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div
      className="qr-scanner-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* GLOWING ORB BACKGROUND EFFECTS */}
      <div className="qr-bg-glow glow-1"></div>
      <div className="qr-bg-glow glow-2"></div>

      <div className="qr-content-wrapper">
        <motion.div
          className="qr-header-box"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            className="qr-icon-wrapper"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <QrCode className="qr-header-icon" size={48} />
          </motion.div>
          <h2 className="qr-title">{isBiometricMode ? 'Biometric QR Scan' : 'Scan QR Code'}</h2>
          <p className="qr-subtitle">
            {isBiometricMode
              ? 'Upload medical ID QR image to securely view reports via fingerprint/FaceID.'
              : 'Upload your medical ID QR image to instantly access critical emergency records.'}
          </p>
        </motion.div>

        <motion.div
          className="qr-upload-card glass-panel"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="upload-icon-container"
            animate={isScanning ? { y: [0, -10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <UploadCloud size={40} className={`upload-icon ${isScanning ? 'scanning' : ''}`} />
          </motion.div>
          <h3>Choose QR Image</h3>

          <div className="upload-box">
            <input
              type="file"
              id="qr-file-upload"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isScanning}
            />
            <motion.label
              htmlFor="qr-file-upload"
              className="upload-label"
              whileHover={{ scale: 1.02, backgroundColor: "rgba(56, 189, 248, 0.15)", borderColor: "var(--primary-cyan)" }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="upload-btn-text">
                {isScanning ? 'Scanning...' : 'Browse Files'}
              </span>
            </motion.label>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="qr-error-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div id="qr-reader" style={{ display: "none" }}></div>
    </motion.div>
  );
}

export default QRScanner;
