import { exercises } from './model.js';
import { approvedItems } from './course.js';
import { choosePractice } from './review-flow.js';

// Opt-in exercise selection only. Never seeds submissions, grades or TA decisions.
export const isPresentation = (search = globalThis.location?.search || '') => {
  const val = new URLSearchParams(search).get('presentation');
  return val === 'true' || val === 'maintainability';
};
const presentationFocus = ['Correctness', 'Maintainability'];
export function presentationPractice(focus, randomFocus, bank = approvedItems('lens-review', exercises), topic = 'Random') {
  if (randomFocus || focus.length !== presentationFocus.length || !presentationFocus.every(lens => focus.includes(lens)) || (topic !== 'Random' && topic !== 'Lists & membership')) return choosePractice(topic, focus, randomFocus, Math.random, bank);
  // The fixed, bundled presentation sample is independent of browser-saved TA approvals.
  const exercise = exercises.find(item => item.id === 'login-maintainability');
  if (!exercise) throw new Error('The bundled presentation exercise is unavailable.');
  return { exerciseId: exercise.id, topic: exercise.topic, focus: [...presentationFocus], randomFocus: false };
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
      || item.submission.student !== 'Hiroshi Sakuda'
      || !['login-maintainability', 'seats-maintainability'].includes(item.exercise?.id)) return '';
  return 'The key issue is hidden shared state in attempts={}. Clearing the dictionary on every call would erase the history needed for the sliding window check. Pass an explicitly managed history dictionary into the function, or encapsulate it in a RateLimiter with a defined lifecycle. If using attempts=None, initialise a new dictionary only when none was supplied; repeated calls must share the explicitly managed history. Verify that a fourth attempt within 60 seconds is flagged and that separate tracker instances remain isolated.';
}

// Prefill only a new presentation editor; the student still saves and submits.
export function presentationStudentReview(config, search = globalThis.location?.search || '') {
  if (!isPresentation(search) || config.randomFocus || !config.focus?.includes('Maintainability')
      || config.focus.some(lens => !['Maintainability', 'Correctness'].includes(lens))
      || !['login-maintainability', 'seats-maintainability'].includes(config.exerciseId)) return null;
  const prepared = {
    range: [1, 6],
    form: {
      lenses: ['Maintainability'],
      text: 'The mutable default argument attempts={} creates hidden shared state across calls. This makes the tracker lifecycle unclear, breaks isolation between independent tests, and can retain histories for inactive users indefinitely.',
      fix: 'Call attempts.clear() at the start of the function.',
    },
  };
  return { ...prepared, annotations: config.focus.includes('Correctness') ? [
    {start:1, end:6, ...prepared.form},
    {start:7, end:7, lenses:['Correctness'], text:'Using >= 3 is off by one: exactly three recent attempts are flagged, but the requirement says exceeded three.', fix:'Change the check to len(recent) > 3.'},
  ] : [] };
}

// Run once at application boot, not on component mounts or in-app navigation.
export function resetPresentationState(search, local, session) {
  if (!isPresentation(search)) return;
  for (const key of ['codelens-demo-v1', 'codelens-practice-v1', 'codelens-ta-v1', 'codelens-course-v1', 'codelens-studio-v1']) {
    local.removeItem(key);
  }
  session.removeItem('codelens-demo');
}
