const config = require('../config');

class AIService {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    this.model = 'gemini-2.0-flash';
  }

  async generateSpendingInsights(transactions, month, year) {
    if (!this.geminiKey) {
      return this.getDefaultInsights(transactions, month);
    }

    try {
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const categoryBreakdown = {};
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        });

      const topCategories = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const prompt = `Analyze this user's spending for ${month}/${year}:

Total Expenses: $${totalExpenses.toFixed(2)}

Top Categories:
${topCategories.map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)} (${((amount/totalExpenses)*100).toFixed(1)}%)`).join('\n')}

Provide 3-5 actionable spending insights. Keep each insight concise (1 sentence). Focus on:
- Unusual spending patterns
- Areas where they can save
- Month-over-month comparisons if possible

Format as a JSON array of objects with "title" and "description" fields only.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultInsights(transactions, month);
    } catch (error) {
      console.error('AI insights generation failed:', error.message);
      return this.getDefaultInsights(transactions, month);
    }
  }

  getDefaultInsights(transactions, month) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryTotals = {};
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])[0];

    const insights = [];

    if (topCategory) {
      const percentage = ((topCategory[1] / totalExpenses) * 100).toFixed(1);
      insights.push({
        title: `Highest spending in ${topCategory[0]}`,
        description: `You spent ${percentage}% of your total expenses on ${topCategory[0]}. Consider reviewing this category for potential savings.`
      });
    }

    if (totalExpenses > 2000) {
      insights.push({
        title: 'High monthly expenses',
        description: `Your total expenses of $${totalExpenses.toFixed(2)} are above the typical range. Look for recurring subscriptions to cancel.`
      });
    }

    if (expenses.length > 50) {
      insights.push({
        title: 'High transaction volume',
        description: `You made ${expenses.length} transactions this month. Tracking every expense helps identify savings opportunities.`
      });
    }

    const categories = Object.keys(categoryTotals).length;
    if (categories > 10) {
      insights.push({
        title: 'Diverse spending categories',
        description: `You have ${categories} expense categories. Consider consolidating similar expenses to better track spending.`
      });
    }

    return insights;
  }

  async autoCategorizeTransaction(description, amount) {
    if (!this.geminiKey) {
      return this.getDefaultCategory(description);
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Categorize this transaction into ONE of these categories exactly: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Income, Other. Just return the category name, nothing else.\nTransaction: "${description}" - $${amount}` 
            }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 20 }
        })
      });

      const data = await response.json();
      const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      const validCategories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Travel', 'Income', 'Other'];
      if (validCategories.includes(category)) {
        return category;
      }
      return this.getDefaultCategory(description);
    } catch (error) {
      console.error('Auto-categorization failed:', error.message);
      return this.getDefaultCategory(description);
    }
  }

  getDefaultCategory(description) {
    const keywords = {
      'Food & Dining': ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'grocery', 'uber eats', 'doordash', 'grubhub'],
      'Transportation': ['uber', 'lyft', 'gas', 'fuel', 'parking', 'transit', 'metro', 'taxi'],
      'Shopping': ['amazon', 'walmart', 'target', 'ebay', 'shop', 'store', 'mall'],
      'Entertainment': ['netflix', 'spotify', 'movie', 'game', 'concert', 'hulu', 'disney'],
      'Bills & Utilities': ['electric', 'water', 'internet', 'phone', 'utility', 'bill'],
      'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health', 'dental'],
      'Travel': ['airline', 'hotel', 'airbnb', 'flight', 'booking', 'vacation']
    };

    const lowerDesc = description.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(w => lowerDesc.includes(w))) {
        return category;
      }
    }
    return 'Other';
  }

  async predictFutureSpending(transactions, monthsAhead = 3) {
    const monthlyTotals = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + t.amount;
      });

    const months = Object.keys(monthlyTotals).sort();
    if (months.length < 2) {
      return {
        prediction: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        confidence: 'low',
        message: 'Not enough historical data for accurate prediction'
      };
    }

    const values = months.map(m => monthlyTotals[m]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const lastMonth = months[months.length - 1];
    const lastValue = monthlyTotals[lastMonth];
    const trend = (lastValue - values[0]) / values.length;

    const prediction = avg + (trend * monthsAhead);
    const confidence = values.length >= 6 ? 'high' : values.length >= 3 ? 'medium' : 'low';

    return {
      prediction: Math.max(0, prediction),
      confidence,
      averageMonthly: avg,
      trend: trend > 0 ? 'increasing' : 'decreasing',
      volatility: stdDev / avg
    };
  }
}

module.exports = new AIService();