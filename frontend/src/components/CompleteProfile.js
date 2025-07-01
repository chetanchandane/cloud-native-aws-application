import React, { useState } from 'react';
import '../styles/CompleteProfile.css';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

export default function CompleteProfile({ setIsProfileComplete }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [health, setHealth] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const fullName = `${firstName} ${lastName}`.trim();

      const response = await fetch(`${process.env.REACT_APP_aws_api_base_url}/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.userId || attributes.sub,
          email: attributes.email,
          name: fullName || '',
          height,
          weight,
          date_of_birth: dob,
          gender,
          health_conditions: health
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("API Error:", result.error);
        throw new Error(result.error);
      }

      alert("Profile completed successfully!");
      setIsProfileComplete(true); 
      navigate('/');
        // window.location.href = '/';
    } catch (err) {
      console.error("Error in profile completion:", err);
      alert("Failed to complete profile.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2>Complete Your Profile</h2>
      <label>
        First Name:
        <input value={firstName} onChange={e => setFirstName(e.target.value)} required />
      </label>

      <label>
        Last Name:
        <input value={lastName} onChange={e => setLastName(e.target.value)} required />
      </label>
      <label>Height (cm): <input value={height} onChange={e => setHeight(e.target.value)} required /></label>
      <label>Weight (kg): <input value={weight} onChange={e => setWeight(e.target.value)} required /></label>
      <label>Date of Birth (YYYY-MM-DD): <input type="date" value={dob} onChange={e => setDob(e.target.value)} required /></label>
      <label>Gender:<select value={gender} onChange={e => setGender(e.target.value)} required>
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
        </select>
      </label>
      <label>Health Conditions: <input value={health} onChange={e => setHealth(e.target.value)} /></label>
      <button type="submit">Submit</button>
    </form>
  );
}
