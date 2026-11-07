import { useState } from 'react';
import { ArrowRight, ChevronDown, ScanLine, Trash2 } from 'lucide-react';
import { features, type Feature, type Go, type ScreenProps } from './features';
import { functionNames, isUnlocked, label, readCourse, topicName } from './course.js';
import { exercises } from './model.js';
import { lensReviewData, listAttempts, percent, setDraftArchived } from './practice-log.js';
const lensReviewCard = { icon: ScanLine, lens: 'Evaluation', skill: 'Judge AI-generated code without being told what to look for.',
  score: () => { const { attempts } = lensReviewData(); return percent(attempts.map((a: any) => a.result.total / 10)); } };
function Card({ id, name, card, go }: { id: string; name: string; card: NonNullable<Feature['card']>; go: Go }) {
  const open = isUnlocked(id, readCourse());
  const score = features.find(f => f.scoreFor)?.scoreFor?.(id) ?? card.score();
  return <article className="practice-card">
    <div className="practice-card-head"><card.icon size={20}/><span className="line-pill">{card.lens}</span></div>
    <h2>{name}</h2><p>{card.skill}</p>
    <dl><div><dt>Your score</dt><dd>{score || '—'}</dd></div></dl>
    {open?<button className="primary" onClick={()=>go(id)}>Start<ArrowRight size={16}/></button>:<p className="preparing">Your TA is preparing this</p>}
  </article>;
}
export default function StudentHome(props: ScreenProps) {
  const [, refresh] = useState(0);
  const [deleted, setDeleted] = useState<{kind: string; id: string} | null>(null);
  const [error, setError] = useState('');
  function remove(kind: string, id: string) {
    if (!setDraftArchived(kind, id, true)) { setError('This draft could not be deleted. Please try again.'); return; }
    setDeleted({kind,id});setError('');refresh(n=>n+1);
  }
  const practice = features.filter(f => f.kind === 'practice');
  const unfinished = [
    ...listAttempts().filter((a: any) => a.status === 'in_progress').map((a: any) => ({ id: a.id, kind: 'practice', text: `${(functionNames as Record<string,string>)[a.function]} · ${label(a.difficulty)} · ${topicName(a.topicId)}`, detail: a.title || 'Practice in progress', criteria: `${a.exerciseIds?.length || 1} exercise(s) · Started ${new Date(a.createdAt).toLocaleDateString()}`, notes: [] as string[], open: () => props.go(a.function, { attemptId: a.id }) })),
    ...Object.entries(lensReviewData().drafts as Record<string, any>).filter(([, d]) => !d.submitted && !d.archived).map(([id, d]) => { const exercise = exercises.find(e => e.id === (d.exerciseId || id)); return { id, kind: 'lens', text: `Lens Review · ${exercise?.title || 'Review'} · ${d.comments.length} ${d.comments.length === 1 ? 'annotation' : 'annotations'}`, detail: exercise?.brief || 'Review in progress', criteria: d.randomFocus ? 'Random criteria · revealed after submission' : (d.focus || ['Correctness','Appropriateness','Efficiency','Maintainability']).join(' · '), notes: d.noIssues ? ['No issues found', d.justification || 'Justification not written yet.'] : d.comments.map((c: any) => `L${c.start}–${c.end}: ${c.claim}`), open: () => props.go('lens-review', { reviewId: id }) }; }),
  ];
  return <div className="student-home">
    <div className="home-heading"><h1>What do you want to practise today?</h1></div>
    <div className="practice-cards">
      {practice.map(f => <Card key={f.id} id={f.id} name={f.label} card={f.card!} go={props.go}/>)}
      <Card id="lens-review" name="Lens Review" card={lensReviewCard} go={props.go}/>
    </div>
    <div className="home-panels">{features.filter(f => f.role === 'student' && f.HomePanel).map(f => { const Panel = f.HomePanel!; return <Panel key={f.id} {...props}/>; })}</div>
    {(unfinished.length>0||deleted)&&<section className="continue-list"><h2>Continue where you left off</h2>{deleted&&<div className="draft-deleted" role="status">Draft deleted.<button onClick={()=>{if(setDraftArchived(deleted.kind,deleted.id,false)){setDeleted(null);refresh(n=>n+1);}else setError('Could not restore the draft.');}}>Undo</button></div>}{error&&<p role="alert">{error}</p>}{unfinished.map(u=><article className="saved-draft" key={u.kind+u.id}><details><summary><ChevronDown size={16} aria-hidden="true"/><span>{u.text}</span></summary><div className="saved-draft-details"><p>{u.detail}</p><p className="draft-criteria">{u.criteria}</p>{u.notes.length>0?<ul>{u.notes.map((note: string,i: number)=><li key={i}>{note}</li>)}</ul>:<p className="muted">No saved answers yet.</p>}<button className="primary draft-continue" onClick={u.open}>Continue<ArrowRight size={15}/></button></div></details><button className="draft-delete" aria-label={'Delete '+u.text} title="Delete draft" onClick={()=>remove(u.kind,u.id)}><Trash2 size={16} aria-hidden="true"/></button></article>)}</section>}
  </div>;
}
