import React, { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../services/transactionService';
import toast from 'react-hot-toast';
import { Plus, Filter, X, Edit, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

const Transactions = ({ isNew = false }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(isNew);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Form handling
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

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });

  // Filter state
  const [filters, setFilters] = useState({});

  // Fetch both transactions and categories
  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = { ...filters, page, limit: pagination.limit };
      const [transactionsData, categoriesData] = await Promise.all([
        transactionService.getTransactions(query),
        transactionService.getCategories()
      ]);

      setTransactions(transactionsData.transactions || []);
      setPagination(transactionsData.pagination || { page: 1, totalPages: 1 });
      setCategories(categoriesData || []);

    } catch (error) {
      toast.error("Failed to load data.");
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    loadData(pagination.page);
  }, [loadData, pagination.page]);

  // Form submission handler
  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const transactionData = {
        ...data,
        amount: parseFloat(data.amount),
      };

      if (editingTransaction) {
        await transactionService.updateTransaction(editingTransaction.id, transactionData);
        toast.success('Transaction updated successfully');
      } else {
        await transactionService.createTransaction(transactionData);
        toast.success('Transaction added successfully');
      }

      closeFormModal();
      loadData(pagination.page);

    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Open the modal for editing
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    reset({
      ...transaction,
      date: new Date(transaction.date).toISOString().split('T')[0]
    });
    setShowFormModal(true);
  };

  // Open the modal for adding
  const handleAdd = () => {
    setEditingTransaction(null);
    reset({
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowFormModal(true);
  };

  // Close the modal and reset state
  const closeFormModal = () => {
    reset();
    setShowFormModal(false);
    setEditingTransaction(null);
    if (isNew) {
      navigate('/transactions');
    }
  };

  // Handle deletion with confirmation
  const handleDelete = async (id) => {
    try {
      await transactionService.deleteTransaction(id);
      toast.success('Transaction deleted');
      setTransactionToDelete(null); // Close confirmation
      loadData(pagination.page);
    } catch (error) {
      toast.error('Failed to delete transaction.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage !== pagination.page) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const filteredCategories = categories.filter(c => c.type === transactionType);

  const tableVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-12 mt-10 md:mt-0"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
            <p className="text-gray-400 mt-1">View and manage all your transactions.</p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button className="btn btn-secondary flex-1 md:flex-none">
              <Filter size={18} className="mr-2" />
              <span>Filter</span>
            </button>
            <button onClick={handleAdd} className="btn btn-primary flex-1 md:flex-none">
              <Plus size={18} className="mr-2" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-white/5 backdrop-blur-md">
                <tr>
                  <th scope="col" className="px-6 py-4">Transaction</th>
                  <th scope="col" className="px-6 py-4">Category</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Amount</th>
                  <th scope="col" className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={tableVariants}
                initial="hidden"
                animate={!loading ? "show" : "hidden"}
              >
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <div className="spinner mx-auto"></div>
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <motion.tr 
                      variants={rowVariants}
                      key={tx.id} 
                      className="group border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2.5 rounded-xl ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>
                          <span className="font-semibold text-gray-200">{tx.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(tx)} className="p-2 text-gray-400 hover:text-indigo-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => setTransactionToDelete(tx)} className="p-2 text-gray-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-16 text-gray-400">
                      <p>No transactions found.</p>
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>

          {!loading && pagination.total > 0 && (
            <div className="p-4 border-t border-white/10 bg-black/20">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Floating Add Button for Mobile */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAdd}
        className="md:hidden fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/40 z-40"
      >
        <Plus size={24} />
      </motion.button>

      {/* Add/Edit Transaction Modal */}
      <AnimatePresence>
        {showFormModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md flex justify-center items-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-panel w-full max-w-lg p-0 overflow-hidden relative"
            >
              {/* Decorative gradient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg mr-3">
                    <DollarSign size={20} />
                  </div>
                  {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <button onClick={closeFormModal} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Transaction Type</label>
                    <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 relative">
                      {/* Active Background Indicator is a simple absolute div handled via active class for now, or just normal Tailwind */}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        >
                          <option value="" className="bg-gray-900">Select...</option>
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
                  
                  <div className="flex justify-end space-x-3 pt-6 border-t border-white/10 mt-6">
                    <button type="button" onClick={closeFormModal} className="btn btn-secondary px-6" disabled={submitting}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-8" disabled={submitting}>
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="spinner h-4 w-4 border-white border-t-transparent mr-2"></div>
                          Saving...
                        </div>
                      ) : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {transactionToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md flex justify-center items-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-sm p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Transaction?</h3>
              <p className="text-sm text-gray-400">
                Are you sure you want to delete this transaction (<span className="text-gray-300 font-medium">{transactionToDelete.description}</span>)? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setTransactionToDelete(null)} className="btn btn-secondary flex-1">Keep It</button>
                <button onClick={() => handleDelete(transactionToDelete.id)} className="btn btn-danger flex-1">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Transactions;