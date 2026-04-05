import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Repeat, X, Edit, Trash2, Calendar, ArrowUpRight, ArrowDownRight, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';

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

const PageLoader = () => (
  <div className="flex items-center justify-center h-[70vh]">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly'
};

const RecurringCard = ({ recurring, onEdit, onDelete, onToggle, categories }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const nextDate = new Date(recurring.nextOccurrence);
  const isOverdue = nextDate < new Date() && recurring.isActive;

  return (
    <motion.div
      variants={itemVariants}
      className={`glass-card p-6 relative overflow-hidden ${!recurring.isActive ? 'opacity-60' : ''}`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${recurring.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${recurring.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {recurring.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{recurring.description || recurring.category}</h3>
            <p className="text-sm text-gray-400">{recurring.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggle(recurring)}
            className={`p-2 rounded-lg transition-colors ${recurring.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-400 hover:bg-white/5'}`}
            title={recurring.isActive ? 'Pause' : 'Resume'}
          >
            {recurring.isActive ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button onClick={() => onEdit(recurring)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(recurring)} className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className={`text-2xl font-bold ${recurring.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {recurring.type === 'income' ? '+' : '-'}{formatCurrency(recurring.amount)}
          </span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300 capitalize">
            {frequencyLabels[recurring.frequency]}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <Calendar size={14} className="text-gray-500" />
          <span className={`${isOverdue ? 'text-rose-400' : 'text-gray-400'}`}>
            {isOverdue ? 'Overdue: ' : 'Next: '}{nextDate.toLocaleDateString()}
          </span>
          {recurring.autoProcess && (
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs">Auto</span>
          )}
        </div>

        {recurring.endDate && (
          <p className="text-xs text-gray-500">
            Ends: {new Date(recurring.endDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const RecurringModal = ({ isOpen, onClose, onSubmit, editingRecurring, categories, submitting }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoProcess: false
  });

  useEffect(() => {
    if (editingRecurring) {
      setFormData({
        type: editingRecurring.type,
        amount: editingRecurring.amount,
        category: editingRecurring.category,
        description: editingRecurring.description || '',
        frequency: editingRecurring.frequency,
        startDate: new Date(editingRecurring.startDate).toISOString().split('T')[0],
        endDate: editingRecurring.endDate ? new Date(editingRecurring.endDate).toISOString().split('T')[0] : '',
        autoProcess: editingRecurring.autoProcess || false
      });
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        autoProcess: false
      });
    }
  }, [editingRecurring, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex justify-center items-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-md p-6 relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Repeat size={24} className="mr-2 text-indigo-400" />
            {editingRecurring ? 'Edit Recurring' : 'New Recurring Transaction'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Transaction Type</label>
            <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
              <label className={`flex-1 relative flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${formData.type === 'expense' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                <input type="radio" value="expense" checked={formData.type === 'expense'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="sr-only" />
                <ArrowDownRight size={18} className={`mr-2 ${formData.type === 'expense' ? 'text-rose-400' : ''}`} />
                <span className="font-semibold">Expense</span>
              </label>
              <label className={`flex-1 relative flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${formData.type === 'income' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                <input type="radio" value="income" checked={formData.type === 'income'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="sr-only" />
                <ArrowUpRight size={18} className={`mr-2 ${formData.type === 'income' ? 'text-emerald-400' : ''}`} />
                <span className="font-semibold">Income</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="5000"
                min="0.01"
                className="w-full pl-8 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="" className="bg-slate-900 text-white">Select category...</option>
              {categories.filter(c => c.type === formData.type).map(cat => (
                <option key={cat.id} value={cat.name} className="bg-slate-900 text-white">{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Rent, Salary"
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="daily" className="bg-slate-900 text-white">Daily</option>
              <option value="weekly" className="bg-slate-900 text-white">Weekly</option>
              <option value="biweekly" className="bg-slate-900 text-white">Bi-weekly</option>
              <option value="monthly" className="bg-slate-900 text-white">Monthly</option>
              <option value="quarterly" className="bg-slate-900 text-white">Quarterly</option>
              <option value="yearly" className="bg-slate-900 text-white">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoProcess"
              checked={formData.autoProcess}
              onChange={(e) => setFormData({ ...formData, autoProcess: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-black/20 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="autoProcess" className="text-sm text-gray-300">Auto-process when due</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn btn-secondary px-6">Cancel</button>
            <button type="submit" className="btn btn-primary px-6" disabled={submitting}>
              {submitting ? 'Saving...' : editingRecurring ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Recurring = () => {
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recurringRes, categoriesRes] = await Promise.all([
        fetch('/api/recurring', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/transactions/categories', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      const recurringData = await recurringRes.json();
      const categoriesData = await categoriesRes.json();
      
      setRecurring(recurringData.recurring || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      const url = editingRecurring ? `/api/recurring/${editingRecurring.id}` : '/api/recurring';
      const method = editingRecurring ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      toast.success(editingRecurring ? 'Recurring updated' : 'Recurring created');
      setShowModal(false);
      setEditingRecurring(null);
      loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      const res = await fetch(`/api/recurring/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !item.isActive })
      });
      
      if (!res.ok) throw new Error('Failed to update');
      
      toast.success(item.isActive ? 'Recurring paused' : 'Recurring resumed');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingRecurring(item);
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete this recurring ${item.description || item.category}?`)) return;
    
    try {
      const res = await fetch(`/api/recurring/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Recurring deleted');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <PageLoader />;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const totalExpenses = recurring
    .filter(r => r.isActive && r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalIncome = recurring
    .filter(r => r.isActive && r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white tracking-tight">Recurring Transactions</h1>
          <p className="text-gray-400 mt-1">Manage your regular income and expenses.</p>
        </motion.div>
        
        <motion.button
          variants={itemVariants}
          onClick={() => { setEditingRecurring(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={18} className="mr-2" />
          Add Recurring
        </motion.button>
      </div>

      {recurring.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-gray-400 mb-2">Active Recurring</p>
            <p className="text-3xl font-bold text-white">{recurring.filter(r => r.isActive).length}</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-gray-400 mb-2">Monthly Expenses</p>
            <p className="text-3xl font-bold text-rose-400">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm font-medium text-gray-400 mb-2">Monthly Income</p>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </div>
        </motion.div>
      )}

      {recurring.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recurring.map(item => (
            <RecurringCard
              key={item.id}
              recurring={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              categories={categories}
            />
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="glass-panel p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Repeat size={32} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Recurring Transactions</h3>
          <p className="text-gray-400 mb-6">Set up recurring transactions for your regular income and expenses.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} className="mr-2" />
            Create Your First Recurring
          </button>
        </motion.div>
      )}

      <RecurringModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingRecurring(null); }}
        onSubmit={handleSubmit}
        editingRecurring={editingRecurring}
        categories={categories}
        submitting={submitting}
      />
    </motion.div>
  );
};

export default Recurring;
