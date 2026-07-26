import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Wallet,
  CreditCard,
  Target,
  PiggyBank,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { transactionService } from '../services/transactionService.js';
import { analyticsService } from '../services/analyticsService.js';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('dashboard_refresh_needed')) {
      localStorage.removeItem('dashboard_refresh_needed');
    }
    loadDashboardData();
    
    const handleRefresh = () => loadDashboardData();
    window.addEventListener('transaction_updated', handleRefresh);
    return () => window.removeEventListener('transaction_updated', handleRefresh);
  }, [loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const [summaryData, transactionsData, insightsData, budgetsData, goalsData] = await Promise.all([
        transactionService.getSummary(startDate, endDate),
        transactionService.getTransactions({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        analyticsService.getInsights(startDate, endDate),
        api.get('/budgets/progress').then(r => r.data).catch(() => ({ budgets: [] })),
        api.get('/goals').then(r => r.data).catch(() => ({ goals: [] }))
      ]);

      setSummary(summaryData);
      setRecentTransactions(transactionsData.transactions);
      setInsights(insightsData || []);
      setBudgets(budgetsData.budgets?.slice(0, 3) || []);
      setGoals(goalsData.goals?.slice(0, 2) || []);
    } catch (error) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'warning': return <TrendingDown className="h-5 w-5 text-amber-400" />;
      default: return <BarChart3 className="h-5 w-5 text-indigo-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="space-y-8 pb-12 mt-10 md:mt-0"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white tracking-tight">Financial Overview</h1>
          <p className="text-gray-400 mt-1">Here&apos;s your latest financial breakdown for this month.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex space-x-3 w-full md:w-auto">
          <button onClick={loadDashboardData} className="btn btn-secondary w-full md:w-auto" title="Refresh dashboard">
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </button>
          <Link to="/transactions/new" className="btn btn-primary w-full md:w-auto">
            <Plus size={18} className="mr-2" />
            Add Expense
          </Link>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Income</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(summary?.income?.total)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 flex items-center">
            <span className="text-emerald-400 font-medium mr-1">{summary?.income?.count || 0}</span> transactions
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Expenses</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(summary?.expense?.total)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 flex items-center">
            <span className="text-rose-400 font-medium mr-1">{summary?.expense?.count || 0}</span> transactions
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Net Balance</p>
              <p className={`text-3xl font-bold mt-1 ${summary?.net >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatCurrency(summary?.net)}
              </p>
            </div>
            <div className={`p-3 rounded-2xl ${summary?.net >= 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} border`}>
              <Wallet size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Remaining this month</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg. Expense</p>
              <p className="text-3xl font-bold text-white mt-1">{formatCurrency(summary?.expense?.average)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Average transaction cost</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <Link to="/transactions" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all</Link>
          </div>
          
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="group flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-100">{tx.description}</p>
                      <p className="text-sm text-gray-500">{tx.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <CreditCard size={24} className="text-gray-500" />
                </div>
                <p className="text-gray-400">No transactions found for this month.</p>
                <Link to="/transactions/new" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block font-medium">Add your first one</Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Smart Insights</h3>
            <Link to="/analytics" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Details</Link>
          </div>
          
          <div className="space-y-4 flex-1">
            {insights.length > 0 ? (
              insights.slice(0, 4).map((insight, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all">
                  <div className="mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-100">{insight.title}</p>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 h-full flex flex-col justify-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <BarChart3 size={24} className="text-gray-500" />
                </div>
                <p className="text-gray-400">No insights available yet.</p>
                <p className="text-sm text-gray-500 mt-2">Add more data to generate insights.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Budget Progress Section */}
      {budgets.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <PiggyBank size={20} className="mr-2 text-indigo-400" />
              Budget Progress
            </h3>
            <Link to="/budgets" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Manage</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="glass-card p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">{budget.category}</span>
                  <span className={`text-sm font-medium ${budget.isOverBudget ? 'text-rose-400' : 'text-gray-400'}`}>
                    {budget.percentage?.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      budget.isOverBudget ? 'bg-rose-500' :
                      budget.alertTriggered ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>${(budget.spent || 0).toLocaleString()}</span>
                  <span>${(budget.amount || 0).toLocaleString()}</span>
                </div>
                {budget.alertTriggered && !budget.isOverBudget && (
                  <div className="flex items-center mt-2 text-xs text-amber-400">
                    <AlertTriangle size={12} className="mr-1" />
                    Near limit
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Goals Progress Section */}
      {goals.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Target size={20} className="mr-2 text-emerald-400" />
              Savings Goals
            </h3>
            <Link to="/goals" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <div key={goal.id} className="glass-card p-4" style={{ borderTop: `3px solid ${goal.color || '#6366F1'}` }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">{goal.name}</span>
                  <span className="text-sm font-medium text-gray-400">
                    {goal.progress?.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                    style={{ width: `${goal.progress || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>${(goal.currentAmount || 0).toLocaleString()}</span>
                  <span>${(goal.targetAmount || 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {goal.daysRemaining || 0} days remaining
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;