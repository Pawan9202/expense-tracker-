import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from './hooks/useAuth.js';
import { lazy, Suspense } from 'react';
import Navbar from './components/Navbar.jsx';
import QuickAddModal from './components/QuickAddModal.jsx';
import { useState, useEffect, useCallback } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Upload = lazy(() => import('./pages/Upload.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Budgets = lazy(() => import('./pages/Budgets.jsx'));
const Goals = lazy(() => import('./pages/Goals.jsx'));
const Recurring = lazy(() => import('./pages/Recurring.jsx'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[70vh]">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

const ToastConfig = () => (
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
);

function App() {
  const { user, loading } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleCloseQuickAdd = useCallback(() => {
    setShowQuickAdd(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const token = localStorage.getItem('token');
      const socket = io(socketUrl, { auth: { token } });

      socket.emit('join_user_room', user.id);

      socket.on('transaction_added', (transaction) => {
        toast.success(`WhatsApp Bot: Added ${transaction.type === 'expense' ? 'Expense' : 'Income'} - ${transaction.description}`, {
          icon: '🤖',
          duration: 5000,
        });

        window.dispatchEvent(new Event('transaction_updated'));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm font-medium tracking-wide">Loading your finances...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <ToastConfig />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden font-sans">
      <Navbar onQuickAdd={() => setShowQuickAdd(true)} />

      <main className="flex-1 overflow-auto bg-gradient-to-br from-[#0f172a] to-[#020617] relative">
        <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/new" element={<Transactions isNew={true} />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/recurring" element={<Recurring />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      <QuickAddModal isOpen={showQuickAdd} onClose={handleCloseQuickAdd} />
      <ToastConfig />
    </div>
  );
}

export default App;
