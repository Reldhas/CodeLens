import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Brackets } from './icons';
import { dimensions } from './model.js';
import { choosePractice, topicsFor } from './review-flow.js';
export type PracticeConfig = { exerciseId: string; topic: string; focus: string[]; randomFocus: boolean };
const hints: Record<string, string> = { Correctness: 'Bugs and edge cases', Appropriateness: 'The right approach', Efficiency: 'Time and memory', Maintainability: 'Readable, adaptable code' };
// Every Lens Review starts here, so choosing the lenses is always a deliberate step.
// initialFocus and topic come from a Practise button on the weakest lens and topic.
export default function ReviewSetup({ onStart, initialFocus = [], topic }: { onStart: (config: PracticeConfig) => void; initialFocus?: string[]; topic?: string }) {
  const [focus, setFocus] = useState<string[]>(initialFocus);
  const [randomFocus, setRandomFocus] = useState(false);
  const [pickedTopic, setPickedTopic] = useState(topic || '');
  const [error, setError] = useState('');
  // Only the topics that have an exercise for these lenses are offered.
  const topics = topicsFor(focus, randomFocus) as string[];
  const chosenTopic = topics.includes(pickedTopic) ? pickedTopic : '';
  function start(e: React.FormEvent) {
    e.preventDefault();
    if (!randomFocus && !focus.length) { setError('Choose at least one lens, or tick Random.'); return; }
    try { onStart(choosePractice(chosenTopic || 'Random', focus, randomFocus)); } catch (err) { setError((err as Error).message); }
  }
  return <section className="sheet center-sheet">
    <form className="setup-form" onSubmit={start}>
      <div><h2 className="setup-title">Which lenses do you want to practise?</h2><p className="muted-text">Choose one or more.</p></div>
      <fieldset className="option-list"><legend className="sr-only">Lenses</legend>
        {dimensions.map(area => <label key={area} className="card hoverable vf option-card"><Brackets/>
          <input type="checkbox" checked={randomFocus || focus.includes(area)} disabled={randomFocus} onChange={() => { setFocus(f => f.includes(area) ? f.filter(a => a !== area) : [...f, area]); setError(''); }}/>
          <span className="option-text"><strong>{area}</strong><small>{hints[area]}</small></span>
        </label>)}
        <label className="random-check"><input type="checkbox" checked={randomFocus} onChange={e => { setRandomFocus(e.target.checked); setError(''); }}/><Shuffle size={15} strokeWidth={1.8} aria-hidden="true"/><span><strong>Random</strong> Any lens may apply. You see which ones after you submit.</span></label>
      </fieldset>
      {topics.length > 1 && <label className="field setup-topic">Topic (optional)<select value={chosenTopic} onChange={e => setPickedTopic(e.target.value)}><option value="">Any topic</option>{topics.map(t => <option key={t} value={t}>{t}</option>)}</select></label>}
      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="setup-actions2"><span className="muted-text">Sample exercises</span><button className="btn btn-primary" type="submit">Start Lens Review</button></div>
    </form>
  </section>;
}
