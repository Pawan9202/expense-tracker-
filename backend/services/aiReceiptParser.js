const fs = require("fs");
const path = require("path");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

class AIReceiptParserService {
  static getApiKey() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    return process.env.GEMINI_API_KEY;
  }

  static fileToBase64(filePath) {
    return fs.readFileSync(filePath).toString("base64");
  }

  static getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".jpg":
      case ".jpeg":
        return "image/jpeg";
      case ".png":
        return "image/png";
      case ".webp":
        return "image/webp";
      default:
        return "application/octet-stream";
    }
  }

  static async parseWithAI(imagePath) {
    const prompt = `Analyze this receipt image and extract exactly 3 fields as JSON.

IMPORTANT - Finding the TOTAL AMOUNT:
- Look for the LARGEST amount on the receipt that represents the final payment
- Search for labels: "Total", "Grand Total", "Amount Due", "Net Amount", "Balance Due", "Amount Paid", "Cash", "Card Total", "Grand Total"
- The total is usually at the BOTTOM of the receipt, often in larger or bold text
- If there are multiple amounts, pick the FINAL total after all items, tax, and discounts
- Do NOT pick individual item prices, subtotal, tax amount, or discount amount
- Include decimals if present. Example: 1249.50 NOT 1249
- Return the number ONLY (no currency symbols, no commas)

IMPORTANT - Finding the DATE:
- Look for dates near the top of the receipt (transaction date)
- Common formats: DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY, YYYY-MM-DD
- Convert to YYYY-MM-DD format

IMPORTANT - Finding the MERCHANT:
- Look at the very top of the receipt for the store/shop name
- Include the full name if visible (e.g., "BIG BAZAAR (FUTURE RETAIL LTD)")

Return ONLY this JSON format, nothing else:
{"totalAmount": 249.50, "transactionDate": "2025-01-15", "description": "Store Name Here"}

If a field cannot be found, use null for that field. But ALWAYS try to find the totalAmount - it is the most important field.`;

    try {
      console.log("Sending receipt image to Gemini...");

      const base64 = this.fileToBase64(imagePath);
      const mimeType = this.getMimeType(imagePath);

      const res = await fetch(`${GEMINI_URL}?key=${this.getApiKey()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Gemini API error:", res.status, JSON.stringify(errorData));
        throw new Error(`Gemini API returned ${res.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await res.json();

      const textResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        console.error("Raw Gemini response:", JSON.stringify(data));
        throw new Error("Invalid response from Gemini - no text found");
      }

      const cleaned = textResponse.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      let amount = parsed.totalAmount;
      if (typeof amount === "string") {
        amount = parseFloat(amount.replace(/[₹$,\s₹]/g, ""));
      }
      if (isNaN(amount) || amount <= 0) {
        amount = null;
      }

      let date = parsed.transactionDate;
      if (date && typeof date === "string") {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split("T")[0];
        }
      }

      return {
        success: true,
        data: {
          totalAmount: amount,
          transactionDate: date || null,
          description: parsed.description || null,
        },
        rawResponse: parsed,
      };
    } catch (error) {
      console.error("Error parsing receipt with AI:", error);
      throw new Error(`The AI model could not process the receipt image: ${error.message}`);
    }
  }
}

module.exports = AIReceiptParserService;
