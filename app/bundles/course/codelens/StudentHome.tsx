import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { features, type ScreenProps } from './features';
import { normalizeComment } from './model.js';
import { functionNames, isUnlocked, label, readCourse, topicName } from './course.js';
import { Brackets, ConceptIcon, DryRunIcon, LensIcon, ResumeIcon } from './icons';
import { exercises } from './model.js';
import { lastDifficulty, lensReviewData, listAttempts, setDraftArchived } from './practice-log.js';
import { choosePractice } from './review-flow.js';
import { loadSkillMap, ResultsList } from './features/skill-map/SkillMap';
import { practiseTarget, usualSlip } from './features/skill-map/skills.js';
import { pct, ScoreBar } from './ui';
import './home.css';

type Card = { id: string; name: string; Icon: typeof DryRunIcon; skill: string; trains: string; score: number | null; setting: string; start: () => void; change: () => void };

// The last Lens Review choice of lenses, so Start can repeat it straight away.
function lastLensConfig() {
  const drafts = Object.values(lensReviewData().drafts as Record<string, any>);
  const last = drafts.at(-1);
  return last ? { randomFocus: !!last.randomFocus, focus: last.focus || [] } : { randomFocus: true, focus: [] };
}

export default function StudentHome({ go, has }: ScreenProps) {
  const [, refresh] = useState(0);
  const [deleted, setDeleted] = useState<{ kind: string; id: string } | null>(null);
  const [draftError, setDraftError] = useState('');
  const [expanded, setExpanded] = useState('');
  function removeDraft(kind: string, id: string) {
    if (!setDraftArchived(kind, id, true)) { setDraftError('This draft could not be deleted. Please try again.'); return; }
    setDeleted({ kind, id }); setDraftError(''); refresh(n => n + 1);
  }
  function undoDelete() {
    if (!deleted || !setDraftArchived(deleted.kind, deleted.id, false)) { setDraftError('Could not restore the draft.'); return; }
    setDeleted(null); setDraftError(''); refresh(n => n + 1);
  }
  const map = loadSkillMap() as any;
  const suggested = map.weakest ? practiseTarget(map.weakest, has) : null;
  const done = (fn: string) => listAttempts(fn).some((a: any) => a.status === 'submitted');
  const startFn = (fn: string, fromSuggestion: boolean) => ({
    start: () => go(fn, { difficulty: lastDifficulty(fn), fromSuggestion }),
    change: () => go(fn, { fromSuggestion }),
  });
  const lens = lastLensConfig();
  const cards: Card[] = [
    ...features.filter(f => f.kind === 'practice' && f.card).map(f => ({
      id: f.id, name: f.label, Icon: f.id === 'dry-run' ? DryRunIcon : ConceptIcon, skill: f.card!.skill, trains: `Trains ${f.card!.lens}`,
      score: map.byFunction[f.id]?.value ?? null,
      setting: `${label(lastDifficulty(f.id))}${done(f.id) ? ', like last time.' : ' to start.'}${f.id === 'concept-match' ? ' Mixed topics.' : ''}`,
      ...startFn(f.id, suggested === f.id),
    })),
    { id: 'lens-review', name: 'Lens Review', Icon: LensIcon, skill: 'Judge AI-generated code without being told what to look for.', trains: 'Trains any lens you pick',
      score: map.byFunction['lens-review']?.value ?? null,
      setting: lens.randomFocus ? "Random lenses." : `Lenses: ${lens.focus.join(", ")}.`,
      start: () => { try { go('lens-review', { start: choosePractice('Random', lens.focus, lens.randomFocus) }); } catch { go('lens-review', { setup: true }); } },
      change: () => go('lens-review', { setup: true }) },
  ];

  const unfinished = [
    ...listAttempts().filter((a: any) => a.status === 'in_progress').reverse().map((a: any) => ({ id: a.id, kind: 'practice', name: (functionNames as any)[a.function], detail: `${label(a.difficulty)}, ${a.function === 'concept-match' ? 'mixed topics' : topicName(a.topicId).toLowerCase()}`, info: a.title || 'Practice in progress', criteria: `Started ${new Date(a.createdAt).toLocaleDateString()}`, notes: [] as string[], open: () => go(a.function, { attemptId: a.id }) })),
    ...Object.entries(lensReviewData().drafts as Record<string, any>).filter(([, d]) => !d.submitted && !d.archived && (d.comments.length || d.noIssues)).reverse().map(([id, d]) => {
      const exercise = exercises.find(e => e.id === (d.exerciseId || id));
      return { id, kind: 'lens', name: 'Lens Review', detail: `${exercise?.title || 'Review'}, ${d.noIssues ? 'no issues found' : `${d.comments.length} ${d.comments.length === 1 ? 'annotation' : 'annotations'}`}`, info: exercise?.brief || 'Review in progress', criteria: d.randomFocus ? 'Random lenses, revealed after you submit.' : `Lenses: ${(d.focus || []).join(', ')}.`,
        notes: d.noIssues ? [d.justification || 'Justification not written yet.'] : d.comments.map(normalizeComment).map((c: any) => `Lines ${c.start}–${c.end}: ${c.text}`), open: () => go('lens-review', { reviewId: id }) };
    }),
  ];
  const recent = [...map.recent].sort((a: any, b: any) => b.date.localeCompare(a.date)).slice(0, 4);
  const course = readCourse();

  return <>
    <h1 className="page-title">Practice</h1>
    {(unfinished.length > 0 || deleted) && <div className="continue-stack">
      {deleted && <div className="draft-undo" role="status">Draft deleted.<button className="text-link" onClick={undoDelete}>Undo</button></div>}
      {draftError && <p className="error-text" role="alert">{draftError}</p>}
      {unfinished.map(u => { const key = u.kind + u.id; const isOpen = expanded === key; return <article key={key} className="continue-card">
        <div className="continue-head">
          <button className="continue-row row-hover" onClick={u.open}>
            <span className="tile sm on-sheet" aria-hidden="true"><ResumeIcon/></span>
            <span className="continue-text"><strong>Continue {u.name}</strong>, {u.detail}</span>
            <span className="continue-go">Resume</span>
          </button>
          <button className="icon-btn continue-toggle" aria-expanded={isOpen} aria-label={'Show what is saved in ' + u.name} onClick={() => setExpanded(isOpen ? '' : key)}><ChevronDown size={17} strokeWidth={1.8}/></button>
          <button className="icon-btn" aria-label={'Delete ' + u.name + ' draft, ' + u.detail} onClick={() => removeDraft(u.kind, u.id)}><Trash2 size={15} strokeWidth={1.8}/></button>
        </div>
        {isOpen && <div className="continue-more panel-in"><p>{u.info}</p><p className="muted-text">{u.criteria}</p>{u.notes.length > 0 && <ul>{u.notes.map((n: string, i: number) => <li key={i}>{n}</li>)}</ul>}</div>}
      </article>; })}
    </div>}
    <div className="practice-grid">{cards.map((c, i) => {
      const isSuggested = suggested === c.id;
      const open = isUnlocked(c.id, course);
      return <article key={c.id} className={'card hoverable vf practice-card2' + (isSuggested ? ' suggested' : '')}>
        <Brackets/>
        <div className="practice-card-top"><span className="tile" aria-hidden="true"><c.Icon/></span>{isSuggested && <span className="chip strong">Suggested for you</span>}</div>
        <div><h2>{c.name}</h2><p>{c.skill}</p></div>
        {isSuggested && <p className="slip-note">{usualSlip(map, map.weakest)}</p>}
        <div className="practice-score">
          <div><span>{c.trains}</span><strong className={c.score != null && c.score < 0.5 ? 'low' : ''}>{pct(c.score)}</strong></div>
          <ScoreBar value={c.score} delay={0.15 + 0.1 * i}/>
        </div>
        {open ? <div className="practice-start">
          <button className="btn btn-primary btn-block" onClick={c.start}>Start {c.name}</button>
          <div className="practice-setting">{c.setting}<button className="text-link" onClick={c.change}>Change</button></div>
        </div> : <p className="preparing-note">Your TA is preparing this.</p>}
      </article>;
    })}</div>
    <section aria-labelledby="recent-title" className="results-section">
      <div className="results-head"><h2 id="recent-title" className="section-title-lg">Recent results</h2>{has('skill-map') && <button className="text-link" onClick={() => go('skill-map')}>See all in Skill map</button>}</div>
      {recent.length ? <ResultsList items={recent} go={go} has={has}/> : <p className="muted-text">Your results appear here after your first exercise.</p>}
    </section>
  </>;
}
