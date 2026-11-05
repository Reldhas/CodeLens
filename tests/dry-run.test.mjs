import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTrace, displayOutput, dryRunFeedback, dryRunScore, normalizeOutput } from '../app/bundles/course/codelens/features/dry-run/feedback.js';
import { questions } from '../app/bundles/course/codelens/features/dry-run/questions.js';
const question = questions[0];
test('library has 2 questions per topic per difficulty',()=>{
  assert.equal(questions.length,18);
  const cells={};for(const q of questions)cells[q.topicId+q.difficulty]=(cells[q.topicId+q.difficulty]||0)+1;
  assert.ok(Object.values(cells).every(count=>count===2));
});
test('spaces around lines and blank ends do not count',()=>assert.equal(normalizeOutput('\n 1 \r\n2\n\n'),'1\n2'));
test('a crash is part of the output',()=>assert.equal(displayOutput('1\n','IndexError'),'1\nError: IndexError'));
test('exact match is correct',()=>{const f=dryRunFeedback(question,' 12\n','12');assert.ok(f.correct);assert.equal(dryRunScore(f),1);});
test('a common mistake is explained',()=>{const f=dryRunFeedback(question,'5','12');assert.equal(f.correct,false);assert.equal(f.mistake,question.commonMistakes[0].explanation);assert.equal(dryRunScore(f),0);});
const real=[['1','0'],['2','1'],['3','3'],['4','6']];
test('rows may skip states and blanks match anything',()=>assert.equal(compareTrace(['i','t'],[['1','0'],['3',''],['4','6']],real).firstWrongRow,null));
test('first wrong row is found',()=>assert.equal(compareTrace(['i','t'],[['1','0'],['2','9']],real).firstWrongRow,1));
test('mostly right trace with a wrong output earns half',()=>{
  const trace=[['1','0'],['2','1'],['3','3'],['4','9']];
  const f=dryRunFeedback({...question,traceColumns:['i','t']},'wrong','12',{student:trace,expected:real});
  assert.equal(dryRunScore(f),0.5);
});
test('a single trace row is never mostly right',()=>assert.equal(compareTrace(['i','t'],[['1','0']],real).mostlyRight,false));
