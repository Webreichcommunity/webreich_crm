import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import MainForm from './components/MainForm';
import DataSaved from './components/DataSaved';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm.';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is already authenticated from localStorage
    const auth = localStorage.getItem('isAuthenticated');
    if (auth) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (username, password) => {
    if (username === 'webreich' && password === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true'); // Store in localStorage
    } else {
      alert('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated'); // Clear localStorage on logout
  };

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <Route path="*" element={<LoginForm onLogin={handleLogin} />} />
        ) : (
          <Route path="/" element={<Layout onLogout={handleLogout} />}>
            <Route index element={<MainForm />} />
            <Route path="/data-saved" element={<DataSaved />} />
            <Route path="*" element={<Navigate to="/" />} /> {/* Redirect to home if other routes accessed */}
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;
