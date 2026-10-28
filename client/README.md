# CodeLens frontend demo

Standalone React + TypeScript Lens Review prototype. No Rails, authentication,
API keys, database, or backend is needed. The older Rails scaffold is not used.

## Run

From this directory, with Node.js 22 or newer:

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
2. Click line 6, then line 9, to select the nested lookup.
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
Python execution, actual AI generation, or approved course material. Model answers
ship in the frontend for demo use. Only Lens Review is included; other modes,
real TA feedback, and real authentication are outside this prototype's scope.

## Structure

- `app/bundles/course/codelens/App.tsx`: review workspace and progress UI
- `app/bundles/course/codelens/model.js`: sample exercises and demo rubric
- `app/bundles/course/codelens/styles.css`: responsive editor-style theme
- `tests/assessment.test.mjs`: scoring, evidence, duplicate, and partial-credit tests

Verified: production build, six scoring tests, browser annotation submission,
locked state, and submitted-review persistence on reload.
