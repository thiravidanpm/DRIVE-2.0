// scripts/seed-questions.ts
// Run this once to populate initial questions
// Command: npx ts-node scripts/seed-questions.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleQuestions = [
  // Level 1 - Aptitude Questions
  {
    level: 1,
    category: "Numbers",
    question_text: "What is the sum of the first 10 natural numbers?",
    option_a: "45",
    option_b: "55",
    option_c: "100",
    option_d: "50",
    correct_option: 2,
    difficulty: "Easy",
    source: "Manual",
  },
  {
    level: 1,
    category: "Percentage",
    question_text:
      "If a product costs 100 and has a 20% discount, what is the final price?",
    option_a: "70",
    option_b: "80",
    option_c: "90",
    option_d: "85",
    correct_option: 2,
    difficulty: "Easy",
    source: "Manual",
  },
  {
    level: 1,
    category: "Ratio & Proportion",
    question_text: "If A:B = 2:3 and B:C = 3:4, find A:B:C",
    option_a: "1:2:3",
    option_b: "2:3:4",
    option_c: "3:4:5",
    option_d: "2:4:6",
    correct_option: 2,
    difficulty: "Medium",
    source: "Manual",
  },
  {
    level: 1,
    category: "Time & Work",
    question_text:
      "If A can do a work in 10 days and B in 15 days, how long will they take together?",
    option_a: "5 days",
    option_b: "6 days",
    option_c: "8 days",
    option_d: "12 days",
    correct_option: 2,
    difficulty: "Medium",
    source: "Manual",
  },
  {
    level: 1,
    category: "Average",
    question_text:
      "The average of 5 numbers is 20. If one number is 30, what is the sum of remaining 4 numbers?",
    option_a: "100",
    option_b: "70",
    option_c: "50",
    option_d: "30",
    correct_option: 2,
    difficulty: "Easy",
    source: "Manual",
  },
  {
    level: 1,
    category: "Percentage",
    question_text: "50 is what percent of 200?",
    option_a: "20%",
    option_b: "25%",
    option_c: "33%",
    option_d: "40%",
    correct_option: 2,
    difficulty: "Easy",
    source: "Manual",
  },
  {
    level: 1,
    category: "Numbers",
    question_text:
      "What is the HCF (Highest Common Factor) of 48 and 64?",
    option_a: "8",
    option_b: "12",
    option_c: "16",
    option_d: "24",
    correct_option: 3,
    difficulty: "Medium",
    source: "Manual",
  },
  {
    level: 1,
    category: "Ratio & Proportion",
    question_text: "If 3x = 5y, what is the ratio x:y?",
    option_a: "3:5",
    option_b: "5:3",
    option_c: "1:1",
    option_d: "2:3",
    correct_option: 2,
    difficulty: "Easy",
    source: "Manual",
  },

  // Level 2 - Logical Reasoning
  {
    level: 2,
    category: "Series",
    question_text: "2, 4, 8, 16, ?",
    option_a: "20",
    option_b: "24",
    option_c: "32",
    option_d: "28",
    correct_option: 3,
    difficulty: "Easy",
    source: "Manual",
  },
  {
    level: 2,
    category: "Series",
    question_text: "1, 1, 2, 3, 5, 8, ?",
    option_a: "10",
    option_b: "11",
    option_c: "13",
    option_d: "15",
    correct_option: 3,
    difficulty: "Medium",
    source: "Manual",
  },
  {
    level: 2,
    category: "Coding-Decoding",
    question_text:
      "If LOGIC is coded as 38124, how is GOOD coded?",
    option_a: "7447",
    option_b: "7884",
    option_c: "7664",
    option_d: "7996",
    correct_option: 1,
    difficulty: "Hard",
    source: "Manual",
  },
  {
    level: 2,
    category: "Blood Relations",
    question_text:
      "If A is the brother of B, B is the sister of C, and C is the mother of D, then what is D to A?",
    option_a: "Nephew",
    option_b: "Niece",
    option_c: "Daughter",
    option_d: "Son",
    correct_option: 1,
    difficulty: "Hard",
    source: "Manual",
  },

  // Level 3 - Advanced Programming
  {
    level: 3,
    category: "Algorithms",
    question_text:
      "What is the time complexity of Binary Search?",
    option_a: "O(n)",
    option_b: "O(log n)",
    option_c: "O(n^2)",
    option_d: "O(2^n)",
    correct_option: 2,
    difficulty: "Easy",
    source: "Manual",
  },
  {
    level: 3,
    category: "DSA",
    question_text:
      "Which data structure is used in DFS (Depth First Search)?",
    option_a: "Queue",
    option_b: "Stack",
    option_c: "Heap",
    option_d: "Hash Table",
    correct_option: 2,
    difficulty: "Medium",
    source: "Manual",
  },
  {
    level: 3,
    category: "Algorithms",
    question_text:
      "What is the worst-case time complexity of QuickSort?",
    option_a: "O(n log n)",
    option_b: "O(n^2)",
    option_c: "O(n)",
    option_d: "O(log n)",
    correct_option: 2,
    difficulty: "Medium",
    source: "Manual",
  },
];

async function seedQuestions() {
  console.log("Seeding questions...");

  try {
    const { data, error } = await supabase
      .from("questions")
      .insert(sampleQuestions);

    if (error) {
      console.error("Error seeding questions:", error);
      return;
    }

    console.log(
      `Successfully seeded ${sampleQuestions.length} questions!`
    );
    console.log("Questions added:", data);
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seedQuestions();
