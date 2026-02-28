import React from 'react';
import { aiService, reportService } from '../services/auth';

function MedicalHistory({ reports, onUpdate }) {
  const handleAnalyze = async (reportId) => {
    try {
      await aiService.analyzeReport(reportId);
      alert('AI Analysis completed!');
      onUpdate();
    } catch (error) {
      alert('Analysis failed: ' + error.message);
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportService.deleteReport(reportId);
        alert('Report deleted successfully!');
        onUpdate();
      } catch (error) {
        alert('Delete failed: ' + error.message);
      }
    }
  };

  return (
    <div className="medical-history-container">
      <h2>📋 Medical History</h2>

      {reports.length === 0 ? (
        <div className="empty-state">
          <p>No medical reports uploaded yet.</p>
          <p>Upload your first report to get started!</p>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.reportId} className="report-card">
              <div className="report-header">
                <h3>{report.reportType.toUpperCase()}</h3>
                <span className="report-date">
                  {new Date(report.reportDate).toLocaleDateString()}
                </span>
              </div>

              <div className="report-details">
                <p><strong>Doctor:</strong> {report.doctorName || 'N/A'}</p>
                <p><strong>Hospital:</strong> {report.hospitalName || 'N/A'}</p>
                <p><strong>Files:</strong> {report.files.length} file(s)</p>
              </div>

              {report.aiAnalysis && (
                <div className="ai-analysis">
                  <h4>🤖 AI Analysis</h4>
                  <p><strong>Summary:</strong> {report.aiAnalysis.summary}</p>
                  {report.aiAnalysis.recommendations && (
                    <div>
                      <strong>Recommendations:</strong>
                      <ul>
                        {report.aiAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="report-actions">
                {!report.aiAnalysis && (
                  <button 
                    onClick={() => handleAnalyze(report.reportId)}
                    className="btn btn-secondary btn-sm"
                  >
                    🧠 Analyze
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(report.reportId)}
                  className="btn btn-danger btn-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MedicalHistory;