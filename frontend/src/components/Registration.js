import React, { useState } from 'react';
// import Auth  from '@aws-amplify/auth';
import { signUp, fetchAuthSession } from 'aws-amplify/auth';
import '../App.css';
import { autoSignIn } from 'aws-amplify/auth';

const Registration = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      // const result = await Auth.signUp({
        const result = await signUp({
        username: email,
        password,
        attributes: {
          email,
          given_name: '',
          "custom:height": height,
          "custom:weight": weight,
        },
        autoSignIn: true, // Automatically sign in after registration
      });
      console.log('User signed up successfully', result);
      // setSuccessMessage('Registration successful!');
      // Redirect to login page after successful registration
      onSwitchToLogin();
    } catch (err) {
      console.error('Error signing up', err);
      setError('Error signing up. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Create a New Account</h2>
      <form onSubmit={handleRegister}>
        <div className="input-field">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="input-field">
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="input-field">
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="input-field">
          <input 
            type="number" 
            placeholder="Height (in cm)" 
            value={height} 
            onChange={(e) => setHeight(e.target.value)} 
            required 
          />
        </div>
        <div className="input-field">
          <input 
            type="number" 
            placeholder="Weight (in kg)" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
            required 
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="auth-buttons">
          <button type="submit" className="btn auth-btn">Create Account</button>
          <button 
            type="button" 
            className="btn switch-btn" 
            onClick={onSwitchToLogin}
          >
            Already have an account? Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Registration;
