import { exercises } from './model.js';
import { approvedItems } from './course.js';
import { choosePractice } from './review-flow.js';

// Opt-in exercise selection only. Never seeds submissions, grades or TA decisions.
export const isPresentation = (search = globalThis.location?.search || '') => {
  const val = new URLSearchParams(search).get('presentation');
  return val === 'true' || val === 'maintainability';
};
export function presentationPractice(focus, randomFocus, bank = approvedItems('lens-review', exercises), topic = 'Random') {
  if (randomFocus || focus.length !== 1 || focus[0] !== 'Maintainability' || (topic !== 'Random' && topic !== 'Lists & membership')) return choosePractice(topic, focus, randomFocus, Math.random, bank);
  const exercise = bank.find(item => item.id === 'login-maintainability' || item.id === 'seats-maintainability');
  if (!exercise) throw new Error('The presentation exercise is not approved. Ask your TA to approve Login attempt tracker (Maintainability) before rehearsing.');
  return { exerciseId: exercise.id, topic: exercise.topic, focus: ['Maintainability'], randomFocus: false };
}

export function presentationDryRun(items) {
  if (!items?.length) return null;
  return items.find(q => q.id === 'dr-fc-easy-1') || items[0];
}

export function presentationConceptMatch(items, count = 3) {
  if (!items?.length) return [];
  const preferredIds = ['cm-easy-1', 'cm-easy-2', 'cm-easy-3'];
  const fixed = preferredIds.map(id => items.find(q => q.id === id)).filter(Boolean);
  const remainder = items.filter(q => !fixed.some(f => f.id === q.id));
  return [...fixed, ...remainder].slice(0, count);
}

// Editable presenter draft only; never saves a review or sets a score.
export function presentationTaFeedback(item, search = globalThis.location?.search || '') {
  if (!isPresentation(search) || !item || item.status !== 'waiting'
      || item.submission.student !== 'Demo student'
      || !['login-maintainability', 'seats-maintainability'].includes(item.exercise?.id)) return '';
  return 'The key issue is hidden shared state in attempts={}. Clearing the dictionary on every call would erase the history needed for the sliding window check. Pass an explicitly managed history dictionary into the function, or encapsulate it in a RateLimiter with a defined lifecycle. If using attempts=None, initialise a new dictionary only when none was supplied; repeated calls must share the explicitly managed history. Verify that a fourth attempt within 60 seconds is flagged and that separate tracker instances remain isolated.';
}

// Prefill only a new presentation editor; the student still saves and submits.
export function presentationStudentReview(config, search = globalThis.location?.search || '') {
  if (!isPresentation(search) || config.randomFocus || config.focus?.length !== 1
      || config.focus[0] !== 'Maintainability'
      || !['login-maintainability', 'seats-maintainability'].includes(config.exerciseId)) return null;
  return {
    range: [1, 6],
    form: {
      lenses: ['Maintainability'],
      text: 'The mutable default argument attempts={} creates hidden shared state across calls. This makes the tracker lifecycle unclear, breaks isolation between independent tests, and can retain histories for inactive users indefinitely.',
      fix: 'Call attempts.clear() at the start of the function.',
    },
  };
}
