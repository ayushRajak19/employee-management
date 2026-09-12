import { Component, type ErrorInfo, type ReactNode } from "react";

const reloadKey = "mobius-chunk-reload";

export const recoverStaleChunk = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (!/dynamically imported module|loading chunk|chunkloaderror|importing a module script/i.test(message)) return false;
  const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
  if (Date.now() - lastReload < 60_000) return false;
  sessionStorage.setItem(reloadKey, String(Date.now()));
  window.location.reload();
  return true;
};

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Application render failed", error, info.componentStack);
    recoverStaleChunk(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><h1 className="text-2xl font-semibold text-slate-900">This page could not load</h1><p className="mt-2 text-sm text-slate-500">The application may have been updated. Reload to continue.</p><button className="mt-5 rounded-xl bg-teal-700 px-5 py-2.5 font-semibold text-white" onClick={() => window.location.reload()}>Reload page</button></div></main>;
  }
}
