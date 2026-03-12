import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService.js';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar as CalendarIcon, PieChart as PieChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);

  // State for date range filtering
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  });

  // Memoized function to load all analytics data
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = dateRange;
      const [summaryData, categoryBreakdown, timeline] = await Promise.all([
        analyticsService.getSummary(startDate, endDate),
        analyticsService.getCategoryBreakdown(startDate, endDate),
        analyticsService.getTimeline(startDate, endDate)
      ]);

      setSummary(summaryData);

      // Process category data
      const processedCategories = Array.isArray(categoryBreakdown)
        ? categoryBreakdown
        : (categoryBreakdown.categories || []);
      setCategoryData(processedCategories);

      // Process timeline data for the chart
      const processedTimeline = Array.isArray(timeline)
        ? timeline.reduce((acc, item) => {
          const date = new Date(item._id.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!acc[date]) {
            acc[date] = { date, income: 0, expense: 0 };
          }
          acc[date][item._id.type] = item.total;
          return acc;
        }, {})
        : {};

      setTimelineData(Object.values(processedTimeline));

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Currency formatter for Indian Rupees (INR)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const handleDateChange = (e) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Process category data for the pie chart
  const topExpenseCategories = categoryData
    .filter(item => item && item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6) // Limit to 6 categories for better visibility
    .map((item, index) => ({
      name: item.category || 'Uncategorized',
      value: item.total,
      count: item.count,
      avgAmount: item.avgAmount,
      percent: 0, // Will be calculated below
      color: [
        '#6366F1', // indigo-500
        '#8B5CF6', // violet-500
        '#D946EF', // fuchsia-500
        '#EC4899', // pink-500
        '#F43F5E', // rose-500
        '#F59E0B'  // amber-500
      ][index % 6]
    }));

  // Calculate percentages for the tooltip
  const totalExpense = topExpenseCategories.reduce((sum, item) => sum + item.value, 0);
  const categoriesWithPercentage = topExpenseCategories.map(item => ({
    ...item,
    percent: totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-4 border border-white/10 shadow-xl bg-[#020617]/90 backdrop-blur-xl">
          <p className="font-semibold text-gray-200">{data.name}</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.value)}</p>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-[#8B5CF6] font-medium">{data.percent}%</span> of total • {data.count} transaction{data.count !== 1 ? 's' : ''}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            Average: {formatCurrency(data.avgAmount || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  const BarChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-4 border border-white/10 shadow-xl bg-[#020617]/90 backdrop-blur-xl">
          <p className="font-semibold text-gray-200 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm flex items-center mb-1">
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              <span className="text-gray-400 mr-2">{entry.name}:</span>
              <span className="font-bold text-white">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend item
  const renderCustomizedLegend = ({ payload }) => (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center text-sm px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
          <div
            className="w-3 h-3 rounded-full mr-2 shadow-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-300">{entry.value}</span>
          <span className="ml-1.5 font-bold text-white">
            {entry.payload.percent}%
          </span>
        </div>
      ))}
    </div>
  );

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-gray-400 mt-1">Deep dive into your financial data and spending trends.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 glass-panel p-2">
          <div className="flex items-center px-3 py-1 bg-black/20 rounded-lg relative">
            <CalendarIcon className="text-gray-400 absolute left-3 pointer-events-none" size={16} />
            <input 
              type="date" 
              name="startDate" 
              value={dateRange.startDate} 
              onChange={handleDateChange} 
              className="bg-transparent border-none text-sm text-white focus:ring-0 pl-6 outline-none [&::-webkit-calendar-picker-indicator]:invert-[0.7]" 
            />
          </div>
          <span className="text-gray-500">-</span>
          <div className="flex items-center px-3 py-1 bg-black/20 rounded-lg relative">
            <CalendarIcon className="text-gray-400 absolute left-3 pointer-events-none" size={16} />
            <input 
              type="date" 
              name="endDate" 
              value={dateRange.endDate} 
              onChange={handleDateChange} 
              className="bg-transparent border-none text-sm text-white focus:ring-0 pl-6 outline-none [&::-webkit-calendar-picker-indicator]:invert-[0.7]" 
            />
          </div>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Net Balance</p>
              <p className={`text-3xl font-bold mt-1 ${summary?.net >= 0 ? 'text-white' : 'text-rose-400'}`}>{formatCurrency(summary?.net)}</p>
            </div>
            <div className={`p-3 rounded-2xl ${summary?.net >= 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} border`}>
              <DollarSign size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Line/Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Cash Flow</h3>
              <p className="text-sm text-gray-400 mt-1">Income and expenses over time</p>
            </div>
          </div>
          
          {timelineData.length > 0 ? (
            <div className="h-[350px] w-[calc(100%-10px)] ml-[-10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barGap={6}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    tickFormatter={(value) => `₹${value / 1000}k`} 
                    dx={-10}
                  />
                  <Tooltip content={<BarChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="income" fill="url(#colorIncome)" name="Income" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" fill="url(#colorExpense)" name="Expense" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/5">
              <TrendingUp size={32} className="mb-3 text-gray-600" />
              <p>No data for this period.</p>
            </div>
          )}
        </motion.div>

        {/* Category Breakdown Pie Chart */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Expense Distribution</h3>
              <p className="text-sm text-gray-400 mt-1">Where your money goes</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
              <PieChartIcon className="text-indigo-400" size={20} />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {categoriesWithPercentage.length > 0 ? (
              <>
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {categoriesWithPercentage.map((entry, index) => (
                          <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1}/>
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.6}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={categoriesWithPercentage}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {categoriesWithPercentage.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-${index})`}
                            className="drop-shadow-md outline-none transition-all duration-300 hover:scale-[1.03] cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Total in center */}
                  <div className="absolute top-[165px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(totalExpense)}</p>
                  </div>
                </div>

                <div className="mt-auto">
                  {renderCustomizedLegend({
                    payload: categoriesWithPercentage.map((item) => ({
                      value: item.name,
                      color: item.color,
                      payload: item
                    }))
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <PieChartIcon className="w-8 h-8 text-gray-600" />
                </div>
                <h4 className="text-white font-medium mb-1">No expense data</h4>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  Add some transactions to see a breakdown of your spending.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;