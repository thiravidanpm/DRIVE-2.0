// lib/webhookParser.ts
/**
 * Parses webhook response with questions in various formats
 */

interface ParsedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number; // 1-4
  category: string;
  difficulty: string;
  level: number;
}

export function parseWebhookResponse(body: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  try {
    // Split by array brackets to handle multiple question blocks
    const blocks = body.split(/\]\s*\[/).map((block, idx) => {
      if (idx === 0) return block.replace(/^[\[\s]*/, "");
      if (idx === body.split(/\]\s*\[/).length - 1) return block.replace(/[\]\s]*$/, "");
      return block;
    });

    for (const block of blocks) {
      try {
        const cleanBlock = block
          .trim()
          .replace(/^[\[\s]+/, "")
          .replace(/[\]\s]+$/, "")
          .replace(/```json\n?/, "")
          .replace(/```\n?/, "");

        if (!cleanBlock) continue;

        const parsed = JSON.parse(cleanBlock);

        // Handle both single object and array
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          const question = normalizeQuestion(item);
          if (question) {
            questions.push(question);
          }
        }
      } catch (error) {
        console.log("Skipping invalid block:", block.substring(0, 50));
        continue;
      }
    }
  } catch (error) {
    console.error("Error parsing webhook:", error);
  }

  return questions;
}

function normalizeQuestion(item: any): ParsedQuestion | null {
  try {
    const question: ParsedQuestion = {
      question_text: item.question || item.q || "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: 1,
      category: "Aptitude",
      difficulty: "Medium",
      level: 1,
    };

    if (!question.question_text) return null;

    // Parse options - handle different formats
    const options = item.options || [];

    if (Array.isArray(options)) {
      // Array format: ["opt1", "opt2", "opt3", "opt4"]
      question.option_a = options[0] || "";
      question.option_b = options[1] || "";
      question.option_c = options[2] || "";
      question.option_d = options[3] || "";
    } else if (typeof options === "object") {
      // Object with keys: {a, b, c, d} or {A, B, C, D} or custom keys
      const keys = Object.keys(options);
      const sortedKeys = keys.sort();

      question.option_a = options[sortedKeys[0]] || options["a"] || options["A"] || "";
      question.option_b = options[sortedKeys[1]] || options["b"] || options["B"] || "";
      question.option_c = options[sortedKeys[2]] || options["c"] || options["C"] || "";
      question.option_d = options[sortedKeys[3]] || options["d"] || options["D"] || "";
    }

    // Parse answer - handle different formats
    const answer = (item.answer || "").toString().toLowerCase().trim();

    // Map answer to correct_option (1-4)
    if (answer === "a" || answer === "option a" || answer === "0" || answer.startsWith("0")) {
      question.correct_option = 1;
    } else if (answer === "b" || answer === "option b" || answer === "1" || answer.startsWith("1")) {
      question.correct_option = 2;
    } else if (answer === "c" || answer === "option c" || answer === "2" || answer.startsWith("2")) {
      question.correct_option = 3;
    } else if (answer === "d" || answer === "option d" || answer === "3" || answer.startsWith("3")) {
      question.correct_option = 4;
    } else if (
      answer.includes(question.option_b) ||
      question.option_b.toLowerCase().includes(answer.split(":")[1]?.toLowerCase().trim() || "")
    ) {
      question.correct_option = 2;
    } else if (
      answer.includes(question.option_c) ||
      question.option_c.toLowerCase().includes(answer.split(":")[1]?.toLowerCase().trim() || "")
    ) {
      question.correct_option = 3;
    } else if (
      answer.includes(question.option_d) ||
      question.option_d.toLowerCase().includes(answer.split(":")[1]?.toLowerCase().trim() || "")
    ) {
      question.correct_option = 4;
    } else {
      question.correct_option = 1;
    }

    // Classify by category based on keywords
    const questionLower = question.question_text.toLowerCase();
    if (
      questionLower.includes("petrol") ||
      questionLower.includes("profit") ||
      questionLower.includes("loss") ||
      questionLower.includes("interest") ||
      questionLower.includes("rupees") ||
      questionLower.includes("rs.")
    ) {
      question.category = "Aptitude";
      question.level = 1;
    } else if (
      questionLower.includes("arrangement") ||
      questionLower.includes("sitting") ||
      questionLower.includes("relation") ||
      questionLower.includes("direction") ||
      questionLower.includes("rank")
    ) {
      question.category = "Logical Reasoning";
      question.level = 2;
    } else if (
      questionLower.includes("code") ||
      questionLower.includes("series") ||
      questionLower.includes("pattern")
    ) {
      question.category = "Pattern Recognition";
      question.level = 2;
    } else {
      question.category = "General";
      question.level = 1;
    }

    // Set difficulty
    if (questionLower.includes("easy") || question.category === "Aptitude") {
      question.difficulty = "Medium";
    } else if (questionLower.includes("hard")) {
      question.difficulty = "Hard";
    }

    return question;
  } catch (error) {
    return null;
  }
}

export function formatQuestionForDownload(questions: ParsedQuestion[]): string {
  let text = `DRIVE 2.0 - Question Set\n`;
  text += `Generated: ${new Date().toLocaleString()}\n`;
  text += `Total Questions: ${questions.length}\n`;
  text += `${"=".repeat(60)}\n\n`;

  questions.forEach((q, idx) => {
    text += `Q${idx + 1}. ${q.question_text}\n`;
    text += `\n`;
    text += `A) ${q.option_a}\n`;
    text += `B) ${q.option_b}\n`;
    text += `C) ${q.option_c}\n`;
    text += `D) ${q.option_d}\n`;
    text += `\nAnswer: ${String.fromCharCode(64 + q.correct_option)}\n`;
    text += `Category: ${q.category} | Difficulty: ${q.difficulty} | Level: ${q.level}\n`;
    text += `${"_".repeat(60)}\n\n`;
  });

  return text;
}
