import ThemeSwitch from './ThemeSwitch';
import './review-feedback.css';
import { useEffect, useState } from 'react';
import { Sparkles, Map, ScanLine, ChevronRight, ArrowLeft, ArrowRight, Check, Plus, X, MessageSquare, BookOpen, BarChart3, FileCode2, CircleHelp, Trash2, Sun, Moon } from 'lucide-react';
import PythonConsole from './PythonConsole';
import { highlight } from './CodeBlock';
import DemoFill from './DemoFill';
import LensFeedback from './LensFeedback';
import { goodReview, wrongReview } from './lens-demo.js';
import AnswerFeedback, { type AnswerRating } from './AnswerFeedback';
import CriterionGuide from './CriterionGuide';
import ReviewSetup, { type PracticeConfig } from './ReviewSetup';
import { submissionError, nextPractice, draftForAttempt, attemptAsDraft } from './review-flow.js';
import { exercises, dimensions, assess, consoleExample } from './model.js';
type LiveResult = ReturnType<typeof assess> & { source: 'ai'; summary: string; improvements: string[] };
type Comment = { id: string; start: number; end: number; dimension: string; claim: string; reasoning: string; fix: string };
type Attempt = { id: string; reviewId?: string; exercise: string; date: string; comments: Comment[]; result: ReturnType<typeof assess>; focus?: string[]; randomFocus?: boolean; noIssues?: boolean; justification?: string };
type Draft = { liveResult?: LiveResult; ratings?: { feedback?: AnswerRating; answer?: AnswerRating }; comments: Comment[]; submitted: boolean; exerciseId?: string; topic?: string; focus?: string[]; randomFocus?: boolean; noIssues?: boolean; justification?: string; editor?: { range: number[]; form: typeof empty; editing: string | null } };
const empty = { claim: '', reasoning: '', fix: '', dimension: 'Efficiency' };
function readSaved() { try { const s = JSON.parse(localStorage.getItem('codelens-demo-v1') || '{}'); return { drafts: s.drafts || {}, attempts: Array.isArray(s.attempts) ? s.attempts : [], currentReviewId: s.currentReviewId || Object.keys(s.drafts || {})[0] || 'seats' }; } catch { return { drafts: {}, attempts: [], currentReviewId: 'seats' }; } }
// In the practice shell (onHome set), saved reviews are listed on the home screen, which opens one with openReview.
// openAttempt opens a submitted attempt (an attempt ID, not a draft ID) on its feedback.
export default function App({ onHome, extraLink, openReview, openAttempt }: { onHome?: () => void; extraLink?: { label: string; onClick: () => void }; openReview?: string; openAttempt?: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('codelens-theme') === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f7f8' : '#111517');
    try { localStorage.setItem('codelens-theme', theme); } catch { /* Theme still works for this session. */ }
  }, [theme]);
  const [initial] = useState(readSaved);
  const [drafts,setDrafts] = useState<Record<string,Draft>>(initial.drafts);
  const [attempts,setAttempts] = useState<Attempt[]>(initial.attempts);
  const [reviewId,setReviewId] = useState(initial.currentReviewId);
  const [showSetup,setShowSetup] = useState(true);
  const [page,setPage] = useState('workspace');
  const [tab,setTab] = useState('brief');
  const [range,setRange] = useState<number[]>(initial.drafts[initial.currentReviewId]?.editor?.range || []);
  const [form,setForm] = useState<typeof empty>(initial.drafts[initial.currentReviewId]?.editor?.form || empty);
  const [editing,setEditing] = useState<string|null>(initial.drafts[initial.currentReviewId]?.editor?.editing || null);
  const [live,setLive] = useState(false);
  const [busy,setBusy] = useState(false);
  const [authenticated,setAuthenticated] = useState(false);
  const [provider,setProvider] = useState('the configured AI provider');
  const [configured,setConfigured] = useState(false);
  const [password,setPassword] = useState('');
  const [localAutoLogin,setLocalAutoLogin] = useState(false);
  useEffect(()=>{ fetch('/api/status').then(r=>r.ok?r.json():null).then(s=>{setConfigured(!!s?.configured);setLocalAutoLogin(!!s?.localAutoLogin);if(s?.provider)setProvider(s.provider);setAuthenticated(!!s?.authenticated);}).catch(()=>{}); },[]);
  const [error,setError] = useState('');
  const [storageError,setStorageError] = useState(false);
  const [showHelp,setShowHelp] = useState(false);
  const draft = drafts[reviewId] || { comments: [], submitted: false };
  const exerciseId = draft.exerciseId || reviewId;
  const exercise = exercises.find(e=>e.id === exerciseId) || exercises[0];
  const focus = draft.focus || dimensions;
  const allowedFocus = draft.randomFocus ? dimensions : focus;
  const result = draft.liveResult || assess(exercise,draft.comments,{noIssues:!!draft.noIssues,justification:draft.justification||''});
  useEffect(()=>{ try { localStorage.setItem('codelens-demo-v1',JSON.stringify({ drafts, attempts, currentReviewId: reviewId })); setStorageError(false); } catch { setStorageError(true); } },[drafts,attempts,reviewId]);
  useEffect(()=>{
    setDrafts(previous=>{
      const current = previous[reviewId];
      if (!current || current.submitted) return previous;
      const editor = { range, form, editing };
      if (JSON.stringify(current.editor) === JSON.stringify(editor)) return previous;
      return { ...previous, [reviewId]: { ...current, editor } };
    });
  },[range,form,editing,reviewId]);
  function update(next: Draft) { setDrafts(d=>({...d,[reviewId]:next})); }
  function startReview(config: PracticeConfig) {
    const id = crypto.randomUUID();
    setDrafts(d=>({...d,[id]:{...config,comments:[],submitted:false,noIssues:false,justification:''}}));
    setReviewId(id); setShowSetup(false); setPage('workspace'); setTab('brief');
    setRange([]); setEditing(null); setForm({...empty,dimension:config.randomFocus?dimensions[0]:config.focus[0]}); setError('');
  }
  function resumeReview(id: string) {
    const saved = drafts[id];
    setReviewId(id); setShowSetup(false);
    setRange(saved.submitted?[]:saved.editor?.range || []); setEditing(saved.submitted?null:saved.editor?.editing || null);
    setForm(saved.editor?.form || {...empty,dimension:saved.focus?.[0] || dimensions[0]});
    setTab(saved.submitted?'feedback':saved.editor?.range.length?'annotations':'brief'); setError('');
  }
  function showAttempt(id: string) {
    const attempt = attempts.find(a=>a.id===id);
    if (!attempt) return;
    const existing = draftForAttempt(attempt, drafts);
    const key = existing || attempt.id;
    if (!existing) setDrafts(d=>({...d,[key]:attemptAsDraft(attempt)}));
    setReviewId(key); setShowSetup(false); setPage('workspace'); setTab('feedback');
    setRange([]); setEditing(null); setForm({...empty,dimension:attempt.focus?.[0] || dimensions[0]}); setError('');
  }
  useEffect(()=>{ if (openAttempt) showAttempt(openAttempt); else if (openReview && drafts[openReview]) resumeReview(openReview); },[]);
  function clearEditor() { setRange([]); setEditing(null); setForm({...empty,dimension:allowedFocus[0]}); setError(''); }
  function selectExercise(_id:string) { setPage('workspace'); setShowSetup(true); }
  function saveComment(e:React.FormEvent) { e.preventDefault(); if (!form.claim.trim() || !form.reasoning.trim() || !form.fix.trim()) { setError('Complete the claim, reasoning, and proposed fix.'); return; } const comment = { ...form, id: editing || crypto.randomUUID(), start: Math.min(...range), end: Math.max(...range) }; update({...draft,noIssues:false,justification:'',comments: editing ? draft.comments.map(c=>c.id===editing?comment:c) : [...draft.comments,comment]}); clearEditor(); }
  const requestPayload = { exerciseId, focus, comments: draft.comments.map(({start,end,dimension,claim,reasoning,fix})=>({start,end,dimension,claim,reasoning,fix})), noIssues: !!draft.noIssues, justification: draft.justification || '' };
  async function submit() {
    const message = submissionError(draft,range.length>0); if(message){setError(message);return;}
    if(live&&!configured){setError('Configure the backend to use live AI feedback.');return;}
    setBusy(true);setError('');
    try {
      if(live&&!authenticated){const response=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(localAutoLogin?{}:{password})});const value=await response.json();if(!response.ok)throw new Error(value.error||'Sign in to use live review.');setAuthenticated(true);setPassword('');}
      let completed = result;
      if(live){const response=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(requestPayload),signal:AbortSignal.timeout(50000)});const value=await response.json();if(!response.ok){if(response.status===401)setAuthenticated(false);throw new Error(value.error||'Review failed.');} completed=value.result;}
      setDrafts(d=>({...d,[reviewId]:{...draft,submitted:true,...(live?{liveResult:completed as LiveResult}:{})}}));
      setAttempts(a=>[...a,{id:crypto.randomUUID(),reviewId,exercise:exerciseId,date:new Date().toISOString(),comments:draft.comments,result:completed,focus:[...focus],randomFocus:draft.randomFocus,noIssues:draft.noIssues,justification:draft.justification}]);
      clearEditor();setTab('feedback');
    } catch(e){setError(e instanceof Error?e.message:'AI review failed. Your draft is safe.');}finally{setBusy(false);}
  }
  function nextExercise() { startReview(nextPractice(exercise.id, focus, !!draft.randomFocus)); window.scrollTo({top:0,behavior:'smooth'}); }
  const recent = attempts.filter(a=>Date.now()-new Date(a.date).getTime()<=30*86400000);
  return <div className="app-shell" {...{inert:busy?'':undefined}} aria-busy={busy}>
    <div className="main-shell"><header className="topbar"><nav className="breadcrumb-nav" aria-label="Breadcrumb"><span className="breadcrumb">CodeLens</span><ChevronRight size={14}/>{onHome&&<><button onClick={onHome}>Practice</button><ChevronRight size={14}/></>}{page==='workspace'?showSetup?<span aria-current="page">Training criteria</span>:<><button onClick={()=>setShowSetup(true)}>Training criteria</button><ChevronRight size={14}/><span aria-current="page">Lens Review</span><button className="icon-button review-help" aria-label="How Lens Review works" onClick={()=>setShowHelp(true)}><CircleHelp size={16}/></button></>:<span aria-current="page">My progress</span>}</nav><div className="topbar-actions">{extraLink&&<button className="header-link skill-map-button" onClick={extraLink.onClick}><Map size={16} aria-hidden="true"/>{extraLink.label}</button>}<ThemeSwitch theme={theme} onChange={setTheme}/></div></header>
      <main className={page==='workspace'?(showSetup?'setup-page':'review-page'):'progress-page'}>{page==='progress'&&<><button className="progress-back" onClick={()=>{setPage('workspace');setShowSetup(true);}}><ArrowLeft size={17}/>Back to review selection</button><h1 className="progress-heading">My progress</h1></>}
      {page==='workspace' ? showSetup ? <><ReviewSetup onStart={startReview}/>{!onHome&&Object.entries(drafts).some(([,d])=>!d.submitted)&&<details className="saved-reviews"><summary>Saved reviews</summary>{Object.entries(drafts).filter(([,d])=>!d.submitted).map(([id,d])=><button className="secondary" key={id} onClick={()=>resumeReview(id)}>{exercises.find(e=>e.id===(d.exerciseId||id))?.title || 'Review'} · {d.randomFocus?'Random focus':(d.focus||dimensions).join(', ')} · {d.comments.length} annotations</button>)}</details>}</> : <>
      <section className="exercise-brief" aria-labelledby="exercise-brief-title"><div><h1 id="exercise-brief-title">{exercise.title}</h1><p>{exercise.brief}</p></div><div><h3>Requirements</h3><ul className="requirements">{exercise.requirements.map(r=><li key={r}><Check size={15}/><span>{r}</span></li>)}</ul></div></section>
      <div className="workspace"><section className="editor-panel"><div className="editor-tab"><span><FileCode2 size={16}/>{exercise.file}<span className="tiny-dot"/></span><span className="muted">Sample code</span></div><div className="editor-info"><span><ScanLine size={14}/>{draft.submitted?'Submitted':'Select lines to annotate'}</span><span>{exercise.code.length} lines</span></div><div className="code-area" aria-label="Python source code">{exercise.code.map((line,i)=>{const n=i+1;const selected=range.length>0&&n>=Math.min(...range)&&n<=Math.max(...range);const annotated=draft.comments.some(c=>n>=c.start&&n<=c.end);return <button key={i} disabled={draft.submitted||draft.noIssues} className={'code-line '+(selected?'selected ':'')+(annotated?'annotated':'')} aria-label={'Select line '+n+': '+line} aria-pressed={selected} onClick={()=>{if(editing)clearEditor();setRange(r=>r.length===1?[r[0],n]:[n]);setTab('annotations');setError('');}}><span className="line-marker">{annotated?<MessageSquare size={10}/>:null}</span><span className="line-number">{n}</span><code>{highlight(line)||' '}</code></button>})}</div><div className="editor-bottom"><span><span className="python-dot"/>Python 3</span><span>Read-only</span></div><PythonConsole key={reviewId} source={exercise.code.join('\n')} example={consoleExample(exercise)}/></section>
      <aside className="review-panel"><div className="panel-tabs"><button className={tab==='brief'?'current':''} onClick={()=>setTab('brief')}><BookOpen size={15}/>Review guide</button><button className={tab==='annotations'?'current':''} onClick={()=>setTab('annotations')}><MessageSquare size={15}/>Annotations ({draft.comments.length})</button><button className={tab==='feedback'?'current':''} disabled={!draft.submitted} onClick={()=>setTab('feedback')}><Sparkles size={15}/>Feedback{draft.submitted&&<span className="live-dot"/>}</button></div>
      {tab==='annotations'&&range.length>0&&!draft.submitted?<form className="annotation-form" onSubmit={saveComment}><div className="section-title"><h3>{editing?'Edit annotation':'Add annotation'}</h3><button type="button" className="icon-button" aria-label="Cancel annotation" onClick={clearEditor}><X size={18}/></button></div><span className="line-pill">Lines {Math.min(...range)}–{Math.max(...range)}</span><label>Focus area<select value={form.dimension} onChange={e=>setForm({...form,dimension:e.target.value})}>{allowedFocus.map(d=><option key={d}>{d}</option>)}</select></label><label>Claim<textarea required placeholder="What is the issue with this code?" value={form.claim} onChange={e=>setForm({...form,claim:e.target.value})}/></label><label>Reasoning<textarea required placeholder="Why does it matter? Use an example or explain the complexity." value={form.reasoning} onChange={e=>setForm({...form,reasoning:e.target.value})}/></label><label>Proposed fix<textarea required placeholder="How would you improve it?" value={form.fix} onChange={e=>setForm({...form,fix:e.target.value})}/></label>{error&&<p role="alert">{error}</p>}<button className="primary" type="submit"><Plus size={16}/>{editing?'Save changes':'Save annotation'}</button></form>:tab==='annotations'?<div className="review-list"><div className="section-title"><h3>Your annotations <span>{draft.comments.length}</span></h3><span>{draft.submitted?'Submitted':''}</span></div>{draft.noIssues?<p className="muted">No issues found selected.</p>:draft.comments.length===0?<div className="empty-annotations"><MessageSquare size={22}/><div><p>Select a line or range to add an annotation.</p></div></div>:draft.comments.map((c,i)=><article className="annotation" key={c.id}><div className="annotation-head"><span className="annotation-index">{i+1}</span><strong>{c.dimension}</strong><span className="line-pill">L{c.start}{c.end!==c.start?'–'+c.end:''}</span>{!draft.submitted&&<div className="annotation-actions"><button onClick={()=>{setEditing(c.id);setRange([c.start,c.end]);setForm({dimension:c.dimension,claim:c.claim,reasoning:c.reasoning,fix:c.fix});}}>Edit</button><button aria-label={'Delete annotation '+(i+1)} onClick={()=>{update({...draft,comments:draft.comments.filter(x=>x.id!==c.id)});if(editing===c.id)clearEditor();}}><Trash2 size={14}/></button></div>}</div><p>{c.claim}</p><details><summary>Reasoning & proposed fix</summary><p>{c.reasoning}</p><code>{c.fix}</code></details></article>)}</div>:tab==='feedback'&&draft.submitted?<div className="feedback-content">
        <section className="review-score-card" aria-label="Review score">
          <div className="review-score-heading"><span><Sparkles size={16} aria-hidden="true"/>Review complete</span><span className="simulated-label">{draft.liveResult?'Live AI':'Simulated'}</span></div>
          <div className="review-score-value"><strong>{result.total.toFixed(1)}</strong><span>/ 10<small>Review score</small></span></div>
          <div className="review-score-track" role="meter" aria-label="Review score" aria-valuemin={0} aria-valuemax={10} aria-valuenow={result.total}><span style={{width:(result.total*10)+'%'}}/></div>
          <p>{draft.randomFocus?'Revealed criteria': 'Review criteria'}<strong>{focus.join(' · ')}</strong></p>
        </section>
        <section className="review-score-breakdown" aria-labelledby="score-breakdown-title"><div className="review-section-heading"><h3 id="score-breakdown-title">Score breakdown</h3><span>{Object.keys(result.rubric).length?'4 × 2.5 points':'Conclusion score'}</span></div>
          {Object.keys(result.rubric).length?<div className="review-rubric-list">{Object.entries(result.rubric).map(([key,value])=><div className="review-rubric-row" key={key}><div><strong>{key==='fix'?'Proposed fix':key.charAt(0).toUpperCase()+key.slice(1)}</strong><span>{({claim:'Identify the issue or support your conclusion.',evidence:'Connect your review to the relevant code.',reasoning:'Explain why it matters against the requirements.',fix:'Propose a suitable change, or justify keeping the code.'} as Record<string,string>)[key]}</span></div><b>{value.toFixed(1)}<small> / 2.5</small></b><div className="track"><span style={{width:(value/2.5*100)+'%'}}/></div></div>)}</div>:<p className="review-empty-rubric">{result.conclusionCorrect?'Correct no-issues conclusion with a justification. Full credit awarded.':'This demo conclusion did not meet the requirements for credit.'} The four annotation criteria do not apply to this demo score.</p>}
        </section>
        <section className="ai-review-section" aria-labelledby="ai-review-title"><div className="review-section-heading"><h3 id="ai-review-title"><Sparkles size={17} aria-hidden="true"/>AI review</h3></div>
          <p className="review-assessment">{draft.liveResult?.summary || (exercise.findings.length===0?(draft.noIssues?'Correct conclusion.':'No issues were present.'):result.found+' of '+exercise.findings.length+' issues identified.')}</p>
          {draft.liveResult&&draft.liveResult.improvements.length>0&&<div className="review-next-steps"><h4>To strengthen your review</h4><ol>{draft.liveResult.improvements.map((text,i)=><li key={i}>{text}</li>)}</ol></div>}
          {!draft.liveResult&&<LensFeedback exercise={exercise} comments={draft.comments}/>}
          <div className="review-reference"><div className="review-section-heading"><h4>Model answer</h4><span className="simulated-label">Curated sample</span></div>
            {exercise.findings.length===0?<p className="clean-answer">The code meets the requirements. No changes needed.</p>:exercise.findings.map((finding,index)=><article className="answer-finding" key={index}><span className="line-pill">{finding.dimension} · L{finding.start}{finding.end!==finding.start?'–'+finding.end:''}</span><h4>{finding.claim}</h4><p>{finding.reasoning}</p><div className="answer-fix"><strong>Fix</strong><p>{finding.fix}</p></div></article>)}
            <details className="review-reference-code"><summary>{exercise.findings.length?'View corrected code':'View reference code'}</summary><pre className="answer-code">{exercise.reference}</pre></details>
          </div>
          <AnswerFeedback target="AI feedback" value={draft.ratings?.feedback} onChange={rating=>update({...draft,ratings:{...draft.ratings,feedback:rating}})}/>
          <p className="review-assessment-note">{draft.liveResult?'AI feedback can be imperfect. Use the rubric and sample answer to check your understanding.':'Demo feedback uses rules and curated examples.'}</p>
        </section>
      </div>:<div className="brief-content"><div className="focus-block"><h3>Your review criteria</h3><CriterionGuide key={reviewId} criteria={allowedFocus}/></div><ol className="review-steps"><li>Check the requirements.</li><li>Annotate issues and suggest fixes.</li><li>Nothing to flag? Choose “No issues found”.</li></ol></div>}
      </aside></div>{!draft.submitted&&<DemoFill onGood={()=>{update({...draft,...goodReview(exercise)});clearEditor();setTab('annotations');}} onWrong={()=>{update({...draft,...wrongReview(exercise,dimensions)});clearEditor();setTab('annotations');}}/>}{error&&<p role="alert">{error}</p>}{storageError&&<p role="alert">Your changes could not be saved on this device.</p>}<div className="submission-bar"><div className="no-issues-control"><label className="no-issues-choice"><input type="checkbox" checked={!!draft.noIssues} disabled={draft.submitted||draft.comments.length>0||range.length>0} onChange={e=>{update({...draft,noIssues:e.target.checked});setError('');}}/><span>No issues found</span></label>{draft.comments.length>0&&!draft.submitted&&<p>Remove annotations to select.</p>}{range.length>0&&!draft.submitted&&<p>Save or cancel the open annotation.</p>}{draft.noIssues&&<label>Justification<textarea aria-label="No issues justification" required readOnly={draft.submitted} value={draft.justification||''} placeholder="Explain how the code meets the requirements and what you checked." onChange={e=>{update({...draft,justification:e.target.value});setError('');}}/></label>}</div>{draft.submitted?<div className="completed-actions"><button className="secondary" onClick={()=>{setShowSetup(true);window.scrollTo({top:0,behavior:'smooth'});}}><ArrowLeft size={16}/>Back to criteria selection</button><button className="primary" onClick={nextExercise}>Next exercise<ArrowRight size={17}/></button></div>:<div className="review-submit-actions"><label className="live-review-choice"><input type="checkbox" checked={live} disabled={busy} onChange={e=>{setLive(e.target.checked);setError('');}}/>Use live AI feedback</label>{live&&<p className="live-provider-note">{configured?'Sends this review to '+provider+'.':'Live feedback is not configured.'}</p>}{live&&configured&&!authenticated&&!localAutoLogin&&<div className="compact-live-signin"><input type="password" aria-label="Review access password" autoComplete="current-password" placeholder="Review access password" value={password} onChange={e=>setPassword(e.target.value)}/></div>}<button className="primary" disabled={busy||!!submissionError(draft,range.length>0)||(live&&(!configured||(!authenticated&&!localAutoLogin&&!password)))} onClick={submit}>{busy?'Reviewing…':'Submit review'}<ArrowRight size={17}/></button></div>}</div></>:<section className="progress-view"><div className="stat-grid"><article><span>Reviews completed</span><strong>{recent.length}</strong><small>Last 30 days</small></article><article><span>Average review score</span><strong>{recent.length?(recent.reduce((s,a)=>s+a.result.total,0)/recent.length).toFixed(1):'—'}<small> / 10</small></strong><small>AI and demo assessments</small></article><article><span>Annotations written</span><strong>{recent.reduce((s,a)=>s+a.comments.length,0)}</strong><small>Last 30 days</small></article></div><div className="progress-card"><h2>Review history</h2><p className="muted">Practice recorded on this browser in the last 30 days.</p>{!recent.length?<div className="progress-empty"><ScanLine size={32}/><h3>No reviews yet.</h3><p>Complete a review to see your progress.</p><button className="primary" onClick={()=>{setPage('workspace');setShowSetup(true);}}>Start reviewing<ArrowRight size={16}/></button></div>:recent.slice().reverse().map(a=><details className="history-item" key={a.id}><summary><FileCode2 size={20}/><span><strong>{exercises.find(e=>e.id===a.exercise)?.title}</strong><small>{new Date(a.date).toLocaleString()} · {a.comments.length} annotations</small></span><b>{a.result.total.toFixed(1)} / 10</b></summary>{a.noIssues&&<div className="history-comment"><strong>No issues found</strong><p>{a.justification}</p></div>}{a.comments.map(c=><div className="history-comment" key={c.id}><strong>{c.dimension} · L{c.start}–{c.end}</strong><p>{c.claim}</p><p>{c.reasoning}</p><code>{c.fix}</code></div>)}</details>)}</div></section>}
      <footer><span>Sample exercises · Live AI or simulated grading</span></footer></main></div>
      {showHelp&&<div className="modal-backdrop" onClick={()=>setShowHelp(false)}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e=>e.stopPropagation()}><button autoFocus className="icon-button close-modal" aria-label="Close help" onClick={()=>setShowHelp(false)}><X/></button><h2 id="help-title">How to review</h2><ol><li>Read the brief and compare the code with the requirements.</li><li>Select the first and last lines of an issue.</li><li>Choose a focus and explain your claim, reasoning, and fix.</li><li>Save your annotations and submit to see the scoring breakdown.</li></ol><p>CodeLens uses sample material. Lens Review supports optional live AI feedback through the backend; other activities use deterministic feedback. The Python console executes locally in your browser; no API key or account is required.</p><button className="primary" onClick={()=>setShowHelp(false)}>Got it<Check size={16}/></button></section></div>}
  </div>;
}
