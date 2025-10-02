import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import components
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import DataManagementPage from './components/DataManagementPage';
import BattleLogsPage from './components/BattleLogsPage';
import SystemSettings from './components/SystemSettings';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Import styles
import './App.css';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:4000';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  
  // State for the migrated components
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [battleDataInput, setBattleDataInput] = useState('');
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('adminToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setAdmin({ username: localStorage.getItem('adminUsername') });
      // Load users data from sessionStorage for the migrated components
      const savedUsers = sessionStorage.getItem('warThunderUsers');
      if (savedUsers) {
        try {
          setUsers(JSON.parse(savedUsers));
        } catch (error) {
          console.error('Error loading users from sessionStorage:', error);
        }
      }
    }
    setLoading(false);
  }, []);

  // Save users to sessionStorage whenever users state changes
  useEffect(() => {
    if (users.length > 0) {
      sessionStorage.setItem('warThunderUsers', JSON.stringify(users));
    }
  }, [users]);

  // Handler for processing battle data
  const handleProcessBattleData = (battleDataArray) => {
    if (!selectedUserId) {
      alert('Please select a user first');
      return;
    }
    
    setDataLoading(true);
    
    // Add the battle data to the selected user
    const updatedUsers = users.map(user => {
      if (user.id === selectedUserId) {
        return {
          ...user,
          battles: [...(user.battles || []), ...battleDataArray]
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    setDataLoading(false);
    setBattleDataInput(''); // Clear the input
  };

  const handleLogin = (token, adminData) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUsername', adminData.username);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
    setAdmin(adminData);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setAdmin(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-950 text-gray-100 font-inter">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header admin={admin} onLogout={handleLogout} />
            
            {/* Page Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900">
              <div className="container mx-auto px-6 py-8">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={
                    <DataManagementPage 
                      users={users}
                      setUsers={setUsers}
                      selectedUserId={selectedUserId}
                      setSelectedUserId={setSelectedUserId}
                      battleDataInput={battleDataInput}
                      setBattleDataInput={setBattleDataInput}
                      handleProcessBattleData={handleProcessBattleData}
                      loading={dataLoading}
                    />
                  } />
                  <Route path="/battles" element={
                    <BattleLogsPage 
                      users={users}
                      setUsers={setUsers}
                      selectedUserId={selectedUserId}
                      setSelectedUserId={setSelectedUserId}
                    />
                  } />
                  <Route path="/settings" element={<SystemSettings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
