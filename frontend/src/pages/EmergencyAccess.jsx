// ... (imports remain the same)
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Phone, FileText, Eye, AlertTriangle, Activity, Pill, User, Volume2, VolumeX, Home, Navigation, PhoneCall, Fingerprint } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import "../styles/emergency.css";

function EmergencyAccess() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [viewingGps, setViewingGps] = useState(false);

  // 🔊 Text-to-Speech Handler
  const handleSpeakInfo = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const textToRead = `Emergency Medical Information. Patient Name: ${user.fullName}. Blood Type: ${user.bloodGroup}. Allergies: ${user.allergies}. Chronic Conditions: ${user.chronicConditions}. Emergency Contact: ${user.emergencyContact}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => setSpeaking(false);

    // Attempt to use a better voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.name.includes('Google') || voice.name.includes('Female')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 📍 Share GPS Location Handler
  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `🚨 EMERGENCY ALERT! \nI need help for ${user?.fullName || 'a patient'}. \nCurrent Location: ${mapLink}`;

        setLocating(false);

        // Trending: Use Web Share API if available
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Emergency Location',
              text: message,
              url: mapLink,
            });
          } catch (err) {
            console.log('Error sharing:', err);
          }
        } else {
          // Fallback to SMS
          window.open(`sms:${user.emergencyContact}?body=${encodeURIComponent(message)}`);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve location. Please enable GPS.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 🌍 View Live GPS Handler
  const handleViewLiveGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setViewingGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setViewingGps(false);
        // Open Google Maps in a new tab showing current live location
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank', 'noopener,noreferrer');
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve location. Please enable GPS.");
        setViewingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const loadEmergencyInfo = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/emergency/${userId}`
      );
      setUser(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading emergency info:', error);
      setError('User not found or unable to load information');
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadEmergencyInfo();
    // Cleanup speech synthesis on unmount
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [loadEmergencyInfo]);

  const handleUpload = () => navigate(`/upload/${userId}`);

  const handleView = async () => {
    try {
      const optResp = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/webauthn/generate-authentication-options`, { userId });

      let asseResp;
      try {
        asseResp = await startAuthentication({ optionsJSON: optResp.data });
      } catch (e) {
        console.error(e);
        alert('Biometric verification cancelled or failed.');
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
        alert('Biometric verification failed.');
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response.data.message.includes('No biometrics registered')) {
        // If no biometrics registered, just allow them to proceed (or block depending on strictness - we fallback to allowing to view the public card records)
        navigate(`/view-records/${userId}`);
      } else {
        console.error(err);
        navigate(`/view-records/${userId}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading emergency information...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h1>❌ Error</h1>
          <p>{error || 'User information not found'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-access-container">
      {/* Header */}
      <header className="emergency-header">
        <button className="btn-home-corner" onClick={() => navigate('/')} aria-label="Go to Home">
          <Home size={22} />
        </button>
        <div className="header-badge">EMERGENCY ACCESS</div>
        <h1>Emergency Medical Info</h1>
        <p className="emergency-subtitle">Critical Medical Data for First Responders</p>
      </header>

      {/* Patient Info */}
      <div className="emergency-content">

        {/* Main ID Card */}
        <div className="patient-id-card glass-effect">
          <div className="id-card-header">
            <div className="id-header-left">
              <span className="pulse-dot"></span>
              <h2>Medical ID</h2>
            </div>
            <button
              onClick={handleSpeakInfo}
              className={`btn-speak-icon ${speaking ? 'speaking' : ''}`}
              aria-label="Read details aloud"
            >
              {speaking ? <><Volume2 size={18} /> Playing</> : <><VolumeX size={18} /> Read Info</>}
            </button>
          </div>

          <div className="id-card-body">
            <div className="avatar-section">
              <div className="patient-avatar">
                {user.fullName ? user.fullName.charAt(0) : <User size={40} />}
              </div>
              <span className="blood-badge">{user.bloodGroup}</span>
            </div>

            <div className="patient-details">
              <h3>{user.fullName}</h3>
              <div className="tags-row">
                <span className="tag">{user.age} Years</span>
                <span className="tag">{user.gender}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vital Alerts Grid */}
        <div className="alerts-grid">
          {/* Allergies */}
          <div className="alert-card warning glass-effect">
            <div className="card-icon">
              <AlertTriangle size={24} color="#fbbf24" />
            </div>
            <div className="card-content">
              <h3>Allergies</h3>
              <p>{user.allergies || 'No known allergies'}</p>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="alert-card danger glass-effect">
            <div className="card-icon">
              <Activity size={24} color="#fca5a5" />
            </div>
            <div className="card-content">
              <h3>Conditions</h3>
              <p>{user.chronicConditions || 'No chronic conditions'}</p>
            </div>
          </div>
        </div>

        {/* Medications */}
        <div className="info-card glass-effect">
          <div className="card-header-simple">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={18} color="#a5b4fc" />
              <h3>Current Medications</h3>
            </div>
          </div>
          <p className="info-content">
            {user.currentMedications || 'No current medications described'}
          </p>
        </div>

        {/* Emergency Contact & Call Quick Actions */}
        <div className="contact-card glass-effect">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>Emergency Contact</h3>
            <p className="contact-number">{user.emergencyContact}</p>
          </div>
          <div className="contact-actions">
            <a href={`tel:${user.emergencyContact}`} className="btn-call-inline contact-call" aria-label="Call Emergency Contact">
              <Phone size={18} /> Call Contact
            </a>
            {/* ADD-ON: Quick call to local emergency services */}
            <a href="tel:112" className="btn-call-inline ambulance-call" aria-label="Call Ambulance">
              <PhoneCall size={18} /> Call 112
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-section glass-effect">
          <h3>Tools & Records</h3>
          <div className="action-buttons">


            <button onClick={handleView} className="btn-action view" style={{ position: 'relative' }}>
              <div className="icon" style={{ color: '#a78bfa' }}>
                <Fingerprint size={24} />
              </div>
              <div className="text">
                <span className="main">View History <Fingerprint size={12} style={{ marginLeft: '4px' }} /></span>
                <span className="sub">Biometric Access</span>
              </div>
            </button>

            <button onClick={handleUpload} className="btn-action upload">
              <div className="icon" style={{ color: '#34d399' }}>
                <FileText size={24} />
              </div>
              <div className="text">
                <span className="main">Upload Reports</span>
                <span className="sub">Add new records</span>
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* Sticky Emergency Footer - Enhanced */}
      <div className="sticky-emergency-footer glass-panel">
        <a href={`tel:${user.emergencyContact}`} className="btn-footer call">
          <Phone size={20} /> Call Contact
        </a>
        <a href="tel:112" className="btn-footer ambulance">
          <PhoneCall size={20} /> Ambulance
        </a>
        <button
          onClick={handleShareLocation}
          className="btn-footer location"
          disabled={locating}
        >
          {locating ? <Activity className="animate-spin" size={20} /> : <MapPin size={20} />}
          {locating ? 'Locating...' : 'Share GPS'}
        </button>
        <button
          onClick={handleViewLiveGPS}
          className="btn-footer location-view"
          disabled={viewingGps}
        >
          {viewingGps ? <Activity className="animate-spin" size={20} /> : <Navigation size={20} />}
          {viewingGps ? 'Opening...' : 'View GPS'}
        </button>
      </div>

      <div className="space-for-footer"></div>
    </div>
  );
}

export default EmergencyAccess;