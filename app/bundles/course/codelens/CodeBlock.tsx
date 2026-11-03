import { FileCode2 } from 'lucide-react';
const keywords = 'def|return|for|while|in|if|elif|else|not|and|or|is|break|continue|import|from|False|True|None|raise|print|len|range';
const parts = new RegExp(`(""".*?"""|".*?"|'.*?'|#.*$|\\b(?:${keywords})\\b|\\b\\d+(?:\\.\\d+)?\\b)`, 'g');
const keyword = new RegExp(`^(${keywords})$`);
export function highlight(line: string) { return line.split(parts).map((part,i) => <span key={i} className={/^["']/.test(part) ? 'syntax-string' : part.startsWith('#') ? 'muted' : keyword.test(part) ? 'syntax-keyword' : /^\d/.test(part) ? 'syntax-number' : ''}>{part}</span>); }
export default function CodeBlock({ file, code }: { file: string; code: string }) {
  const lines = code.split('\n');
  return <>
    <div className="editor-tab"><span><FileCode2 size={16}/>{file}<span className="tiny-dot"/></span><span className="muted">Sample code</span></div>
    <div className="editor-info"><span>Read-only</span><span>{lines.length} lines</span></div>
    <div className="code-area" aria-label="Python source code">{lines.map((line,i)=><div className="code-line" key={i}><span className="line-marker"/><span className="line-number">{i+1}</span><code>{highlight(line)}</code></div>)}</div>
    <div className="editor-bottom"><span><span className="python-dot"/>Python 3</span><span>Read-only</span></div>
  </>;
}
