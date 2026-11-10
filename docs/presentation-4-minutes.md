# Four-minute presentation journey

Updated for the dev UX redesign (bf807c2). Start after a 30-second introduction; return to slides at 4:30 overall. Cut one minute from the remaining slide narration to retain the 10:15 total target.

## Preparation

Open the presentation deployment with `?presentation=true`, without `?demo`. Navigate normally from Practice. The query fixes exercise selection only; it does not seed answers, scores, or TA decisions. The home card must use Any topic or Lists & membership, and the student must explicitly select exactly two lenses, Correctness and Maintainability. Other topics and lenses keep their normal selection behavior. Fixed exercises are also provided for Dry Run (`Cinema ticket price`) and Concept Match in case they are opened during the demo.

In Content Studio, ensure the Login attempt tracker (2 planted issues) variant is approved before rehearsal. The fixed flow will report an error rather than bypass approval. Use the same browser and origin for student and TA, since this prototype saves feedback locally. Verify live AI sign-in/configuration before presenting. Rehearse on a separate attempt and keep its results accessible through normal history as a fallback.

## Live journey

| Time | Action | What to say |
| --- | --- | --- |
| 0:00-0:35 | Practice home: point to Dry Run and Concept Match and their Level/Topic selectors. Briefly open one practice, then exit back to Practice using its normal back control. | Dry Run builds tracing; Concept Match practises choosing an approach. Today we focus on evaluating code. |
| 0:35-1:20 | Lens Review card: choose Lists & membership (or Any topic), Start Lens Review, select Correctness and Maintainability, Start Lens Review. Select lines 1-6, tag Maintainability, enter the first explanation and fix below, Save annotation. Select line 7, tag Correctness, enter the second explanation and fix below, Save annotation. Enable Use live AI feedback and submit. | One review can apply several lenses. Correctness asks whether the code meets its requirements; Maintainability asks whether it will stay safe to change. The student must identify each problem, explain it and suggest a change. |
| 1:20-1:55 | Result: point to the score, lenses practised, highlighted code and live feedback. Expand How this was scored briefly. | The assessment evaluates the review. Found/missed highlighting is checked against the curated answer key; the live model supplies the score and feedback. |
| 1:55-2:45 | Back to Practice -> TA -> Review Queue. Select Review on the matching Demo student / Login attempt tracker submission, checking title and time. Read the saved live assessment. Review the automatically prefilled TA comment; optionally enter Your score. Approve and send. Use Back to Review Queue if it automatically opens the next submission. | The TA adds their own judgement alongside the AI assessment; they do not rewrite the AI response. |
| 2:45-3:15 | Class Insights: show the lens breakdown, common gaps and students needing support. | These sample class insights help a TA prioritise support. |
| 3:15-3:40 | Switch Student to return to Practice. Notice the new TA feedback announcement banner on home (or the notification bell in the topbar). Click View feedback. | The student immediately sees the TA announcement banner and opens the review layout, focused on the TA comment above the AI feedback. The TA score appears alongside the AI score if supplied. |
| 3:40-4:00 | Back to Practice -> Skill Map. Show the weakest lens/topic and recommended next practice. | Feedback becomes a next step. The prototype map includes sample history. |

Do not use fill-answer shortcuts or direct result links. Do not spend time finishing a Dry Run or Concept Match set. Their level and topic setup now lives on home, so the older separate setup-screen narration no longer applies.

## Prepared annotation

For the intermediate Login attempt tracker variant:

```python
def record_attempt(user_id, timestamp, attempts={}):
    """Track attempt timestamps and flag if rate limit exceeded."""
    user_history = attempts.setdefault(user_id, [])
    user_history.append(timestamp)
    recent = [t for t in user_history if timestamp - t <= 60]
    attempts[user_id] = recent
    return len(recent) >= 3
```

This variant has two planted issues, one per selected lens, so it takes two annotations.

### Annotation 1: Maintainability

Select lines 1-6 (or line 1) and the Maintainability lens.

**What's wrong, and why?**

> A mutable default argument (`attempts={}`) creates hidden shared state across all function calls. In a web server, this causes an unbounded memory leak and breaks test isolation because user attempt history persists across independent requests.

**Proposed fix** (intentionally imperfect):

> Call `attempts.clear()` at the start of the function.

The intentional mistake is clearing the dictionary inside the function: while it stops cross-request leakage, it wipes out previous timestamps on each call so sliding window rate limiting never accumulates past 1. It does not fix the root architectural smell of using a mutable default parameter. Do not promise an exact score or that the AI will detect the flawed patch. Discuss the actual response.

### Annotation 2: Correctness

Select line 7 and the Correctness lens.

**What's wrong, and why?**

> Using `>= 3` is off by one. The requirement only flags a user who exceeded 3 attempts, but a user with exactly 3 recent attempts is already flagged.

**Proposed fix:**

> Change the check to `len(recent) > 3`.

## Prepared TA feedback

In presentation mode, the matching unsent Demo student review opens with editable feedback already filled in. The score remains blank and nothing is sent until Approve and send is clicked.

> The key issue is hidden shared state in attempts={}. Clearing the dictionary on every call would erase the history needed for the sliding window check. Pass an explicitly managed history dictionary into the function, or encapsulate it in a RateLimiter with a defined lifecycle. If using attempts=None, initialise a new dictionary only when none was supplied; repeated calls must share the explicitly managed history. Verify that a fourth attempt within 60 seconds is flagged and that separate tracker instances remain isolated.


The TA form now has Yes/No feedback quality, Your feedback, and an optional Your score. It no longer edits the AI summary. Queue review flags are heuristics, not model confidence.

## Recovery and closing

Submit by 1:20 and enter TA review by 1:55. If live evaluation is slow, explicitly introduce the completed rehearsal result, return through Practice and open it from Recent results or Skill Map. Review that same attempt in the TA queue; it appears at the top of the queue as the newest submission.

If behind, skip opening How this was scored and shorten the other-practice preview. Keep TA review, the notification and Class Insights.

Close: You've seen the student and TA journey. Here is the research and testing that shaped those decisions.

## Password-free live presentation

On the presentation deployment backend, set `PRESENTATION_AUTO_LOGIN=true` and `PRESENTATION_AUTO_LOGIN_UNTIL` to the ISO timestamp when access should end (include the timezone, for example `2026-11-10T21:15:00+08:00`). Redeploy after changing deployment variables. Use a future timestamp for your actual presentation.

With `?presentation=true` the password field is hidden and submission creates a temporary session automatically. Keep the API key and REVIEW_PASSWORD server-side. The URL alone cannot enable this access. Anyone able to reach this deployment can use the temporary presentation access while enabled, subject to the existing limits. Those limits are per server instance, not a durable account-wide budget. Existing password sign-in remains available outside presentation mode. Temporary sessions expire no later than the configured cutoff. Remove the two settings after the presentation.

The configured default cutoff is 10 November 2026 at 9:15 pm Singapore time (13:15 UTC). Server opt-in via PRESENTATION_AUTO_LOGIN=true is still required.

## Student prefill

Starting the fixed Maintainability exercise in presentation mode opens the annotation editor with lines 1-6, the explanation and the intentionally imperfect fix already filled. You can edit them, then click Save annotation and Submit review yourself. Resuming an existing draft keeps your saved edits. Other exercises and normal practice are unchanged.

For the two-lens presentation (Correctness + Maintainability), both annotations are already saved as editable draft annotations. Review or edit them, then submit. The single-lens flow still opens the prefilled editor.
