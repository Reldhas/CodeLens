# CodeLens

A frontend-only Python code review practice demo for CS students, built with
React, TypeScript, and Vite. No Ruby, Rails, database, or backend service is required.

## Start the demo

Requires Node.js 22 or newer.

```sh
cd client
npm install
npm run dev
```

Open http://127.0.0.1:5173/.

## Features

- Exercise brief and requirements above the code
- Light and dark themes with a saved preference
- Line annotations organized beside the review guide
- Real Python execution in a browser worker, with output and a stop button
- Simulated review scoring and model reviews
- Browser-local drafts and review history

Python loads on demand from a CDN on the first run. Review scoring is simulated;
the exercises are sample material for demonstration.

## Validate and build

From `client/`:

```sh
npm test
npm run build
npm run preview
```

Deploy `client/dist/` to a static host. Source code, dependencies, tests, and
configuration live in `client/`. See [the frontend guide](client/README.md)
for the walkthrough, execution limits, and implementation details.
