# Four-minute presentation journey

Updated for the dev UX redesign (bf807c2). Start after a 30-second introduction; return to slides at 4:30 overall. Cut one minute from the remaining slide narration to retain the 10:15 total target.

## Preparation

Open the presentation deployment with `?presentation=maintainability`, without `?demo`. Navigate normally from Practice. The query fixes exercise selection only; it does not seed answers, scores, or TA decisions. The home card must use Any topic or Lists & membership, and the student must explicitly select only Maintainability. Other topics and lenses keep their normal selection behavior.

In Content Studio, ensure the Cinema seat checker Maintainability variant is approved before rehearsal. The fixed flow will report an error rather than bypass approval. Use the same browser and origin for student and TA, since this prototype saves feedback locally. Verify live AI sign-in/configuration before presenting. Rehearse on a separate attempt and keep its results accessible through normal history as a fallback.

## Live journey

| Time | Action | What to say |
| --- | --- | --- |
| 0:00-0:35 | Practice home: point to Dry Run and Concept Match and their Level/Topic selectors. Briefly open one practice, then exit back to Practice using its normal back control. | Dry Run builds tracing; Concept Match practises choosing an approach. Today we focus on evaluating code. |
| 0:35-1:20 | Lens Review card: choose Lists & membership (or Any topic), Start Lens Review, select only Maintainability, Start Lens Review. Select lines 1-3, tag Maintainability, enter the explanation and fix below, Save annotation. Enable Use live AI feedback and submit. | Working code can still be difficult to maintain. The student must identify a problem, explain it and suggest a change. |
| 1:20-1:55 | Result: point to the score, lenses practised, highlighted code and live feedback. Expand How this was scored briefly. | The assessment evaluates the review. Found/missed highlighting is checked against the curated answer key; the live model supplies the score and feedback. |
| 1:55-2:45 | Back to Practice -> TA -> Review Queue. Select Review on the matching Demo student submission, checking title and time. Read the saved live assessment. Enter the TA comment below; optionally enter Your score. Approve and send. Use Back to Review Queue if it automatically opens the next submission. | The TA adds their own judgement alongside the AI assessment; they do not rewrite the AI response. |
| 2:45-3:15 | Class Insights: show the lens breakdown, common gaps and students needing support. | These sample class insights help a TA prioritise support. |
| 3:15-3:40 | Switch Student to return to Practice. Open the notification bell and the new Your TA commented notification. | The notification opens the same review layout, focused on the TA comment above the AI feedback. The TA score appears alongside the AI score if supplied. |
| 3:40-4:00 | Back to Practice -> Skill Map. Show the weakest lens/topic and recommended next practice. | Feedback becomes a next step. The prototype map includes sample history. |

Do not use fill-answer shortcuts or direct result links. Do not spend time finishing a Dry Run or Concept Match set. Their level and topic setup now lives on home, so the older separate setup-screen narration no longer applies.

## Prepared annotation

For the fixed three-line cinema variant:

```python
def available_seats(a, b):
    c = set(a)
    return [d for d in b if d not in c]
```

Select lines 1-3 and the Maintainability lens.

**What's wrong, and why?**

> Single-letter variable names hide which seats are booked and which are requested. This makes the data flow harder to follow and increases the risk of swapping the inputs when changing the code.

**Proposed fix** (intentionally imperfect):

> Rename a to requested_seats, b to booked_seats, c to booked_set, and d to seat.

The student identifies the issue but swaps the parameter meanings. Do not promise an exact score or that the AI will detect the swap. Discuss the actual response.

## Prepared TA feedback

> You identified the naming problem. Check the data flow before renaming: a is the booked seats because c = set(a), and b is the requested seats because the comprehension iterates over b. Use booked, requested, booked_set and seat, then verify that requested-seat order is preserved.

The TA form now has Yes/No feedback quality, Your feedback, and an optional Your score. It no longer edits the AI summary. Queue review flags are heuristics, not model confidence.

## Recovery and closing

Submit by 1:20 and enter TA review by 1:55. If live evaluation is slow, explicitly introduce the completed rehearsal result, return through Practice and open it from Recent results or Skill Map. Review that same attempt in the TA queue; flagged items may sort ahead of newer submissions.

If behind, skip opening How this was scored and shorten the other-practice preview. Keep TA review, the notification and Class Insights.

Close: You've seen the student and TA journey. Here is the research and testing that shaped those decisions.
