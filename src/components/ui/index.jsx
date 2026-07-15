import { useState } from 'react';
import { cn } from '../../lib/cn.js';
import { toneClass, toneDot, tierClass } from '../../lib/tone.js';
import { I, Icon } from '../../lib/icons.jsx';

/* `cn` is a plain joiner, so a border-color utility passed via className would
   tie with the base one and fall to stylesheet order. Inline style always wins. */
const invalidStyle = (invalid, style) =>
  invalid ? { borderColor: 'var(--danger-fg)', ...style } : style;

/* --------------------------------------------------------------- surfaces */

const CARD_VARIANT = {
  default: 'border-border bg-panel',
  accent: 'border-accent/25 bg-accent-soft',
  purple: 'border-purple/30 bg-purple-bg',
  gold: 'border-gold/35 bg-gold-bg',
};

export function Card({ variant = 'default', className, children, ...rest }) {
  return (
    <div
      className={cn(
        'rounded-2xl border shadow-card transition-[border-color,box-shadow]',
        CARD_VARIANT[variant] || CARD_VARIANT.default,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Card header with a title, optional subtitle and a right-hand slot. */
export function CardHead({ title, subtitle, right, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold tracking-[-0.01em] text-text">{title}</div>
        {subtitle && <div className="mt-0.5 text-[12.5px] text-muted">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

/** Page title block: heading, sub-line, freshness stamp and actions. */
export function PageHeader({ title, subtitle, freshness, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
      <div className="min-w-0">
        <h1 className="m-0 text-[22px] font-bold tracking-tight text-text sm:text-[24px]">
          {title}
        </h1>
        {subtitle && <div className="mt-0.5 text-[13px] text-muted">{subtitle}</div>}
        {freshness && <div className="mt-0.5 text-[11.5px] text-faint">{freshness}</div>}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- controls */

const BTN = {
  primary:
    'bg-primary text-primary-text border border-primary hover:opacity-90',
  default: 'bg-panel text-text border border-border hover:bg-hover',
  subtle: 'bg-inset text-text border border-transparent hover:bg-hover',
  accent: 'bg-accent text-accent-text border border-accent hover:opacity-90',
  purple: 'bg-purple-bg text-purple-fg border border-purple hover:opacity-90',
  gold: 'bg-gold-bg text-gold-fg border border-gold hover:opacity-90',
  danger: 'bg-danger-bg text-danger-fg border border-danger-fg hover:opacity-90',
};

/**
 * `loading` shows a spinner in place of the icon, disables the button so a
 * submit cannot fire twice while the first is still in flight, and sets
 * `aria-busy` so the state is not carried by the spinner's pixels alone.
 */
export function Button({
  variant = 'default',
  icon,
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] px-3.25 py-2 text-[13px] font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)',
        BTN[variant] || BTN.default,
        className
      )}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : icon && <Icon paths={icon} size={14} />}
      {children}
    </button>
  );
}

/** Rounded filter chip. */
export function Chip({ active, className, children, ...rest }) {
  return (
    <button
      type="button"
      className={cn(
        'cursor-pointer whitespace-nowrap rounded-full border px-3.25 py-1.5 text-[12.5px] transition-colors',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)',
        active
          ? 'border-text bg-text font-semibold text-panel'
          : 'border-border bg-panel font-medium text-muted hover:bg-hover',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Underline-free tab pill used above tables. */
export function Tab({ active, className, children, ...rest }) {
  return (
    <button
      type="button"
      className={cn(
        'cursor-pointer whitespace-nowrap rounded-[9px] border px-3.5 py-2 text-[13px] transition-colors',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)',
        active
          ? 'border-border bg-panel font-semibold text-text shadow-card'
          : 'border-transparent bg-transparent font-medium text-muted hover:text-text',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onClick, className, ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!on}
      onClick={onClick}
      className={cn(
        'relative h-5.5 w-9.5 shrink-0 cursor-pointer rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)',
        on ? 'bg-accent' : 'bg-border-strong',
        className
      )}
      {...rest}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-transform',
          on && 'translate-x-4'
        )}
      />
    </button>
  );
}

export function SearchInput({ className, ...rest }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-[10px] border border-border bg-inset px-3 py-2.25 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-3 focus-within:ring-(--ring)',
        className
      )}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-faint"
        aria-hidden="true"
      >
        <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        className="w-full min-w-0 border-0 bg-transparent text-[13px] text-text outline-none placeholder:text-faint"
        {...rest}
      />
    </div>
  );
}

const INPUT =
  'w-full rounded-[10px] border border-border bg-inset px-3 py-2.25 text-[13px] text-text outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent focus:ring-3 focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-60';

export function TextInput({ className, invalid, style, ...rest }) {
  return (
    <input
      aria-invalid={invalid ? 'true' : undefined}
      style={invalidStyle(invalid, style)}
      className={cn(INPUT, className)}
      {...rest}
    />
  );
}

const EYE = ['M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'];
const EYE_OFF = [
  'M17.9 17.9A10.5 10.5 0 0 1 12 19c-7 0-11-7-11-7a19 19 0 0 1 5.1-5.9',
  'M9.9 4.2A9.6 9.6 0 0 1 12 4c7 0 11 7 11 7a19 19 0 0 1-2.2 3.2',
  'M9.9 9.9a3 3 0 0 0 4.2 4.2',
  'M2 2l20 20',
];

/** Password field with a reveal toggle. */
export function PasswordInput({ className, ...rest }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="relative">
      <TextInput
        type={reveal ? 'text' : 'password'}
        className={cn('pr-10.5', className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setReveal((v) => !v)}
        aria-label={reveal ? 'Hide password' : 'Show password'}
        aria-pressed={reveal}
        className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-[10px] border-0 bg-transparent text-faint hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
      >
        <Icon paths={reveal ? EYE_OFF : EYE} size={16} strokeWidth={1.9} />
      </button>
    </div>
  );
}

export function Select({ className, invalid, style, children, ...rest }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid ? 'true' : undefined}
        style={invalidStyle(invalid, style)}
        className={cn(INPUT, 'cursor-pointer appearance-none pr-9', className)}
        {...rest}
      >
        {children}
      </select>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-faint"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/**
 * Label + control + inline error. Give the control `id`, and it picks up the
 * error message as its description automatically.
 */
export function Field({ id, label, error, action, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-text">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12px] font-medium text-danger-fg">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-[11.5px] text-faint">{hint}</p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- feedback */

/**
 * The shape that carries each tone. Colour alone fails for the ~8% of men with
 * a colour-vision deficiency, so an error and a confirmation must not differ
 * only in hue — they differ in glyph too.
 */
export const FEEDBACK_ICON = {
  ok: I.check,
  danger: I.warn,
  warn: I.warn,
  info: I.info,
  neutral: I.info,
  purple: I.info,
  gold: I.warn,
};

/**
 * Indeterminate spinner. Pass `label` when it is the only thing on screen —
 * without one a screen reader announces nothing at all while the user waits.
 */
export function Spinner({ size = 14, label, className }) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0 animate-kspin', className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.75" opacity="0.22" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!label) return svg;
  return (
    <span role="status" className="inline-flex items-center">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centred spinner for a region that has nothing to show yet. */
export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2.5 px-6 py-14 text-muted',
        className
      )}
    >
      <Spinner size={22} label={label} className="text-accent" />
      <span className="text-[12.5px] font-medium">{label}</span>
    </div>
  );
}

/**
 * Shimmer placeholder. Give it its own size and radius — `cn` is a plain joiner,
 * so a default radius here would tie with the caller's and fall to source order.
 * The `.skeleton` class lives in styles/index.css; it is not a utility stack.
 */
export function Skeleton({ className, ...rest }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} {...rest} />;
}

