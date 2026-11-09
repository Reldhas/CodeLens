import { exercises } from './model.js';
import { approvedItems } from './course.js';
import { choosePractice } from './review-flow.js';

// Opt-in exercise selection only. Never seeds submissions, grades or TA decisions.
export const isPresentation = (search = globalThis.location?.search || '') => new URLSearchParams(search).get('presentation') === 'maintainability';
export function presentationPractice(focus, randomFocus, bank = approvedItems('lens-review', exercises), topic = 'Random') {
  if (randomFocus || focus.length !== 1 || focus[0] !== 'Maintainability' || (topic !== 'Random' && topic !== 'Lists & membership')) return choosePractice(topic, focus, randomFocus, Math.random, bank);
  const exercise = bank.find(item => item.id === 'seats-maintainability');
  if (!exercise) throw new Error('The presentation exercise is not approved. Ask your TA to approve Cinema seat checker (Maintainability) before rehearsing.');
  return { exerciseId: exercise.id, topic: exercise.topic, focus: ['Maintainability'], randomFocus: false };
}
