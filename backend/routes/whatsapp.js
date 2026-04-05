const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const AIStatementParserService = require('../services/aiStatementParser');
const AIReceiptParserService = require('../services/aiReceiptParser');
const fetch = require('node-fetch'); // We might need to download the image from Twilio, or pass the URL directly to Gemini if it supports it, but Gemini API usually takes base64. Let's see how aiReceiptParser behaves.

const { MessagingResponse } = twilio.twiml;

// We need a helper to text parsing if AIStatementParserService is meant for full PDFs.
// Let's create a quick function to use Gemini directly.
async function parseWhatsAppTextWithAI(text) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const prompt = `
You are an expert personal finance assistant processing a WhatsApp message.
Extract these fields:
- amount (number, positive)
- type (expense or income, usually expense unless they say "got paid", "received")
- category (string - e.g. Food & Dining, Utilities, Shopping, Transportation, Entertainment, Health & Fitness, Personal Care)
- description (short string representing what it was, e.g. "Lunch at McD")

Message: "${text}"

Rules:
- Respond with ONLY valid JSON
- If amount is missing, return null for amount

Example:
{ "amount": 250, "type": "expense", "category": "Food & Dining", "description": "Lunch at McD" }
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });
    const data = await res.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("Invalid response");
    
    const cleaned = textResponse.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Text parsing error:", err);
    return null;
  }
}

// Optionally, we could add Twilio signature validation middleware here in production.
// twilio.webhook({ protocol: 'https' }) - but for local testing without https let's just parse.

router.post('/webhook', async (req, res) => {
  const twiml = new MessagingResponse();
  const io = req.app.get('io');
  
  try {
    const rawFrom = req.body.From; // e.g. "whatsapp:+1234567890"
    const bodyText = req.body.Body;
    const mediaUrl = req.body.MediaUrl0;
    
    if (!rawFrom) {
      return res.status(400).send('No From number provided');
    }
    
    // Extract actual number
    const whatsappNumber = rawFrom.replace('whatsapp:', '');
    
    // Authenticate user by whatsappNumber
    const user = await User.findOne({ whatsappNumber });
    
    if (!user) {
      twiml.message(`Your WhatsApp number (${whatsappNumber}) is not linked to any account on the Expense Tracker. Please update your profile settings.`);
      res.type('text/xml').send(twiml.toString());
      return;
    }
    
    let transactionData = null;
    
    if (mediaUrl) {
      // User sent an image (Receipt)
      // Note: Twilio media URLs require authenticating if we restricted access. 
      // For a simple implementation, we can just download the image to a temp file and pass to AIReceiptParserService or directly.
      // Since downloading the image requires dealing with Twilio auth and saving a local file, let's keep it simple or use Gemini text for now.
      
      const os = require('os');
      const fs = require('fs');
      const path = require('path');
      const tempFilePath = path.join(os.tmpdir(), `receipt_${Date.now()}.jpg`);
      
      const mediaResponse = await fetch(mediaUrl);
      const buffer = await mediaResponse.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));
      
      const result = await AIReceiptParserService.parseWithAI(tempFilePath);
      if (result.success && result.data.totalAmount) {
        transactionData = {
          amount: result.data.totalAmount,
          type: 'expense',
          category: AIStatementParserService.categorizeTransaction ? AIStatementParserService.categorizeTransaction(result.data.description, true) : 'Shopping',
          description: result.data.description || 'Receipt from WhatsApp',
          date: result.data.transactionDate ? new Date(result.data.transactionDate) : new Date()
        };
      }
      
      // Cleanup
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      
    } else if (bodyText && bodyText.trim().length > 0) {
      // User sent text
      const parsedData = await parseWhatsAppTextWithAI(bodyText);
      if (parsedData && parsedData.amount) {
        transactionData = {
          amount: parsedData.amount,
          type: parsedData.type || 'expense',
          category: parsedData.category || 'Other',
          description: parsedData.description || bodyText,
          date: new Date()
        };
      }
    }
    
    if (transactionData) {
      const transaction = new Transaction({
        userId: user._id,
        ...transactionData
      });
      await transaction.save();
      
      // Emit to frontend
      if (io) {
        io.to(user._id.toString()).emit('transaction_added', transaction); // Using user ID as room
      }
      
      twiml.message(`✅ Saved ${transaction.type === 'expense' ? 'Expense' : 'Income'}: $${transaction.amount} for ${transaction.description}.`);
    } else {
      twiml.message(`I couldn't understand that transaction. Please send a clear description like "Lunch for $15" or send a receipt image.`);
    }

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    twiml.message(`Sorry, something went wrong processing your request.`);
  }

  res.type('text/xml').send(twiml.toString());
});

module.exports = router;
