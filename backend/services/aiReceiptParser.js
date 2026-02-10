const fs = require("fs");
const path = require("path");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("CRITICAL: GEMINI_API_KEY is not defined in your .env file.");
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";



class AIReceiptParserService {
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
    const prompt = `
You are an expert system for extracting structured data from receipts.

Extract these fields:
- totalAmount (number)
- transactionDate (YYYY-MM-DD)
- description (merchant/store name)

Rules:
- Respond with ONLY valid JSON
- If a value is unclear, use null
- Do not include markdown or extra text

Example:
{ "totalAmount": 249.50, "transactionDate": "2025-07-28", "description": "Reliance Fresh" }
`;

    try {
      console.log("Sending receipt image to Gemini...");

      const base64 = this.fileToBase64(imagePath);
      const mimeType = this.getMimeType(imagePath);

      const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
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
        }),
      });

      const data = await res.json();

      const textResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        console.error("Raw Gemini response:", data);
        throw new Error("Invalid response from Gemini");
      }

      // Clean ```json if model adds it
      const cleaned = textResponse.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(cleaned);

      return {
        success: true,
        data: parsed,
      };
    } catch (error) {
      console.error("Error parsing receipt with AI:", error);
      throw new Error("The AI model could not process the receipt image.");
    }
  }
}

module.exports = AIReceiptParserService;
