import React from 'react';
import { authService } from '../services/auth';

function PersonalDetails() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="personal-details-container">
      <h2>👤 Personal Details</h2>

      <div className="detail-card">
        <h3>Basic Information</h3>
        <p><strong>Name:</strong> {user.fullName}</p>
        <p><strong>Age:</strong> {user.age}</p>
        <p><strong>Gender:</strong> {user.gender}</p>
        <p><strong>Blood Group:</strong> {user.bloodGroup}</p>
        <p><strong>User ID:</strong> {user.userId}</p>
      </div>

      <div className="detail-card">
        <h3>Emergency Information</h3>
        <p><strong>Emergency Contact:</strong> {user.emergencyContact}</p>
        <p><strong>Allergies:</strong> {user.allergies || 'None'}</p>
        <p><strong>Chronic Conditions:</strong> {user.chronicConditions || 'None'}</p>
      </div>
    </div>
  );
}

export default PersonalDetails;