/** Placeholder paragraph. The short last line is what makes it read as text. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3 rounded-md', i === lines - 1 ? 'w-[55%]' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Indeterminate bar, for a wait whose length is unknown. */
export function ProgressBar({ label = 'Working…', className }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-inset', className)}
    >
      <div className="h-full w-full animate-kbar rounded-full bg-accent" />
    </div>
  );
}

/**
 * Inline status block: the persistent counterpart to a Toast. Use it when the
 * message belongs to a region of the page and must stay put — a form-level
 * failure, a boundary note — and a Toast when it belongs to an action.
 */
export function Alert({ tone = 'info', title, icon, onDismiss, className, children }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[12.5px] leading-normal',
        toneClass(tone),
        className
      )}
    >
      <span className="mt-px shrink-0 opacity-80">
        <Icon paths={icon || FEEDBACK_ICON[tone] || FEEDBACK_ICON.info} size={14} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cn(title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mt-0.5 -mr-1 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)"
        >
          <Icon paths={I.x} size={13} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ atoms */

/** Pill badge. Pass `tone` for a design token, or `tier` for a customer tier. */
export function Badge({ tone, tier, className, children }) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-full px-2.25 py-0.75 text-[11.5px] font-semibold',
        tier ? tierClass(tier) : toneClass(tone),
        className
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = 'neutral', className }) {
  return <span className={cn('h-1.75 w-1.75 shrink-0 rounded-full', toneDot(tone), className)} />;
}

