import test from 'node:test';
import assert from 'node:assert/strict';
import { isPresentation, presentationPractice, presentationDryRun, presentationConceptMatch } from '../app/bundles/course/codelens/presentation.js';
import { exercises } from '../app/bundles/course/codelens/model.js';

test('presentation is explicit and repeatedly selects the same two-lens task',()=>{
  assert.equal(isPresentation(''),false);
  assert.equal(isPresentation('?demo'),false);
  assert.equal(isPresentation('?presentation=maintainability'),true);
  assert.equal(isPresentation('?presentation=true'),true);
  for(let i=0;i<10;i++){
    const config=presentationPractice(['Maintainability','Correctness'],false,exercises);
    assert.equal(config.exerciseId,'login-maintainability');
    assert.deepEqual(config.focus,['Correctness','Maintainability']);assert.equal(config.randomFocus,false);
    assert.ok(exercises.find(e=>e.id===config.exerciseId).findings.every(f=>config.focus.includes(f.dimension)));
  }
  assert.throws(()=>presentationPractice(['Correctness','Maintainability'],false,[]),/not approved/);
});

test('presentation does not fix the two-lens task when only one of its lenses is selected',()=>{
  for(const lens of ['Correctness','Maintainability']){
    const config=presentationPractice([lens],false,exercises);
    assert.deepEqual(config.focus,[lens]);
    assert.ok(exercises.find(e=>e.id===config.exerciseId).findings.every(f=>f.dimension===lens));
  }
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
