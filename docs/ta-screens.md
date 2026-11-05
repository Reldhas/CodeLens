# TA screens

The TA side of the prototype, with made-up sample data and no backend. TA actions
are saved in this browser's localStorage, so run a student-and-TA demo in one
browser. Use the Student / TA switch on the home screen to change views. It also
appears on the TA screens, but not inside exercises.

## Content Studio

- **Example bank:** approved examples per function, against the number required.
- **Samples:** Generate reveals pre-made samples for a function and topic. Each can
  be approved, rejected or regenerated, and its explanation edited. The code can't
  be edited.
- **Materials:** Upload keeps the file name, week and topic. The file itself isn't
  stored.
- **Course settings:** published topics and examples required.

These settings really change what students get:

- A function with too few approved examples shows "Your TA is preparing this".
  This applies to all three functions.
- Published topics limit Dry Run and Concept Match. Lens Review keeps its own
  exercises and topics.

Generation and the sandbox checks shown on each sample are simulated. Edited
explanations are saved in Content Studio but don't change what students see.

## Review Queue

Lists Lens Review submissions: this browser's real ones plus sample students.
Waiting items come first, then those with more flags, then the newest.

- **Flags:** low AI confidence, student 👎 and watching.
- **Opening one:** the code, the student's comments, the AI draft and the answer key.
- **Actions:** rate the AI feedback, edit its summary, adjust the score, comment,
  Approve and send, Skip, and Watch the student.

The student then gets a notice on the home screen, opening a page with the score,
summary and TA comments. An adjusted score also changes the Skill Map, when that
screen is merged.

## Class Insights

Students active, attempts, share started from the Skill Map, students to support,
class averages by function and lens, common gaps, and AI feedback quality. It
combines a made-up class of eight (`sample-class.js`) with this browser's attempts.

## Files

| Folder | Purpose |
| --- | --- |
| `features/content-studio/` | Content Studio and its pre-made samples |
| `features/review-queue/` | Queue rules, sample submissions and the review screen |
| `features/ta-feedback/` | The notice and page students see |
| `features/class-insights/` | Calculations, sample class and the screen |
| `tests/ta-screens.test.mjs` | Tests |

This pull request only adds new files. The switch and TA menu already exist in
`Shell.tsx` and appear once these features are present.
