// Made-up practice history so the Skill Map has something to show in a demo.
// Dates are relative to today so the sample never falls out of the 30-day window.
import { exercises } from '../../model.js';
import { goodReview } from '../../lens-demo.js';
const daysAgo = days => new Date(Date.now() - days * 86400000).toISOString();
const dryRun = (id, title, days, correct, note) => ({ id, function: 'dry-run', title, date: daysAgo(days), score: correct ? 1 : 0, shown: correct ? 'Correct' : 'Not quite', items: [{ lens: 'Correctness', value: correct ? 1 : 0, source: 'exam' }], note });
const conceptSet = (id, days, right, note) => ({ id, function: 'concept-match', title: 'Set of 5 questions', date: daysAgo(days), score: right / 5, shown: `${right} / 5`, items: [0, 1, 2, 3, 4].map(i => ({ lens: 'Appropriateness', value: i < right ? 1 : 0, source: 'exam' })), note });
const lensReview = (id, title, days, total, items, note, taComment) => ({ id, function: 'lens-review', title, date: daysAgo(days), score: total / 10, shown: `${total.toFixed(1)} / 10`, items: items.map(([lens, value]) => ({ lens, value, source: 'review' })), note, taComment });
export const sampleHistory = [
  dryRun('sample-dr-1', 'While loop countdown', 1, false, '`while n > 0` runs once more than you traced: n is still 1 before the last iteration.'),
  conceptSet('sample-cm-1', 2, 4, 'Your reason named the requirement in the story. That is what makes the answer exam-ready.'),
  lensReview('sample-lr-1', 'Shopping discount calculator', 3, 5, [['Correctness', 1], ['Correctness', 0]], 'You found the $100 boundary bug but missed that negative totals are accepted.', 'Your boundary comment is exam-ready. Now try every requirement in turn: which one has no line of code behind it?'),
  dryRun('sample-dr-2', 'Cinema ticket price', 4, true, 'You read `<` correctly at the boundary.'),
  dryRun('sample-dr-3', 'List changed while looping', 6, false, 'Removing an item shifts the rest, so the loop skips the next one.'),
  conceptSet('sample-cm-2', 8, 3, 'Two options would work here; the story asks for the one that keeps the original order.'),
  lensReview('sample-lr-2', 'Cinema seat checker', 9, 7.5, [['Efficiency', 1]], 'You spotted the repeated scan. Say what a set changes in the running time.'),
  dryRun('sample-dr-4', 'Accumulator total', 11, false, 'The total is updated before the check, so the final value is one step later than you traced.'),
  conceptSet('sample-cm-3', 13, 4, 'Good: you ruled out the dictionary because nothing needs to be looked up.'),
  dryRun('sample-dr-5', 'Nested loop pairs', 16, true, 'You kept the inner and outer counters apart.'),
  lensReview('sample-lr-3', 'Cinema seat checker', 19, 2.5, [['Maintainability', 0], ['Appropriateness', 1]], 'The approach comment was right; the unclear names went unnoticed.'),
];

// Concrete, explicitly simulated submissions let every demo review open a results page.
export function sampleLensAttempt(id) {
  const summary = sampleHistory.find(s => s.id === id && s.function === 'lens-review');
  if (!summary) return null;
  const exercise = id === 'sample-lr-1' ? exercises.find(e => e.id === 'discount')
    : id === 'sample-lr-3' ? exercises.find(e => e.title === summary.title && e.findings.some(f => f.dimension === 'Maintainability'))
    : exercises.find(e => e.id === 'seats');
  if (!exercise) return null;
  const submission = goodReview(exercise);
  if (id === 'sample-lr-1') submission.comments = submission.comments.slice(0, 1);
  if (id === 'sample-lr-2') submission.comments = submission.comments.map(c => ({ ...c, reasoning: 'A set would avoid repeatedly scanning the booked seats.', fix: 'Use a set.' }));
  if (id === 'sample-lr-3') submission.comments = [{ id: 'sample-comment', dimension: 'Appropriateness', start: 1, end: exercise.code.length, claim: 'A set is the right approach for membership checks.', reasoning: 'It avoids scanning every booked seat.', fix: 'Keep using the set.' }];
  const part = summary.score * 10 / 4;
  return { id, exercise: exercise.id, date: summary.date, ...submission, focus: [...new Set(summary.items.map(i => i.lens))], sample: true, sampleNote: summary.note, result: { rubric: { claim: part, evidence: part, reasoning: part, fix: part }, total: summary.score * 10, found: id === 'sample-lr-3' ? 0 : 1 } };
}
