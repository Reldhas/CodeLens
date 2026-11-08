import { useState } from 'react';
import { Brackets } from './icons';
import { dimensions } from './model.js';
import { choosePractice } from './review-flow.js';
export type PracticeConfig = { exerciseId: string; topic: string; focus: string[]; randomFocus: boolean };
const hints: Record<string, string> = { Correctness: 'Bugs and edge cases', Appropriateness: 'The right approach', Efficiency: 'Time and memory', Maintainability: 'Readable, adaptable code' };
// Every Lens Review starts here, so choosing the lenses is always a deliberate step.
// initialFocus and topic come from a Practise button on the weakest lens and topic.
export default function ReviewSetup({ onStart, initialFocus = [], topic }: { onStart: (config: PracticeConfig) => void; initialFocus?: string[]; topic?: string }) {
  const [focus, setFocus] = useState<string[]>(initialFocus);
  const [randomFocus, setRandomFocus] = useState(false);
  const [error, setError] = useState('');
  function start(e: React.FormEvent) {
    e.preventDefault();
    if (!randomFocus && !focus.length) { setError('Choose at least one lens, or Random.'); return; }
    const pick = () => { if (topic) { try { return choosePractice(topic, focus, randomFocus); } catch { /* No exercise for this topic and these lenses: use any topic. */ } } return choosePractice('Random', focus, randomFocus); };
    try { onStart(pick()); } catch (err) { setError((err as Error).message); }
  }
  return <section className="sheet center-sheet">
    <form className="setup-form" onSubmit={start}>
      <div><h2 className="setup-title">Which lenses do you want to practise?</h2><p className="muted-text">Choose one or more, or let CodeLens pick at random.</p></div>
      <fieldset className="option-list"><legend className="sr-only">Lenses</legend>
        <label className="card hoverable vf option-card"><Brackets/><input type="checkbox" checked={randomFocus} onChange={e => { setRandomFocus(e.target.checked); setError(''); }}/><span className="option-text"><strong>Random</strong><small>Any lens may apply. You see which ones after you submit.</small></span></label>
        {dimensions.map(area => <label key={area} className="card hoverable vf option-card"><Brackets/>
          <input type="checkbox" checked={randomFocus || focus.includes(area)} disabled={randomFocus} onChange={() => { setFocus(f => f.includes(area) ? f.filter(a => a !== area) : [...f, area]); setError(''); }}/>
          <span className="option-text"><strong>{area}</strong><small>{hints[area]}</small></span>
        </label>)}
      </fieldset>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="setup-actions2"><span className="muted-text">Sample exercises</span><button className="btn btn-primary" type="submit">Start Lens Review</button></div>
    </form>
  </section>;
}
