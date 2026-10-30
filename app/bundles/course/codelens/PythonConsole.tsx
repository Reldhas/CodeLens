import { useEffect, useRef, useState } from 'react';
import { Square, Terminal } from 'lucide-react';

export default function PythonConsole({ source, example }: { source: string; example: string }) {
  const [command, setCommand] = useState(example);
  const [history, setHistory] = useState<{ command: string; output: string }[]>([]);
  const scrollArea = useRef<HTMLDivElement>(null);
  function setOutput(output: string) {
    setHistory(entries => entries.map((entry, i) => i === entries.length - 1 ? { ...entry, output } : entry));
  }
  useEffect(() => {
    const area = scrollArea.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [history]);
  const [busy, setBusy] = useState(false);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  function dispose() {
    clearTimeout(timer.current);
    worker.current?.terminate();
    worker.current = null;
  }
  useEffect(() => () => dispose(), []);
  function stop(message = 'Execution stopped.') {
    dispose();
    setBusy(false);
    setOutput(message);
  }
  function run() {
    if (busy || !command.trim()) return;
    setBusy(true);
    setHistory(entries => [...entries.slice(-99), { command, output: 'Starting Python…' }]);
    setCommand('');
    try {
      if (!worker.current) worker.current = new Worker(new URL('./python.worker.js', import.meta.url), { type: 'module' });
      const active = worker.current;
      active.onmessage = ({ data }) => {
        if (worker.current !== active) return;
        setOutput(data.text);
        if (data.type === 'status' && data.text === 'Running…') {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => stop('Execution stopped after 10 seconds. Try a smaller input.'), 10000);
        }
        if (data.type === 'done' || data.type === 'error') {
          clearTimeout(timer.current);
          setBusy(false);
        }
      };
      active.onerror = () => stop('Python could not load. Check your internet connection and try again.');
      timer.current = setTimeout(() => stop('Python download timed out. Check your connection and try again.'), 120000);
      active.postMessage({ source, command });
    } catch (error) { stop('Unable to start Python: ' + String(error)); }
  }
  return <section className="python-console simple-terminal" aria-label="Python command console">
    <div className="console-heading"><h3><Terminal size={14}/>Terminal</h3>{busy?<button className="terminal-stop" onClick={()=>stop()}><Square size={12}/>Stop</button>:<span>Enter to run · Shift+Enter for a new line</span>}</div>
    <div className="terminal-scroll" ref={scrollArea}>
      <div className="terminal-history" role="log" aria-live="polite" aria-relevant="additions text">
        {history.map((entry, index)=><div className="terminal-entry" key={index}>
          <pre className="terminal-command">{'>>> ' + entry.command.replace(/\n/g, '\n... ')}</pre>
          <pre className="terminal-result">{entry.output}</pre>
        </div>)}
      </div>
      <form className="terminal-prompt" onSubmit={e=>{e.preventDefault();run();}}>
        <span aria-hidden="true">&gt;&gt;&gt;</span>
        <textarea rows={Math.min(6, command.split('\n').length)} wrap="off" id="python-command" aria-label="Python command" autoComplete="off" autoCapitalize="off" spellCheck={false} value={command} readOnly={busy} onChange={e=>setCommand(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();run();}else if(e.ctrlKey&&e.key==='c'&&busy){e.preventDefault();stop();}}}/>
      </form>
    </div>
  </section>;
}
