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
management route is added. Test runs and AI assessments still return 501, so
`can_run_tests` is false at every level until execution is implemented.
Nonempty test evidence IDs are rejected rather than presented as verified results.
Reference responses use `{ items: [...], rubric_explanations: [...] }`.

Stop the server with Ctrl+C. Disable mock mode before starting the default host:

```powershell
Remove-Item Env:CODELENS_MOCK_MODE
```

Run both default and mock checks with `bundle exec rake test`. Each mock test
gets a fresh store and restores the default mode afterwards.
