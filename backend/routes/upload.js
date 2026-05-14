const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/transaction');
const Category = require('../models/category');
const PDFService = require('../services/pdfService'); // Kept for initial text extraction
const AIStatementParserService = require('../services/aiStatementParser');
const AIReceiptParserService = require('../services/aiReceiptParser');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Multer Configurations ---

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Helper to check for valid image extensions
const isValidImageFile = (filename) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    return validExtensions.includes(path.extname(filename).toLowerCase());
};

// Multer config for image receipts
const uploadReceipt = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (isValidImageFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, or WebP images are allowed.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Multer config for PDF statements
const uploadStatement = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (PDFService.isValidPDFFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});



const getMatchedCategory = async (description) => {
  try {
    const categories = await Category.find({ type: 'expense' }).lean();
    const categoryNames = categories.map(c => c.name);
    const d = description ? description.toLowerCase() : '';

    const keywordToCategory = [
      { keywords: ['food', 'dining', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'swiggy', 'zomato', 'milk', 'bakery', 'grocery', 'supermarket', 'mart', 'fresh', 'big bazaar', 'dmart', 'more', 'spencer'], category: 'Food & Dining' },
      { keywords: ['fuel', 'petrol', 'diesel', 'gas', 'uber', 'ola', 'transport', 'metro', 'bus', 'train', 'taxi', 'parking', 'toll', 'vehicle'], category: 'Transportation' },
      { keywords: ['amazon', 'flipkart', 'shopping', 'mall', 'clothes', 'shoes', 'electronics', 'mobile', 'phone', 'laptop'], category: 'Shopping' },
      { keywords: ['netflix', 'spotify', 'movie', 'cinema', 'game', 'entertainment', 'pvr', 'inox', 'bookmyshow'], category: 'Entertainment' },
      { keywords: ['electric', 'wifi', 'recharge', 'bill', 'internet', 'water', 'rent', 'maintenance', 'broadband', 'electricity'], category: 'Bills & Utilities' },
      { keywords: ['medical', 'pharmacy', 'doctor', 'hospital', 'clinic', 'health', 'medicine', 'apollo', 'medplus'], category: 'Healthcare' },
      { keywords: ['education', 'school', 'college', 'tuition', 'course', 'book', 'udemy', 'coursera'], category: 'Education' },
      { keywords: ['hotel', 'flight', 'travel', 'trip', 'airbnb', 'make my trip', 'oyo', 'goibibo', 'booking'], category: 'Travel' },
    ];

    for (const { keywords, category } of keywordToCategory) {
      if (keywords.some(k => d.includes(k)) && categoryNames.includes(category)) {
        return category;
      }
    }

    return categoryNames.find(name => name.includes('Other')) || 'Other Expenses';
  } catch (error) {
    console.error('Category matching error:', error);
    return 'Other Expenses';
  }
};

router.post('/receipt', uploadReceipt.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded', message: 'Please select an image file.' });
  }
  const filePath = req.file.path;

  try {
    if (typeof AIReceiptParserService.parseWithAI !== 'function') {
      console.error("CRITICAL ERROR: AIReceiptParserService.parseWithAI is not a function.");
      throw new Error("AI Receipt Parser service is not available.");
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = Transaction.computeFileHash(fileBuffer);

    const existingFile = await Transaction.findOne({ userId: req.user._id, fileHash });
    if (existingFile) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(409).json({
        success: false,
        error: 'Duplicate receipt',
        message: 'This receipt image has already been uploaded.'
      });
    }

    const result = await AIReceiptParserService.parseWithAI(filePath);

    const { totalAmount, transactionDate, description } = result.data;
    const matchedCategory = await getMatchedCategory(description);

    const responseData = {
      success: true,
      extractedData: {
        amount: totalAmount,
        category: matchedCategory,
        date: transactionDate || new Date().toISOString().split('T')[0],
        description: description || 'Not detected',
        confidence: totalAmount ? 'high' : 'low',
      },
      rawText: JSON.stringify(result.rawResponse || result.data),
      fileUrl: `/uploads/${req.file.filename}`
    };

    if (!totalAmount) {
      responseData.message = 'Receipt processed but amount could not be detected. Please enter it manually on the Transactions page.';
      return res.json(responseData);
    }

    const existingDuplicate = await Transaction.checkDuplicate(req.user._id, {
      amount: totalAmount,
      date: transactionDate || new Date(),
      description: description || 'Transaction from receipt',
      category: matchedCategory
    });

    if (existingDuplicate) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(409).json({
        success: false,
        error: 'Duplicate transaction',
        message: 'A transaction with the same amount, date, description, and category already exists.'
      });
    }

    const transaction = new Transaction({
      userId: req.user._id,
      amount: totalAmount,
      type: 'expense',
      category: matchedCategory,
      description: description || 'Transaction from receipt',
      date: transactionDate ? new Date(transactionDate) : new Date(),
      receiptUrl: `/uploads/${req.file.filename}`,
      fileHash
    });

    await transaction.save();

    responseData.message = 'Receipt processed successfully with AI';
    responseData.transaction = transaction;

    res.json(responseData);

  } catch (error) {
    if (error.code === 11000) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(409).json({
        success: false,
        error: 'Duplicate transaction',
        message: 'This transaction already exists in your records.'
      });
    }
    console.error('AI Receipt processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Receipt processing failed',
      message: error.message
    });
  }
});

