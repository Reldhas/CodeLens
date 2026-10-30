import { useState } from 'react';
import { ArrowRight, Shuffle } from 'lucide-react';
import { dimensions } from './model.js';
import { choosePractice } from './review-flow.js';
export type PracticeConfig = { exerciseId: string; topic: string; focus: string[]; randomFocus: boolean };
export default function ReviewSetup({ onStart }: { onStart: (config: PracticeConfig) => void }) {
  const [focus, setFocus] = useState<string[]>(['Efficiency']);
  const [randomFocus, setRandomFocus] = useState(false);
  const [error, setError] = useState('');
  function start(e: React.FormEvent) {
    e.preventDefault();
    if (!randomFocus && !focus.length) { setError('Choose at least one criterion, or Random criteria.'); return; }
    try { onStart(choosePractice('Random', focus, randomFocus)); } catch (err) { setError((err as Error).message); }
  }
  return <section className="review-setup">
    <div className="eyebrow green">YOUR TRAINING CRITERIA</div>
    <h2>Which skills do you want to train?</h2>
    <p>Choose the criteria for your next problem and code review. The exercise will target these skills; the code may contain issues or none.</p>
    <form onSubmit={start}>
      <fieldset><legend>Select one or more criteria</legend><div className="setup-focus">
        {dimensions.map(area=><label key={area} className={focus.includes(area)&&!randomFocus?'chosen':''}>
          <input type="checkbox" checked={!randomFocus&&focus.includes(area)} disabled={randomFocus} onChange={()=>{setFocus(f=>f.includes(area)?f.filter(a=>a!==area):[...f,area]);setError('');}}/><span>{area}<small>{({Correctness:"Find bugs and boundary cases.",Appropriateness:"Judge whether the approach fits the problem.",Efficiency:"Spot unnecessary work and costly operations.",Maintainability:"Assess clarity and ease of future changes."} as Record<string,string>)[area]}</small></span>
        </label>)}
      </div><label className="random-focus"><input type="checkbox" checked={randomFocus} onChange={e=>{setRandomFocus(e.target.checked);setError('');}}/><Shuffle size={15}/>Random criteria · reveal the selected criteria after submission</label></fieldset>
      <p className="muted">Demo: a matching sample problem and code are selected. AI generation and feedback are simulated. · 8–15 minutes</p>
      {error&&<p className="validation-error" role="alert">{error}</p>}
      <div className="setup-actions"><button className="primary" type="submit">Start practice<ArrowRight size={16}/></button></div>
    </form>
  </section>;
}
