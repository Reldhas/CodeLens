# CodeLens frontend — reserved structure

This directory will contain the student React/TypeScript interface. It is a
structural scaffold only: no package manager, build tool, dependencies, UI or
mocks have been installed. There is no frontend start command yet.

## Responsibilities

| Directory | Intended contents |
|---|---|
| `app/bundles/course/codelens/` | Student screens, feature components, hooks and colocated UI tests |
| `app/api/course/codelens/` | Course-scoped API adapter, request/response types and adapter tests |
| `mocks/` | Future development/test request handlers and synthetic fixtures |
| `public/` | Public static assets; never private rubrics, references or secrets |

Keep feature code inside the CodeLens bundle. Create subdirectories for screens,
components and hooks when implementation needs them. Keep tests next to their
frontend implementation; the root `test/` directory belongs to Rails.

## Backend boundary

Use `/courses/:course_id/codelens` for all CodeLens API requests. Centralise
transport in the API adapter so screens do not construct URLs or manage tokens.
Keep JSON fields in `snake_case` at the API boundary and treat record IDs as
opaque identifiers. By default the backend returns structured HTTP 501 errors;
the future client must handle these as unavailable operations, not successful
empty responses. The optional [backend mock workflow](../docs/mock-workflow.md)
now supports attempts, drafts, submissions, references and empty TA feedback.
Tests and AI jobs remain unavailable in both modes.

The current scope excludes activity listing and staff authoring. Do not add an
`activities` request merely to populate a first screen. Activity selection and
fixtures will be agreed when mocks are implemented.

Mocks should implement the same request/response contracts, be explicitly
enabled for development or tests, and remain outside production bundles. Never
put server-owned reference answers or private rubric content into shipped assets.

## Future Coursemology integration

The bundle path anticipates `client/app/bundles/course/codelens/` in the target
application. The API adapter directory is provisional: reconcile it with the
target branch's existing course API layer when integrating.

Reuse Coursemology's API helpers/interceptors, identity and course context,
navigation, UI conventions and pinned toolchain. Do not introduce a second login
flow. Authorisation and reference release remain backend responsibilities.

When building the standalone POC interface, keep any local entry point and
development-server configuration outside the reusable CodeLens bundle. Configure
local API forwarding then, once a build tool is chosen; no CORS changes or
connections are needed for this structural preparation.

JavaScript dependencies and their eventual lockfile belong in `client/`; Ruby
dependencies remain at the repository root. The Rails gem packages backend paths
only. Frontend packaging and deployment will be configured when the UI exists.
