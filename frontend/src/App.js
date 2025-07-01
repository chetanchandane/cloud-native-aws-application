import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

import { Authenticator, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import Dashboard from './components/Dashboard';
import DietGenerator from './components/DietGenerator';
import Calculators from './components/Calculators';
import CompleteProfile from './components/CompleteProfile';
import DietDashboard from './components/DietDashboard';
import MealLogging from './components/MealLogging'
import Header from './Header';
import Profile from './components/UserProfile';
import Textract from './components/Textract';

import './App.css';

Amplify.configure(awsconfig);

function AppWrapper({ signOut, user }) {
  const [isProfileComplete, setIsProfileComplete] = useState(null);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const attrs = await fetchUserAttributes();
        const id = attrs.sub
        const email = attrs.email

        const response = await fetch(`${process.env.REACT_APP_aws_api_base_url}/complete-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: id,
            email: email,
          }),
        });

        const data = await response.json();
        
        if (data.item['height'] &&
          data.item['weight'] &&
          data.item['date_of_birth'] &&
          data.item['gender']){
            setIsProfileComplete(true)
            sessionStorage.setItem('userProfile', JSON.stringify(data.item));
        }else{
          setIsProfileComplete(false)
        }
      } catch (err) {
        console.error('Failed to fetch user attributes', err);
        setIsProfileComplete(false);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user]);

  if (isProfileComplete === null) {
    return <p>Loading...</p>;
  }

  return (
    <Router>
      <div className="App">
        <Header signOut={signOut} />
        <Routes>
          <Route
            path="/"
            element={
              isProfileComplete ? (
                <Dashboard />
              ) : (
                <Navigate to="/complete-profile" replace />
              )
            }
          />
          <Route path="/diet" element={<DietGenerator />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/diet-dashboard" element={<DietDashboard />} />
          <Route path="/meal-logging" element={<MealLogging />} />
          <Route path="/textract" element={<Textract />} />

          <Route path="/profile" element={<Profile />} />  {/*just testing*/} 
          <Route
            path="/complete-profile"
            element={
              <CompleteProfile setIsProfileComplete={setIsProfileComplete} />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => <AppWrapper signOut={signOut} user={user} />}
    </Authenticator>
  );
}

export default withAuthenticator(App);