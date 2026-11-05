import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCourse, eligibleItems, isUnlocked, pickItems } from '../app/bundles/course/codelens/course.js';
const items = [{id:'a',difficulty:'easy',topicId:'loops'},{id:'b',difficulty:'easy',topicId:'lists-strings'},{id:'c',difficulty:'hard',topicId:'loops'}];
test('only published topics at this difficulty are eligible',()=>assert.deepEqual(eligibleItems(items,'easy',['loops']).map(i=>i.id),['a']));
test('exercises not done yet come first',()=>assert.equal(pickItems(items.slice(0,2),1,['a'])[0].id,'b'));
test('repeats are allowed once everything is done',()=>assert.equal(pickItems(items.slice(0,2),2,['a','b']).length,2));
test('nothing is gated before a TA uses Content Studio',()=>assert.ok(isUnlocked('dry-run',defaultCourse())));
test('a function needs the required number of approved examples',()=>{
  assert.equal(isUnlocked('dry-run',{...defaultCourse(),approved:{'dry-run':2}}),false);
  assert.ok(isUnlocked('dry-run',{...defaultCourse(),examplesRequired:2,approved:{'dry-run':2}}));
});
