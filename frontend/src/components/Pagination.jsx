import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mt-8 p-3 glass-panel border border-white/5 rounded-2xl"
    >
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed group"
      >
        <ChevronLeft size={16} className="mr-1 text-gray-400 group-hover:text-white transition-colors" />
        <span>Prev</span>
      </button>

      <div className="text-sm text-gray-400 px-4 py-2 bg-black/20 rounded-xl border border-white/5 backdrop-blur-sm shadow-inner">
        Page <span className="font-bold text-white mx-1">{currentPage}</span> of <span className="font-bold text-gray-300 mx-1">{totalPages}</span>
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed group"
      >
        <span>Next</span>
        <ChevronRight size={16} className="ml-1 text-gray-400 group-hover:text-white transition-colors" />
      </button>
    </motion.div>
  );
};

export default Pagination;