import test from 'node:test';
import assert from 'node:assert/strict';
import { isPresentation, presentationPractice } from '../app/bundles/course/codelens/presentation.js';
import { exercises } from '../app/bundles/course/codelens/model.js';
import { aiSummary } from '../app/bundles/course/codelens/features/review-queue/queue.js';

test('presentation is explicit and repeatedly selects the same real maintainability task',()=>{
  assert.equal(isPresentation(''),false);
  assert.equal(isPresentation('?demo'),false);
  assert.equal(isPresentation('?presentation=maintainability'),true);
  for(let i=0;i<10;i++){
    const config=presentationPractice(['Maintainability'],false,exercises);
    assert.equal(config.exerciseId,'seats-maintainability');
    assert.deepEqual(config.focus,['Maintainability']);assert.equal(config.randomFocus,false);
    assert.ok(exercises.find(e=>e.id===config.exerciseId).findings.every(f=>config.focus.includes(f.dimension)));
  }
  assert.throws(()=>presentationPractice(['Maintainability'],false,[]),/not approved/);
});

test('presentation respects other selected criteria rather than mislabeling them',()=>{
  const config=presentationPractice(['Efficiency'],false,exercises);
  assert.deepEqual(config.focus,['Efficiency']);
  assert.ok(exercises.find(e=>e.id===config.exerciseId).findings.every(f=>f.dimension==='Efficiency'));
});

test('TA summary preserves live AI feedback and retains demo fallback',()=>{
  const exercise=exercises.find(e=>e.id==='seats-maintainability');
  const result={source:'ai',summary:'The claim is valid, but the proposed names swap booked and requested.',found:1};
  assert.equal(aiSummary(exercise,result,false),result.summary);
  assert.equal(aiSummary(exercise,{found:1},false),'1 of 1 issues identified.');
});
