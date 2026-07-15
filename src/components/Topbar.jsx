import { I, Icon } from '../lib/icons.jsx';
import { CRUMB, NAV } from '../data/nav.js';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';

function formatUpdatedAt(value) {
  if (!value) return 'Not saved yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Save time unavailable';
  return `Saved ${date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** "Inventory Management · Purchase Orders" for tabbed pages, else the page name. */
function useCrumb() {
  const p = usePortal();
  for (const g of NAV) {
    for (const it of g.items) {
      if (it.page !== p.page) continue;
      if (!it.children || !it.tabKey) return it.label;
      const kids = it.children.map((c) => (typeof c === 'string' ? { tab: c, label: c } : c));
      const k = kids.find((c) => c.tab === p[it.tabKey]);
      return it.label + (k ? ' · ' + k.label : '');
    }
  }
  return CRUMB[p.page] || 'Dashboard';
}

export default function Topbar() {
  const p = usePortal();
  const { threads = [], meta = {} } = useDomain();
  const crumb = useCrumb();
  const unreadTotal = threads.reduce((sum, thread) => sum + Number(thread.unread || 0), 0);
  const savedLabel = formatUpdatedAt(meta.updatedAt);
  const persisted = meta.persistence !== 'memory';
  const persistenceLabel = meta.recoveryRequired
    ? 'Recovery needed'
    : persisted
      ? 'Local'
      : 'Memory only';

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-panel/95 px-3.5 sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={p.openMobileNav}
        aria-label="Open navigation"
        className="flex shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-muted hover:bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring) md:hidden"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      </button>
      <button
        type="button"
        onClick={p.toggleCollapsed}
        aria-label={p.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-muted hover:bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring) md:flex"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      </button>

      <div className="flex min-w-0 shrink items-center gap-2 overflow-hidden">
        <span className="hidden shrink-0 whitespace-nowrap text-[13.5px] text-faint lg:inline">Partner Portal</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hidden shrink-0 text-faint lg:block"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold text-text">
          {crumb}
        </span>
      </div>

      <div className="flex-1" />

      <div
        title={persisted ? 'Saved in browser storage; no remote sync is configured' : (meta.persistenceError || 'Running in memory only')}
        className="hidden shrink-0 items-center gap-1.75 rounded-[9px] border border-border bg-inset px-2.75 py-1.5 md:flex"
      >
        <span className={`h-1.75 w-1.75 rounded-full ${persisted ? 'bg-ok-fg' : 'bg-danger-fg'}`} />
        <span className="whitespace-nowrap text-[12px] text-muted">
          {persistenceLabel}<span className="hidden xl:inline"> · <strong className="font-semibold text-text">{savedLabel}</strong></span>
        </span>
      </div>

      <button
        type="button"
        onClick={p.toggleTheme}
        title="Toggle theme"
        aria-label={`Switch to ${p.theme === 'light' ? 'dark' : 'light'} theme`}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-border bg-transparent text-muted hover:bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)"
      >
        <Icon paths={p.theme === 'light' ? I.moon : I.sun} size={17} strokeWidth={1.9} />
      </button>

      <button
        type="button"
        onClick={p.go('messages')}
        aria-label={`Messages${unreadTotal ? `, ${unreadTotal} unread` : ', none unread'}`}
        className="relative hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-border bg-transparent text-muted hover:bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring) sm:flex"
      >
        <Icon paths={I.bell} size={17} strokeWidth={1.9} />
        {unreadTotal > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border border-panel bg-danger-fg px-1 text-[10px] font-bold text-white tabular-nums">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => p.set({ page: 'promocreate', nav: 'marketing' })}
        className="flex h-9 shrink-0 cursor-pointer items-center gap-1.75 rounded-[9px] border-0 bg-primary px-2.5 text-[13px] font-semibold text-primary-text hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring) sm:px-3.75"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span className="hidden sm:inline">New promo</span>
      </button>
    </header>
  );
}
