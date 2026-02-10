const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");

function render_page(pageData) {
  let render_options = {
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  };

  return pageData.getTextContent(render_options).then(function (textContent) {
    let lastY,
      text = "";
    for (let item of textContent.items) {
      if (lastY === item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += "\n" + item.str;
      }
      lastY = item.transform[5];
    }
    return text;
  });
}

class PDFService {
  // ---------------------------
  // 1. Extract text from PDF
  // ---------------------------
  static async extractText(pdfPath) {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(dataBuffer, { pageRender: render_page });
      return data.text;
    } catch (error) {
      console.error("PDF text extraction failed:", error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // ---------------------------
  // 2. Parse transactions from extracted text
  // ---------------------------
  static async parseTransactionStatement(text, userId) {
    const transactions = [];
    const lines = text.split("\n").map((line) => line.trim());

    const startIndex = lines.findIndex((line) =>
      line.toUpperCase().includes("BALANCE B/F")
    );

    if (startIndex === -1) {
      console.error("Could not find the start of transaction data.");
      return [];
    }

    const transactionLines = lines.slice(startIndex);

    const anchorRegex =
      /(\d{2}\/\d{2}\/\d{4})\s+(?:\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([\d,.]*)\s+([\d,.]*)\s+([\d,.]+\s*CR)/;

    let descriptionBuffer = [];

    for (const line of transactionLines) {
      const match = line.match(anchorRegex);

      if (match) {
        // Finalize previous transaction description
        if (transactions.length > 0) {
          const lastTx = transactions[transactions.length - 1];
          lastTx.description = (
            (lastTx.description || "") +
            " " +
            descriptionBuffer.join(" ")
          )
            .replace(/\s+/g, " ")
            .trim();

          lastTx.category = this.categorizeTransaction(
            lastTx.description,
            lastTx.type === "expense"
          );
        }

        descriptionBuffer = [];

        const [, dateStr, descPart, debitStr, creditStr] = match;

        const date = this.parseDate(dateStr);
        if (!date) continue;

        const debit = this.parseAmount(debitStr);
        const credit = this.parseAmount(creditStr);

        if (debit > 0 || credit > 0) {
          const isExpense = debit > 0;
          const amount = isExpense ? debit : credit;

          transactions.push({
            user_id: userId,
            amount,
            type: isExpense ? "expense" : "income",
            category: "Uncategorized",
            description: descPart || "Unknown Transaction",
            date,
            receipt_url: null,
          });
        }
      } else if (transactions.length > 0) {
        if (
          line.length > 1 &&
          !/^\d{2}\/\d{2}\/\d{4}/.test(line) &&
          !/Page No:/i.test(line)
        ) {
          descriptionBuffer.push(line);
        }
      }
    }

    // Final cleanup for last transaction
    if (transactions.length > 0 && descriptionBuffer.length > 0) {
      const lastTx = transactions[transactions.length - 1];
      lastTx.description = (
        (lastTx.description || "") +
        " " +
        descriptionBuffer.join(" ")
      )
        .replace(/\s+/g, " ")
        .trim();

      lastTx.category = this.categorizeTransaction(
        lastTx.description,
        lastTx.type === "expense"
      );
    }

    console.log(
      `State-machine parser successfully extracted ${transactions.length} transactions.`
    );

    return transactions;
  }

  // ---------------------------
  // 3. Safe date parsing
  // ---------------------------
  static parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      const parts = dateStr.split(/\s+/)[0].split("/");
      if (parts.length !== 3) return null;

      const [day, month, year] = parts;

      const date = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );

      if (isNaN(date.getTime())) return null;

      return date.toISOString().split("T")[0];
    } catch {
      return null;
    }
  }

  // ---------------------------
  // 4. Safe amount parsing
  // ---------------------------
  static parseAmount(amountStr) {
    if (!amountStr || typeof amountStr !== "string") return 0;

    try {
      const cleanAmount = amountStr.replace(/[$,CR]/gi, "").trim();
      const amount = parseFloat(cleanAmount);
      return isNaN(amount) ? 0 : amount;
    } catch {
      return 0;
    }
  }

  // ---------------------------
  // 5. Safe categorization (no crashes)
  // ---------------------------
  static categorizeTransaction(description, isExpense) {
    if (!description || typeof description !== "string") {
      return isExpense ? "Other Expenses" : "Other Income";
    }

    const lowerDesc = description.toLowerCase();

    if (/salary|payroll/.test(lowerDesc)) return "Salary";
    if (/interest|credit\s*rfnd|refund/.test(lowerDesc)) return "Investment";
    if (/restaurant|cafe|food|dhaba|milk/.test(lowerDesc)) return "Food & Dining";
    if (/grocery|supermarket/.test(lowerDesc)) return "Food & Dining";
    if (/gas|fuel|transport|uber|ola/.test(lowerDesc)) return "Transportation";
    if (/amazon|walmart|shopping|paytm|upi/.test(lowerDesc)) return "Shopping";
    if (/netflix|spotify|movie/.test(lowerDesc)) return "Entertainment";
    if (/utility|electric|internet|wifi|recharge/.test(lowerDesc))
      return "Bills & Utilities";
    if (/pharmacy|medical|doctor/.test(lowerDesc)) return "Healthcare";
    if (/flight|hotel|travel/.test(lowerDesc)) return "Travel";

    return isExpense ? "Other Expenses" : "Other Income";
  }

  // ---------------------------
  // 6. Full pipeline
  // ---------------------------
  static async processStatement(pdfPath, userId) {
    try {
      if (!fs.existsSync(pdfPath)) throw new Error("PDF file not found");

      const text = await PDFService.extractText(pdfPath);

      if (!text || text.trim().length === 0)
        throw new Error("No text could be extracted from the PDF");

      const transactions = await PDFService.parseTransactionStatement(
        text,
        userId
      );

      return {
        success: true,
        transactions,
        count: transactions.length,
        rawText: text.substring(0, 1500) + "...",
      };
    } catch (error) {
      console.error("PDF statement processing failed:", error);
      return {
        success: false,
        error: error.message,
        transactions: [],
        count: 0,
        rawText: null,
      };
    }
  }

  // ---------------------------
  // 7. Helpers
  // ---------------------------
  static isValidPDFFile(filePath) {
    return path.extname(filePath).toLowerCase() === ".pdf";
  }

  static getSupportedFormats() {
    return [".pdf"];
  }
}

module.exports = PDFService;
