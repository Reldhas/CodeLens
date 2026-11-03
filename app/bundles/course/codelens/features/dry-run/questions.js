// Sample questions standing in for AI generation. Every program really runs after the student submits.
export const questions = [
 {
  "id": "dr-fc-easy-1",
  "topicId": "functions-conditionals",
  "difficulty": "easy",
  "title": "Cinema ticket price",
  "prompt": "Trace the code. What does it print?",
  "code": "def ticket_price(age):\n    if age < 12:\n        return 5\n    elif age < 65:\n        return 12\n    else:\n        return 7\n\nprint(ticket_price(12))",
  "commonMistakes": [
   {
    "output": "5",
    "explanation": "12 is not less than 12, so the first condition is False. `<` excludes the boundary value itself."
   },
   {
    "output": "7",
    "explanation": "Only one branch of an if/elif/else runs. 12 < 65 is True, so the elif returns before the else is reached."
   }
  ],
  "explanation": "age is 12. `12 < 12` is False, so the first branch is skipped. `12 < 65` is True, so the function returns 12 and prints it.",
  "tip": "At a boundary, read the operator slowly: `<` leaves the boundary out, `<=` keeps it in.",
  "concept": "Boundaries in if / elif / else (Week 3)",
  "traceColumns": [
   "age",
   "returned"
  ]
 },
 {
  "id": "dr-fc-easy-2",
  "topicId": "functions-conditionals",
  "difficulty": "easy",
  "title": "Grade letters",
  "prompt": "Trace the code. What does it print?",
  "code": "def grade(score):\n    if score >= 80:\n        return \"A\"\n    if score >= 70:\n        return \"B\"\n    return \"C\"\n\nprint(grade(80), grade(79))",
  "commonMistakes": [
   {
    "output": "B B",
    "explanation": "80 >= 80 is True, so grade(80) returns \"A\" straight away. `>=` includes the boundary."
   },
   {
    "output": "A C",
    "explanation": "79 is not >= 80, but it is >= 70, so the second if returns \"B\"."
   }
  ],
  "explanation": "grade(80): 80 >= 80 is True → \"A\". grade(79): 79 >= 80 is False, 79 >= 70 is True → \"B\". print shows both, separated by a space: A B.",
  "tip": "`return` ends the function immediately, so later ifs only run when earlier ones were False.",
  "concept": "return inside if statements (Week 2)",
  "traceColumns": [
   "score",
   "returned"
  ]
 },
 {
  "id": "dr-fc-medium-1",
  "topicId": "functions-conditionals",
  "difficulty": "medium",
  "title": "Shipping cost",
  "prompt": "Trace the code. What does it print?",
  "code": "def shipping(weight, express):\n    cost = 5\n    if weight > 2:\n        cost = cost + 3\n    if express:\n        cost = cost * 2\n    elif weight > 10:\n        cost = cost + 10\n    return cost\n\nprint(shipping(12, False))\nprint(shipping(3, True))",
  "commonMistakes": [
   {
    "output": "8\n16",
    "explanation": "For shipping(12, False), express is False, so the elif is checked: 12 > 10 is True and adds 10, giving 18."
   },
   {
    "output": "18\n26",
    "explanation": "For shipping(3, True), the if express branch runs, so the elif is skipped (and 3 > 10 is False anyway): 8 * 2 = 16."
   }
  ],
  "explanation": "shipping(12, False): cost 5 → 12 > 2 adds 3 → 8. express is False, so the elif runs: 12 > 10 adds 10 → 18. shipping(3, True): 5 → 8 → express doubles it → 16.",
  "tip": "Two separate ifs both run; an if/elif pair runs at most one branch. Mark which kind each condition is before tracing.",
  "concept": "Separate if vs if / elif (Week 3)",
  "traceColumns": [
   "weight",
   "express",
   "cost"
  ]
 },
 {
  "id": "dr-fc-medium-2",
  "topicId": "functions-conditionals",
  "difficulty": "medium",
  "title": "Weather label",
  "prompt": "Trace the code. What does it print?",
  "code": "def label(temp, raining):\n    if temp > 30:\n        if raining:\n            return \"humid\"\n        return \"hot\"\n    elif temp > 20 and not raining:\n        return \"nice\"\n    return \"stay in\"\n\nprint(label(25, True))\nprint(label(31, False))\nprint(label(20, False))",
  "commonMistakes": [
   {
    "output": "nice\nhot\nnice",
    "explanation": "label(25, True): `not raining` is False, so the elif fails. label(20, False): 20 > 20 is False. Both return \"stay in\"."
   },
   {
    "output": "nice\nhot\nstay in",
    "explanation": "For label(25, True), both parts of `and` must be True. raining is True, so `not raining` is False and the elif is skipped."
   }
  ],
  "explanation": "label(25, True): 25 > 30 False; 25 > 20 is True but `not True` is False → \"stay in\". label(31, False): 31 > 30, not raining → \"hot\". label(20, False): 20 > 30 False, 20 > 20 False → \"stay in\".",
  "tip": "With `and`, check each side separately and only then combine them.",
  "concept": "Nested conditions and boolean operators (Week 3)",
  "traceColumns": [
   "temp",
   "raining",
   "returned"
  ]
 },
 {
  "id": "dr-fc-hard-1",
  "topicId": "functions-conditionals",
  "difficulty": "hard",
  "title": "Two discounts",
  "prompt": "Trace the code. What does it print?",
  "code": "def total(amount):\n    if amount >= 100:\n        amount = amount * 0.9\n    if amount > 90:\n        amount = amount - 5\n    return round(amount, 2)\n\nprint(total(100))\nprint(total(95))\nprint(total(99))",
  "commonMistakes": [
   {
    "output": "85.0\n90\n94",
    "explanation": "The second if checks `amount` after the first if changed it. total(100) makes amount 90.0, and 90.0 > 90 is False, so no $5 is taken off."
   },
   {
    "output": "90\n90\n94",
    "explanation": "100 * 0.9 is a float, 90.0, and round(90.0, 2) stays a float, so Python prints 90.0. total(95) never multiplies, so it stays an int: 90."
   }
  ],
  "explanation": "total(100): 100 >= 100 → amount = 90.0; 90.0 > 90 is False → 90.0. total(95): first if skipped; 95 > 90 → 90. total(99): first if skipped; 99 > 90 → 94.",
  "tip": "When a variable is reassigned inside an if, every later condition sees the new value, not the original.",
  "concept": "Reassigning variables inside conditions (Week 3)",
  "traceColumns": [
   "amount",
   "returned"
  ]
 },
 {
  "id": "dr-fc-hard-2",
  "topicId": "functions-conditionals",
  "difficulty": "hard",
  "title": "Number classifier",
  "prompt": "Trace the code. What does it print?",
  "code": "def classify(n, strict=False):\n    if n % 2 == 0:\n        if strict and n == 0:\n            return \"zero\"\n        return \"even\"\n    if n < 0:\n        return \"negative odd\"\n    return \"odd\"\n\nprint(classify(0))\nprint(classify(0, True))\nprint(classify(-3))\nprint(classify(-4, True))",
  "commonMistakes": [
   {
    "output": "zero\nzero\nnegative odd\neven",
    "explanation": "classify(0) uses the default strict=False, so `strict and n == 0` is False and it returns \"even\"."
   },
   {
    "output": "even\nzero\nodd\neven",
    "explanation": "-3 % 2 is 1 in Python, so -3 is odd; then -3 < 0 is True, giving \"negative odd\"."
   }
  ],
  "explanation": "classify(0): even, strict is False → \"even\". classify(0, True): even, strict and n == 0 → \"zero\". classify(-3): -3 % 2 is 1, so not even; -3 < 0 → \"negative odd\". classify(-4, True): even, but n is not 0 → \"even\".",
  "tip": "Default parameters apply when the argument is left out. Check every call's arguments before tracing.",
  "concept": "Default parameters and nested if (Week 3)",
  "traceColumns": [
   "n",
   "strict",
   "returned"
  ]
 },
 {
  "id": "dr-loops-easy-1",
  "topicId": "loops",
  "difficulty": "easy",
  "title": "Running total",
  "prompt": "Trace the code. What does it print?",
  "code": "total = 0\nfor i in range(1, 5):\n    total = total + i\nprint(total)",
  "commonMistakes": [
   {
    "output": "15",
    "explanation": "range(1, 5) stops before 5, so i takes 1, 2, 3, 4 only: 1 + 2 + 3 + 4 = 10."
   },
   {
    "output": "4",
    "explanation": "total adds every i, not just the last one: 1 + 2 + 3 + 4 = 10."
   }
  ],
  "explanation": "range(1, 5) gives 1, 2, 3, 4. total goes 0 → 1 → 3 → 6 → 10, and 10 is printed once, after the loop.",
  "tip": "range(a, b) includes a and excludes b.",
  "concept": "for loops and range (Week 4)",
  "traceColumns": [
   "i",
   "total"
  ]
 },
 {
  "id": "dr-loops-easy-2",
  "topicId": "loops",
  "difficulty": "easy",
  "title": "Countdown by threes",
  "prompt": "Trace the code. What does it print?",
  "code": "count = 0\nn = 10\nwhile n > 0:\n    n = n - 3\n    count = count + 1\nprint(count, n)",
  "commonMistakes": [
   {
    "output": "3 1",
    "explanation": "When n is 1, the condition 1 > 0 is still True, so the loop runs once more: n becomes -2 and count 4."
   },
   {
    "output": "4 1",
    "explanation": "n is updated inside the last iteration too: 1 - 3 = -2."
   }
  ],
  "explanation": "n goes 10 → 7 → 4 → 1 → -2, and count goes 1, 2, 3, 4. The loop stops when n is -2, so it prints 4 -2.",
  "tip": "Check the while condition with the value the variable has at the start of each iteration, including the last one.",
  "concept": "while loops and stopping conditions (Week 4)",
  "traceColumns": [
   "n",
   "count"
  ]
 },
 {
  "id": "dr-loops-medium-1",
  "topicId": "loops",
  "difficulty": "medium",
  "title": "Counting steps",
  "prompt": "Trace the code. What does it print?",
  "code": "def count_steps(n):\n    steps = 0\n    while n > 1:\n        if n % 2 == 0:\n            n = n // 2\n        else:\n            n = 3 * n + 1\n        steps += 1\n    return steps\n\nprint(count_steps(6))",
  "commonMistakes": [
   {
    "output": "9",
    "explanation": "When n reaches 1, the condition n > 1 is False, so the loop stops and no extra step is counted."
   },
   {
    "output": "7",
    "explanation": "Count every change of n: 6→3→10→5→16→8→4→2→1 is 8 steps."
   }
  ],
  "explanation": "n goes 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1, one step each: 8 steps. At 1 the loop stops.",
  "tip": "Check the loop condition before each new iteration, especially at the end.",
  "concept": "while loops and stopping conditions (Week 4)",
  "traceColumns": [
   "n",
   "steps"
  ]
 },
 {
  "id": "dr-loops-medium-2",
  "topicId": "loops",
  "difficulty": "medium",
  "title": "Nested digits",
  "prompt": "Trace the code. What does it print?",
  "code": "result = \"\"\nfor i in range(3):\n    for j in range(i):\n        result = result + str(j)\nprint(result)",
  "commonMistakes": [
   {
    "output": "012",
    "explanation": "The inner loop runs range(i) times: 0 times when i is 0, once (j = 0) when i is 1, twice (j = 0, 1) when i is 2."
   },
   {
    "output": "01",
    "explanation": "Don't forget the inner loop when i is 1: it adds \"0\" before the \"01\" from i = 2."
   }
  ],
  "explanation": "i = 0: range(0) is empty. i = 1: j = 0 → \"0\". i = 2: j = 0, 1 → \"01\". result is \"0\" + \"01\" = \"001\".",
  "tip": "For nested loops, write the inner loop's range for each value of the outer variable first.",
  "concept": "Nested loops (Week 5)",
  "traceColumns": [
   "i",
   "j",
   "result"
  ]
 },
 {
  "id": "dr-loops-hard-1",
  "topicId": "loops",
  "difficulty": "hard",
  "title": "Skip and stop",
  "prompt": "Trace the code. What does it print?",
  "code": "total = 0\nfor n in [4, 7, 2, 9, 6, 1]:\n    if n % 2 == 1:\n        continue\n    if total > 5:\n        break\n    total += n\nprint(total)",
  "commonMistakes": [
   {
    "output": "12",
    "explanation": "When n is 6, total is already 6, and 6 > 5 is True, so the loop breaks before adding 6."
   },
   {
    "output": "4",
    "explanation": "`continue` only skips the odd numbers. 2 is even and total (4) is not > 5, so 2 is added: total 6."
   }
  ],
  "explanation": "4: even, total 0 → 4. 7: odd, continue. 2: even, 4 > 5 is False → 6. 9: odd, continue. 6: even, 6 > 5 is True → break. Prints 6.",
  "tip": "`continue` jumps to the next item; `break` leaves the loop. The check happens before the addition here.",
  "concept": "break and continue (Week 5)",
  "traceColumns": [
   "n",
   "total"
  ]
 },
 {
  "id": "dr-loops-hard-2",
  "topicId": "loops",
  "difficulty": "hard",
  "title": "First repeat",
  "prompt": "Trace the code. What does it print?",
  "code": "def first_repeat(items):\n    seen = []\n    for i in range(len(items)):\n        if items[i] in seen:\n            return i\n        seen.append(items[i])\n    return -1\n\nprint(first_repeat([3, 1, 4, 1, 5, 3]))\nprint(first_repeat([2, 7]))",
  "commonMistakes": [
   {
    "output": "1\n-1",
    "explanation": "The function returns the index i, not the value. The repeated value 1 is found at index 3."
   },
   {
    "output": "5\n-1",
    "explanation": "3 does repeat, but at index 5. The loop returns earlier, at index 3, when it meets the second 1."
   }
  ],
  "explanation": "i = 0: 3 added. i = 1: 1 added. i = 2: 4 added. i = 3: 1 is already in seen → return 3. For [2, 7] nothing repeats, so the loop ends and -1 is returned.",
  "tip": "Ask what is returned (an index or a value) and when the loop is left early.",
  "concept": "Loops with early return (Week 5)",
  "traceColumns": [
   "i",
   "items[i]",
   "seen"
  ]
 },
 {
  "id": "dr-ls-easy-1",
  "topicId": "lists-strings",
  "difficulty": "easy",
  "title": "Slicing a word",
  "prompt": "Trace the code. What does it print?",
  "code": "word = \"banana\"\nprint(word[1:4])",
  "commonMistakes": [
   {
    "output": "bana",
    "explanation": "Indexes start at 0, so word[1] is \"a\", not \"b\"."
   },
   {
    "output": "anan",
    "explanation": "A slice stops before the end index: [1:4] takes indexes 1, 2 and 3."
   }
  ],
  "explanation": "\"banana\" has indexes b0 a1 n2 a3 n4 a5. word[1:4] takes indexes 1, 2, 3: \"ana\".",
  "tip": "Write the indexes under the letters before slicing.",
  "concept": "String indexing and slicing (Week 6)"
 },
 {
  "id": "dr-ls-easy-2",
  "topicId": "lists-strings",
  "difficulty": "easy",
  "title": "Sorting a list",
  "prompt": "Trace the code. What does it print?",
  "code": "nums = [5, 3, 8]\nnums.append(1)\nnums.sort()\nprint(nums[0], len(nums))",
  "commonMistakes": [
   {
    "output": "5 3",
    "explanation": "append adds 1 to the list, and sort changes the list itself, so nums is [1, 3, 5, 8]."
   },
   {
    "output": "1 3",
    "explanation": "After append the list has 4 items."
   }
  ],
  "explanation": "After append: [5, 3, 8, 1]. sort() sorts it in place: [1, 3, 5, 8]. nums[0] is 1 and the length is 4.",
  "tip": "List methods like append and sort change the list itself and return None.",
  "concept": "List methods (Week 6)",
  "traceColumns": [
   "nums"
  ]
 },
 {
  "id": "dr-ls-medium-1",
  "topicId": "lists-strings",
  "difficulty": "medium",
  "title": "Title case",
  "prompt": "Trace the code. What does it print?",
  "code": "words = \"the cat sat\".split()\nresult = []\nfor w in words:\n    result.append(w[0].upper() + w[1:])\nprint(\" \".join(result))",
  "commonMistakes": [
   {
    "output": "THE CAT SAT",
    "explanation": "Only w[0], the first letter, is upper-cased; w[1:] is added unchanged."
   },
   {
    "output": "The cat sat",
    "explanation": "The loop runs for every word in the list, not only the first one."
   }
  ],
  "explanation": "split() gives [\"the\", \"cat\", \"sat\"]. Each word becomes its first letter in upper case plus the rest: \"The\", \"Cat\", \"Sat\". join puts spaces between them.",
  "tip": "Trace string expressions piece by piece: w[0], .upper(), w[1:], then the +.",
  "concept": "split, join and string methods (Week 6)",
  "traceColumns": [
   "w",
   "w[0].upper()",
   "w[1:]",
   "result"
  ]
 },
 {
  "id": "dr-ls-medium-2",
  "topicId": "lists-strings",
  "difficulty": "medium",
  "title": "Copy or same list?",
  "prompt": "Trace the code. What does it print?",
  "code": "a = [1, 2, 3]\nb = a\nb.append(4)\nc = a[:]\nc.append(5)\nprint(len(a), len(b), len(c))",
  "commonMistakes": [
   {
    "output": "3 4 4",
    "explanation": "`b = a` doesn't copy the list: a and b are the same list, so appending to b changes a too."
   },
   {
    "output": "3 4 5",
    "explanation": "a and b name the same list, so a also has 4 items. Only a[:] makes a copy."
   }
  ],
  "explanation": "b = a makes b another name for the same list, so after b.append(4) both have 4 items. c = a[:] is a copy of [1, 2, 3, 4]; appending 5 changes only c. Lengths: 4 4 5.",
  "tip": "Assignment never copies a list. Slicing ([:]) or list() does.",
  "concept": "Lists are mutable: aliasing and copies (Week 7)",
  "traceColumns": [
   "a",
   "b",
   "c"
  ]
 },
 {
  "id": "dr-ls-hard-1",
  "topicId": "lists-strings",
  "difficulty": "hard",
  "title": "Removing while looping",
  "prompt": "Trace the code. What does it print?",
  "code": "nums = [2, 4, 5, 6, 8]\nfor n in nums:\n    if n % 2 == 0:\n        nums.remove(n)\nprint(nums)",
  "commonMistakes": [
   {
    "output": "[5]",
    "explanation": "Removing items while looping over the same list shifts the remaining items left, so the loop skips the item after each removal."
   },
   {
    "output": "[5, 8]",
    "explanation": "Track the loop by position: after 2 is removed, position 1 holds 5 (4 was skipped); after 6 is removed, the loop has reached the end."
   }
  ],
  "explanation": "Position 0: n = 2, removed → [4, 5, 6, 8]. Position 1: n = 5, kept. Position 2: n = 6, removed → [4, 5, 8]. Position 3 doesn't exist, so the loop ends. 4 and 8 were skipped.",
  "tip": "A for loop walks through positions. Changing the list's length while looping moves items under it.",
  "concept": "Modifying a list while iterating (Week 7)",
  "traceColumns": [
   "n",
   "nums"
  ]
 },
 {
  "id": "dr-ls-hard-2",
  "topicId": "lists-strings",
  "difficulty": "hard",
  "title": "Compressing a string",
  "prompt": "Trace the code. What does it print?",
  "code": "def compress(s):\n    out = \"\"\n    count = 1\n    for i in range(1, len(s)):\n        if s[i] == s[i - 1]:\n            count += 1\n        else:\n            out += s[i - 1] + str(count)\n            count = 1\n    return out\n\nprint(compress(\"aaabcc\"))",
  "commonMistakes": [
   {
    "output": "a3b1c2",
    "explanation": "A group is only added when the next letter is different. The last group (\"cc\") never meets a different letter, so it is never added."
   },
   {
    "output": "a2b1c1",
    "explanation": "count starts at 1 for the first letter, and the loop starts at index 1, so \"aaa\" counts to 3."
   }
  ],
  "explanation": "i = 1, 2: same letter, count 2 then 3. i = 3: \"b\" ≠ \"a\" → out = \"a3\", count 1. i = 4: \"c\" ≠ \"b\" → out = \"a3b1\", count 1. i = 5: same → count 2. The loop ends without adding \"c2\": prints a3b1.",
  "tip": "After a loop, ask what happens to the work in progress (here, the last group).",
  "concept": "Loops over strings with indexes (Week 7)",
  "traceColumns": [
   "i",
   "s[i]",
   "count",
   "out"
  ]
 }
];
