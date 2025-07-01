  import React from 'react';
  import '../styles/UserProfile.css'; 

  const Profile = () => {
    const userProfile = JSON.parse(sessionStorage.getItem('userProfile'));

    if (!userProfile) {
      return <p>No profile data found.</p>;
    }

    console.log()

    return (
      <div className="profile-panel">
        <h2>User Profile</h2>
        <ul>
          <li><strong>Name:</strong> {userProfile.name || 'N/A'}</li>
          <li><strong>Height:</strong> {userProfile.height} cm</li>
          <li><strong>Weight:</strong> {userProfile.weight} kg</li>
          <li><strong>Date of Birth:</strong> {userProfile.date_of_birth}</li>
          <li><strong>Gender:</strong> {userProfile.gender}</li>
          {userProfile.health_conditions && (
            <li><strong>Health Conditions:</strong> {userProfile.health_conditions}</li>
          )}
        </ul>
      </div>
    );
  };

  export default Profile;
