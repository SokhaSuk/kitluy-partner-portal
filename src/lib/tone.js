// Tone -> utility classes. Tailwind only sees class names that appear as
// literals in source, so these maps are spelled out rather than interpolated.

export const TONE = {
  ok: 'bg-ok-bg text-ok-fg',
  warn: 'bg-warn-bg text-warn-fg',
  danger: 'bg-danger-bg text-danger-fg',
  info: 'bg-info-bg text-info-fg',
  purple: 'bg-purple-bg text-purple-fg',
  gold: 'bg-gold-bg text-gold-fg',
  neutral: 'bg-neutral-bg text-neutral-fg',
};

/** Foreground-only, e.g. a status dot or a value that carries the tone. */
export const TONE_FG = {
  ok: 'text-ok-fg',
  warn: 'text-warn-fg',
  danger: 'text-danger-fg',
  info: 'text-info-fg',
  purple: 'text-purple-fg',
  gold: 'text-gold-fg',
  neutral: 'text-neutral-fg',
};

export const TONE_DOT = {
  ok: 'bg-ok-fg',
  warn: 'bg-warn-fg',
  danger: 'bg-danger-fg',
  info: 'bg-info-fg',
  purple: 'bg-purple-fg',
  gold: 'bg-gold-fg',
  neutral: 'bg-neutral-fg',
};

export const toneClass = (tone) => TONE[tone] || TONE.neutral;
export const toneFg = (tone) => TONE_FG[tone] || TONE_FG.neutral;
export const toneDot = (tone) => TONE_DOT[tone] || TONE_DOT.neutral;

/** Customer tiers. "Black Diamond" has no design token — it is a literal pair. */
export const TIER = {
  Silver: TONE.neutral,
  Gold: TONE.gold,
  Platinum: TONE.info,
  Diamond: TONE.purple,
  'Black Diamond': 'bg-[#1f2937] text-[#e5e7eb]',
  B2B: TONE.ok,
};

export const tierClass = (tier) => TIER[tier] || TIER.Silver;

/** Order status -> the tone its pill uses. Mirrors `ST` in data/status.js. */
export const STATUS_TONE = {
  created: 'info',
  paid: 'info',
  processing: 'purple',
  ready: 'gold',
  collected: 'ok',
  completed: 'ok',
  cancelled: 'danger',
};

export const METHOD = {
  cash: 'Cash',
  khqr: 'KHQR',
  aba: 'ABA',
  card: 'Card',
  coin: 'Coins',
  split: 'Split',
  tab: 'Tab',
  deposit: 'Deposit',
};
