import test from 'node:test';
import assert from 'node:assert/strict';
import { isPresentation, presentationPractice } from '../app/bundles/course/codelens/presentation.js';
import { exercises } from '../app/bundles/course/codelens/model.js';

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

test('presentation respects a different topic selected on the home card',()=>{
  const config=presentationPractice(['Maintainability'],false,exercises,'Conditions & boundaries');
  assert.equal(config.topic,'Conditions & boundaries');
  assert.notEqual(config.exerciseId,'seats-maintainability');
});
