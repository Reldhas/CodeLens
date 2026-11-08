# Three-minute live demo

Open the live-AI development build with `?presentation=maintainability` appended to its URL. Locally: http://127.0.0.1:5173/?presentation=maintainability . For the hosted demo, deploy this branch first, then use https://codelens-nus-dev.vercel.app/?presentation=maintainability .

This opt-in selects one real exercise when Maintainability is selected: `seats-maintainability`. It does not create answers, scores, attempts or TA feedback. No navigation or answer-fill shortcuts are shown. Removing the query parameter restores normal selection. Live AI wording, scores and response time remain variable.

## Before presenting

- Use the same browser profile, origin and tab for student and TA views: this prototype stores attempts and TA decisions in that browser. They are not synchronized across devices.
- Rehearse once on the development build. Confirm the live-AI checkbox is available and the review access password works. Keep the password private. Never display `.env` or the host's secret settings.
- If Content Studio has been configured, ensure the maintainability seat exercise is approved and Lens Review is unlocked. Presentation mode respects approval rules.
- Keep the student and TA text below ready to copy, in separate notes beside the browser. Paste into the actual annotation fields; do not use `?demo`.
- Start on the student home page. Avoid deleting existing history or changing course settings for the presentation.
- Allow roughly 10–15 seconds for AI latency inside the results segment. If rehearsal shows persistent provider errors, present a saved rehearsal result and explicitly call it saved, or uncheck live AI before submission and explain that the labeled demo scoring is the fallback. Do not promise a particular score.

## Journey and spoken script

| Time | Normal navigation and action | Suggested narration |
| --- | --- | --- |
| 0:00–0:20 | Home → Dry Run → Back to practice; Home → Concept Match → Back to practice. Briefly show each setup; don't start a set. | “Students can practise tracing execution, choosing concepts, and evaluating generated code. I'll focus on evaluation.” |
| 0:20–0:55 | Home → Lens Review → leave Maintainability selected → Start practice. Select lines 1–3, choose Maintainability, paste the three fields below and save the annotation. Select Use live AI feedback and Submit review. | “This code works, but unclear names make it harder to maintain. My review identifies that problem, but its proposed fix contains a subtle mistake.” |
| 0:55–1:20 | Show the results score, rubric and one improvement. Expand Your submission briefly, then collapse it. Return through Practice in the top banner. | “The evaluation considers the claim, code evidence, reasoning and proposed fix. It can distinguish spotting an issue from proposing a sound change.” |
| 1:20–2:05 | On home, switch to TA. In Review Queue open the new Demo student / Cinema seat checker submission, identified by its timestamp and the pasted claim. Read its actual AI feedback. Paste the TA comment below; approve and send. Leave the AI score unchanged unless you can explain a specific correction. | “The TA reviews the same submission and AI assessment, then adds the teaching explanation. Human judgment stays in the loop.” |
| 2:05–2:20 | Use the existing Student role switch to return to student home, then use the existing New TA feedback notice on home. Show AI and TA feedback together on the same results page. Return home through Practice. | “The student receives both perspectives on their own work.” |
| 2:20–2:40 | Switch to TA on home → Class Insights. Point to By lens and Common gaps. Use the existing Student role switch to return to student home. | “These class insights combine clearly labeled sample class data with this browser's activity. They help a TA identify topics that need attention.” |
| 2:40–3:00 | From student home open Skill Map. Point to progress, the new review in Recent feedback, and the suggested next activity. | “At student level, the Skill Map closes the loop: practise, get feedback, and decide what to work on next.” |

If time runs short, show the other practice cards on home without opening their setups. Keep the Lens Review → TA → student comparison intact.

## Student annotation — select lines 1–3

Criterion: **Maintainability**

### Claim

The single-letter variable names hide which seats are booked and which are requested.

### Reasoning

Another developer has to trace a, b, c and d to understand their roles. Descriptive names would make the booking logic easier to review and change without introducing mistakes.

### Proposed fix (intentionally imperfect)

Rename a to requested_seats, b to booked_seats, c to booked_set, and d to seat.

The intentional mistake is swapping the roles of a and b. Since c = set(a), a contains booked seats. The comprehension iterates over b, so b contains requested seats. The reference answer is curated; the live AI should assess the explanation semantically, but its exact critique and score are not guaranteed.

## TA comment — paste into Your comment to the student

You identified the naming problem clearly. Before renaming, trace each value: c = set(a) means a contains the booked seats, while the loop over b means b contains the requested seats. Rename a to booked, b to requested, c to booked_set, and d to seat. Good names should communicate the existing behavior accurately, not just be longer.

## What is real and what is sample

- The submitted annotation, live AI response and sent TA comment belong to the same actual local attempt.
- Scores are not forced by presentation mode. Do not change a score solely to match the script.
- Reference code and planted findings are curated samples.
- Class Insights includes labeled sample students; one demo review does not represent a newly measured class-wide trend.
- Skill Map includes labeled sample history and this browser's completed practice.
