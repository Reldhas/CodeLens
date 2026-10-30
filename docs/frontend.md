# CodeLens frontend demo

Standalone React + TypeScript Lens Review prototype. No Rails, authentication,
API keys, database, or backend is needed. The Ruby backend has been removed.

## Run

From the repository root, with Node.js 22 or newer:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. The development server only serves frontend assets.

```sh
npm run build
npm test
npm run preview
```

`dist/` is the static production site and can be served by a static host.
Google Fonts is optional; system fonts work if offline.

## Demo walkthrough

1. Open Cinema seat checker and read the brief.
2. Click line 6, then line 9, to select the nested lookup. This opens the Annotations tab beside Review guide.
3. Choose Efficiency. Example claim: "The nested loop scans every booked seat."
4. Explain that each request scans the whole list, resulting in O(r*b) time.
5. Propose building a set of booked seats before the loop. Save the annotation.
6. Edit or delete annotations before submission. Submit to lock the review.
7. Inspect Claim, Evidence, Reasoning, and Fix scores; expand the model review.
8. Visit My progress, or try the shopping discount exercise for boundary cases.

Saved annotations, submitted reviews, and history persist in browser localStorage
under `codelens-demo-v1`. Unsaved annotation form text is not persisted. Try again
starts a fresh draft while preserving submitted history. Analytics show the last
30 days; records remain until browser storage is cleared. Storage failure falls
back to session memory and displays a notice.

Feedback is explicitly simulated. A deterministic heuristic checks focus,
issue keywords, line overlap, reasoning length, and fix keywords. Duplicate
annotations cannot increase an issue's score. This is not semantic assessment,
actual AI generation, or approved course material. Model answers
ship in the frontend for demo use. Only Lens Review is included; other modes,
real TA feedback, and real authentication are outside this prototype's scope.

## Python console

The command area below the code executes real Python using Pyodide 0.28.3,
loaded on demand from jsDelivr. No Python server or API key is required.
The first run requires internet access to download the runtime.

Click **Run Python**, or press Ctrl+Enter (Command+Enter on macOS).
The displayed exercise code is loaded before your command in a fresh namespace.
The cinema example prints `['A3', 'B1']`; the discount example prints `100`,
revealing the existing boundary bug. Commands can contain multiple lines.

Execution happens in a dedicated Web Worker. **Stop** terminates that worker;
execution also stops after 10 seconds, while runtime loading has a separate
120-second timeout. Switching exercises or leaving the workspace terminates the
worker. Output is limited to 20,000 characters. Interactive `input()` is not
supported. Console output does not affect review grading or saved annotations.

The new console passes the production build and TypeScript checks. Live browser
execution verification is pending because browser approval was blocked by a
usage limit during implementation.

## Structure

- `app/bundles/course/codelens/App.tsx`: review workspace and progress UI
- `app/bundles/course/codelens/PythonConsole.tsx`: command input, output, and execution lifecycle
- `app/bundles/course/codelens/python.worker.js`: browser Python runtime
- `app/bundles/course/codelens/model.js`: sample exercises and demo rubric
- `app/bundles/course/codelens/styles.css`: responsive editor-style theme
- `tests/assessment.test.mjs`: scoring, evidence, duplicate, and partial-credit tests

Verified: production build, six scoring tests, browser annotation submission,
locked state, and submitted-review persistence on reload.
