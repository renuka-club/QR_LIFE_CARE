import React from 'react';

function HealthAlerts({ reports }) {
  const generateAlerts = () => {
    const alerts = [];

    // Check if there are any blood test reports
    const bloodTests = reports.filter(r => r.reportType === 'blood-test');
    if (bloodTests.length > 0) {
      alerts.push({
        type: 'warning',
        message: '⚠️ Monitor blood sugar levels - Stay hydrated and avoid sugary foods'
      });
    }

    // General health reminder
    alerts.push({
      type: 'info',
      message: '💧 Remember to drink 8 glasses of water daily'
    });

    // Positive feedback
    if (reports.length > 0) {
      alerts.push({
        type: 'success',
        message: '✅ Great job keeping your medical records updated!'
      });
    }

    return alerts;
  };

  const alerts = generateAlerts();

  return (
    <div className="health-alerts-container">
      <h3>🔔 Health Alerts</h3>
      
      {alerts.length === 0 ? (
        <p>No alerts at this time.</p>
      ) : (
        <div className="alerts-list">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.type}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HealthAlerts;