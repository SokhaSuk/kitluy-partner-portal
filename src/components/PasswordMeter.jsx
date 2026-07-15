import { cn } from '../lib/cn.js';
import { Icon } from '../lib/icons.jsx';
import { PASSWORD_RULES, passwordScore } from '../lib/validate.js';

const BAR = {
  neutral: 'bg-border-strong',
  danger: 'bg-danger-fg',
  warn: 'bg-warn-fg',
  info: 'bg-info-fg',
  ok: 'bg-ok-fg',
};

const TEXT = {
  danger: 'text-danger-fg',
  warn: 'text-warn-fg',
  info: 'text-info-fg',
  ok: 'text-ok-fg',
};

const CHECK = ['M20 6 9 17l-5-5'];
const DASH = ['M5 12h14'];

/** Four-bar strength gauge plus the live rule checklist. Hidden until typing starts. */
export default function PasswordMeter({ value = '' }) {
  const { score, label, tone, hits } = passwordScore(value);
  if (!value) return null;

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i < score ? BAR[tone] : BAR.neutral
              )}
            />
          ))}
        </div>
        <span
          aria-live="polite"
          className={cn('w-12 text-right text-[11.5px] font-semibold', TEXT[tone] || 'text-faint')}
        >
          {label}
        </span>
      </div>

      <ul className="mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
        {PASSWORD_RULES.map((rule) => {
          const met = hits.includes(rule.key);
          return (
            <li
              key={rule.key}
              className={cn(
                'flex items-center gap-1.25 text-[11.5px]',
                met ? 'font-medium text-ok-fg' : 'text-faint'
              )}
            >
              <Icon paths={met ? CHECK : DASH} size={11} strokeWidth={2.6} />
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
