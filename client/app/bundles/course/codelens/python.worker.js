const runtimeURL = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
let runtime;
self.onmessage = async ({ data }) => {
  try {
    if (!runtime) {
      self.postMessage({ type: 'status', text: 'Downloading Python runtime…' });
      const { loadPyodide } = await import(/* @vite-ignore */ `${runtimeURL}pyodide.mjs`);
      runtime = await loadPyodide({ indexURL: runtimeURL, stdin: () => null });
    }
    self.postMessage({ type: 'status', text: 'Running…' });
    let output = '';
    let truncated = false;
    const append = (text) => {
      if (output.length < 20000) output += (text + '\n').slice(0, 20000 - output.length);
      else truncated = true;
    };
    runtime.setStdout({ batched: append });
    runtime.setStderr({ batched: append });
    const globals = runtime.toPy({ __name__: '__main__' });
    try {
      await runtime.runPythonAsync(data.source, { globals });
      const result = await runtime.runPythonAsync(data.command, { globals });
      if (result !== undefined) {
        append(String(result));
        result?.destroy?.();
      }
      self.postMessage({ type: 'done', text: (output || '(No output)') + (truncated ? '\n[Output truncated]' : '') });
    } catch (error) {
      self.postMessage({ type: 'error', text: output + String(error) });
    } finally { globals.destroy(); }
  } catch (error) {
    self.postMessage({ type: 'error', text: 'Could not start Python. Check your connection and try again.\n' + String(error) });
  }
};
