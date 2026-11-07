import type { ReactNode, RefObject } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, MessageSquare, Sparkles } from 'lucide-react';
import AnswerFeedback from '../../AnswerFeedback';

type Props = { question: any; choice: string; reason: string; evaluation?: any; feedback: any; rating: any; onRate: (rating: any) => void; headingRef: RefObject<HTMLHeadingElement>; onNext: () => void; onHome: () => void; last: boolean; progress: ReactNode };
export default function ConceptResult({ question, choice, reason, evaluation, feedback, rating, onRate, headingRef, onNext, onHome, last, progress }: Props) {
  const chosen = question.options.find((o: any) => o.id === choice);
  const right = question.options.find((o: any) => o.id === question.correct);
  const correct = choice === question.correct;
  const reasonScore = evaluation?.reasonScore ?? (feedback.reasonRating === 'good' ? 5 : feedback.reasonRating === 'partly' ? 2.5 : 0);
  const choiceScore = correct ? 5 : 0;
  const total = choiceScore + reasonScore;
  return <div className="concept-results">
    <header className="concept-results-heading"><div><p className="eyebrow">Concept Match · Appropriateness</p><h1 ref={headingRef} tabIndex={-1}>Your answer results</h1></div><div className="completed-actions"><button className="secondary" onClick={onHome}><ArrowLeft size={16}/>Back to practice</button><button className="primary" onClick={onNext}>{last?'See set results':'Next question'}<ArrowRight size={16}/></button></div></header>
    {progress}
    <div className="concept-result-grid">
      <section className="concept-score concept-card" aria-label="Answer score"><div className="concept-card-title"><h2><Sparkles size={18}/>{evaluation?'AI assessment':'Demo assessment'}</h2><span className="simulated-label">{evaluation?'Live AI':'Simulated'}</span></div><div className="concept-total"><strong>{total.toFixed(1)}</strong><span>/ 10<small>Answer score</small></span></div><progress aria-label="Answer score" value={total} max={10}/><p>{correct?'Correct concept selected':'A different concept fits better'}</p></section>
      <section className="concept-card"><h2>Score breakdown</h2>{[['Concept choice',choiceScore,'Matching the reference choice earns 5 points.'],['Explanation',reasonScore,'Connects your choice to the story’s requirements.']].map(([name,score,note])=><div className="concept-rubric" key={String(name)}><div><strong>{name}</strong><span>{Number(score).toFixed(1)} / 5</span></div><p>{note}</p><progress aria-label={String(name)} value={Number(score)} max={5}/></div>)}</section>
      <details className="concept-card concept-submission"><summary><MessageSquare size={18}/><span><strong>Your submission</strong><small>{choice}. {chosen?.text}</small></span><span>Compare</span><ChevronDown size={16}/></summary><div className="concept-submission-body"><div><h3>Your explanation</h3><p>{reason}</p></div><div><h3>The story</h3><p>{question.story}</p></div></div></details>
      <section className="concept-card concept-assessment"><h2><Sparkles size={18}/>{evaluation?'AI feedback':'Demo feedback'}</h2><p>{evaluation?.summary ?? feedback.comment}</p>{evaluation?.improvements?.length>0&&<div className="concept-improvements"><h3>To strengthen your explanation</h3><ul>{evaluation.improvements.map((text:string,i:number)=><li key={i}>{text}</li>)}</ul></div>}<AnswerFeedback target="this explanation" value={rating} onChange={onRate}/><small className="muted">{evaluation?'AI feedback can be imperfect. Compare it with the reference explanations.':'Demo explanation scoring uses keywords; live AI assesses the meaning of your answer.'}</small></section>
      <section className="concept-card concept-reference"><h2><BookOpen size={18}/>Reference explanations <span className="simulated-label">Curated sample</span></h2><div className="concept-reference-grid"><div><h3>Why {right.id} fits</h3><p>{right.text}</p><p>{right.why}</p><small className="muted">{question.concept}</small></div><div><h3>Other approaches</h3>{question.options.filter((o:any)=>o.id!==right.id).map((o:any)=><div key={o.id}><h4>{o.id}. {o.text}</h4><p>{o.why}</p></div>)}</div></div></section>
    </div>
  </div>;
}
