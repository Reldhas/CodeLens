# Local student workflow

Start from the repository root in PowerShell:

```powershell
$env:CODELENS_MOCK_MODE = '1'
bundle exec rackup --host 127.0.0.1 --port 3000
```

This opts the local Rails host into an in-memory test double. The default mode
still returns 501. Mock mode refuses to start outside development/test. Use one
server process: restarting resets attempts, submissions and idempotency keys.
No database, Redis, identity provider, evaluator or AI connection is made.

The only fixture is activity **15**, version **22**, rubric version **7**, in
course **12**. The server configures the synthetic owner `student-1`; HTTP
parameters and headers cannot select another identity. This is not an authenticated
multi-user service. Real course membership and tenant checks belong to the later
Coursemology integration.

## Try the flow

In another PowerShell terminal:

```powershell
$base = 'http://127.0.0.1:3000/courses/12/codelens'
$attempt = Invoke-RestMethod -Method Post -Uri "$base/attempts" -ContentType 'application/json' -Body (@{
  attempt = @{ activity_id = 15; level = 'beginner' }
} | ConvertTo-Json -Depth 10)

Invoke-RestMethod "$base/attempts/$($attempt.id)"

$draft = Invoke-RestMethod -Method Patch -Uri "$base/attempts/$($attempt.id)/draft" -ContentType 'application/json' -Body (@{
  draft = @{ lock_version = 0; review = @{ summary = 'Check the discount threshold.' } }
} | ConvertTo-Json -Depth 10)

$criteria = @(
  @{ criterion = 'correctness'; judgment = 'needs_changes'; reasoning = 'The code applies 10% instead of 20%.'; line_numbers = @(3) }
  @{ criterion = 'efficiency'; judgment = 'acceptable'; reasoning = 'Time and space are constant.' }
  @{ criterion = 'maintainability'; judgment = 'acceptable'; reasoning = 'The short branch is easy to follow.' }
  @{ criterion = 'context_fit'; judgment = 'insufficient_information'; reasoning = 'Money rounding is unspecified.' }
)
$submissionBody = @{
  review_submission = @{
    lock_version = $draft.lock_version
    review = @{
      decision = 'request_changes'
      criteria = $criteria
      summary = 'Correct the discount rate.'
      proposed_changes = 'Use 0.8 instead of 0.9.'
      proposed_code = $null
    }
  }
} | ConvertTo-Json -Depth 10
$headers = @{ 'Idempotency-Key' = [guid]::NewGuid().ToString() }
$submission = Invoke-RestMethod -Method Post -Uri "$base/attempts/$($attempt.id)/review_submissions" -ContentType 'application/json' -Headers $headers -Body $submissionBody

Invoke-RestMethod "$base/attempts/$($attempt.id)/reference_solutions"
Invoke-RestMethod "$base/review_submissions/$($submission.id)/ta_feedback"
```

Resending the same submission body and key returns the original submission.
Reusing that key with a different body returns 409. A revision requires the
current attempt `lock_version` and a new key; earlier submissions remain intact.
The submission response includes the incremented `lock_version` for convenience.
Draft saves also increment it; stale drafts/submissions return 409.

Before a complete submission, references return 403. Incomplete reviews return
422 and do not release references. A complete review requires all four distinct
criteria with judgment and reasoning, a decision and a summary; requesting changes
also requires proposed changes. `proposed_code` is stored as text only.

Successful mock responses include `X-CodeLens-Mode: mock`. No `/activities` or
management route is added. All ten student endpoints work in mock mode; all still
return 501 when mock mode is disabled. `can_run_tests` is true only for beginner.
Reference responses use `{ items: [...], rubric_explanations: [...] }`.

## Simulated tests and AI jobs

Create a test run after creating a beginner attempt (before submitting if you
want to include its evidence):