router.post('/statement', uploadStatement.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded', message: 'Please select a PDF file.' });
  }
  const filePath = req.file.path;

  try {
    // FIX: Add a similar check for the statement parser for robustness.
    if (typeof AIStatementParserService.parseWithAI !== 'function') {
      console.error("CRITICAL ERROR: AIStatementParserService.parseWithAI is not a function. This is likely caused by an error during the service's initialization (e.g., missing GEMINI_API_KEY in .env).");
      throw new Error("AI Statement Parser service is not available. Please check the server logs for more details.");
    }

    // Step 1: Extract raw text from the PDF.
    const rawText = await PDFService.extractText(filePath);
    if (!rawText || rawText.trim().length < 50) {
      throw new Error('No text could be extracted from the PDF, or the document is empty.');
    }

    // Step 2: Send the raw text to the AI for intelligent parsing.
    const transactionsToInsert = await AIStatementParserService.parseWithAI(rawText, req.user._id);
    
    let insertedCount = 0;
    let duplicateCount = 0;
    const nonDuplicateTransactions = [];

    if (transactionsToInsert.length > 0) {
      // Step 3: Filter out duplicates based on amount, date, description, and category.
      for (const tx of transactionsToInsert) {
        const existing = await Transaction.checkDuplicate(req.user._id, tx);
        if (existing) {
          duplicateCount++;
        } else {
          nonDuplicateTransactions.push(tx);
        }
      }

      // Step 4: Insert only the non-duplicate transactions.
      if (nonDuplicateTransactions.length > 0) {
        const result = await Transaction.insertMany(nonDuplicateTransactions, { ordered: false });
        insertedCount = result.length;
      }
    }

    res.json({
      message: 'Statement processed successfully with AI',
      totalTransactions: transactionsToInsert.length,
      insertedTransactions: insertedCount,
      skippedTransactions: transactionsToInsert.length - insertedCount,
      duplicateCount,
      transactions: transactionsToInsert.slice(0, 10), // Return a preview for the UI
    });

  } catch (error) {
    console.error('AI Statement processing error:', error);
    res.status(500).json({
      error: 'Statement processing failed',
      message: error.message || 'An unexpected error occurred.',
    });
  } finally {
    // Step 4: Always clean up the uploaded PDF file after processing.
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});


router.get('/supported-formats', (req, res) => {
  res.json({
    receipt: {
      description: 'Receipt images (JPG, PNG, WebP)',
      formats: ['.jpg', '.jpeg', '.png', '.webp'],
      maxSize: '10MB'
    },
    statement: {
      description: 'PDF bank statements',
      formats: ['.pdf'],
      maxSize: '10MB'
    }
  });
});

// Multer error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: 'File upload error', message: error.message });
    }
    if (error) {
        return res.status(400).json({ error: 'Invalid file', message: error.message });
    }
    next();
});

module.exports = router;