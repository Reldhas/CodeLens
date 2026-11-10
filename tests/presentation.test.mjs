import test from 'node:test';
import assert from 'node:assert/strict';
import { isPresentation, presentationPractice, presentationDryRun, presentationConceptMatch, presentationTaFeedback, presentationStudentReview } from '../app/bundles/course/codelens/presentation.js';
import { exercises } from '../app/bundles/course/codelens/model.js';

test('presentation is explicit and repeatedly selects the same real maintainability task',()=>{
  assert.equal(isPresentation(''),false);
  assert.equal(isPresentation('?demo'),false);
  assert.equal(isPresentation('?presentation=maintainability'),true);
  assert.equal(isPresentation('?presentation=true'),true);
  for(let i=0;i<10;i++){
    const config=presentationPractice(['Maintainability'],false,exercises);
    assert.equal(config.exerciseId,'login-maintainability');
    assert.deepEqual(config.focus,['Maintainability']);assert.equal(config.randomFocus,false);
    assert.ok(exercises.find(e=>e.id===config.exerciseId).findings.every(f=>config.focus.includes(f.dimension)));
  }
  assert.throws(()=>presentationPractice(['Maintainability'],false,[]),/not approved/);
});

test('presentation provides fixed exercises for dry run and concept match',()=>{
  const dummyDry = [{ id: 'dr-fc-easy-2' }, { id: 'dr-fc-easy-1' }];
  assert.equal(presentationDryRun(dummyDry).id, 'dr-fc-easy-1');
  const dummyCm = [{ id: 'cm-easy-3' }, { id: 'cm-easy-1' }, { id: 'cm-easy-2' }, { id: 'cm-other' }];
  const picked = presentationConceptMatch(dummyCm, 3);
  assert.equal(picked.length, 3);
  assert.deepEqual(picked.map(p => p.id), ['cm-easy-1', 'cm-easy-2', 'cm-easy-3']);
});

test('presentation respects other selected criteria rather than mislabeling them',()=>{
  const config=presentationPractice(['Efficiency'],false,exercises);
  assert.deepEqual(config.focus,['Efficiency']);
  assert.ok(exercises.find(e=>e.id===config.exerciseId).findings.every(f=>f.dimension==='Efficiency'));
});

test('presentation respects a different topic selected on the home card',()=>{
  const config=presentationPractice(['Maintainability'],false,exercises,'Conditions & boundaries');
  assert.equal(config.topic,'Conditions & boundaries');
  assert.notEqual(config.exerciseId,'login-maintainability');
});

test('TA prefill is scoped to an unsent presentation submission and does not mutate it', () => {
  const item = { status: 'waiting', submission: { student: 'Demo student' }, exercise: { id: 'login-maintainability' } };
  const before = JSON.stringify(item);
  assert.match(presentationTaFeedback(item, '?presentation=true'), /explicitly managed history/);
  assert.equal(presentationTaFeedback(item, ''), '');
  assert.equal(presentationTaFeedback(item, '?demo'), '');
  assert.equal(presentationTaFeedback({...item, status: 'sent'}, '?presentation=true'), '');
  assert.equal(presentationTaFeedback({...item, exercise: {id:'discount'}}, '?presentation=true'), '');
  assert.equal(presentationTaFeedback({...item, submission: {student:'Other student'}}, '?presentation=true'), '');
  assert.equal(presentationTaFeedback(undefined, '?presentation=true'), '');
  assert.equal(JSON.stringify(item), before);
});

test('student prefill is restricted to the fixed presentation and returns independent editable drafts', () => {
  const config = { exerciseId: 'login-maintainability', focus: ['Maintainability'], randomFocus: false };
  assert.equal(presentationStudentReview(config, ''), null);
  assert.equal(presentationStudentReview({...config, randomFocus:true}, '?presentation=true'), null);
  assert.equal(presentationStudentReview({...config, exerciseId:'discount'}, '?presentation=true'), null);
  assert.equal(presentationStudentReview({...config, focus:['Correctness']}, '?presentation=true'), null);
  const first = presentationStudentReview(config, '?presentation=true');
  assert.deepEqual(first.range, [1,6]);
  assert.match(first.form.fix, /attempts.clear/);
  first.form.text = 'Student edit';
  assert.notEqual(presentationStudentReview(config, '?presentation=true').form.text, 'Student edit');
});
