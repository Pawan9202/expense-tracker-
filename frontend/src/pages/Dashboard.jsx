 import React, { useState, useEffect } from 'react';
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
  CreditCard
} from 'lucide-react';
import { transactionService } from '../services/transactionService.js';
import { analyticsService } from '../services/analyticsService.js';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const [summaryData, transactionsData, insightsData] = await Promise.all([
        transactionService.getSummary(startDate, endDate),
        transactionService.getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        analyticsService.getInsights(startDate, endDate)
      ]);

      setSummary(summaryData);
      setRecentTransactions(transactionsData.transactions);
      setInsights(insightsData || []); // Ensure insights is always an array
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
          <p className="text-gray-400 mt-1">Here's your latest financial breakdown for this month.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex space-x-3 w-full md:w-auto">
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
    </motion.div>
  );
};

export default Dashboard;