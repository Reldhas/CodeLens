import { Plus, X } from 'lucide-react';
export function TraceInput({ columns, rows, locked, onChange }: { columns: string[]; rows: string[][]; locked: boolean; onChange: (rows: string[][]) => void }) {
  const setCell = (r: number, c: number, value: string) => onChange(rows.map((row,i)=>i===r?row.map((cell,j)=>j===c?value:cell):row));
  return <div className="trace-input">
    <div className="trace-scroll"><table><thead><tr><th>Step</th>{columns.map(c=><th key={c}><code>{c}</code></th>)}{!locked&&<th><span className="sr-only">Remove</span></th>}</tr></thead>
      <tbody>{rows.map((row,r)=><tr key={r}><td>{r+1}</td>{row.map((cell,c)=><td key={c}><input value={cell} readOnly={locked} spellCheck={false} autoCapitalize="off" aria-label={`Step ${r+1}, ${columns[c]}`} onChange={e=>setCell(r,c,e.target.value)}/></td>)}{!locked&&<td><button type="button" className="icon-button" aria-label={`Remove step ${r+1}`} onClick={()=>onChange(rows.filter((_,i)=>i!==r))}><X size={14}/></button></td>}</tr>)}</tbody></table></div>
    {!locked&&<button type="button" className="text-button" onClick={()=>onChange([...rows,columns.map(()=>'')])}><Plus size={14}/>Add step</button>}
  </div>;
}
const describe = (columns: string[], row?: string[]) => (row||[]).map((v,i)=>v===''?null:`${columns[i]} = ${v}`).filter(Boolean).join(', ') || 'no values yet';
function ResultTable({ title, columns, rows, mark }: { title: string; columns: string[]; rows: string[][]; mark: number | null }) {
  return <div className="trace-result"><h4>{title}</h4><div className="trace-scroll"><table><thead><tr>{columns.map(c=><th key={c}><code>{c}</code></th>)}</tr></thead><tbody>{rows.map((row,r)=><tr key={r} className={r===mark?'marked':''}>{row.map((cell,c)=><td key={c}><code>{cell||'·'}</code></td>)}</tr>)}</tbody></table></div></div>;
}
export function TraceResult({ trace }: { trace: any }) {
  const wrong = trace.firstWrongRow;
  return <div><p className="clean-answer">{wrong===null?'Every step of your trace table matches the real run.':`Your trace went wrong at step ${wrong+1}: you wrote ${describe(trace.columns,trace.student[wrong])}, but at that point the code had ${describe(trace.columns,trace.expected[trace.expectedAt])}.`}</p>
    <div className="trace-results"><ResultTable title="Your trace" columns={trace.columns} rows={trace.student} mark={wrong}/><ResultTable title="Real run" columns={trace.columns} rows={trace.expected} mark={trace.expectedAt}/></div></div>;
}
