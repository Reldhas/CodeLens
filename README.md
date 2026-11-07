# CodeLens

A frontend-only Python code review practice demo for CS students, built with
React, TypeScript, and Vite. No Ruby, Rails, database, or backend service is required.

## Live demos

[![Main demo](https://img.shields.io/badge/Live_Demo-Main-2563eb?style=for-the-badge)](https://codelens-nus.vercel.app/)
[![Development demo](https://img.shields.io/badge/Live_Demo-Dev_%C2%B7_Live_AI-7c3aed?style=for-the-badge)](https://codelens-nus-dev.vercel.app/)

- [Main demo](https://codelens-nus.vercel.app/) — the `main` branch, with simulated review scoring and feedback.
- [Development demo](https://codelens-nus-dev.vercel.app/) — the `dev` branch, with live AI feedback for Lens Review.

The setup instructions below apply to the frontend-only version on `main`.

## Start the demo

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173/.

## Features

- Three practice functions: Lens Review, Dry Run, and Concept Match ([guide](docs/new-features.md))
- Exercise brief and requirements above the code
- Light and dark themes with a saved preference
- Line annotations organized beside the review guide
- Real Python execution in a browser worker, with output and a stop button
- Simulated review scoring and model reviews
- Browser-local drafts and review history

Python loads on demand from a CDN on the first run. Review scoring is simulated;
the exercises are sample material for demonstration.

## Validate and build

From the repository root:

```sh
npm test
npm run build
npm run preview
```

Deploy `dist/` to a static host. Source code, dependencies, tests, and
configuration live at the repository root. See [the frontend guide](docs/frontend.md)
for the walkthrough, execution limits, and implementation details.
