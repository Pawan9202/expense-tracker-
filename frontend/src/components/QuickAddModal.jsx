import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownRight, Calendar, Tag, FileText, Zap } from 'lucide-react';
import { transactionService } from '../services/transactionService.js';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const QuickAddModal = ({ isOpen, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const transactionType = watch('type');

  const loadCategories = useCallback(async () => {
    if (categories.length > 0 || loadingCategories) return;
    setLoadingCategories(true);
    setCategoriesError(false);
    try {
      const cats = await transactionService.getCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategoriesError(true);
    } finally {
      setLoadingCategories(false);
    }
  }, [categories.length, loadingCategories]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  useEffect(() => {
    reset({ ...watch(), category: '' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const transactionData = {
        ...data,
        amount: parseFloat(data.amount),
      };
      await transactionService.createTransaction(transactionData);
      toast.success('Transaction added successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === transactionType);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex justify-center items-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="glass-panel w-full max-w-md p-0 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg mr-3">
                  <Zap size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Quick Add</h2>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">Transaction Type</label>
                  <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 relative">
                    <label className={`flex-1 relative flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${transactionType === 'expense' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                      <input type="radio" value="expense" {...register('type')} className="sr-only" />
                      <ArrowDownRight size={18} className={`mr-2 ${transactionType === 'expense' ? 'text-rose-400' : ''}`} />
                      <span className="font-semibold">Expense</span>
                    </label>
                    <label className={`flex-1 relative flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all ${transactionType === 'income' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                      <input type="radio" value="income" {...register('type')} className="sr-only" />
                      <ArrowUpRight size={18} className={`mr-2 ${transactionType === 'income' ? 'text-emerald-400' : ''}`} />
                      <span className="font-semibold">Income</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="amount" className="text-sm font-medium text-gray-300 mb-1.5 block">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium">₹</span>
                    </div>
                    <input
                      id="amount" type="number" step="0.01" placeholder="0.00"
                      {...register('amount', { required: 'Amount is required', valueAsNumber: true, min: { value: 0.01, message: 'Amount must be positive' } })}
                      className="w-full pl-8 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
                    />
                  </div>
                  {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount.message}</p>}
                </div>
                
                <div>
                  <label htmlFor="description" className="text-sm font-medium text-gray-300 mb-1.5 block">Description</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FileText size={18} className="text-gray-500" />
                    </div>
                    <input
                      id="description" type="text" placeholder="e.g., Grocery shopping"
                      {...register('description', { required: 'Description is required' })}
                      className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
                    />
                  </div>
                  {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="text-sm font-medium text-gray-300 mb-1.5 block">Category</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Tag size={18} className="text-gray-500" />
                      </div>
                      <select 
                        id="category" 
                        {...register('category', { required: 'Category is required' })} 
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all appearance-none"
                        disabled={loadingCategories}
                      >
                        <option value="" className="bg-gray-900">
                          {loadingCategories ? 'Loading...' : categoriesError ? 'Error loading' : 'Select...'}
                        </option>
                        {filteredCategories.map(cat => (
                          <option key={cat.id} value={cat.name} className="bg-gray-900">{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.category && <p className="text-rose-400 text-xs mt-1">{errors.category.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="date" className="text-sm font-medium text-gray-300 mb-1.5 block">Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Calendar size={18} className="text-gray-500" />
                      </div>
                      <input
                        id="date" type="date"
                        {...register('date', { required: 'Date is required' })}
                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all appearance-none [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
                      />
                    </div>
                    {errors.date && <p className="text-rose-400 text-xs mt-1">{errors.date.message}</p>}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={onClose} className="btn btn-secondary px-6" disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-8" disabled={submitting}>
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Zap size={16} className="mr-2" />
                        Add Transaction
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickAddModal;