```powershell
$run = Invoke-RestMethod -Method Post -Uri "$base/attempts/$($attempt.id)/test_runs" -ContentType 'application/json' -Headers @{
  'Idempotency-Key' = [guid]::NewGuid().ToString()
} -Body (@{ test_run = @{ cases = @(
  @{ client_case_id = 'threshold'; inputs = @{ amount = 500 }; prediction = @{ kind = 'value'; value = 400 } }
) } } | ConvertTo-Json -Depth 10)

# POST returns queued. First GET advances to running; second GET completes.
Invoke-RestMethod "http://127.0.0.1:3000$($run.poll_url)"
$result = Invoke-RestMethod "http://127.0.0.1:3000$($run.poll_url)"
$result.cases
```

The fixed exercise yields actual 450 and expected 400 at the threshold of 500.
Results carry `simulated: true`: a Ruby fixture computes them without executing
Python, Docker or student code. The mock oracle is a POC fixture, not a validated
production evaluator. Numeric comparison uses absolute tolerance `0.000001`.
Nonnegative values below 500 are unchanged. Negative amounts are accepted as test
data but have null expected outcomes and requirement verdicts because the fixture
does not specify their business validity. Prediction matching still compares
against the simulated actual result.

Each request accepts 1–10 cases with unique IDs (1–100 characters) and exactly one
numeric input, `amount`, bounded to ±1e9. Predictions accept bounded numeric values
or `{ kind: 'error', error_code: 'INVALID_INPUT' }`. Code, extra inputs, shell strings
and other unexpected case fields are rejected with 422. Intermediate/advanced
attempts return `TESTING_NOT_AVAILABLE` even if called directly.

Add `test_run_ids = @($run.id)` to a criterion in the submission body to cite a
completed run. Evidence must belong to that attempt and pinned version; pending,
failed, missing and other-attempt runs are rejected. Submission freezes a copy
of the review, evidence, version identifiers and feedback-exposure state.

After submitting a review, request AI feedback with an empty body:

```powershell
$assessment = Invoke-RestMethod -Method Post -Uri "$base/review_submissions/$($submission.id)/ai_assessments" -Headers @{
  'Idempotency-Key' = [guid]::NewGuid().ToString()
}
Invoke-RestMethod "http://127.0.0.1:3000$($assessment.poll_url)"
$feedback = Invoke-RestMethod "http://127.0.0.1:3000$($assessment.poll_url)"
$feedback
```

Feedback has `source: ai`, `simulated: true`, all four criteria and only saved
code-line/test-run references. Outcomes are deliberately `not_assessable` with
`needs_human_review: true`; no model has evaluated the review. Model and prompt
versions are server-owned mock identifiers. Nonempty request bodies are rejected.
TA feedback remains a separate endpoint returning `{ feedback: null }`.

Job POSTs require `Idempotency-Key`, scoped to student, course, operation and parent
record. Repeating a key with a different payload returns 409. A repeated key returns
the same job ID and its current status. AI requests with different keys also dedupe
by submission and the fixed rubric/prompt/model configuration while in flight or
completed. After failure, a new key permits a retry, capped at three total attempts.
The original key continues to identify the original failed job.

Polling is ownership/course-scoped and returns `running`, then `completed` or
`failed`; terminal responses are stable. Failure contains a safe `MOCK_JOB_FAILED`
error and preserves the review. Tests inject failing evaluator/assessor callables
through `Workflow.new(evaluator: ..., assessor: ...)`; HTTP clients cannot control
failure modes or provider configuration.

**POC limitation:** no worker runs in the background. Polling drives the mock job
state machine. All records, jobs and deduplication keys are process-local and lost
on restart. Durable jobs, real identity/permissions, production evaluator and AI
integration must replace these doubles before deployment.

Stop the server with Ctrl+C. Disable mock mode before starting the default host:

```powershell
Remove-Item Env:CODELENS_MOCK_MODE
```

Run both default and mock checks with `bundle exec rake test`. Each mock test
gets a fresh store and restores the default mode afterwards.
