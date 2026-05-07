import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import PinLock from './components/PinLock';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectDetails from './components/ProjectDetails';
import FinancePage from './components/FinancePage';
import ReportsPage from './components/ReportsPage';
import ScriptPage from './components/ScriptPage';

function App() {
  const AUTH_KEY = 'wrcrm_auth_v1';
  const UNLOCK_KEY = 'wrcrm_unlocked_v1';
  const REQUIRED_PIN = '9113';
  const REQUIRED_EMAIL = 'webreichcommunity@gmail.com';
  const REQUIRED_PASSWORD = 'webreich@123';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem(AUTH_KEY) === 'true';
    const unlocked = sessionStorage.getItem(UNLOCK_KEY) === 'true';
    setIsAuthenticated(auth);
    setIsUnlocked(auth ? unlocked : false);
  }, []);

  const handleLogin = (email, password) => {
    if (email === REQUIRED_EMAIL && password === REQUIRED_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.removeItem(UNLOCK_KEY);
      setIsAuthenticated(true);
      setIsUnlocked(false);
      return;
    }
    alert('Invalid credentials.');
  };

  const handleUnlock = (pin) => {
    if (pin === REQUIRED_PIN) {
      sessionStorage.setItem(UNLOCK_KEY, 'true');
      setIsUnlocked(true);
      return;
    }
    alert('Invalid PIN.');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsUnlocked(false);
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(UNLOCK_KEY);
  };

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <Route path="*" element={<LoginForm onLogin={handleLogin} />} />
        ) : !isUnlocked ? (
          <Route path="*" element={<PinLock onUnlock={handleUnlock} onLogout={handleLogout} />} />
        ) : (
          <Route path="/" element={<Layout onLogout={handleLogout} />}>
            <Route index element={<ProjectDashboard />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="scripts" element={<ScriptPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}
export default App;
