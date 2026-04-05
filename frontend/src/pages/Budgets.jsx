import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, TrendingUp, TrendingDown, AlertTriangle, X, Edit, Trash2 } from 'lucide-react';
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

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-rose-500';
    if (percentage >= budget.alertThreshold) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{budget.category}</h3>
          <p className="text-sm text-gray-400 capitalize">{budget.period || 'Monthly'}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onEdit(budget)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(budget)} className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-white">{formatCurrency(budget.spent)}</span>
          <span className="text-sm text-gray-400">of {formatCurrency(budget.amount)}</span>
        </div>

        <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute inset-y-0 left-0 rounded-full ${getProgressColor(budget.percentage)}`}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className={`font-medium ${budget.isOverBudget ? 'text-rose-400' : 'text-gray-400'}`}>
            {budget.percentage.toFixed(0)}% used
          </span>
          <span className="text-gray-500">
            {formatCurrency(budget.remaining)} remaining
          </span>
        </div>

        {budget.alertTriggered && !budget.isOverBudget && (
          <div className="flex items-center space-x-2 text-amber-400 text-sm bg-amber-500/10 p-2 rounded-lg">
            <AlertTriangle size={14} />
            <span>Approaching budget limit ({budget.alertThreshold}% threshold)</span>
          </div>
        )}

        {budget.isOverBudget && (
          <div className="flex items-center space-x-2 text-rose-400 text-sm bg-rose-500/10 p-2 rounded-lg">
            <TrendingDown size={14} />
            <span>Over budget by {formatCurrency(budget.spent - budget.amount)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const BudgetModal = ({ isOpen, onClose, onSubmit, editingBudget, categories, submitting }) => {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    alertThreshold: 80
  });

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        category: editingBudget.category,
        amount: editingBudget.amount,
        period: editingBudget.period || 'monthly',
        alertThreshold: editingBudget.alertThreshold || 80
      });
    } else {
      setFormData({ category: '', amount: '', period: 'monthly', alertThreshold: 80 });
    }
  }, [editingBudget, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
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
            <Target size={24} className="mr-2 text-indigo-400" />
            {editingBudget ? 'Edit Budget' : 'Create Budget'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="" className="bg-slate-900 text-white">Select category...</option>
              {categories.filter(c => c.type === 'expense').map(cat => (
                <option key={cat.id} value={cat.name} className="bg-slate-900 text-white">{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Budget Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="5000"
                min="1"
                className="w-full pl-8 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Period</label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="weekly" className="bg-slate-900 text-white">Weekly</option>
              <option value="monthly" className="bg-slate-900 text-white">Monthly</option>
              <option value="yearly" className="bg-slate-900 text-white">Yearly</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">
              Alert Threshold: {formData.alertThreshold}%
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn btn-secondary px-6">Cancel</button>
            <button type="submit" className="btn btn-primary px-6" disabled={submitting}>
              {submitting ? 'Saving...' : editingBudget ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        fetch('/api/budgets/progress', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/transactions/categories', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      const budgetsData = await budgetsRes.json();
      const categoriesData = await categoriesRes.json();
      
      setBudgets(budgetsData.budgets || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load budgets');
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
      const url = editingBudget 
        ? `/api/budgets/${editingBudget.id}` 
        : '/api/budgets';
      const method = editingBudget ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Failed to save budget');
      
      toast.success(editingBudget ? 'Budget updated' : 'Budget created');
      setShowModal(false);
      setEditingBudget(null);
      loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleDelete = async (budget) => {
    if (!confirm(`Delete budget for ${budget.category}?`)) return;
    
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Budget deleted');
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <PageLoader />;

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white tracking-tight">Budget Management</h1>
          <p className="text-gray-400 mt-1">Set and track spending limits for your categories.</p>
        </motion.div>
        
        <motion.button
          variants={itemVariants}
          onClick={() => { setEditingBudget(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={18} className="mr-2" />
          Add Budget
        </motion.button>
      </div>

      {budgets.length > 0 && (
        <motion.div variants={itemVariants} className="glass-panel p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Overall Budget</h3>
            <span className="text-sm text-gray-400">
              {overallPercentage.toFixed(0)}% used
            </span>
          </div>
          <div className="relative h-4 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`absolute inset-y-0 left-0 rounded-full ${
                overallPercentage >= 100 ? 'bg-rose-500' :
                overallPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>₹{totalSpent.toLocaleString()}</span>
            <span>₹{totalBudget.toLocaleString()}</span>
          </div>
        </motion.div>
      )}

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="glass-panel p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Target size={32} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Budgets Yet</h3>
          <p className="text-gray-400 mb-6">Create budgets to track your spending limits and stay on top of your finances.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} className="mr-2" />
            Create Your First Budget
          </button>
        </motion.div>
      )}

      <BudgetModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingBudget(null); }}
        onSubmit={handleSubmit}
        editingBudget={editingBudget}
        categories={categories}
        submitting={submitting}
      />
    </motion.div>
  );
};

export default Budgets;