export function Avatar({ name, className, tier }) {
  const initials = (name || '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold',
        tier ? tierClass(tier) : 'bg-inset text-muted',
        className || 'h-9 w-9'
      )}
    >
      {initials}
    </span>
  );
}

/** Small stat block used in KPI strips. */
export function Kpi({ label, value, delta, up = true, sub, icon, tint, tone }) {
  const TINT = {
    info: 'bg-info-bg text-info-fg',
    purple: 'bg-purple-bg text-purple-fg',
    gold: 'bg-gold-bg text-gold-fg',
    ok: 'bg-ok-bg text-ok-fg',
  };
  const tintTone = tone || ['info', 'purple', 'gold', 'ok'][tint] || 'info';
  return (
    <Card className="p-4 sm:p-4.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12.5px] font-medium text-muted">{label}</div>
        {icon != null && tint != null && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]',
              TINT[tintTone]
            )}
          >
            <Icon paths={icon} size={15} />
          </span>
        )}
      </div>
      <div className="mt-2 text-[23px] font-bold tracking-tight text-text">{value}</div>
      <div className="mt-0.5 flex items-center gap-1.5">
        {delta && (
          <span className={cn('text-[12px] font-semibold', up ? 'text-ok-fg' : 'text-danger-fg')}>
            {delta}
          </span>
        )}
        {sub && <span className="truncate text-[11.5px] text-faint">{sub}</span>}
      </div>
    </Card>
  );
}

export function EmptyState({ title, message, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-panel px-6 py-14 text-center">
      <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-inset text-muted">
        <Icon paths={['M5 12h14', 'M12 5v14']} size={18} />
      </span>
      <div className="text-[15px] font-semibold text-text">{title}</div>
      {message && <div className="max-w-md text-[13px] text-muted">{message}</div>}
      {children}
    </div>
  );
}

/** Divider label above a group of rows. */
export function SectionNote({ children }) {
  return (
    <div className="rounded-xl border border-border bg-inset px-4 py-3 text-[12.5px] text-muted">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ table */

/**
 * CSS-grid table. `cols` is a grid-template-columns string; header cells and
 * row cells must agree on count.
 */
export function GridTable({ cols, head, children, className, minWidth }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <div style={minWidth ? { minWidth } : undefined}>
          {head && (
            <div
              className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75"
              style={{ gridTemplateColumns: cols }}
            >
              {head.map((c, i) => {
                const label = typeof c === 'string' ? c : c.label;
                const align = typeof c === 'string' ? undefined : c.align;
                return (
                  <div
                    key={i}
                    className={cn(
                      'text-[11px] font-semibold uppercase tracking-[0.055em] text-muted',
                      align === 'right' && 'text-right'
                    )}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          )}
          <div>{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function GridRow({ cols, onClick, className, children }) {
  const onKeyDown = onClick
    ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }
    : undefined;
  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'grid items-center gap-3 border-b border-border px-4.5 py-3.25 last:border-b-0',
        onClick &&
          'cursor-pointer hover:bg-hover focus-visible:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
        className
      )}
      style={{ gridTemplateColumns: cols }}
    >
      {children}
    </div>
  );
}

/** Primary cell text, with an optional muted sub-line. */
export function Cell({ strong, muted, mono, align, sub, className, children }) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right', className)}>
      <div
        className={cn(
          'truncate text-[13px]',
          muted ? 'text-faint' : 'text-text',
          strong ? 'font-semibold' : 'font-normal',
          mono && 'font-mono'
        )}
      >
        {children}
      </div>
      {sub && <div className="truncate text-[11.5px] text-faint">{sub}</div>}
    </div>
  );
}
