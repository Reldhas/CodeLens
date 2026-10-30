import { useEffect, useRef, useState } from 'react';
import { Play, Square, Terminal } from 'lucide-react';

export default function PythonConsole({ source, example }: { source: string; example: string }) {
  const [command, setCommand] = useState(example);
  const [output, setOutput] = useState('Run a command to test the code above.');
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
    setOutput('Starting Python…');
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
  return <section className="python-console" aria-label="Python command console">
    <div className="console-heading"><h3><Terminal size={16}/>Python console</h3><span>Runs in your browser</span></div>
    <label htmlFor="python-command">Command</label>
    <textarea id="python-command" spellCheck={false} value={command} disabled={busy} onChange={e=>setCommand(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}}}/>
    <div className="console-actions"><span>Ctrl / ⌘ + Enter to run</span>{busy?<button className="secondary" onClick={()=>stop()}><Square size={14}/>Stop</button>:<button className="primary" disabled={!command.trim()} onClick={run}><Play size={14}/>Run Python</button>}</div>
    <pre className="console-output" role="status" aria-live="polite" aria-busy={busy}>{output}</pre>
    <p className="console-note">The first run downloads Python. Each run starts with the code above and fresh variables. Use print() to display values. Interactive input() is not supported.</p>
  </section>;
}
