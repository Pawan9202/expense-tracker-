import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  CreditCard,
  BarChart3,
  Upload,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Overview', icon: Home },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/upload', label: 'Upload Data', icon: Upload },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return location.pathname === path;
  };

  // Mobile Topbar
  const MobileTopbar = () => (
    <div className="md:hidden glass-panel fixed top-0 w-full z-50 rounded-none border-t-0 border-x-0 border-b border-white/10 px-4 py-3 flex justify-between items-center transition-all bg-[#020617]/80">
      <Link to="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white font-bold text-sm">$</span>
        </div>
        <span className="font-semibold text-lg text-white">Finance</span>
      </Link>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );

  return (
    <>
      <MobileTopbar />

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-[#020617] pt-20 px-4"
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all ${
                      active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-[#8B5CF6]' : ''} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="absolute bottom-8 left-4 right-4">
              <div className="glass-panel p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                    <User size={18} className="text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.username}</p>
                    <p className="text-xs text-gray-400">Pro Plan</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 256 }}
        className="hidden md:flex flex-col h-screen glass-panel rounded-none border-y-0 border-l-0 border-r border-white/10 relative z-30 bg-[#020617]/50"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-[#020617] border border-white/10 rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors z-40 flex items-center justify-center cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="p-6 flex items-center h-20">
          <Link to="/" className="flex items-center space-x-3 overflow-hidden whitespace-nowrap">
            <div className="min-w-[32px] w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-sm">$</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-lg text-white"
                >
                  Finance
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center px-3 py-3 rounded-xl transition-all group ${
                  active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <Icon size={20} className={`relative z-10 min-w-[20px] ${active ? 'text-[#8B5CF6]' : 'group-hover:text-gray-200'}`} />
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, ml: 0 }}
                      animate={{ opacity: 1, width: "auto", ml: 12 }}
                      exit={{ opacity: 0, width: 0, ml: 0 }}
                      className="relative z-10 font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} glass-panel p-2 transition-all`}>
            {isCollapsed ? (
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            ) : (
              <>
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="min-w-[32px] w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                    <User size={16} className="text-gray-300" />
                  </div>
                  <div className="whitespace-nowrap overflow-hidden">
                    <p className="text-sm font-medium text-white truncate max-w-[100px]">{user?.username}</p>
                    <p className="text-xs text-gray-400">Pro Plan</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Navbar; 