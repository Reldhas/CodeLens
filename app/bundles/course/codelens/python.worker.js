const runtimeURL = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
let runtime;
let globals;
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
    if (!globals) {
      globals = runtime.toPy({ __name__: '__main__' });
      await runtime.runPythonAsync(data.source, { globals });
    }
    try {
      const result = await runtime.runPythonAsync(data.command, { globals });
      if (result !== undefined) {
        append(String(result));
        result?.destroy?.();
      }
      self.postMessage({ type: 'done', text: output + (truncated ? '\n[Output truncated]' : '') });
    } catch (error) {
      self.postMessage({ type: 'error', text: output + String(error) });
    }
  } catch (error) {
    self.postMessage({ type: 'error', text: 'Could not start Python. Check your connection and try again.\n' + String(error) });
  }
};
