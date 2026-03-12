// import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Analytics from './pages/Analytics.jsx';
import Upload from './pages/Upload.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#020617]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#34d399', secondary: 'rgba(255, 255, 255, 0.1)' },
            },
            error: {
              duration: 5000,
              iconTheme: { primary: '#f87171', secondary: 'rgba(255, 255, 255, 0.1)' },
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-[#0f172a] to-[#020617] relative">
        <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/new" element={<Transactions isNew={true} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
          success: {
            duration: 3000,
            iconTheme: { primary: '#34d399', secondary: 'rgba(255, 255, 255, 0.1)' },
          },
          error: {
            duration: 5000,
            iconTheme: { primary: '#f87171', secondary: 'rgba(255, 255, 255, 0.1)' },
          },
        }}
      />
    </div>
  );
}

export default App; 