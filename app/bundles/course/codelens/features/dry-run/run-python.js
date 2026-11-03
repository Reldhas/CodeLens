// Runs a whole program in the same browser worker as the Python console.
const harness = String.raw`
import contextlib, io, json, sys

def _show(value):
    return value if isinstance(value, str) else repr(value)

def run_program(code):
    buf = io.StringIO()
    error = None
    try:
        with contextlib.redirect_stdout(buf):
            exec(code, {"__name__": "__main__"})
    except Exception as e:
        error = type(e).__name__
    return json.dumps({"output": buf.getvalue(), "error": error})

def trace_program(code, columns_json):
    columns = json.loads(columns_json)
    states = []
    def snapshot(frame, returned=None):
        row = []
        for col in columns:
            if col == "returned":
                row.append("" if returned is None else _show(returned))
                continue
            try:
                row.append(_show(eval(col, frame.f_globals, frame.f_locals)))
            except Exception:
                row.append("")
        if any(row) and (not states or states[-1] != row) and len(states) < 200:
            states.append(row)
    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<string>":
            return None
        if event == "line":
            snapshot(frame)
        elif event == "return":
            snapshot(frame, arg if frame.f_code.co_name != "<module>" else None)
        return tracer
    buf = io.StringIO()
    error = None
    sys.settrace(tracer)
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(code, "<string>", "exec"), {"__name__": "__main__"})
    except Exception as e:
        error = type(e).__name__
    finally:
        sys.settrace(None)
    return json.dumps({"output": buf.getvalue(), "error": error, "trace": states})
`;
const loadLimit = 120000, runLimit = 10000;
let worker = null;
function start() {
  if (!worker) worker = new Worker(new URL('../../python.worker.js', import.meta.url), { type: 'module' });
  return worker;
}
export function runProgram(code, traceColumns) {
  const command = traceColumns
    ? `trace_program(${JSON.stringify(code)}, ${JSON.stringify(JSON.stringify(traceColumns))})`
    : `run_program(${JSON.stringify(code)})`;
  return new Promise((resolve, reject) => {
    const active = start();
    const fail = message => { clearTimeout(timer); active.terminate(); worker = null; reject(new Error(message)); };
    let timer = setTimeout(() => fail('Python download timed out. Check your connection and try again.'), loadLimit);
    active.onmessage = ({ data }) => {
      if (data.type === 'status' && data.text === 'Running…') { clearTimeout(timer); timer = setTimeout(() => fail('The code took too long to run.'), runLimit); }
      if (data.type === 'done') { clearTimeout(timer); resolve(JSON.parse(data.text.trim())); }
      if (data.type === 'error') fail('Could not run the code. Check your connection and try again.');
    };
    active.onerror = () => fail('Python could not load. Check your internet connection and try again.');
    active.postMessage({ source: harness, command });
  });
}
