import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, X, Edit, Trash2, Clock, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

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

const GoalCard = ({ goal, onEdit, onDelete, onContribute }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getProgressColor = () => {
    if (goal.isCompleted) return 'bg-emerald-500';
    if (!goal.isOnTrack) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  const getStatusBadge = () => {
    if (goal.isCompleted) {
      return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium flex items-center"><CheckCircle size={12} className="mr-1"/> Completed</span>;
    }
    if (goal.daysRemaining === 0) {
      return <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-medium flex items-center"><Clock size={12} className="mr-1"/> Today</span>;
    }
    if (!goal.isOnTrack) {
      return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium flex items-center"><TrendingUp size={12} className="mr-1"/> Behind</span>;
    }
    return <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium flex items-center"><Clock size={12} className="mr-1"/> {goal.daysRemaining} days left</span>;
  };

  return (
    <motion.div
      variants={itemVariants}
      className="glass-card p-6 relative overflow-hidden"
      style={{ borderTop: `3px solid ${goal.color}` }}
    >
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl opacity-20" style={{ backgroundColor: goal.color }}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
            <Target size={20} style={{ color: goal.color }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{goal.name}</h3>
            <p className="text-sm text-gray-400">{goal.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge()}
          <button onClick={() => onEdit(goal)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(goal)} className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-3xl font-bold text-white">{formatCurrency(goal.currentAmount)}</span>
            <span className="text-lg text-gray-400"> / {formatCurrency(goal.targetAmount)}</span>
          </div>
          <span className="text-lg font-bold" style={{ color: goal.color }}>
            {goal.progress.toFixed(0)}%
          </span>
        </div>

        <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute inset-y-0 left-0 rounded-full ${getProgressColor()}`}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">
            {formatCurrency(goal.remaining)} to go
          </span>
          <span className="text-gray-400">
            Deadline: {new Date(goal.deadline).toLocaleDateString()}
          </span>
        </div>

        <button
          onClick={() => onContribute(goal)}
          disabled={goal.isCompleted}
          className="w-full btn btn-primary mt-2 disabled:opacity-50"
          style={{ backgroundColor: goal.color }}
        >
          <DollarSign size={16} className="mr-2" />
          Add Contribution
        </button>
      </div>
    </motion.div>
  );
};

const GoalModal = ({ isOpen, onClose, onSubmit, editingGoal, submitting }) => {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    category: 'General',
    deadline: '',
    color: '#6366F1'
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount,
        category: editingGoal.category,
        deadline: editingGoal.deadline.split('T')[0],
        color: editingGoal.color || '#6366F1'
      });
    } else {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 6);
      setFormData({
        name: '',
        targetAmount: '',
        category: 'General',
        deadline: nextMonth.toISOString().split('T')[0],
        color: '#6366F1'
      });
    }
  }, [editingGoal, isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex justify-center items-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-md p-6 relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Target size={24} className="mr-2 text-indigo-400" />
            {editingGoal ? 'Edit Goal' : 'Create Savings Goal'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Emergency Fund, Vacation"
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Target Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="100000"
                min="1"
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
            >
              <option value="General" className="bg-slate-900 text-white">General</option>
              <option value="Emergency" className="bg-slate-900 text-white">Emergency Fund</option>
              <option value="Travel" className="bg-slate-900 text-white">Travel</option>
              <option value="Education" className="bg-slate-900 text-white">Education</option>
              <option value="Purchase" className="bg-slate-900 text-white">Purchase</option>
              <option value="Investment" className="bg-slate-900 text-white">Investment</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Target Date</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Color</label>
            <div className="flex space-x-2">
              {['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-transform ${formData.color === color ? 'scale-110 ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn btn-secondary px-6">Cancel</button>
            <button type="submit" className="btn btn-primary px-6" disabled={submitting}>
              {submitting ? 'Saving...' : editingGoal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ContributeModal = ({ isOpen, onClose, onSubmit, goal, submitting }) => {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(parseFloat(amount));
  };

  if (!isOpen || !goal) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex justify-center items-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-panel w-full max-w-sm p-6 relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: `${goal.color}20` }}></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add Contribution</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-400 mb-4">Add to your goal: <span className="text-white font-semibold">{goal.name}</span></p>
        <p className="text-sm text-gray-500 mb-4">Remaining: ₹{goal.remaining.toLocaleString()}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                min="1"
                max={goal.remaining}
                className="w-full pl-8 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn btn-secondary px-6">Cancel</button>
            <button type="submit" className="btn btn-primary px-6" disabled={submitting} style={{ backgroundColor: goal.color }}>
              {submitting ? 'Adding...' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      setGoals(Array.isArray(res.data.goals) ? res.data.goals : []);
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const url = editingGoal ? `/goals/${editingGoal.id}` : '/goals';
      const method = editingGoal ? 'put' : 'post';
      
      await api[method](url, {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount)
      });
      
      toast.success(editingGoal ? 'Goal updated' : 'Goal created');
      setShowModal(false);
      setEditingGoal(null);
      loadGoals();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (amount) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/goals/${contributingGoal.id}/contribute`, { amount });
      
      toast.success('Contribution added!');
      if (res.data.goal.isCompleted) {
        toast.success('Congratulations! Goal completed!');
      }
      setShowContributeModal(false);
      setContributingGoal(null);
      loadGoals();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingGoal(null);
  }, []);

  const handleCloseContributeModal = useCallback(() => {
    setShowContributeModal(false);
    setContributingGoal(null);
  }, []);

  const handleDelete = async (goal) => {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    
    try {
      await api.delete(`/goals/${goal.id}`);
      
      toast.success('Goal deleted');
      loadGoals();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <PageLoader />;

  const completedGoals = goals.filter(g => g.isCompleted);
  const activeGoals = goals.filter(g => !g.isCompleted);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white tracking-tight">Savings Goals</h1>
          <p className="text-gray-400 mt-1">Track progress toward your financial targets.</p>
        </motion.div>
        
        <motion.button
          variants={itemVariants}
          onClick={() => { setEditingGoal(null); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={18} className="mr-2" />
          Create Goal
        </motion.button>
      </div>

      {completedGoals.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center">
            <CheckCircle size={20} className="mr-2 text-emerald-400" />
            Completed ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {completedGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onContribute={(g) => { setContributingGoal(g); setShowContributeModal(true); }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {activeGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onContribute={(g) => { setContributingGoal(g); setShowContributeModal(true); }}
            />
          ))}
        </div>
      ) : goals.length === 0 && (
        <motion.div variants={itemVariants} className="glass-panel p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Target size={32} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Savings Goals Yet</h3>
          <p className="text-gray-400 mb-6">Set financial targets and track your progress toward achieving them.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={18} className="mr-2" />
            Create Your First Goal
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        <GoalModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          editingGoal={editingGoal}
          submitting={submitting}
        />
      </AnimatePresence>

      <AnimatePresence>
        <ContributeModal
          isOpen={showContributeModal}
          onClose={handleCloseContributeModal}
          onSubmit={handleContribute}
          goal={contributingGoal}
          submitting={submitting}
        />
      </AnimatePresence>
    </motion.div>
  );
};

export default Goals;
