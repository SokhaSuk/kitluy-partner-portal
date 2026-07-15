import { Component } from 'react';

/** Last-resort UI boundary so a bad record cannot blank the whole portal. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep diagnostics visible to developers without leaking them into the UI.
    console.error('KitLuy portal render failed', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-panel p-6 shadow-pop">
          <div className="text-[18px] font-bold">This screen could not be displayed</div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Your saved portal data is still on this device. Reload the page first; if the problem
            continues, export or reset the local data from Settings.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 cursor-pointer rounded-lg border-0 bg-accent px-4 py-2 text-[13px] font-semibold text-accent-text"
          >
            Reload portal
          </button>
        </div>
      </div>
    );
  }
}
