if (!process.env.GEMINI_API_KEY) {
  throw new Error("CRITICAL: GEMINI_API_KEY is not defined.");
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

class AIStatementParserService {
  static async parseWithAI(text, userId) {
    const prompt = `
You are an expert financial data extraction tool. Extract all transactions.

Text:
---
${text}
---

Return JSON array with:
- date (YYYY-MM-DD)
- description
- amount (number)
- type ("expense" or "income")

Rules:
- Only valid transactions
- Ignore summaries, balances
- Return only JSON
- If none, return []

Example:
[
  {
    "date": "2025-07-21",
    "description": "UPI Debit Paytm",
    "amount": 1500,
    "type": "expense"
  }
]
`;

    try {
      console.log("Sending statement to Gemini...");

      const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      const data = await res.json();

      const textResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error("Invalid Gemini response");
      }

      const cleaned = textResponse.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return parsed.map((tx) => ({
        userId,
        amount: tx.amount,
        type: tx.type,
        category: this.categorizeTransaction(tx.description, tx.type === "expense"),
        description: tx.description,
        date: new Date(tx.date),
        receiptUrl: null,
      }));
    } catch (err) {
      console.error("Gemini error:", err);
      throw new Error("AI could not process the statement.");
    }
  }

  static categorizeTransaction(description, isExpense) {
    const d = description.toLowerCase();

    if (/salary|payroll/.test(d)) return "Salary";
    if (/interest|refund/.test(d)) return "Investment";
    if (/restaurant|cafe|food|dhaba|milk/.test(d)) return "Food & Dining";
    if (/grocery|supermarket/.test(d)) return "Food & Dining";
    if (/fuel|gas|uber|ola|transport/.test(d)) return "Transportation";
    if (/amazon|flipkart|shopping|paytm|upi/.test(d)) return "Shopping";
    if (/netflix|spotify|movie/.test(d)) return "Entertainment";
    if (/electric|wifi|recharge|bill/.test(d)) return "Bills & Utilities";
    if (/medical|pharmacy/.test(d)) return "Healthcare";
    if (/hotel|flight/.test(d)) return "Travel";

    return isExpense ? "Other Expenses" : "Other Income";
  }
}

module.exports = AIStatementParserService;
