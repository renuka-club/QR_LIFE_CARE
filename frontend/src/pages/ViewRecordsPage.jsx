import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { aiService } from '../services/auth';
import "../styles/view.css";

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const FILE_BASE = API_BASE.replace('/api', '');

function ViewRecordsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Inject styles for spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleAnalyzeAI = async (reportId) => {
    setAnalyzing(true);
    try {
      const response = await aiService.analyzeReport(reportId);

      if (response.success) {
        // Update the selected report with new analysis
        const updatedReport = { ...selectedReport, aiAnalysis: response.data };
        setSelectedReport(updatedReport);

        // Update list as well
        setReports(reports.map(r => r._id === reportId ? { ...r, aiAnalysis: response.data } : r));
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      alert('Failed to analyze report: ' + (error.response?.data?.message || error.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const loadReports = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/reports/user/${userId}`);
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  // 🔥 FORCE DOWNLOAD FUNCTION
  const handleDownload = async (file) => {
    try {
      const fileUrl = `${FILE_BASE}/${file.path}`;
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.originalName;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert('Download failed');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading medical records...</p>
      </div>
    );
  }

  return (
    <div className="view-records-container">
      <header className="page-header">
        <button
          onClick={() => navigate(`/emergency/${userId}`)}
          className="back-btn"
        >
          ← Back
        </button>
        <h1>📋 Medical Records</h1>
      </header>

      <div className="records-content">
        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h2>No Medical Records Found</h2>
            <p>No reports have been uploaded for this user yet.</p>
            <button
              onClick={() => navigate(`/upload/${userId}`)}
              className="btn btn-primary"
            >
              📄 Upload First Report
            </button>
          </div>
        ) : (
          <>
            <div className="records-header">
              <h2>Total Reports: {reports.length}</h2>
            </div>

            <div className="reports-grid">
              {reports.map((report) => (
                <div key={report.reportId || report._id} className="report-card">
                  <div className="report-card-header">
                    <h3>{report.reportType.replace('-', ' ').toUpperCase()}</h3>
                    <span className="report-date">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="report-card-body">
                    <p><strong>Doctor:</strong> {report.doctorName || 'N/A'}</p>
                    <p><strong>Hospital:</strong> {report.hospitalName || 'N/A'}</p>
                    <p><strong>Files:</strong> {report.files?.length || 0}</p>
                    {report.notes && (
                      <p><strong>Notes:</strong> {report.notes.substring(0, 50)}...</p>
                    )}
                  </div>

                  <div className="report-card-footer">
                    <button
                      onClick={() => viewReportDetails(report)}
                      className="btn btn-view-small"
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && selectedReport && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content report-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeModal}>&times;</button>

            <h2>📄 Report Details</h2>

            <div className="report-details">

              {/* REPORT INFO */}
              <div className="detail-section">
                <h3>Report Information</h3>
                <p><strong>Type:</strong> {selectedReport.reportType.toUpperCase()}</p>
                <p><strong>Date:</strong> {new Date(selectedReport.reportDate).toLocaleDateString()}</p>
                <p><strong>Doctor:</strong> {selectedReport.doctorName || 'Not specified'}</p>
                <p><strong>Hospital:</strong> {selectedReport.hospitalName || 'Not specified'}</p>
                {selectedReport.notes && (
                  <p><strong>Notes:</strong> {selectedReport.notes}</p>
                )}
              </div>

              {/* FILES */}
              <div className="detail-section">
                <h3>Uploaded Files ({selectedReport.files.length})</h3>

                <div className="files-list">
                  {selectedReport.files.map((file, index) => (
                    <div key={index} className="file-item">

                      {file.mimetype.startsWith('image/') ? (
                        <div className="file-preview">
                          <img
                            src={`${FILE_BASE}/${file.path}`}
                            alt={file.originalName}
                          />
                          <p>{file.originalName}</p>
                        </div>
                      ) : (
                        <div className="file-preview document">
                          <div className="doc-icon">📄</div>
                          <p>{file.originalName}</p>
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}

                      {/* 🔽 FORCE DOWNLOAD */}
                      <button
                        className="download-btn"
                        onClick={() => handleDownload(file)}
                      >
                        ⬇ Download
                      </button>

                    </div>
                  ))}
                </div>
              </div>

              {/* AI ANALYSIS SECTION */}
              <div className="detail-section ai-analysis">
                <h3>🤖 AI Health Assistant</h3>

                {/* BUFFER / LOADING STATE */}
                {analyzing ? (
                  <div className="ai-loading-buffer" style={{ textAlign: 'center', padding: '30px', color: '#666', background: '#f8f9fa', borderRadius: '10px', animation: 'fadeIn 0.5s' }}>
                    <div className="spinner" style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #f3f3f3',
                      borderTop: '4px solid #3498db',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 15px'
                    }}></div>
                    <p style={{ fontWeight: '500' }}>✨ Analyzing report with AI...</p>
                    <small>Extracting insights, identifying medicines, and checking for risks.</small>
                  </div>
                ) : !selectedReport.aiAnalysis ? (
                  /* INITIAL ANALYZE BUTTON */
                  <div className="ai-start-container">
                    <p>Get instant insights, summaries, and medication reminders from this report.</p>
                    <button
                      className="btn btn-ai-analyze"
                      onClick={() => handleAnalyzeAI(selectedReport._id)}
                      disabled={analyzing}
                    >
                      ✨ Analyze with AI
                    </button>
                  </div>
                ) : (
                  /* RESULTS DISPLAY */
                  <div className="ai-results">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', gap: '10px' }}>
                      <button
                        style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'transparent', border: '1px solid #aaa', borderRadius: '5px', cursor: 'pointer', color: '#555' }}
                        onClick={async () => {
                          if (window.confirm("Send a copy of this analysis to your registered email?")) {
                            try {
                              alert("Sending email...");
                              await aiService.sendEmailNotification(selectedReport._id);
                              alert("Email sent successfully!");
                            } catch (e) {
                              alert("Failed to send email.");
                            }
                          }
                        }}
                        disabled={analyzing}
                      >
                        📧 Email Copy
                      </button>
                      <button
                        style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'transparent', border: '1px solid #aaa', borderRadius: '5px', cursor: 'pointer', color: '#555' }}
                        onClick={() => handleAnalyzeAI(selectedReport._id)}
                        disabled={analyzing}
                      >
                        🔄 Re-analyze
                      </button>
                    </div>

                    <p><strong>Summary:</strong> {selectedReport.aiAnalysis.summary}</p>

                    {selectedReport.aiAnalysis.keyFindings?.length > 0 && (
                      <div className="ai-subsection">
                        <strong>Key Findings:</strong>
                        <ul>
                          {selectedReport.aiAnalysis.keyFindings.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {selectedReport.aiAnalysis.recommendations?.length > 0 && (
                      <div className="ai-subsection">
                        <strong>Recommendations:</strong>
                        <ul>
                          {selectedReport.aiAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReport.aiAnalysis.medicines?.length > 0 && (
                      <div className="ai-subsection">
                        <strong>💊 Suggested Medications / Supplements:</strong>
                        <ul>
                          {selectedReport.aiAnalysis.medicines.map((med, idx) => (
                            <li key={idx}>{med}</li>
                          ))}
                        </ul>
                        <small className="disclaimer">*Consult a doctor before taking any medication.</small>
                      </div>
                    )}

                    <div className="ai-reminders-badge">
                      ✅ Reminders & Alerts Activated
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewRecordsPage;
