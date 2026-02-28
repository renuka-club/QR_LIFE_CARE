import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, aiService } from '../services/auth';
import api from '../services/api';
import {
    User,
    Activity,
    Heart,
    Smartphone,
    Shield,
    FileText,
    Stethoscope,
    Calendar,
    Droplet,
    LogOut,
    Sparkles,
    AlertTriangle,
    Bell,
    Pill,
    Camera,
    Trash2,
    Fingerprint
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import '../styles/profile.css';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [latestInsights, setLatestInsights] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userData = await authService.getCurrentUser();
                if (userData && userData.data) {
                    setUser(userData.data);

                    try {
                        const response = await api.get(`/reports/user/${userData.data.userId}`);
                        if (response.data?.data?.length > 0) {
                            const reportsWithAI = response.data.data.filter(r => r.aiAnalysis && r.aiAnalysis.summary);
                            if (reportsWithAI.length > 0) {
                                setLatestInsights(reportsWithAI[0].aiAnalysis);
                            }
                        }

                        // Fetch Reminders
                        try {
                            const remResponse = await aiService.getReminders();
                            setReminders(remResponse.data || []);
                        } catch (err) {
                            console.error('Failed to load reminders', err);
                        }

                    } catch (error) {
                        console.error('Failed to load insights', error);
                    }
                } else {
                    // If accessing directly without auth, fallback or redirect
                    const storedUser = localStorage.getItem('userId');
                    if (!storedUser) {
                        navigate('/login');
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await api.post('/auth/upload-photo', formData);

            if (response.data.success) {
                setUser((prev) => ({ ...prev, profilePhoto: response.data.profilePhoto }));
            }
        } catch (error) {
            console.error('Failed to upload photo', error);
            alert('Failed to upload profile photo. Please try again.');
        }
    };

    const handlePhotoRemove = async () => {
        try {
            const response = await api.delete('/auth/remove-photo');
            if (response.data.success) {
                setUser((prev) => ({ ...prev, profilePhoto: '' }));
            }
        } catch (error) {
            console.error('Failed to remove photo', error);
            alert('Failed to remove profile photo. Please try again.');
        }
    };

    const handleRegisterBiometrics = async () => {
        try {
            // 1. Get options from server
            const resp = await api.get('/webauthn/generate-registration-options');
            const options = resp.data;

            // 2. Pass options to browser to create credentials
            let attResp;
            try {
                attResp = await startRegistration({ optionsJSON: options });
            } catch (error) {
                if (error.name === 'NotAllowedError') {
                    alert('Biometric registration was cancelled or not allowed.');
                } else {
                    console.error('Registration failed:', error);
                    alert('Biometric registration failed on this device.');
                }
                return;
            }

            // 3. Send credentials back to server for verification
            const verificationResp = await api.post('/webauthn/verify-registration', attResp);

            if (verificationResp.data && verificationResp.data.success) {
                alert('Biometrics successfully registered!');
            } else {
                alert('Verification failed. Try again.');
            }
        } catch (error) {
            console.error('Failed to register biometrics:', error);
            alert('Failed to register biometrics. Please ensure your device supports it or try again later.');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="profile-container">
            <div className="profile-content-wrapper">
                <div className="profile-header">
                    <div>
                        <h1 className="profile-title">My Profile</h1>
                        <p className="profile-subtitle">Manage your personal and medical information</p>
                    </div>
                    <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                <div className="profile-grid">
                    {/* Left Column: Identity & QR */}
                    <div className="profile-card">
                        <div className="profile-avatar-section" style={{ position: 'relative' }}>
                            <div className="avatar-circle" style={{ position: 'relative', overflow: 'hidden', backgroundImage: user.profilePhoto ? `url(${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${user.profilePhoto})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {!user.profilePhoto && (user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U')}

                                <label className="photo-upload-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '5px', cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: '0.2s' }}>
                                    <Camera size={18} color="#fff" />
                                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpload} />
                                </label>
                            </div>

                            {user.profilePhoto && (
                                <button
                                    onClick={handlePhotoRemove}
                                    style={{ background: 'none', border: 'none', color: 'var(--alert-red)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', cursor: 'pointer', marginTop: '10px' }}
                                >
                                    <Trash2 size={14} /> Remove Photo
                                </button>
                            )}

                            <h2 className="user-name">{user.fullName}</h2>
                            <div className="user-id">ID: {user.userId}</div>
                        </div>

                        <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="info-item">
                                <div className="info-label">Email Address</div>
                                <div className="info-value" style={{ wordBreak: 'break-all' }}>{user.email}</div>
                            </div>
                        </div>

                        <div className="qr-section">
                            {user.qrCode ? (
                                <img src={user.qrCode} alt="Emergency QR Code" className="qr-image" />
                            ) : (
                                <div className="qr-placeholder">QR Code Not Available</div>
                            )}
                            <p className="qr-label">Scan to view emergency info</p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => window.open(`/emergency/${user.userId}`, '_blank')}
                                >
                                    View Public Card
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleRegisterBiometrics}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <Fingerprint size={16} /> Setup Biometrics
                                </button>
                            </div>
                        </div>

                        {/* Reminders section automatically pulled from AI analysis */}
                        <div className="profile-card" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
                            <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#f0f0f0' }}>
                                    <Bell size={18} color="var(--primary-blue)" /> Daily Reminders
                                </h3>
                                <span style={{ background: 'var(--primary-blue)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{reminders.length}</span>
                            </div>
                            <div className="reminders-list" style={{ padding: '20px', maxHeight: '350px', overflowY: 'auto' }}>
                                {reminders.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No active reminders.</p>
                                ) : (
                                    reminders.map((rem, idx) => {
                                        let borderColor = 'var(--alert-red)';
                                        if (rem.type === 'medication') borderColor = 'var(--accent-teal)';
                                        if (rem.type === 'lifestyle') borderColor = 'var(--primary-cyan)';
                                        if (rem.type === 'appointment') borderColor = 'var(--primary-blue)';

                                        return (
                                            <div key={idx} className={`reminder-item ${rem.type}`} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', marginBottom: '10px', borderRadius: '8px', borderLeft: `3px solid ${borderColor}` }}>
                                                <div className="icon">
                                                    {rem.type === 'medication' ? <Pill size={16} /> :
                                                        rem.type === 'appointment' ? <Calendar size={16} /> :
                                                            rem.type === 'lifestyle' ? <Droplet size={16} /> : <AlertTriangle size={16} />}
                                                </div>
                                                <div className="info">
                                                    <h4 style={{ fontSize: '0.95rem', margin: '0 0 4px 0', color: 'var(--text-main)' }}>{rem.title}</h4>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{rem.message}</p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Details */}
                    <div className="details-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Personal Info */}
                        <div className="profile-card">
                            <h3 className="info-section-title">
                                <div className="icon-container cyan"><User size={20} /></div> Personal Information
                            </h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <div className="info-label"><Calendar size={14} style={{ marginRight: 6 }} /> Age</div>
                                    <div className="info-value">{user.age} Years</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label"><User size={14} style={{ marginRight: 6 }} /> Gender</div>
                                    <div className="info-value" style={{ textTransform: 'capitalize' }}>{user.gender}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label"><Droplet size={14} style={{ marginRight: 6 }} /> Blood Group</div>
                                    <div className="info-value">{user.bloodGroup}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label"><Smartphone size={14} style={{ marginRight: 6 }} /> Emergency Contact</div>
                                    <div className="info-value">{user.emergencyContact}</div>
                                </div>
                            </div>
                        </div>

                        {/* Medical Info */}
                        <div className="profile-card">
                            <h3 className="info-section-title">
                                <div className="icon-container red"><Activity size={20} /></div> Medical Profile
                            </h3>
                            <div className="medical-grid">
                                <div className="info-item">
                                    <div className="info-label"><Shield size={14} style={{ marginRight: 6 }} /> Allergies</div>
                                    <div className={`info-value ${user.allergies !== 'None' ? 'alert' : ''}`}>
                                        {user.allergies}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label"><Heart size={14} style={{ marginRight: 6 }} /> Chronic Conditions</div>
                                    <div className={`info-value ${user.chronicConditions !== 'None' ? 'alert' : ''}`}>
                                        {user.chronicConditions}
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label"><FileText size={14} style={{ marginRight: 6 }} /> Current Medications</div>
                                    <div className="info-value">
                                        {user.currentMedications}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Provider Info */}
                        <div className="profile-card">
                            <h3 className="info-section-title">
                                <div className="icon-container purple"><Stethoscope size={20} /></div> Provider Information
                            </h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <div className="info-label">Doctor's Name</div>
                                    <div className="info-value">{user.doctorName || 'Not specified'}</div>
                                </div>
                                <div className="info-item">
                                    <div className="info-label">Insurance Details</div>
                                    <div className="info-value">{user.insuranceInfo || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        {/* AI Health Insights List */}
                        {latestInsights && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
                                <h3 className="info-section-title" style={{ color: '#ff8a80', margin: 0, paddingLeft: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <AlertTriangle size={18} /> Critical Alerts
                                </h3>

                                {latestInsights.riskFactors?.map((risk, idx) => (
                                    <div
                                        key={`risk-${idx}`}
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
                                    </div>
                                ))}

                                {latestInsights.recommendations?.map((rec, idx) => (
                                    <div
                                        key={`rec-${idx}`}
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
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
