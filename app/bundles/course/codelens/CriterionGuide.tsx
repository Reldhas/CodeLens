import { useState } from 'react';
import { CircleHelp, X } from 'lucide-react';

const guidance: Record<string, { question: string; checks: string[]; evidence: string }> = {
  Correctness: {
    question: 'Does the code do what the requirements say?',
    checks: ['Trace a normal input and compare the result with the expected behavior.', 'Check empty inputs, boundary values, duplicates, and invalid inputs where relevant.', 'Inspect conditions, loop bounds, return values, and error handling.'],
    evidence: 'Name a specific input, its expected result, and what the code actually does. Select the lines responsible and propose a correction.'
  },
  Appropriateness: {
    question: 'Does the chosen approach fit this problem and its constraints?',
    checks: ['Compare the algorithm and data structures with what the task needs.', 'Check that required techniques and restrictions are respected.', 'Look for unnecessary complexity or techniques whose assumptions do not fit the inputs.'],
    evidence: 'Connect the chosen lines to a requirement or constraint. Explain why another approach is a better fit, rather than just a personal preference.'
  },
  Efficiency: {
    question: 'How does the work grow as the input gets larger?',
    checks: ['Look for repeated scans, nested loops, and repeated calculations.', 'Consider both running time and extra memory.', 'Check whether work can be done once or with a more suitable data structure.'],
    evidence: 'Identify the repeated work and describe its cost as input size grows. Suggest an improvement that preserves the required behavior.'
  },
  Maintainability: {
    question: 'Could another developer understand and safely change this code?',
    checks: ['Check names, structure, and whether the intent is clear.', 'Look for duplicated logic and unexplained constants.', 'Check comments and conventions against the stated requirements. Avoid changes that only reflect personal taste.'],
    evidence: 'Point to a concrete source of confusion or change risk. Explain its impact and propose a clearer name, structure, or shared constant.'
  }
};

export default function CriterionGuide({ criteria }: { criteria: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const guide = selected ? guidance[selected] : null;
  return <>
    <div className="focus-tags criterion-buttons">{criteria.map((criterion, index)=><button
      key={criterion} type="button" aria-expanded={selected===criterion} aria-controls="criterion-guidance"
      onClick={()=>setSelected(selected===criterion?null:criterion)}>
      <span className={'focus-dot dot-'+index}/>{criterion}<CircleHelp size={12}/>
    </button>)}</div>
    <p className="criteria-help-hint">Click a criterion for tips.</p>
    {guide&&<section className="criterion-guidance" id="criterion-guidance" aria-label={selected+' guidance'}>
      <div className="guidance-heading"><h4>{selected}</h4><button className="icon-button" aria-label="Close criterion guidance" onClick={()=>setSelected(null)}><X size={15}/></button></div>
      <strong>{guide.question}</strong>
      <ul>{guide.checks.map(check=><li key={check}>{check}</li>)}</ul>
      <h4>What to put in your annotation</h4><p>{guide.evidence}</p>
      <p className="guidance-reminder">Finding no issue is valid. Explain what you checked rather than inventing a problem.</p>
    </section>}
  </>;
}
