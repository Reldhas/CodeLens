import { ThumbsUp, ThumbsDown } from 'lucide-react';
export type AnswerRating = { vote: 'up' | 'down' | null; comment: string; updatedAt: string };
export default function AnswerFeedback({ target, value, onChange }: {
  target: string;
  value?: AnswerRating;
  onChange: (rating: AnswerRating) => void;
}) {
  function vote(next: 'up' | 'down') {
    onChange({ vote: value?.vote === next ? null : next, comment: value?.comment || '', updatedAt: new Date().toISOString() });
  }
  return <div className="answer-rating" role="group" aria-label={'Rate '+target}>
    <div className="rating-row"><span>Helpful?</span>
      <button type="button" aria-label={target+' was helpful'} aria-pressed={value?.vote==='up'} onClick={()=>vote('up')} title="Helpful"><ThumbsUp size={16}/></button>
      <button type="button" aria-label={target+' was not helpful'} aria-pressed={value?.vote==='down'} onClick={()=>vote('down')} title="Not helpful"><ThumbsDown size={16}/></button>
      {value?.vote&&<span className="rating-saved" role="status">Saved locally</span>}
    </div>
    {value?.vote&&<label className="rating-comment">{value.vote==='down'?'What should improve?':'What helped?'} <span>(optional)</span>
      <textarea value={value.comment} maxLength={2000} aria-label={'Comment on '+target} placeholder="Add a short note…" onChange={e=>onChange({...value,comment:e.target.value,updatedAt:new Date().toISOString()})}/>
    </label>}
  </div>;
}
