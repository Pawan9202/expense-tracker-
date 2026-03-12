import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, FileText, Image, AlertCircle, CheckCircle, FileUp } from 'lucide-react';
import { uploadService } from '../services/uploadService.js';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Upload = () => {
  const [uploadType, setUploadType] = useState('receipt');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [supportedFormats, setSupportedFormats] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    loadSupportedFormats();
  }, []);

  const loadSupportedFormats = async () => {
    try {
      const formats = await uploadService.getSupportedFormats();
      setSupportedFormats(formats);
    } catch (error) {
      console.error('Error loading supported formats:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      let result;
      if (uploadType === 'receipt') {
        result = await uploadService.uploadReceipt(selectedFile);
      } else {
        result = await uploadService.uploadStatement(selectedFile);
      }

      setUploadResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (!file) return <FileUp className="h-12 w-12 text-gray-500 mb-3" />;

    const extension = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif'].includes(extension)) {
      return <Image className="h-12 w-12 text-indigo-400 mb-3" />;
    } else if (extension === 'pdf') {
      return <FileText className="h-12 w-12 text-rose-400 mb-3" />;
    }
    return <FileUp className="h-12 w-12 text-indigo-400 mb-3" />;
  };

  // Animation variants
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
      className="max-w-4xl mx-auto space-y-6 pb-12 mt-10 md:mt-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-white tracking-tight">Upload Documents</h1>
        <p className="text-gray-400 mt-1">
          Upload receipts for OCR processing or PDF statements for bulk import
        </p>
      </motion.div>

      {/* Upload Type Selection */}
      <motion.div variants={itemVariants} className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select Upload Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setUploadType('receipt')}
            className={`p-5 rounded-xl text-left transition-all duration-300 border ${
              uploadType === 'receipt'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${uploadType === 'receipt' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-gray-400'}`}>
                <Image className="h-6 w-6" />
              </div>
              <div>
                <h4 className={`font-semibold ${uploadType === 'receipt' ? 'text-white' : 'text-gray-300'}`}>Receipt Upload</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Upload receipt images for automatic text extraction
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setUploadType('statement')}
            className={`p-5 rounded-xl text-left transition-all duration-300 border ${
              uploadType === 'statement'
                ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${uploadType === 'statement' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-gray-400'}`}>
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className={`font-semibold ${uploadType === 'statement' ? 'text-white' : 'text-gray-300'}`}>Statement Upload</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Upload PDF bank statements for bulk transaction import
                </p>
              </div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* File Upload Area */}
      <motion.div variants={itemVariants} className="glass-card p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">
          {uploadType === 'receipt' ? 'Upload Receipt Image' : 'Upload PDF Statement'}
        </h3>

        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
            isDragOver 
              ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]' 
              : selectedFile 
                ? 'border-emerald-500/50 bg-emerald-500/5' 
                : 'border-white/20 bg-black/20 hover:border-indigo-400/50 hover:bg-white/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          {isDragOver && (
            <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl filter blur-xl -z-10"></div>
          )}
          
          <input
            id="file-input"
            type="file"
            accept={uploadType === 'receipt' ? 'image/*' : '.pdf'}
            onChange={handleFileSelect}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div 
                key="file-selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                {getFileIcon(selectedFile)}
                <h4 className="mt-2 text-lg font-medium text-white">{selectedFile.name}</h4>
                <p className="text-sm text-gray-400 mt-1">{formatFileSize(selectedFile.size)}</p>
                <div className="mt-4 inline-flex items-center text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full">
                  Click or drag to change file
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="no-file"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 shadow-inner">
                  {getFileIcon()}
                </div>
                <h4 className="text-lg font-medium text-white">
                  {uploadType === 'receipt' ? 'Select receipt image' : 'Select PDF statement'}
                </h4>
                <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                  Drag and drop your file here, or click to browse from your computer
                </p>
                <p className="text-xs text-gray-500 mt-4 bg-black/30 inline-block px-3 py-1 rounded-full border border-white/5">
                  {uploadType === 'receipt'
                    ? `Supported formats: ${supportedFormats.receipt?.formats?.join(', ') || 'JPG, PNG, BMP'}`
                    : 'Supported format: PDF'
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn btn-primary relative w-full sm:w-auto px-8 py-3 text-lg font-medium overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center">
                {isUploading ? (
                  <>
                    <div className="spinner border-t-white/80 border-white/20 mr-3 h-5 w-5"></div>
                    Processing your file...
                  </>
                ) : (
                  <>
                    <UploadIcon size={20} className="mr-2" />
                    {uploadType === 'receipt' ? 'Process Receipt' : 'Process Statement'}
                  </>
                )}
              </div>
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Upload Result */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 border border-white/10 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Processing Result</h3>

            {uploadResult.success ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-medium">Processing completed successfully!</span>
                </div>

                {uploadType === 'receipt' && uploadResult.extractedData && (
                  <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                    <h4 className="font-medium text-gray-300 mb-4 flex items-center">
                      <FileText size={16} className="mr-2" />
                      Extracted Data
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Amount</span>
                        <span className="text-white text-lg font-medium">
                          {uploadResult.extractedData.amount
                            ? `₹${uploadResult.extractedData.amount.toFixed(2)}`
                            : 'Not detected'
                          }
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Category</span>
                        <span className="text-white text-base">
                          {uploadResult.extractedData.category || 'Not detected'}
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Date</span>
                        <span className="text-white text-base">
                          {uploadResult.extractedData.date || 'Not detected'}
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Confidence</span>
                        <span className={`capitalize inline-block px-2 py-1 rounded text-xs font-semibold ${
                            uploadResult.extractedData.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                            uploadResult.extractedData.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                          {uploadResult.extractedData.confidence}
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5 md:col-span-2">
                        <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Description</span>
                        <span className="text-white text-base">
                          {uploadResult.extractedData.description || 'Not detected'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {uploadType === 'statement' && (
                  <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                    <h4 className="font-medium text-gray-300 mb-4">Import Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-center">
                        <span className="text-gray-400 block mb-1">Total Found</span>
                        <span className="text-white text-2xl font-bold">{uploadResult.totalTransactions}</span>
                      </div>
                      <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20 text-center">
                        <span className="text-emerald-400/80 block mb-1">Imported</span>
                        <span className="text-emerald-400 text-2xl font-bold">{uploadResult.insertedTransactions}</span>
                      </div>
                      <div className="bg-rose-500/10 p-4 rounded-lg border border-rose-500/20 text-center">
                        <span className="text-rose-400/80 block mb-1">Skipped</span>
                        <span className="text-rose-400 text-2xl font-bold">{uploadResult.skippedTransactions}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <span className="font-medium">Processing failed: {uploadResult.error}</span>
              </div>
            )}

            {uploadResult.rawText && (
              <details className="mt-4 group">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors flex items-center outline-none">
                  <span className="group-open:rotate-90 transition-transform mr-2">▶</span>
                  View extracted text (developer debug)
                </summary>
                <div className="mt-3 p-4 bg-black/50 border border-white/10 rounded-lg overflow-hidden">
                  <pre className="text-xs text-gray-400 overflow-auto max-h-40 custom-scrollbar whitespace-pre-wrap font-mono">
                    {uploadResult.rawText}
                  </pre>
                </div>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <motion.div variants={itemVariants} className="glass-panel p-6 border border-white/5 bg-white/[0.02]">
        <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>

        {uploadType === 'receipt' ? (
          <ul className="space-y-3 text-sm text-gray-400 list-disc list-inside marker:text-indigo-500">
            <li>Upload clear, well-lit images of receipts</li>
            <li>Supported formats: <strong className="text-gray-300">JPG, PNG, BMP, TIFF</strong></li>
            <li>Maximum file size: <strong className="text-gray-300">10MB</strong></li>
            <li>The system will automatically extract amount, date, and category</li>
            <li>You can review and edit the extracted data before saving</li>
          </ul>
        ) : (
          <ul className="space-y-3 text-sm text-gray-400 list-disc list-inside marker:text-rose-500">
            <li>Upload PDF bank statements or transaction histories</li>
            <li>Supported format: <strong className="text-gray-300">PDF</strong></li>
            <li>Maximum file size: <strong className="text-gray-300">10MB</strong></li>
            <li>Transactions will be automatically categorized based on descriptions</li>
            <li>Review imported transactions in the Transactions page</li>
          </ul>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Upload;