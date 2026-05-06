import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm.';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectDetails from './components/ProjectDetails';
import FinancePage from './components/FinancePage';
import ReportsPage from './components/ReportsPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => { if (localStorage.getItem('isAuthenticated')) setIsAuthenticated(true); }, []);
  const handleLogin = (username, password) => {
    if (username === 'webreich' && password === '9113') { setIsAuthenticated(true); localStorage.setItem('isAuthenticated', 'true'); }
    else alert('Invalid credentials. App lock PIN is required.');
  };
  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem('isAuthenticated'); };
  return (<Router><Routes>{!isAuthenticated ? <Route path='*' element={<LoginForm onLogin={handleLogin} />} /> : <Route path='/' element={<Layout onLogout={handleLogout} />}><Route index element={<ProjectDashboard />} /><Route path='projects/:id' element={<ProjectDetails />} /><Route path='finance' element={<FinancePage />} /><Route path='reports' element={<ReportsPage />} /><Route path='*' element={<Navigate to='/' />} /></Route>}</Routes></Router>);
}
export default App;
