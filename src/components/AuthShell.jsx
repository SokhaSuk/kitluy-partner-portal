import { I, Icon } from '../lib/icons.jsx';
import { usePortal } from '../store/PortalContext.jsx';

/** Selling points on the brand wall. */
const HIGHLIGHTS = [
  {
    icon: I.receipt,
    title: 'Orders, end to end',
    body: 'Exercise intake, wash, fold and delivery workflows in one portal.',
  },
  {
    icon: I.wallet,
    title: 'Money that reconciles',
    body: 'Review the shift-finance and payout experience in the local build.',
  },
  {
    icon: I.spark,
    title: 'Insight, not guesswork',
    body: 'Explore capacity, repeat-rate and margin screens with development data.',
  },
];

/**
 * Chrome shared by every signed-out screen: brand wall, theme toggle, footer.
 * From `lg` up the form column is a third of the viewport and the brand wall
 * takes the rest; below that the wall is hidden and the form is full width.
 * `width` widens the column for the multi-column sign-up form.
 */
export default function AuthShell({ children, width = 'max-w-100' }) {
  const p = usePortal();

  return (
    <div className="flex h-full w-full">
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-1"
        style={{
          background:
            'linear-gradient(155deg, color-mix(in srgb, var(--accent) 88%, #05121d), #0a1626 100%)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(90% 60% at 15% 0%, rgba(255,255,255,0.18), transparent 60%)',
          }}
        />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-12">
          <div className="flex items-center gap-2.5">
            <span className="text-[15.5px] font-semibold text-white">
              KitLuy <span className="font-medium text-white/60">Partner</span>
            </span>
          </div>

          <div className="max-w-125 py-10">
            <h2 className="text-[30px] leading-[1.2] font-bold tracking-tight text-white xl:text-[34px]">
              Run the whole store from one screen.
            </h2>
            <p className="mt-3 text-[14px] leading-[1.6] text-white/70">
              This local-development build lets you exercise Partner Portal workflows with accounts
              and sessions stored only in this browser.
            </p>

            <ul className="mt-9 flex list-none flex-col gap-5 p-0">
              {HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/12 text-white">
                    <Icon paths={h.icon} size={17} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-white">{h.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-normal text-white/60">
                      {h.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-white/55">
            <Icon paths={I.shield} size={14} strokeWidth={1.9} />
            <span>Local development only · no remote account or message delivery</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto lg:w-1/3 lg:flex-none">
        <header className="flex shrink-0 items-center gap-3 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="text-[15px] font-semibold text-text">
              KitLuy <span className="font-medium text-muted">Partner</span>
            </span>
          </div>
          <button
            type="button"
            onClick={p.toggleTheme}
            title="Toggle theme"
            aria-label={`Switch to ${p.theme === 'light' ? 'dark' : 'light'} theme`}
            className="ml-auto flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-border bg-transparent text-muted hover:bg-hover hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
          >
            <Icon paths={p.theme === 'light' ? I.moon : I.sun} size={17} strokeWidth={1.9} />
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-4 sm:px-8">
          <div className={`w-full ${width} animate-kfade`}>{children}</div>
        </main>

        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 py-5 text-[11.5px] text-faint sm:px-8">
          <span>© 2026 KitLuy</span>
          <span>Browser-local accounts</span>
          <span>No SMS or email delivery</span>
        </footer>
      </div>
    </div>
  );
}

/** Text link used for cross-links between the auth screens. */
export function AuthLink({ onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded border-0 bg-transparent text-[12.5px] font-semibold text-accent hover:underline focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none ${className}`}
    >
      {children}
    </button>
  );
}
