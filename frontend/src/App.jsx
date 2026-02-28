import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import EmergencyAccess from './pages/EmergencyAccess';
import QRScanner from './components/QRScanner';
import UploadReportsPage from './pages/UploadReportsPage';
import ViewRecordsPage from './pages/ViewRecordsPage';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';
import ProfilePage from './pages/ProfilePage';

import './styles/main.css';

function PrivateRoute({ children }) {
  return authService.isAuthenticated()
    ? children
    : <Navigate to="/" />;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegistrationForm />} />

          {/* PROTECTED */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          <Route path="/scan-qr" element={<QRScanner />} />
          <Route path="/emergency/:userId" element={<EmergencyAccess />} />
          <Route path="/upload/:userId" element={<UploadReportsPage />} />
          <Route path="/view-records/:userId" element={<ViewRecordsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
