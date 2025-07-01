import React, { useState } from 'react';
// import Auth from '@aws-amplify/auth';
import { signIn, fetchAuthSession } from 'aws-amplify/auth';
import '../App.css';

const Login = ({ onSwitchToRegistration }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // const user = await Auth.signIn({username: email, password: password});
      const user = await signIn({username: email, password: password});
      console.log('User signed in successfully', user);
      // Redirect to landing page after successful login
      window.location.href = "/Dashboard";
    } catch (err) {
      console.error('Error signing in', err);
      setError('Invalid email or password');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
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
        {error && <p className="error-message">{error}</p>}
        <div className="auth-buttons">
          <button type="submit" className="btn auth-btn">Login</button>
          <button 
            type="button" 
            className="btn switch-btn" 
            onClick={onSwitchToRegistration}
          >
            Create Account
          </button>
          <button type="button" className="btn forgot-btn">Forgot Password?</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
