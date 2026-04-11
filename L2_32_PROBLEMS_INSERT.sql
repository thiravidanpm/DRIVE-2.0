-- ============================================
-- L2 CODING PROBLEMS - 32 LeetCode Problems
-- 4 problems per week = 8 weeks
-- Run in Supabase SQL Editor
-- ============================================

-- First, clear existing problems (if re-seeding)
-- DELETE FROM l2_submissions;
-- DELETE FROM l2_weekly_results;
-- DELETE FROM l2_problems;

-- ==================== CREATE TABLES (if not exist) ====================

CREATE TABLE IF NOT EXISTS l2_problems (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Arrays',
  difficulty TEXT NOT NULL DEFAULT 'Medium'
    CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  step_number INT NOT NULL DEFAULT 1,
  test_cases JSONB NOT NULL DEFAULT '[]',
  starter_code JSONB NOT NULL DEFAULT '{}',
  week_number INT,
  problem_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS l2_weekly_results (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  problems_solved INT NOT NULL DEFAULT 0,
  total_problems INT NOT NULL DEFAULT 4,
  score INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

CREATE TABLE IF NOT EXISTS l2_submissions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id INT NOT NULL REFERENCES l2_problems(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('python', 'java', 'c')),
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('passed', 'failed', 'error', 'pending')),
  test_results JSONB NOT NULL DEFAULT '[]',
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_config ADD COLUMN IF NOT EXISTS l2_current_week INT DEFAULT 1;
UPDATE app_config SET l2_current_week = COALESCE(l2_current_week, 1) WHERE id = 1;

CREATE INDEX IF NOT EXISTS idx_l2_problems_week ON l2_problems(week_number);
CREATE INDEX IF NOT EXISTS idx_l2_results_user_week ON l2_weekly_results(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_l2_submissions_user_problem ON l2_submissions(user_id, problem_id, week_number);

-- ==================== SCHEMA UPDATES ====================

-- Add score column to l2_submissions (20 for pass, 0-15 for AI-scored)
ALTER TABLE l2_submissions ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0;
-- Add AI feedback
ALTER TABLE l2_submissions ADD COLUMN IF NOT EXISTS ai_score INT;
ALTER TABLE l2_submissions ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
-- Add time tracking
ALTER TABLE l2_submissions ADD COLUMN IF NOT EXISTS time_started TIMESTAMPTZ;
ALTER TABLE l2_submissions ADD COLUMN IF NOT EXISTS time_expired BOOLEAN DEFAULT FALSE;

-- Add pulled_weeks to app_config (JSONB array of week numbers pulled by admin)
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS l2_pulled_weeks JSONB DEFAULT '[]';

-- Update l2_weekly_results score to support marks-based scoring (max 80 per week = 4 problems × 20)
-- score column already exists, just needs to store marks instead of count

-- Unique constraint: one submission per user per problem (one-time attempt)
-- First drop any existing submissions so constraint can be added
-- ALTER TABLE l2_submissions ADD CONSTRAINT unique_user_problem UNIQUE (user_id, problem_id);
-- If constraint already exists, this will fail silently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_problem'
  ) THEN
    ALTER TABLE l2_submissions ADD CONSTRAINT unique_user_problem UNIQUE (user_id, problem_id);
  END IF;
END $$;

-- ==================== WEEK 1: Arrays Basics (Problems 1-4) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 1: Two Sum
('Two Sum',
'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists.',
'Arrays', 'Easy', 1, 1, 1,
'[
  {"input": "4\n2 7 11 15\n9", "expected_output": "0 1"},
  {"input": "3\n3 2 4\n6", "expected_output": "1 2"},
  {"input": "2\n3 3\n6", "expected_output": "0 1"},
  {"input": "5\n1 5 3 7 2\n9", "expected_output": "1 3"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    target = int(input())\n    # Find two indices that sum to target\n    # Print indices separated by space\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        // Find two indices that sum to target\n        // Print indices separated by space\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    int target;\n    scanf(\"%d\", &target);\n    // Find two indices that sum to target\n    // Print indices separated by space\n    return 0;\n}"}'),

-- Problem 2: Best Time to Buy and Sell Stock
('Best Time to Buy and Sell Stock',
'You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Example 1:
Input: prices = [7,1,5,3,6,4]
Output: 5

Example 2:
Input: prices = [7,6,4,3,1]
Output: 0

Constraints:
- 1 <= prices.length <= 10^5
- 0 <= prices[i] <= 10^4',
'Arrays', 'Easy', 2, 1, 2,
'[
  {"input": "6\n7 1 5 3 6 4", "expected_output": "5"},
  {"input": "5\n7 6 4 3 1", "expected_output": "0"},
  {"input": "3\n1 2 3", "expected_output": "2"},
  {"input": "1\n5", "expected_output": "0"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    prices = list(map(int, input().split()))\n    # Return max profit\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] prices = new int[n];\n        for (int i = 0; i < n; i++) prices[i] = sc.nextInt();\n        // Print max profit\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int prices[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &prices[i]);\n    // Print max profit\n    return 0;\n}"}'),

-- Problem 3: Contains Duplicate
('Contains Duplicate',
'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.

Example 1:
Input: nums = [1,2,3,1]
Output: true

Example 2:
Input: nums = [1,2,3,4]
Output: false

Example 3:
Input: nums = [1,1,1,3,3,4,3,2,4,2]
Output: true

Constraints:
- 1 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9',
'Arrays', 'Easy', 3, 1, 3,
'[
  {"input": "4\n1 2 3 1", "expected_output": "true"},
  {"input": "4\n1 2 3 4", "expected_output": "false"},
  {"input": "10\n1 1 1 3 3 4 3 2 4 2", "expected_output": "true"},
  {"input": "1\n5", "expected_output": "false"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print true or false\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print true or false\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print true or false\n    return 0;\n}"}'),

-- Problem 4: Product of Array Except Self
('Product of Array Except Self',
'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

You must write an algorithm that runs in O(n) time and without using the division operation.

Example 1:
Input: nums = [1,2,3,4]
Output: [24,12,8,6]

Example 2:
Input: nums = [-1,1,0,-3,3]
Output: [0,0,9,0,0]

Constraints:
- 2 <= nums.length <= 10^5
- -30 <= nums[i] <= 30
- Product of any prefix or suffix fits in 32-bit integer',
'Arrays', 'Medium', 4, 1, 4,
'[
  {"input": "4\n1 2 3 4", "expected_output": "24 12 8 6"},
  {"input": "5\n-1 1 0 -3 3", "expected_output": "0 0 9 0 0"},
  {"input": "3\n2 3 4", "expected_output": "12 8 6"},
  {"input": "2\n0 0", "expected_output": "0 0"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print product array space-separated\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print product array space-separated\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print product array space-separated\n    return 0;\n}"}');

-- ==================== WEEK 2: Arrays Advanced (Problems 5-8) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 5: Maximum Subarray
('Maximum Subarray',
'Given an integer array nums, find the subarray with the largest sum, and return its sum.

Example 1:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

Example 2:
Input: nums = [1]
Output: 1

Example 3:
Input: nums = [5,4,-1,7,8]
Output: 23

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4',
'Arrays', 'Medium', 5, 2, 1,
'[
  {"input": "9\n-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6"},
  {"input": "1\n1", "expected_output": "1"},
  {"input": "5\n5 4 -1 7 8", "expected_output": "23"},
  {"input": "3\n-1 -2 -3", "expected_output": "-1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print max subarray sum\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print max subarray sum\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print max subarray sum\n    return 0;\n}"}'),

-- Problem 6: Maximum Product Subarray
('Maximum Product Subarray',
'Given an integer array nums, find a subarray that has the largest product, and return the product.

Example 1:
Input: nums = [2,3,-2,4]
Output: 6
Explanation: [2,3] has the largest product 6.

Example 2:
Input: nums = [-2,0,-1]
Output: 0

Constraints:
- 1 <= nums.length <= 2 * 10^4
- -10 <= nums[i] <= 10
- Product of any subarray fits in 32-bit integer',
'Arrays', 'Medium', 6, 2, 2,
'[
  {"input": "4\n2 3 -2 4", "expected_output": "6"},
  {"input": "3\n-2 0 -1", "expected_output": "0"},
  {"input": "1\n-2", "expected_output": "-2"},
  {"input": "4\n-2 3 -4 5", "expected_output": "60"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print max product subarray\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print max product subarray\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print max product subarray\n    return 0;\n}"}'),

-- Problem 7: Find Minimum in Rotated Sorted Array
('Find Minimum in Rotated Sorted Array',
'Suppose an array of length n sorted in ascending order is rotated between 1 and n times.

Given the sorted rotated array nums of unique elements, return the minimum element of this array.

You must write an algorithm that runs in O(log n) time.

Example 1:
Input: nums = [3,4,5,1,2]
Output: 1

Example 2:
Input: nums = [4,5,6,7,0,1,2]
Output: 0

Example 3:
Input: nums = [11,13,15,17]
Output: 11

Constraints:
- n == nums.length
- 1 <= n <= 5000
- All integers are unique',
'Arrays', 'Medium', 7, 2, 3,
'[
  {"input": "5\n3 4 5 1 2", "expected_output": "1"},
  {"input": "7\n4 5 6 7 0 1 2", "expected_output": "0"},
  {"input": "4\n11 13 15 17", "expected_output": "11"},
  {"input": "1\n1", "expected_output": "1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print minimum element\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print minimum element\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print minimum element\n    return 0;\n}"}'),

-- Problem 8: Search in Rotated Sorted Array
('Search in Rotated Sorted Array',
'There is an integer array nums sorted in ascending order (with distinct values).

Prior to being passed to your function, nums is possibly rotated at an unknown index k.

Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums.

You must write an algorithm with O(log n) runtime complexity.

Example 1:
Input: nums = [4,5,6,7,0,1,2], target = 0
Output: 4

Example 2:
Input: nums = [4,5,6,7,0,1,2], target = 3
Output: -1

Example 3:
Input: nums = [1], target = 0
Output: -1

Constraints:
- 1 <= nums.length <= 5000
- All values are unique
- -10^4 <= nums[i] <= 10^4',
'Arrays', 'Medium', 8, 2, 4,
'[
  {"input": "7\n4 5 6 7 0 1 2\n0", "expected_output": "4"},
  {"input": "7\n4 5 6 7 0 1 2\n3", "expected_output": "-1"},
  {"input": "1\n1\n0", "expected_output": "-1"},
  {"input": "5\n3 4 5 1 2\n4", "expected_output": "1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    target = int(input())\n    # Print index of target or -1\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        // Print index of target or -1\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    int target;\n    scanf(\"%d\", &target);\n    // Print index of target or -1\n    return 0;\n}"}');

-- ==================== WEEK 3: Arrays + Two Pointers (Problems 9-12) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 9: 3Sum
('3Sum',
'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

The solution set must not contain duplicate triplets.

Example 1:
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]

Example 2:
Input: nums = [0,1,1]
Output: []

Example 3:
Input: nums = [0,0,0]
Output: [[0,0,0]]

Constraints:
- 3 <= nums.length <= 3000
- -10^5 <= nums[i] <= 10^5

Note: Print each triplet on a separate line, numbers space-separated, triplets sorted.',
'Arrays', 'Medium', 9, 3, 1,
'[
  {"input": "6\n-1 0 1 2 -1 -4", "expected_output": "-1 -1 2\n-1 0 1"},
  {"input": "3\n0 1 1", "expected_output": ""},
  {"input": "3\n0 0 0", "expected_output": "0 0 0"},
  {"input": "4\n-2 0 1 1", "expected_output": "-2 1 1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print all unique triplets summing to 0\n    # Each triplet on a new line, space-separated, sorted\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print all unique triplets summing to 0\n    }\n}", "c": "#include <stdio.h>\n#include <stdlib.h>\n\nint cmp(const void *a, const void *b) { return *(int*)a - *(int*)b; }\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print all unique triplets summing to 0\n    return 0;\n}"}'),

-- Problem 10: Container With Most Water
('Container With Most Water',
'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Example 1:
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49

Example 2:
Input: height = [1,1]
Output: 1

Constraints:
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4',
'Arrays', 'Medium', 10, 3, 2,
'[
  {"input": "9\n1 8 6 2 5 4 8 3 7", "expected_output": "49"},
  {"input": "2\n1 1", "expected_output": "1"},
  {"input": "3\n1 2 1", "expected_output": "2"},
  {"input": "4\n4 3 2 1", "expected_output": "4"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    height = list(map(int, input().split()))\n    # Print max water area\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] height = new int[n];\n        for (int i = 0; i < n; i++) height[i] = sc.nextInt();\n        // Print max water area\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int height[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &height[i]);\n    // Print max water area\n    return 0;\n}"}'),

-- Problem 11: Counting Bits
('Counting Bits',
'Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1s in the binary representation of i.

Example 1:
Input: n = 2
Output: [0,1,1]

Example 2:
Input: n = 5
Output: [0,1,1,2,1,2]

Constraints:
- 0 <= n <= 10^5

Note: Print the array space-separated.',
'Bit Manipulation', 'Easy', 11, 3, 3,
'[
  {"input": "2", "expected_output": "0 1 1"},
  {"input": "5", "expected_output": "0 1 1 2 1 2"},
  {"input": "0", "expected_output": "0"},
  {"input": "8", "expected_output": "0 1 1 2 1 2 2 3 1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    # Print count of 1-bits for 0 to n, space-separated\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // Print count of 1-bits for 0 to n, space-separated\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    // Print count of 1-bits for 0 to n, space-separated\n    return 0;\n}"}'),

-- Problem 12: Middle of the Linked List
('Middle of the Linked List',
'Given the head of a singly linked list (as space-separated values), return the middle node value and all values after it.

If there are two middle nodes, return the second middle node.

Example 1:
Input: [1,2,3,4,5]
Output: [3,4,5]

Example 2:
Input: [1,2,3,4,5,6]
Output: [4,5,6]

Constraints:
- Number of nodes in range [1, 100]
- 1 <= Node.val <= 100

Note: Input is n followed by n values. Output is values from middle to end, space-separated.',
'Linked List', 'Easy', 12, 3, 4,
'[
  {"input": "5\n1 2 3 4 5", "expected_output": "3 4 5"},
  {"input": "6\n1 2 3 4 5 6", "expected_output": "4 5 6"},
  {"input": "1\n1", "expected_output": "1"},
  {"input": "2\n1 2", "expected_output": "2"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    values = list(map(int, input().split()))\n    # Find middle and print from middle to end, space-separated\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] values = new int[n];\n        for (int i = 0; i < n; i++) values[i] = sc.nextInt();\n        // Find middle and print from middle to end, space-separated\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int values[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &values[i]);\n    // Find middle and print from middle to end, space-separated\n    return 0;\n}"}');

-- ==================== WEEK 4: Backtracking + Binary Search (Problems 13-16) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 13: Subsets II
('Subsets II',
'Given an integer array nums that may contain duplicates, return all possible subsets (the power set).

The solution set must not contain duplicate subsets. Return the solution in any order.

Example 1:
Input: nums = [1,2,2]
Output: [[],[1],[1,2],[1,2,2],[2],[2,2]]

Example 2:
Input: nums = [0]
Output: [[],[0]]

Note: Print each subset on a new line, elements space-separated. Empty subset as empty line. Subsets sorted lexicographically.',
'Backtracking', 'Medium', 13, 4, 1,
'[
  {"input": "3\n1 2 2", "expected_output": "\n1\n1 2\n1 2 2\n2\n2 2"},
  {"input": "1\n0", "expected_output": "\n0"},
  {"input": "2\n1 1", "expected_output": "\n1\n1 1"},
  {"input": "3\n1 2 3", "expected_output": "\n1\n1 2\n1 2 3\n1 3\n2\n2 3\n3"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print all unique subsets, one per line\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print all unique subsets, one per line\n    }\n}", "c": "#include <stdio.h>\n#include <stdlib.h>\n\nint cmp(const void *a, const void *b) { return *(int*)a - *(int*)b; }\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print all unique subsets, one per line\n    return 0;\n}"}'),

-- Problem 14: Single Element in a Sorted Array
('Single Element in a Sorted Array',
'You are given a sorted array consisting of only integers where every element appears exactly twice, except for one element which appears exactly once.

Return the single element that appears only once.

Your solution must run in O(log n) time and O(1) space.

Example 1:
Input: nums = [1,1,2,3,3,4,4,8,8]
Output: 2

Example 2:
Input: nums = [3,3,7,7,10,11,11]
Output: 10

Constraints:
- 1 <= nums.length <= 10^5
- 0 <= nums[i] <= 10^5',
'Binary Search', 'Medium', 14, 4, 2,
'[
  {"input": "9\n1 1 2 3 3 4 4 8 8", "expected_output": "2"},
  {"input": "7\n3 3 7 7 10 11 11", "expected_output": "10"},
  {"input": "1\n1", "expected_output": "1"},
  {"input": "5\n1 1 2 2 3", "expected_output": "3"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    nums = list(map(int, input().split()))\n    # Print the single element\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print the single element\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print the single element\n    return 0;\n}"}'),

-- Problem 15: Find Median from Data Stream
('Find Median from Data Stream',
'The median is the middle value in an ordered integer list. If the size of the list is even, the median is the mean of the two middle values.

Implement functionality that:
- Reads a series of operations
- "add X" adds integer X to the data structure
- "median" prints the current median

Example:
Input:
5
add 1
add 2
median
add 3
median

Output:
1.5
2.0

Constraints:
- -10^5 <= num <= 10^5
- There will be at least one element before median is called',
'Heap', 'Hard', 15, 4, 3,
'[
  {"input": "5\nadd 1\nadd 2\nmedian\nadd 3\nmedian", "expected_output": "1.5\n2.0"},
  {"input": "3\nadd 5\nmedian\nadd 3\n", "expected_output": "5.0"},
  {"input": "7\nadd 1\nadd 2\nadd 3\nmedian\nadd 4\nadd 5\nmedian", "expected_output": "2.0\n3.0"},
  {"input": "4\nadd 6\nadd 10\nadd 2\nmedian", "expected_output": "6.0"}
]',
'{"python": "import sys\nimport heapq\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    for _ in range(n):\n        line = input().strip()\n        if line.startswith(\"add\"):\n            num = int(line.split()[1])\n            # Add num to data structure\n        elif line == \"median\":\n            # Print current median as float\n            pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); sc.nextLine();\n        for (int i = 0; i < n; i++) {\n            String line = sc.nextLine().trim();\n            if (line.startsWith(\"add\")) {\n                int num = Integer.parseInt(line.split(\" \")[1]);\n                // Add num\n            } else if (line.equals(\"median\")) {\n                // Print median\n            }\n        }\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    char cmd[20];\n    int val;\n    for (int i = 0; i < n; i++) {\n        scanf(\"%s\", cmd);\n        if (strcmp(cmd, \"add\") == 0) {\n            scanf(\"%d\", &val);\n            // Add val\n        } else {\n            // Print median\n        }\n    }\n    return 0;\n}"}'),

-- Problem 16: Top K Frequent Elements
('Top K Frequent Elements',
'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.

Example 1:
Input: nums = [1,1,1,2,2,3], k = 2
Output: [1,2]

Example 2:
Input: nums = [1], k = 1
Output: [1]

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4
- k is in range [1, number of unique elements]

Note: Print k elements space-separated, sorted by frequency (most frequent first).',
'HashMap', 'Medium', 16, 4, 4,
'[
  {"input": "6 2\n1 1 1 2 2 3", "expected_output": "1 2"},
  {"input": "1 1\n1", "expected_output": "1"},
  {"input": "10 2\n1 2 1 2 1 2 3 1 3 2", "expected_output": "1 2"},
  {"input": "5 3\n1 1 2 2 3", "expected_output": "1 2 3"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n, k = map(int, input().split())\n    nums = list(map(int, input().split()))\n    # Print top k frequent elements, space-separated\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(), k = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print top k frequent elements, space-separated\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n, k;\n    scanf(\"%d %d\", &n, &k);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print top k frequent elements, space-separated\n    return 0;\n}"}');

-- ==================== WEEK 5: Stack & Queue (Problems 17-20) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 17: Implement Stack using Queues
('Implement Stack using Queues',
'Implement a last-in-first-out (LIFO) stack using only queue operations.

Operations:
- push X: Push X to top of stack
- pop: Remove and print top element
- top: Print the top element
- empty: Print true/false

Example:
Input:
5
push 1
push 2
top
pop
empty

Output:
2
2
false

Constraints:
- 1 <= number of operations <= 100
- 1 <= x <= 9',
'Stack', 'Easy', 17, 5, 1,
'[
  {"input": "5\npush 1\npush 2\ntop\npop\nempty", "expected_output": "2\n2\nfalse"},
  {"input": "3\npush 5\npop\nempty", "expected_output": "5\ntrue"},
  {"input": "4\npush 1\npush 2\npush 3\ntop", "expected_output": "3"},
  {"input": "6\npush 1\npush 2\npop\npush 3\ntop\nempty", "expected_output": "2\n3\nfalse"}
]',
'{"python": "import sys\nfrom collections import deque\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    # Implement stack using queues\n    for _ in range(n):\n        line = input().strip().split()\n        op = line[0]\n        if op == \"push\":\n            x = int(line[1])\n            # push x\n        elif op == \"pop\":\n            # pop and print\n            pass\n        elif op == \"top\":\n            # print top\n            pass\n        elif op == \"empty\":\n            # print true/false\n            pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); sc.nextLine();\n        // Implement stack using queues\n        for (int i = 0; i < n; i++) {\n            String[] parts = sc.nextLine().trim().split(\" \");\n            // handle push, pop, top, empty\n        }\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    char op[10];\n    int val;\n    // Implement stack using queues\n    for (int i = 0; i < n; i++) {\n        scanf(\"%s\", op);\n        // handle push, pop, top, empty\n    }\n    return 0;\n}"}'),

-- Problem 18: Implement Queue using Stacks
('Implement Queue using Stacks',
'Implement a first-in-first-out (FIFO) queue using only two stacks.

Operations:
- push X: Push X to back of queue
- pop: Remove and print front element
- peek: Print front element
- empty: Print true/false

Example:
Input:
5
push 1
push 2
peek
pop
empty

Output:
1
1
false

Constraints:
- 1 <= number of operations <= 100
- 1 <= x <= 9',
'Queue', 'Easy', 18, 5, 2,
'[
  {"input": "5\npush 1\npush 2\npeek\npop\nempty", "expected_output": "1\n1\nfalse"},
  {"input": "3\npush 1\npop\nempty", "expected_output": "1\ntrue"},
  {"input": "6\npush 1\npush 2\npush 3\npeek\npop\npeek", "expected_output": "1\n1\n2"},
  {"input": "4\npush 5\npush 10\npop\npeek", "expected_output": "5\n10"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    # Implement queue using two stacks\n    for _ in range(n):\n        line = input().strip().split()\n        op = line[0]\n        if op == \"push\":\n            x = int(line[1])\n        elif op == \"pop\":\n            pass\n        elif op == \"peek\":\n            pass\n        elif op == \"empty\":\n            pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); sc.nextLine();\n        // Implement queue using two stacks\n        for (int i = 0; i < n; i++) {\n            String[] parts = sc.nextLine().trim().split(\" \");\n            // handle push, pop, peek, empty\n        }\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    char op[10];\n    // Implement queue using two stacks\n    for (int i = 0; i < n; i++) {\n        scanf(\"%s\", op);\n    }\n    return 0;\n}"}'),

-- Problem 19: Next Greater Element I
('Next Greater Element I',
'You are given two distinct 0-indexed integer arrays nums1 and nums2, where nums1 is a subset of nums2.

For each element in nums1, find the next greater element in nums2. If there is no next greater element, the answer is -1.

Example 1:
Input: nums1 = [4,1,2], nums2 = [1,3,4,2]
Output: [-1,3,-1]

Example 2:
Input: nums1 = [2,4], nums2 = [1,2,3,4]
Output: [3,-1]

Constraints:
- 1 <= nums1.length <= nums2.length <= 1000
- All integers in nums1 and nums2 are unique

Note: Input format: n1 n2 on first line, nums1 on second, nums2 on third.',
'Stack', 'Easy', 19, 5, 3,
'[
  {"input": "3 4\n4 1 2\n1 3 4 2", "expected_output": "-1 3 -1"},
  {"input": "2 4\n2 4\n1 2 3 4", "expected_output": "3 -1"},
  {"input": "1 1\n1\n1", "expected_output": "-1"},
  {"input": "3 5\n1 3 5\n1 2 3 4 5", "expected_output": "2 4 -1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n1, n2 = map(int, input().split())\n    nums1 = list(map(int, input().split()))\n    nums2 = list(map(int, input().split()))\n    # Print next greater elements, space-separated\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n1 = sc.nextInt(), n2 = sc.nextInt();\n        int[] nums1 = new int[n1], nums2 = new int[n2];\n        for (int i = 0; i < n1; i++) nums1[i] = sc.nextInt();\n        for (int i = 0; i < n2; i++) nums2[i] = sc.nextInt();\n        // Print next greater elements, space-separated\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n1, n2;\n    scanf(\"%d %d\", &n1, &n2);\n    int nums1[n1], nums2[n2];\n    for (int i = 0; i < n1; i++) scanf(\"%d\", &nums1[i]);\n    for (int i = 0; i < n2; i++) scanf(\"%d\", &nums2[i]);\n    // Print next greater elements, space-separated\n    return 0;\n}"}'),

-- Problem 20: LFU Cache
('LFU Cache',
'Design and implement a Least Frequently Used (LFU) cache.

Operations:
- capacity N: Initialize with capacity N
- put K V: Insert/update key K with value V
- get K: Print value of key K, or -1 if not found

When cache is full, remove the least frequently used key. For ties, remove least recently used.

Example:
Input:
2
7
put 1 1
put 2 2
get 1
put 3 3
get 2
get 3
get 1

Output:
1
-1
3
-1

Note: First line is capacity, second is operation count.',
'Design', 'Hard', 20, 5, 4,
'[
  {"input": "2\n7\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 3", "expected_output": "1\n-1\n3"},
  {"input": "1\n5\nput 1 1\nget 1\nput 2 2\nget 1\nget 2", "expected_output": "1\n-1\n2"},
  {"input": "2\n4\nput 1 10\nput 1 20\nget 1\nget 2", "expected_output": "20\n-1"},
  {"input": "2\n6\nput 1 1\nput 2 2\nget 1\nget 1\nput 3 3\nget 2", "expected_output": "1\n1\n-1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    capacity = int(input())\n    n = int(input())\n    # Implement LFU Cache\n    for _ in range(n):\n        parts = input().strip().split()\n        if parts[0] == \"put\":\n            k, v = int(parts[1]), int(parts[2])\n            # put k v\n        elif parts[0] == \"get\":\n            k = int(parts[1])\n            # print value or -1\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int capacity = sc.nextInt();\n        int n = sc.nextInt(); sc.nextLine();\n        // Implement LFU Cache\n        for (int i = 0; i < n; i++) {\n            String[] parts = sc.nextLine().trim().split(\" \");\n            // handle put and get\n        }\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    int capacity, n;\n    scanf(\"%d %d\", &capacity, &n);\n    char op[10];\n    int k, v;\n    // Implement LFU Cache\n    for (int i = 0; i < n; i++) {\n        scanf(\"%s\", op);\n        if (strcmp(op, \"put\") == 0) {\n            scanf(\"%d %d\", &k, &v);\n        } else {\n            scanf(\"%d\", &k);\n            // print value or -1\n        }\n    }\n    return 0;\n}"}');

-- ==================== WEEK 6: Stack Advanced (Problems 21-24) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 21: Largest Rectangle in Histogram
('Largest Rectangle in Histogram',
'Given an array of integers heights representing the histogram bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.

Example 1:
Input: heights = [2,1,5,6,2,3]
Output: 10

Example 2:
Input: heights = [2,4]
Output: 4

Constraints:
- 1 <= heights.length <= 10^5
- 0 <= heights[i] <= 10^4',
'Stack', 'Hard', 21, 6, 1,
'[
  {"input": "6\n2 1 5 6 2 3", "expected_output": "10"},
  {"input": "2\n2 4", "expected_output": "4"},
  {"input": "1\n5", "expected_output": "5"},
  {"input": "5\n3 3 3 3 3", "expected_output": "15"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    heights = list(map(int, input().split()))\n    # Print largest rectangle area\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] heights = new int[n];\n        for (int i = 0; i < n; i++) heights[i] = sc.nextInt();\n        // Print largest rectangle area\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    int heights[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &heights[i]);\n    // Print largest rectangle area\n    return 0;\n}"}'),

-- Problem 22: Sliding Window Maximum
('Sliding Window Maximum',
'You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position.

Return the max sliding window.

Example 1:
Input: nums = [1,3,-1,-3,5,3,6,7], k = 3
Output: [3,3,5,5,6,7]

Example 2:
Input: nums = [1], k = 1
Output: [1]

Constraints:
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4
- 1 <= k <= nums.length

Note: Input format: n k on first line, nums on second. Output space-separated.',
'Deque', 'Hard', 22, 6, 2,
'[
  {"input": "8 3\n1 3 -1 -3 5 3 6 7", "expected_output": "3 3 5 5 6 7"},
  {"input": "1 1\n1", "expected_output": "1"},
  {"input": "5 2\n1 3 1 2 0", "expected_output": "3 3 2 2"},
  {"input": "4 4\n4 3 2 1", "expected_output": "4"}
]',
'{"python": "import sys\nfrom collections import deque\ninput = sys.stdin.readline\n\ndef solve():\n    n, k = map(int, input().split())\n    nums = list(map(int, input().split()))\n    # Print sliding window maximums, space-separated\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(), k = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        // Print sliding window maximums, space-separated\n    }\n}", "c": "#include <stdio.h>\n\nint main() {\n    int n, k;\n    scanf(\"%d %d\", &n, &k);\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &nums[i]);\n    // Print sliding window maximums, space-separated\n    return 0;\n}"}'),

-- Problem 23: Min Stack
('Min Stack',
'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

Operations:
- push X: Push element X onto stack
- pop: Remove top element
- top: Print the top element
- getMin: Print the minimum element

Example:
Input:
8
push -2
push 0
push -3
getMin
pop
top
getMin

Output:
-3
0
-2

Constraints:
- Methods pop, top, getMin will always be called on non-empty stacks
- -2^31 <= val <= 2^31 - 1',
'Stack', 'Medium', 23, 6, 3,
'[
  {"input": "7\npush -2\npush 0\npush -3\ngetMin\npop\ntop\ngetMin", "expected_output": "-3\n0\n-2"},
  {"input": "5\npush 1\npush 2\npush 3\ntop\ngetMin", "expected_output": "3\n1"},
  {"input": "6\npush 5\npush 3\npush 7\ngetMin\npop\ngetMin", "expected_output": "3\n3"},
  {"input": "4\npush 0\npush -1\ngetMin\ntop", "expected_output": "-1\n-1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    # Implement MinStack with O(1) getMin\n    for _ in range(n):\n        parts = input().strip().split()\n        op = parts[0]\n        if op == \"push\":\n            val = int(parts[1])\n        elif op == \"pop\":\n            pass\n        elif op == \"top\":\n            pass\n        elif op == \"getMin\":\n            pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); sc.nextLine();\n        // Implement MinStack with O(1) getMin\n        for (int i = 0; i < n; i++) {\n            String[] parts = sc.nextLine().trim().split(\" \");\n            // handle push, pop, top, getMin\n        }\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    char op[10];\n    int val;\n    // Implement MinStack with O(1) getMin\n    for (int i = 0; i < n; i++) {\n        scanf(\"%s\", op);\n        if (strcmp(op, \"push\") == 0) {\n            scanf(\"%d\", &val);\n        }\n        // handle pop, top, getMin\n    }\n    return 0;\n}"}'),

-- Problem 24: Repeated String Match
('Repeated String Match',
'Given two strings a and b, return the minimum number of times you should repeat string a so that string b is a substring of it. If it is impossible, return -1.

Example 1:
Input: a = "abcd", b = "cdabcdab"
Output: 3

Example 2:
Input: a = "a", b = "aa"
Output: 2

Constraints:
- 1 <= a.length, b.length <= 10^4
- a and b consist of lowercase English letters',
'Strings', 'Medium', 24, 6, 4,
'[
  {"input": "abcd\ncdabcdab", "expected_output": "3"},
  {"input": "a\naa", "expected_output": "2"},
  {"input": "abc\nxyz", "expected_output": "-1"},
  {"input": "ab\nab", "expected_output": "1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    a = input().strip()\n    b = input().strip()\n    # Print minimum repeats of a to contain b, or -1\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String a = sc.nextLine().trim();\n        String b = sc.nextLine().trim();\n        // Print minimum repeats of a to contain b, or -1\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char a[10001], b[10001];\n    scanf(\"%s\", a);\n    scanf(\"%s\", b);\n    // Print minimum repeats of a to contain b, or -1\n    return 0;\n}"}');

-- ==================== WEEK 7: Strings (Problems 25-28) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 25: Longest Common Prefix
('Longest Common Prefix',
'Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string "".

Example 1:
Input: strs = ["flower","flow","flight"]
Output: "fl"

Example 2:
Input: strs = ["dog","racecar","car"]
Output: ""

Constraints:
- 1 <= strs.length <= 200
- 0 <= strs[i].length <= 200
- strs[i] consists of only lowercase English letters

Note: Input format: n on first line, then n strings one per line.',
'Strings', 'Easy', 25, 7, 1,
'[
  {"input": "3\nflower\nflow\nflight", "expected_output": "fl"},
  {"input": "3\ndog\nracecar\ncar", "expected_output": ""},
  {"input": "1\nhello", "expected_output": "hello"},
  {"input": "2\nab\na", "expected_output": "a"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    n = int(input())\n    strs = [input().strip() for _ in range(n)]\n    # Print longest common prefix\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); sc.nextLine();\n        String[] strs = new String[n];\n        for (int i = 0; i < n; i++) strs[i] = sc.nextLine().trim();\n        // Print longest common prefix\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    char strs[200][201];\n    for (int i = 0; i < n; i++) scanf(\"%s\", strs[i]);\n    // Print longest common prefix\n    return 0;\n}"}'),

-- Problem 26: String to Integer (atoi)
('String to Integer (atoi)',
'Implement the myAtoi function, which converts a string to a 32-bit signed integer.

Algorithm:
1. Ignore leading whitespace
2. Check for +/- sign
3. Read digits until non-digit or end
4. Clamp to [-2^31, 2^31 - 1]

Example 1: Input: "42" → Output: 42
Example 2: Input: " -042" → Output: -42
Example 3: Input: "1337c0d3" → Output: 1337
Example 4: Input: "0-1" → Output: 0
Example 5: Input: "words and 987" → Output: 0

Constraints:
- 0 <= s.length <= 200
- s consists of English letters, digits, space, +, -, .',
'Strings', 'Medium', 26, 7, 2,
'[
  {"input": "42", "expected_output": "42"},
  {"input": " -042", "expected_output": "-42"},
  {"input": "1337c0d3", "expected_output": "1337"},
  {"input": "words and 987", "expected_output": "0"},
  {"input": "0-1", "expected_output": "0"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    s = input().rstrip(\"\\n\")\n    # Implement atoi and print result\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        // Implement atoi and print result\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n#include <limits.h>\n\nint main() {\n    char s[201];\n    fgets(s, 201, stdin);\n    // Remove trailing newline\n    s[strcspn(s, \"\\n\")] = 0;\n    // Implement atoi and print result\n    return 0;\n}"}'),

-- Problem 27: Roman to Integer
('Roman to Integer',
'Roman numerals: I=1, V=5, X=10, L=50, C=100, D=500, M=1000

Subtraction cases: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900

Given a roman numeral, convert it to an integer.

Example 1: Input: "III" → Output: 3
Example 2: Input: "LVIII" → Output: 58
Example 3: Input: "MCMXCIV" → Output: 1994

Constraints:
- 1 <= s.length <= 15
- s contains only I, V, X, L, C, D, M
- 1 <= answer <= 3999',
'Strings', 'Easy', 27, 7, 3,
'[
  {"input": "III", "expected_output": "3"},
  {"input": "LVIII", "expected_output": "58"},
  {"input": "MCMXCIV", "expected_output": "1994"},
  {"input": "IX", "expected_output": "9"},
  {"input": "XLII", "expected_output": "42"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    s = input().strip()\n    # Convert roman to integer and print\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        // Convert roman to integer and print\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[16];\n    scanf(\"%s\", s);\n    // Convert roman to integer and print\n    return 0;\n}"}'),

-- Problem 28: Longest Palindromic Substring
('Longest Palindromic Substring',
'Given a string s, return the longest palindromic substring in s.

Example 1:
Input: s = "babad"
Output: "bab"
(Note: "aba" is also a valid answer)

Example 2:
Input: s = "cbbd"
Output: "bb"

Constraints:
- 1 <= s.length <= 1000
- s consists of only digits and English letters',
'Strings', 'Medium', 28, 7, 4,
'[
  {"input": "babad", "expected_output": "bab"},
  {"input": "cbbd", "expected_output": "bb"},
  {"input": "a", "expected_output": "a"},
  {"input": "racecar", "expected_output": "racecar"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    s = input().strip()\n    # Print longest palindromic substring\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        // Print longest palindromic substring\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[1001];\n    scanf(\"%s\", s);\n    // Print longest palindromic substring\n    return 0;\n}"}');

-- ==================== WEEK 8: Strings Advanced (Problems 29-32) ====================

INSERT INTO l2_problems (title, description, category, difficulty, step_number, week_number, problem_order, test_cases, starter_code) VALUES

-- Problem 29: Reverse Words in a String
('Reverse Words in a String',
'Given an input string s, reverse the order of the words.

A word is defined as a sequence of non-space characters. The words in s will be separated by at least one space.

Return a string of the words in reverse order concatenated by a single space. Do not include extra spaces.

Example 1:
Input: "the sky is blue"
Output: "blue is sky the"

Example 2:
Input: "  hello world  "
Output: "world hello"

Example 3:
Input: "a good   example"
Output: "example good a"

Constraints:
- 1 <= s.length <= 10^4
- s contains English letters, digits, and spaces',
'Strings', 'Medium', 29, 8, 1,
'[
  {"input": "the sky is blue", "expected_output": "blue is sky the"},
  {"input": "  hello world  ", "expected_output": "world hello"},
  {"input": "a good   example", "expected_output": "example good a"},
  {"input": "hello", "expected_output": "hello"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    s = input().rstrip(\"\\n\")\n    # Print reversed words\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        // Print reversed words\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[10001];\n    fgets(s, 10001, stdin);\n    s[strcspn(s, \"\\n\")] = 0;\n    // Print reversed words\n    return 0;\n}"}'),

-- Problem 30: Find the Index of the First Occurrence in a String
('Find the Index of the First Occurrence in a String',
'Given two strings haystack and needle, return the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.

Example 1:
Input: haystack = "sadbutsad", needle = "sad"
Output: 0

Example 2:
Input: haystack = "leetcode", needle = "leeto"
Output: -1

Constraints:
- 1 <= haystack.length, needle.length <= 10^4
- haystack and needle consist of only lowercase English characters',
'Strings', 'Easy', 30, 8, 2,
'[
  {"input": "sadbutsad\nsad", "expected_output": "0"},
  {"input": "leetcode\nleeto", "expected_output": "-1"},
  {"input": "hello\nll", "expected_output": "2"},
  {"input": "abc\nabc", "expected_output": "0"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    haystack = input().strip()\n    needle = input().strip()\n    # Print index of first occurrence or -1\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String haystack = sc.nextLine().trim();\n        String needle = sc.nextLine().trim();\n        // Print index of first occurrence or -1\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char haystack[10001], needle[10001];\n    scanf(\"%s\", haystack);\n    scanf(\"%s\", needle);\n    // Print index of first occurrence or -1\n    return 0;\n}"}'),

-- Problem 31: Minimum Insertion Steps to Make a String Palindrome
('Minimum Insertion Steps to Make a String Palindrome',
'Given a string s. In one step you can insert any character at any index of the string.

Return the minimum number of steps to make s a palindrome.

Example 1:
Input: s = "zzazz"
Output: 0 (already a palindrome)

Example 2:
Input: s = "mbadm"
Output: 2

Example 3:
Input: s = "leetcode"
Output: 5

Constraints:
- 1 <= s.length <= 500
- s consists of lowercase English letters',
'Dynamic Programming', 'Hard', 31, 8, 3,
'[
  {"input": "zzazz", "expected_output": "0"},
  {"input": "mbadm", "expected_output": "2"},
  {"input": "leetcode", "expected_output": "5"},
  {"input": "a", "expected_output": "0"},
  {"input": "ab", "expected_output": "1"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    s = input().strip()\n    # Print minimum insertions to make palindrome\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        // Print minimum insertions to make palindrome\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[501];\n    scanf(\"%s\", s);\n    // Print minimum insertions to make palindrome\n    return 0;\n}"}'),

-- Problem 32: Valid Anagram
('Valid Anagram',
'Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An anagram is a word formed by rearranging the letters of a different word, using all the original letters exactly once.

Example 1:
Input: s = "anagram", t = "nagaram"
Output: true

Example 2:
Input: s = "rat", t = "car"
Output: false

Constraints:
- 1 <= s.length, t.length <= 5 * 10^4
- s and t consist of lowercase English letters',
'Strings', 'Easy', 32, 8, 4,
'[
  {"input": "anagram\nnagaram", "expected_output": "true"},
  {"input": "rat\ncar", "expected_output": "false"},
  {"input": "a\na", "expected_output": "true"},
  {"input": "ab\nba", "expected_output": "true"},
  {"input": "ab\nab", "expected_output": "true"}
]',
'{"python": "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    s = input().strip()\n    t = input().strip()\n    # Print true or false\n    pass\n\nsolve()", "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        String t = sc.nextLine().trim();\n        // Print true or false\n    }\n}", "c": "#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[50001], t[50001];\n    scanf(\"%s\", s);\n    scanf(\"%s\", t);\n    // Print true or false\n    return 0;\n}"}');

-- ==================== VERIFY ====================
SELECT week_number, COUNT(*) as problem_count FROM l2_problems GROUP BY week_number ORDER BY week_number;
