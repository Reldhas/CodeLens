import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import DifficultySetup, { type Difficulty } from '../../DifficultySetup';
import type { ScreenProps } from '../../features';
import { approvedItems, eligibleItems, label, pickItems, readCourse, topicName } from '../../course.js';
import { createAttempt, getAttempt, lastDifficulty, listAttempts, readTa, updateAttempt } from '../../practice-log.js';
import DemoFill from '../../DemoFill';
import { demoAnswer, questionFeedback, setFeedback } from './feedback.js';
import { questions as library } from './questions.js';
import ConceptResult from './ConceptResult';
import { feedbackForAttempt } from '../../review-comparison.js';
import './concept-match.css';
const levels = { easy: 'Clear story; wrong options are clearly unsuitable.', medium: 'Two plausible options to choose between.', hard: 'Several plausible options that differ in one requirement.' };
const reasonLabel = { good: 'Good reason', partly: 'Could say more', missing: 'No reason given' };
const summaryStep = -1;
const setSize = 5;
export default function ConceptMatchScreen({ params, go }: ScreenProps) {
  const [attemptId, setAttemptId] = useState<string | null>(params.attemptId || null);
  const [again, setAgain] = useState<Difficulty | undefined>();
  const [error, setError] = useState('');
  function start(difficulty: Difficulty) {
    const done = listAttempts('concept-match').flatMap((a: any) => a.exerciseIds);
    const picked = pickItems(eligibleItems(approvedItems('concept-match', library), difficulty, readCourse().publishedTopics), setSize, done);
    if (!picked.length) { setError('Your TA is preparing this: nothing is approved and published at this difficulty yet.'); return; }
    setAttemptId(createAttempt({ function: 'concept-match', title: `Set of ${picked.length} questions`, difficulty, topicId: null, exerciseIds: picked.map((q: any) => q.id), answers: { choices: {}, reasons: {}, checked: [] }, fromSuggestion: !!params.fromSuggestion }).id);
  }
  if (error) return <section className="review-setup difficulty-setup"><h1>Concept Match</h1><p>{error}</p><button className="secondary" onClick={()=>go('home')}>Back to practice</button></section>;
  if (!attemptId) return <DifficultySetup title="Concept Match" what="a set of questions" levels={levels} autoStart={again || (params.fromSuggestion ? lastDifficulty('concept-match') : undefined)} onStart={start} onBack={()=>go('home')}/>;
  if (!getAttempt(attemptId)) return <section className="review-setup"><h1>Practice not found</h1><button className="secondary" onClick={()=>go('home')}>Back to practice</button></section>;
  return <QuestionSet key={attemptId} attemptId={attemptId} onHome={()=>go('home')} onNewSet={()=>{setAgain(getAttempt(attemptId).difficulty);setAttemptId(null);}}/>;
}
function QuestionSet({ attemptId, onHome, onNewSet }: { attemptId: string; onHome: () => void; onNewSet: () => void }) {
  const [attempt, setAttempt] = useState<any>(() => getAttempt(attemptId));
  const questions: any[] = attempt.exerciseIds.map((id: string) => library.find(q => q.id === id)).filter(Boolean);
  const { choices, reasons, checked } = attempt.answers;
  const [current, setCurrent] = useState(() => { const open = questions.findIndex(q => !checked.includes(q.id)); return open === -1 ? summaryStep : open; });
  const saveAnswers = (patch: object) => setAttempt(updateAttempt(attemptId, { answers: { ...attempt.answers, ...patch } }));
  const [live, setLive] = useState(false);
  const [service, setService] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(()=>{let mounted=true;fetch('/api/status').then(r=>r.ok?r.json():null).then(value=>{if(mounted)setService(value);}).catch(()=>{});return()=>{mounted=false;};},[]);
  useEffect(()=>{if(busy||checked.includes(questions[current]?.id)||current===summaryStep)heading.current?.focus();},[busy,current,checked.length]);
  async function check(id: string) {
    if(inFlight.current)return;
    inFlight.current=true;setFailure('');setBusy(true);
    try {
      let evaluation;
      if(live){
        if(!service?.authenticated){
          const response=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(service?.localAutoLogin?{}:{password}),signal:AbortSignal.timeout(10000)});
          const value=await response.json();if(!response.ok)throw new Error(value.error||'Sign in to use live feedback.');
          setService({...service,authenticated:true});setPassword('');
        }
        const response=await fetch('/api/concept-match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:id,choice:choices[id],reason:reasons[id]}),signal:AbortSignal.timeout(50000)});
        const value=await response.json();if(!response.ok){if(response.status===401)setService((s:any)=>({...s,authenticated:false}));throw new Error(value.error||'AI evaluation failed.');}
        evaluation=value.result;
      }
      const evaluations={...attempt.evaluations,...(evaluation?{[id]:evaluation}:{})};

    const answers = { ...attempt.answers, checked: [...checked, id] };
    if (answers.checked.length < questions.length) { setAttempt(updateAttempt(attemptId, { answers, evaluations })); return; }
    const feedback = setFeedback(questions, choices, reasons);
    feedback.questions = feedback.questions.map((item: any) => evaluations[item.questionId] ? { ...item, comment: evaluations[item.questionId].summary, reasonRating: evaluations[item.questionId].reasonScore >= 4 ? 'good' : 'partly' } : item);
    setAttempt(updateAttempt(attemptId, { answers, evaluations, feedback, status: 'submitted', submittedAt: new Date().toISOString(), score: feedback.correctCount / questions.length }));
    }catch(e){setFailure(e instanceof Error?e.message:'Evaluation failed. Your answer is saved.');}
    finally{inFlight.current=false;setBusy(false);}
  }
  function next() {
    const after = questions.findIndex((q, i) => i > current && !checked.includes(q.id));
    const open = questions.findIndex(q => !checked.includes(q.id));
    setCurrent(after !== -1 ? after : open !== -1 ? open : summaryStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const rate = (id: string, rating: any) => setAttempt(updateAttempt(attemptId, { ratings: { ...attempt.ratings, [id]: rating } }));
  const steps = <div className="review-focus-summary set-progress"><span>Criteria</span><strong>Appropriateness</strong>
    <span className="set-dots" aria-label="Questions in this set">{current===summaryStep?'Results':`Question ${current+1} of ${questions.length}`}
      {questions.map((q,i)=>{const done=checked.includes(q.id);const right=done&&choices[q.id]===q.correct;return <button key={q.id} disabled={!done&&i!==current} className={(done?(right?'right':'wrong'):'')+(i===current?' at':'')} aria-label={`Question ${i+1}${done?(right?', correct':', not quite'):''}`} aria-current={i===current?'step':undefined} onClick={()=>setCurrent(i)}/>;})}
      {attempt.status==='submitted'&&current!==summaryStep&&<button className="results-link" onClick={()=>setCurrent(summaryStep)}>Results</button>}
    </span></div>;
  const toolbar = <div className="workspace-toolbar"><div className="exercise-select"><strong>{current===summaryStep?'Your results':topicName(questions[current].topicId)}</strong></div><div className="exercise-meta"><span>Concept Match</span><span className="difficulty-tag">{label(attempt.difficulty)}</span></div></div>;
  if(busy)return <section className="concept-loading" role="status" aria-live="polite" aria-busy="true"><Sparkles className="concept-loading-icon" size={40}/><h1 ref={heading} tabIndex={-1}>Evaluating your answer</h1><p>Connecting your explanation to the story requirements.</p></section>;
  if (current === summaryStep) {
    const ta = feedbackForAttempt(attemptId, readTa().reviews);
    const correct = questions.filter(q => choices[q.id] === q.correct).length;
    const message = correct === questions.length ? 'A perfect set. Try a harder level, or a Lens Review to use these concepts on real code.' : correct / questions.length >= 0.6 ? 'Good work. Open the ones you missed to see why the other option fits better.' : 'Open each question to see why the right concept fits; the explanations are the fastest way to improve.';
    return <div className="concept-results"><header className="concept-results-heading"><div><p className="eyebrow">Concept Match - {label(attempt.difficulty)}</p><h1 ref={heading} tabIndex={-1}>Your set results</h1></div></header>{steps}
      <section className="set-summary"><div className="compact-score"><strong>{correct}</strong><span>/ {questions.length} correct</span></div><p>{message}</p>
        <ol>{questions.map((q,i)=>{const fb=questionFeedback(q,choices[q.id]??null,reasons[q.id]??'');return <li key={q.id}><button onClick={()=>setCurrent(i)}><span className={'result-dot '+(fb.correct?'right':'wrong')}>{fb.correct?<Check size={14}/>:<X size={14}/>}</span><span className="set-summary-text"><span>{q.story}</span><small>{q.concept} · {attempt.evaluations?.[q.id] ? `Live AI: ${attempt.evaluations[q.id].total.toFixed(1)} / 10` : reasonLabel[fb.reasonRating as keyof typeof reasonLabel]}</small></span><ArrowRight size={15}/></button></li>;})}</ol>
      </section>
      {ta.available&&<section className="concept-card"><h2>TA feedback on this set</h2>{ta.adjustedScore!=null&&<p>TA-reviewed score: {ta.adjustedScore} / 10</p>}{ta.editedSummary&&<p>{ta.editedSummary}</p>}{ta.comments.map((comment:string,i:number)=><p key={i}>{comment}</p>)}</section>}
      <div className="submission-bar"><div className="completed-actions"><button className="secondary" onClick={onHome}><ArrowLeft size={16}/>Back to practice</button><button className="primary" onClick={onNewSet}>New set<ArrowRight size={17}/></button></div></div>
    </div>;
  }
  const q = questions[current];
  const locked = checked.includes(q.id);
  const choice = choices[q.id] ?? null;
  const reason = reasons[q.id] ?? '';
  function fill(kind: 'good' | 'wrong') { const answer = demoAnswer(q, kind); saveAnswers({ choices: { ...choices, [q.id]: answer.choice }, reasons: { ...reasons, [q.id]: answer.reason } }); }
  const fb = locked ? questionFeedback(q, choice, reason) : null;
  if(locked)return <ConceptResult question={q} choice={choice} reason={reason} evaluation={attempt.evaluations?.[q.id]} feedback={fb} rating={attempt.ratings[q.id]} onRate={rating=>rate(q.id,rating)} headingRef={heading} onNext={next} onHome={onHome} last={checked.length===questions.length} progress={steps}/>;
  return <>{toolbar}{steps}
    <div className="workspace concept-workspace">
      <section className="editor-panel concept-question" aria-label={`Question ${current+1}`}>
        <p className="concept-story">{q.story}</p>
        <fieldset><legend>Choose one concept</legend>
          {q.options.map((o: any)=><label key={o.id} className={'concept-option '+(!locked?(choice===o.id?'chosen':''):o.id===q.correct?'right':o.id===choice?'wrong':'faded')}>
            <input type="radio" className="sr-only" name={q.id} checked={choice===o.id} disabled={locked} onChange={()=>saveAnswers({choices:{...choices,[q.id]:o.id}})}/>
            <span className="option-id">{locked&&o.id===q.correct?<Check size={14}/>:locked&&o.id===choice?<X size={14}/>:o.id}</span><span>{o.text}</span>
          </label>)}
        </fieldset>
        <label className="concept-reason">Why? <span className="muted">(one line, required)</span><input value={reason} maxLength={200} readOnly={locked} required aria-required="true" placeholder="What in the story makes this concept fit?" onChange={e=>saveAnswers({reasons:{...reasons,[q.id]:e.target.value}})}/></label>
      </section>
      <aside className="review-panel"><div className="brief-content"><h3>How this works</h3><ol className="review-steps"><li>Read the story.</li><li>Pick the concept that fits it best.</li><li>Explain what in the story supports your choice.</li></ol><p className="muted concept-note">Your answer locks after a successful evaluation. Live AI assesses your explanation; demo mode uses keyword rules.</p></div></aside>
    </div>
    {!locked&&<DemoFill onGood={()=>fill('good')} onWrong={()=>fill('wrong')}/>}
    {failure&&<p role="alert" className="concept-error">{failure} Your answer is saved; you can retry.</p>}
    <div className="submission-bar"><button className="secondary" onClick={onHome}><ArrowLeft size={16}/>Save and leave</button><div className="concept-submit"><label><input type="checkbox" checked={live} onChange={e=>{setLive(e.target.checked);setFailure('');}}/>Use live AI feedback</label>{live&&<small>{service?.configured?`Sends your answer to ${service.provider}.`:'Live feedback is not configured on this server.'}</small>}{live&&service?.configured&&!service.authenticated&&!service.localAutoLogin&&<input type="password" aria-label="Review access password" autoComplete="current-password" placeholder="Review access password" value={password} onChange={e=>setPassword(e.target.value)}/>}<button className="primary" disabled={!choice||!reason.trim()||(live&&(!service?.configured||(!service.authenticated&&!service.localAutoLogin&&!password)))} onClick={()=>check(q.id)}>Submit answer<ArrowRight size={17}/></button></div></div>
  </>;
}
