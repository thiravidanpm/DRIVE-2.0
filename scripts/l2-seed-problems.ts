// L2 DSA Problem Seed Data - First 24 problems from Striver A2Z Sheet
// Run: npx ts-node scripts/seed-l2-problems.ts
// Or paste the JSON into the admin import tool

export const L2_SEED_PROBLEMS = [
  // ========== WEEK 1: Step 1 - Basics ==========
  {
    title: "Sum of N Natural Numbers",
    description: "Given a number N, find the sum of first N natural numbers.\n\nInput: A single integer N\nOutput: Print the sum of 1 + 2 + 3 + ... + N\n\nConstraints:\n1 <= N <= 10^6",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "5", expected_output: "15" },
      { input: "10", expected_output: "55" },
      { input: "1", expected_output: "1" },
      { input: "100", expected_output: "5050" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Check Palindrome Number",
    description: "Given an integer N, check if it is a palindrome. A number is palindrome if it reads the same backward as forward.\n\nInput: A single integer N\nOutput: Print \"true\" if palindrome, \"false\" otherwise\n\nConstraints:\n-10^6 <= N <= 10^6\nNote: Negative numbers are not palindromes.",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "121", expected_output: "true" },
      { input: "123", expected_output: "false" },
      { input: "-121", expected_output: "false" },
      { input: "1", expected_output: "true" },
      { input: "1221", expected_output: "true" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Factorial of N",
    description: "Given a number N, find N! (N factorial).\n\nN! = 1 × 2 × 3 × ... × N\n\nInput: A single integer N\nOutput: Print N!\n\nConstraints:\n0 <= N <= 20",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "5", expected_output: "120" },
      { input: "0", expected_output: "1" },
      { input: "1", expected_output: "1" },
      { input: "10", expected_output: "3628800" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Count Digits",
    description: "Given a number N, count the number of digits in N.\n\nInput: A single integer N\nOutput: Print the count of digits\n\nConstraints:\n1 <= N <= 10^9",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "12345", expected_output: "5" },
      { input: "7", expected_output: "1" },
      { input: "1000", expected_output: "4" },
      { input: "999999999", expected_output: "9" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },

  // ========== WEEK 2: Step 1 - Basics contd ==========
  {
    title: "Reverse a Number",
    description: "Given an integer N, reverse it.\n\nInput: A single integer N\nOutput: Print the reversed number\n\nConstraints:\n-10^9 <= N <= 10^9\nNote: If N = 1200, reversed = 21",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "12345", expected_output: "54321" },
      { input: "1200", expected_output: "21" },
      { input: "7", expected_output: "7" },
      { input: "100", expected_output: "1" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Check Armstrong Number",
    description: "Given an integer N, check if it is an Armstrong number. A number is Armstrong if the sum of each digit raised to the power of the number of digits equals the number itself.\n\nExample: 153 = 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153\n\nInput: A single integer N\nOutput: Print \"true\" if Armstrong, \"false\" otherwise\n\nConstraints:\n1 <= N <= 10^6",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "153", expected_output: "true" },
      { input: "371", expected_output: "true" },
      { input: "123", expected_output: "false" },
      { input: "1", expected_output: "true" },
      { input: "9474", expected_output: "true" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\n#include <math.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Fibonacci Number",
    description: "Given N, find the Nth Fibonacci number (0-indexed).\n\nFibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, ...\nF(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)\n\nInput: A single integer N\nOutput: Print F(N)\n\nConstraints:\n0 <= N <= 30",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "0", expected_output: "0" },
      { input: "1", expected_output: "1" },
      { input: "5", expected_output: "5" },
      { input: "10", expected_output: "55" },
      { input: "20", expected_output: "6765" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Check Prime Number",
    description: "Given a number N, check if it is prime.\n\nA prime number is a number greater than 1 that has no positive divisors other than 1 and itself.\n\nInput: A single integer N\nOutput: Print \"true\" if prime, \"false\" otherwise\n\nConstraints:\n1 <= N <= 10^6",
    category: "Basics",
    difficulty: "Easy",
    step_number: 1,
    test_cases: [
      { input: "7", expected_output: "true" },
      { input: "4", expected_output: "false" },
      { input: "1", expected_output: "false" },
      { input: "2", expected_output: "true" },
      { input: "97", expected_output: "true" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Write your code here\n    return 0;\n}"
    }
  },

  // ========== WEEK 3: Step 2 - Sorting ==========
  {
    title: "Selection Sort",
    description: "Given an array of N integers, sort it using Selection Sort and print the sorted array.\n\nInput:\nFirst line: N (size of array)\nSecond line: N space-separated integers\n\nOutput: Print the sorted array as space-separated integers\n\nConstraints:\n1 <= N <= 1000\n-10^5 <= arr[i] <= 10^5",
    category: "Sorting",
    difficulty: "Easy",
    step_number: 2,
    test_cases: [
      { input: "5\n64 25 12 22 11", expected_output: "11 12 22 25 64" },
      { input: "3\n3 1 2", expected_output: "1 2 3" },
      { input: "1\n5", expected_output: "5" },
      { input: "4\n4 3 2 1", expected_output: "1 2 3 4" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Bubble Sort",
    description: "Given an array of N integers, sort it using Bubble Sort and print the sorted array.\n\nInput:\nFirst line: N (size of array)\nSecond line: N space-separated integers\n\nOutput: Print the sorted array as space-separated integers\n\nConstraints:\n1 <= N <= 1000\n-10^5 <= arr[i] <= 10^5",
    category: "Sorting",
    difficulty: "Easy",
    step_number: 2,
    test_cases: [
      { input: "5\n5 1 4 2 8", expected_output: "1 2 4 5 8" },
      { input: "3\n3 2 1", expected_output: "1 2 3" },
      { input: "1\n42", expected_output: "42" },
      { input: "6\n6 5 4 3 2 1", expected_output: "1 2 3 4 5 6" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Insertion Sort",
    description: "Given an array of N integers, sort it using Insertion Sort and print the sorted array.\n\nInput:\nFirst line: N (size of array)\nSecond line: N space-separated integers\n\nOutput: Print the sorted array as space-separated integers\n\nConstraints:\n1 <= N <= 1000\n-10^5 <= arr[i] <= 10^5",
    category: "Sorting",
    difficulty: "Easy",
    step_number: 2,
    test_cases: [
      { input: "5\n12 11 13 5 6", expected_output: "5 6 11 12 13" },
      { input: "3\n1 2 3", expected_output: "1 2 3" },
      { input: "4\n4 3 2 1", expected_output: "1 2 3 4" },
      { input: "1\n99", expected_output: "99" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Merge Sort",
    description: "Given an array of N integers, sort it using Merge Sort and print the sorted array.\n\nInput:\nFirst line: N (size of array)\nSecond line: N space-separated integers\n\nOutput: Print the sorted array as space-separated integers\n\nConstraints:\n1 <= N <= 10000\n-10^5 <= arr[i] <= 10^5",
    category: "Sorting",
    difficulty: "Medium",
    step_number: 2,
    test_cases: [
      { input: "6\n38 27 43 3 9 82", expected_output: "3 9 27 38 43 82" },
      { input: "5\n5 4 3 2 1", expected_output: "1 2 3 4 5" },
      { input: "1\n1", expected_output: "1" },
      { input: "3\n1 1 1", expected_output: "1 1 1" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },

  // ========== WEEK 4: Step 3 - Arrays (Easy) ==========
  {
    title: "Largest Element in Array",
    description: "Given an array of N integers, find the largest element.\n\nInput:\nFirst line: N (size of array)\nSecond line: N space-separated integers\n\nOutput: Print the largest element\n\nConstraints:\n1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9",
    category: "Arrays",
    difficulty: "Easy",
    step_number: 3,
    test_cases: [
      { input: "5\n1 8 7 56 90", expected_output: "90" },
      { input: "3\n-1 -5 -3", expected_output: "-1" },
      { input: "1\n42", expected_output: "42" },
      { input: "4\n5 5 5 5", expected_output: "5" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Second Largest Element",
    description: "Given an array of N integers, find the second largest distinct element. If no second largest exists, print -1.\n\nInput:\nFirst line: N\nSecond line: N space-separated integers\n\nOutput: Print the second largest element, or -1\n\nConstraints:\n1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9",
    category: "Arrays",
    difficulty: "Easy",
    step_number: 3,
    test_cases: [
      { input: "5\n12 35 1 10 34", expected_output: "34" },
      { input: "3\n10 10 10", expected_output: "-1" },
      { input: "2\n5 3", expected_output: "3" },
      { input: "1\n7", expected_output: "-1" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Move Zeros to End",
    description: "Given an array of N integers, move all zeros to the end while maintaining the relative order of non-zero elements.\n\nInput:\nFirst line: N\nSecond line: N space-separated integers\n\nOutput: Print the modified array as space-separated integers\n\nConstraints:\n1 <= N <= 10^5\n0 <= arr[i] <= 10^5",
    category: "Arrays",
    difficulty: "Easy",
    step_number: 3,
    test_cases: [
      { input: "5\n0 1 0 3 12", expected_output: "1 3 12 0 0" },
      { input: "1\n0", expected_output: "0" },
      { input: "4\n1 2 3 4", expected_output: "1 2 3 4" },
      { input: "3\n0 0 1", expected_output: "1 0 0" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Find Missing Number",
    description: "Given an array of N-1 integers in the range [0, N], find the missing number.\n\nInput:\nFirst line: N (the range is 0 to N)\nSecond line: N-1 space-separated integers\n\nOutput: Print the missing number\n\nConstraints:\n1 <= N <= 10^5\n0 <= arr[i] <= N\nAll elements are distinct",
    category: "Arrays",
    difficulty: "Easy",
    step_number: 3,
    test_cases: [
      { input: "5\n0 1 3 4", expected_output: "2" },
      { input: "3\n0 1", expected_output: "2" },
      { input: "2\n1 0", expected_output: "2" },
      { input: "4\n0 1 2 3", expected_output: "4" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n-1];\n        for(int i = 0; i < n-1; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n-1];\n    for(int i = 0; i < n-1; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },

  // ========== WEEK 5: Step 3 - Arrays (Medium) ==========
  {
    title: "Two Sum",
    description: "Given an array of N integers and a target T, find two indices such that arr[i] + arr[j] = T.\n\nInput:\nFirst line: N T (space separated)\nSecond line: N space-separated integers\n\nOutput: Print the two 0-based indices (smaller first), space separated. If no solution exists, print \"-1 -1\"\n\nConstraints:\n2 <= N <= 10^4\n-10^9 <= arr[i], T <= 10^9",
    category: "Arrays",
    difficulty: "Medium",
    step_number: 3,
    test_cases: [
      { input: "4 9\n2 7 11 15", expected_output: "0 1" },
      { input: "3 6\n3 2 4", expected_output: "1 2" },
      { input: "2 6\n3 3", expected_output: "0 1" },
      { input: "3 10\n1 2 3", expected_output: "-1 -1" }
    ],
    starter_code: {
      python: "n, t = map(int, input().split())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(), t = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n, t;\n    scanf(\"%d %d\", &n, &t);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Sort Array of 0s, 1s, and 2s",
    description: "Given an array of N integers containing only 0, 1, and 2, sort the array in-place (Dutch National Flag problem).\n\nInput:\nFirst line: N\nSecond line: N space-separated integers (each 0, 1, or 2)\n\nOutput: Print the sorted array\n\nConstraints:\n1 <= N <= 10^5",
    category: "Arrays",
    difficulty: "Medium",
    step_number: 3,
    test_cases: [
      { input: "6\n2 0 2 1 1 0", expected_output: "0 0 1 1 2 2" },
      { input: "3\n2 1 0", expected_output: "0 1 2" },
      { input: "5\n0 0 0 0 0", expected_output: "0 0 0 0 0" },
      { input: "1\n1", expected_output: "1" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Maximum Subarray Sum (Kadane's Algorithm)",
    description: "Given an array of N integers, find the contiguous subarray with the maximum sum.\n\nInput:\nFirst line: N\nSecond line: N space-separated integers\n\nOutput: Print the maximum subarray sum\n\nConstraints:\n1 <= N <= 10^5\n-10^5 <= arr[i] <= 10^5",
    category: "Arrays",
    difficulty: "Medium",
    step_number: 3,
    test_cases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expected_output: "6" },
      { input: "1\n-1", expected_output: "-1" },
      { input: "5\n1 2 3 4 5", expected_output: "15" },
      { input: "4\n-2 -3 -1 -5", expected_output: "-1" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Best Time to Buy and Sell Stock",
    description: "Given an array prices where prices[i] is the price of a stock on day i, find the maximum profit. You may complete at most one transaction.\n\nInput:\nFirst line: N\nSecond line: N space-separated integers (prices)\n\nOutput: Print the maximum profit. If no profit possible, print 0.\n\nConstraints:\n1 <= N <= 10^5\n0 <= prices[i] <= 10^5",
    category: "Arrays",
    difficulty: "Medium",
    step_number: 3,
    test_cases: [
      { input: "6\n7 1 5 3 6 4", expected_output: "5" },
      { input: "5\n7 6 4 3 1", expected_output: "0" },
      { input: "2\n1 2", expected_output: "1" },
      { input: "1\n5", expected_output: "0" }
    ],
    starter_code: {
      python: "n = int(input())\nprices = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] prices = new int[n];\n        for(int i = 0; i < n; i++) prices[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int prices[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &prices[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },

  // ========== WEEK 6: Step 4 - Binary Search ==========
  {
    title: "Binary Search",
    description: "Given a sorted array of N integers and a target T, find the index of T using binary search. If T is not found, print -1.\n\nInput:\nFirst line: N T\nSecond line: N space-separated sorted integers\n\nOutput: Print the index (0-based) or -1\n\nConstraints:\n1 <= N <= 10^5\n-10^9 <= arr[i], T <= 10^9",
    category: "Binary Search",
    difficulty: "Easy",
    step_number: 4,
    test_cases: [
      { input: "5 3\n1 2 3 4 5", expected_output: "2" },
      { input: "5 6\n1 2 3 4 5", expected_output: "-1" },
      { input: "1 1\n1", expected_output: "0" },
      { input: "6 1\n1 3 5 7 9 11", expected_output: "0" }
    ],
    starter_code: {
      python: "n, t = map(int, input().split())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(), t = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n, t;\n    scanf(\"%d %d\", &n, &t);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Search Insert Position",
    description: "Given a sorted array of distinct integers and a target value, return the index if found. If not, return the index where it would be inserted.\n\nInput:\nFirst line: N T\nSecond line: N space-separated sorted integers\n\nOutput: Print the index\n\nConstraints:\n1 <= N <= 10^4\n-10^4 <= arr[i], T <= 10^4",
    category: "Binary Search",
    difficulty: "Easy",
    step_number: 4,
    test_cases: [
      { input: "4 5\n1 3 5 6", expected_output: "2" },
      { input: "4 2\n1 3 5 6", expected_output: "1" },
      { input: "4 7\n1 3 5 6", expected_output: "4" },
      { input: "4 0\n1 3 5 6", expected_output: "0" }
    ],
    starter_code: {
      python: "n, t = map(int, input().split())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(), t = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n, t;\n    scanf(\"%d %d\", &n, &t);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Find Peak Element",
    description: "Given an array of N integers, find a peak element and return its index. A peak element is an element that is strictly greater than its neighbors.\n\nThe array may contain multiple peaks; return the index of any one.\nAssume arr[-1] = arr[n] = -infinity.\n\nInput:\nFirst line: N\nSecond line: N space-separated integers\n\nOutput: Print the index of a peak element\n\nConstraints:\n1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9",
    category: "Binary Search",
    difficulty: "Medium",
    step_number: 4,
    test_cases: [
      { input: "3\n1 2 3", expected_output: "2" },
      { input: "4\n1 2 1 3", expected_output: "1" },
      { input: "1\n1", expected_output: "0" },
      { input: "2\n1 2", expected_output: "1" }
    ],
    starter_code: {
      python: "n = int(input())\narr = list(map(int, input().split()))\n# Write your code here\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // Write your code here\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int arr[n];\n    for(int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    // Write your code here\n    return 0;\n}"
    }
  },
  {
    title: "Square Root (Integer)",
    description: "Given a non-negative integer N, find the integer part of its square root without using built-in sqrt functions.\n\nInput: A single integer N\nOutput: Print floor(sqrt(N))\n\nConstraints:\n0 <= N <= 10^9",
    category: "Binary Search",
    difficulty: "Easy",
    step_number: 4,
    test_cases: [
      { input: "4", expected_output: "2" },
      { input: "8", expected_output: "2" },
      { input: "0", expected_output: "0" },
      { input: "1", expected_output: "1" },
      { input: "100", expected_output: "10" }
    ],
    starter_code: {
      python: "n = int(input())\n# Write your code here - do not use sqrt()\n",
      java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long n = sc.nextLong();\n        // Write your code here - do not use Math.sqrt()\n    }\n}",
      c: "#include <stdio.h>\nint main() {\n    long long n;\n    scanf(\"%lld\", &n);\n    // Write your code here - do not use sqrt()\n    return 0;\n}"
    }
  }
];
