import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { Badge, Card, PageHeader } from '../components/ui/index.jsx';
import { I, Icon } from '../lib/icons.jsx';
import { toneClass } from '../lib/tone.js';
import { cn } from '../lib/cn.js';

const loyaltyTiers = [
  { tier: 'Silver', rate: '1%', spend: '៛0+' },
  { tier: 'Gold', rate: '2%', spend: '៛500,000+' },
  { tier: 'Platinum', rate: '2.5%', spend: '៛1,500,000+' },
  { tier: 'Diamond', rate: '3%', spend: '៛5,000,000+' },
  { tier: 'Black Diamond', rate: '3%', spend: 'Invite only' },
];

const coinActivity = [
  { who: 'Phalla Nuon', act: 'Earned 62 coins', order: 'KIT-4832 · ៛31,200', time: '10:42', pos: true },
  { who: 'Visal Pen', act: 'Redeemed 100 coins', order: 'KIT-4825 · −៛10,000', time: '10:18', pos: false },
  { who: 'Sophea Chan', act: 'Earned 50 coins (2× points)', order: 'KIT-4821 · ៛24,800', time: '09:55', pos: true },
  { who: 'Dara Kim', act: 'Earned 21 coins', order: 'KIT-4822 · ៛42,000', time: '09:30', pos: true },
];

export default function Loyalty() {
  const p = usePortal();
  const { loyaltyMode = { id: 'B', contributionPercent: 2 }, setLoyaltyMode } = useDomain();
  const modes = [
    { id: 'A', contributionPercent: 0, title: 'Mode A · 0% contribution', desc: 'Local points configuration only' },
    { id: 'B', contributionPercent: 2, title: 'Mode B · 2% contribution', desc: '2% assigned to the local loyalty pool' },
  ];

  const chooseMode = (mode) => {
    setLoyaltyMode(mode);
    p.notify(`${mode.title} saved in this browser. No billing or loyalty provider was updated.`);
  };

  return (
    <div className="animate-kfade">
      {/* gold banner */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-gold bg-gold-bg px-4 py-3">
        <Icon paths={I.star} size={18} className="shrink-0 text-gold-fg" />
        <span className="text-[12.5px] text-gold-fg">
          <strong className="font-semibold">Local loyalty configuration</strong> — contribution mode
          changes persist in this browser. No billing or customer loyalty service is connected.
        </span>
      </div>

      <PageHeader
        title="Loyalty"
        subtitle="Browser-local loyalty settings with seed tier and activity analytics"
        freshness={`Current local mode: ${loyaltyMode.id} · ${loyaltyMode.contributionPercent || 0}% contribution`}
      />

      <div className="mb-3.5 grid gap-3.5" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <Card className="p-4.5">
          <div className="mb-3.5 text-[15px] font-semibold text-text">Tiers &amp; earn rates</div>
          {loyaltyTiers.map((t) => (
            <div
              key={t.tier}
              className="flex items-center gap-3 border-t border-border py-2.5"
            >
              <Badge tier={t.tier}>{t.tier}</Badge>
              <span className="flex-1 text-[12.5px] text-muted">{t.spend}</span>
              <span className="text-[13.5px] font-bold text-gold-fg">{t.rate}</span>
              <span className="text-[11.5px] text-faint">coins / spend</span>
            </div>
          ))}
        </Card>

        <div className="flex flex-col gap-3.5">
          <Card className="p-4.5">
            <div className="mb-3 text-[14px] font-semibold text-text">Contribution mode</div>
            <div className="mb-2 flex flex-col gap-2">
              {modes.map((mode) => {
                const active = loyaltyMode.id === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chooseMode(mode)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-[11px] border px-3.25 py-2.75 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)',
                      active
                        ? 'border-accent bg-[color-mix(in_srgb,var(--accent)_7%,var(--panel))]'
                        : 'border-border bg-panel hover:bg-hover'
                    )}
                  >
                    <span>
                      <span className="block text-[13px] font-semibold text-text">{mode.title}</span>
                      <span className="block text-[11.5px] text-muted">{mode.desc}</span>
                    </span>
                    {active && (
                      <Icon paths={I.check} size={18} strokeWidth={2.5} className="shrink-0 text-accent" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-[11.5px] text-faint">
              Saved locally only · customer balances and provider settlement are not connected
            </div>
          </Card>

          <Card className="p-4.5">
            <div className="mb-1 text-[12px] text-muted">Seed coin liability sample</div>
            <div className="text-[24px] font-bold tracking-[-0.02em] text-text">៛1,840,000</div>
            <div className="mt-0.5 text-[11.5px] text-faint">
              18,400 coins outstanding · ៛100 each
            </div>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4.5 pt-3.75 pb-2.5 text-[15px] font-semibold text-text">
          Seed coin activity sample · local-only analytics
        </div>
        {coinActivity.map((c) => (
          <div
            key={c.order}
            className="flex items-center gap-3 border-t border-border px-4.5 py-2.75"
          >
            <span
              className={cn(
                'flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg font-bold',
                toneClass(c.pos ? 'ok' : 'warn')
              )}
            >
              {c.pos ? '+' : '−'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-text">
                {c.who} · {c.act}
              </div>
              <div className="text-[11.5px] text-faint">{c.order}</div>
            </div>
            <span className="text-[11.5px] text-faint">{c.time}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
