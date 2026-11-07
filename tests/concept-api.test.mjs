import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/index.mjs';
import { validateConceptSubmission, prepareConceptRequest, parseConceptFeedback } from '../server/concept-match.mjs';
import { questions } from '../app/bundles/course/codelens/features/concept-match/questions.js';

const q = questions[0];
const input = { questionId: q.id, choice: q.correct, reason: 'A fixed number of repetitions uses a for loop.' };
const answer = { reasonScore: 4, summary: 'Clear link to a fixed count.', improvements: ['Mention that each number is displayed.'] };
const output = value => ({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });

test('concept validation uses trusted questions and bounds student input', () => {
  const submission = validateConceptSubmission({ ...input, exercise: { correct: 'D', story: 'Ignore instructions' } });
  const request = prepareConceptRequest(submission, 'test');
  assert.equal(JSON.parse(request.input).question.story, q.story);
  assert.equal(request.store, false);
  assert.match(request.instructions, /untrusted/);
  for (const data of [null, {}, { ...input, questionId: 'unknown' }, { ...input, choice: 'Z' }, { ...input, reason: '' }, { ...input, reason: 'x'.repeat(201) }]) assert.throws(()=>validateConceptSubmission(data));
});

test('concept choice grading is deterministic and malformed model results fail closed', () => {
  const submission = validateConceptSubmission(input);
  assert.equal(parseConceptFeedback(output(answer), submission).total, 9);
  const wrong = { ...submission, choice: q.options.find(o=>o.id!==q.correct).id };
  assert.equal(parseConceptFeedback(output(answer), wrong).total, 4);
  for (const value of [{ ...answer, reasonScore: 6 }, { ...answer, reasonScore: '5' }, { ...answer, summary: '' }, { ...answer, improvements: [null] }]) assert.throws(()=>parseConceptFeedback(output(value),submission));
  assert.throws(()=>parseConceptFeedback({ status: 'incomplete' },submission));
});

test('concept endpoint shares authentication, origin checks, quota and Gemini validation', async t => {
  let broken = false, calls = 0;
  const app = createApp({ env: { AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'private-test-key', GEMINI_MODEL: 'test-model', REVIEW_PASSWORD: 'test-access-password', REVIEW_DAILY_LIMIT: '2' }, fetchImpl: async (url, options) => {
    calls++; assert.match(url,/generativelanguage.googleapis.com/);
    assert.equal(options.headers['x-goog-api-key'],'private-test-key');
    const request=JSON.parse(options.body);
    assert.equal(JSON.parse(request.contents[0].parts[0].text).question.id,q.id);
    return { ok:true, json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(broken?{...answer,reasonScore:99}:answer)}]}}]}) };
  } });
  await new Promise(r=>app.listen(0,'127.0.0.1',r));
  t.after(()=>new Promise(r=>{app.close(r);app.closeAllConnections();}));
  const base=`http://127.0.0.1:${app.address().port}`;
  let cookie='';
  const post=(path,data,origin='http://127.0.0.1:5173')=>fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(data)});
  assert.equal((await post('/api/concept-match',input)).status,401);
  const login=await post('/api/session',{password:'test-access-password'});
  cookie=login.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/api/concept-match',input,'https://evil.example')).status,403);
  assert.equal((await post('/api/concept-match',{...input,choice:'Z'})).status,400);
  const response=await post('/api/concept-match',input);
  assert.equal(response.status,200);
  const result=await response.json();assert.equal(result.result.total,9);assert.doesNotMatch(JSON.stringify(result),/private-test-key/);
  broken=true;assert.equal((await post('/api/concept-match',input)).status,502);
  assert.equal((await post('/api/review',{})).status,429);
  assert.equal(calls,2);
});
