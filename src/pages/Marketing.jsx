import { I } from '../lib/icons.jsx';
import { khr } from '../lib/format.js';
import { Badge, Button, Card, GridRow, GridTable, Kpi, PageHeader, Tab, Toggle } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';

const PLUS = ['M12 5v14', 'M5 12h14'];

const MKT_TABS = ['Promo Codes', 'Automated Flows', 'In-store Offers', 'Analytics'];

const PROMO_COLS = '1.1fr 1fr 1.1fr 1fr 1fr 0.7fr';

export default function Marketing() {
  const p = usePortal();
  const {
    promotions,
    marketingFlows,
    offers,
    toggleMarketingFlow,
    toggleOffer,
  } = useDomain();
  const tab = p.mktTab;
  const promoRows = promotions || [];
  const flowRows = marketingFlows || [];
  const offerRows = offers || [];
  const redemptions = promoRows.reduce((sum, promo) => sum + Number(promo.used || 0), 0);
  const promoRevenue = promoRows.reduce((sum, promo) => sum + Number(promo.revenue || 0), 0);
  const flowMessages = flowRows.reduce((sum, flow) => sum + Number(flow.sent || 0), 0);
  const liveOffers = offerRows.filter((offer) => offer.on).length;
  const kpis = [
    { label: 'Redemptions', value: String(redemptions), sub: `${promoRows.length} promo codes`, icon: I.tag, tint: 0 },
    { label: 'Promo revenue', value: khr(promoRevenue), sub: 'Recorded redemptions', icon: I.wallet, tint: 3 },
    { label: 'Seed flow messages', value: String(flowMessages), sub: `${flowRows.filter((flow) => flow.on).length} flows enabled locally`, icon: I.chat, tint: 1 },
    { label: 'Enabled offers', value: String(liveOffers), sub: `${offerRows.length} configured locally`, icon: I.target, tint: 2 },
  ];

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Marketing"
        subtitle="Browser-local promotion and offer configuration · no delivery or POS publishing service is connected"
      >
        <Button
          variant="primary"
          icon={PLUS}
          onClick={() => p.set({ page: 'promocreate', nav: 'marketing' })}
        >
          New promo code
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-1">
        {MKT_TABS.map((t) => (
          <Tab key={t} active={tab === t} onClick={() => p.set({ mktTab: t })}>
            {t}
          </Tab>
        ))}
      </div>

      {tab === 'Promo Codes' && (
        <GridTable cols={PROMO_COLS} head={['Code', 'Discount', 'Applies to', 'Used', 'Revenue', 'Status']}>
          {promoRows.map((promo) => (
            <GridRow key={promo.id || promo.code} cols={PROMO_COLS}>
              <span className="truncate font-mono text-[13px] font-semibold text-accent">{promo.code}</span>
              <span className="text-[13px] text-text">{promo.type}</span>
              <span className="text-[12.5px] text-muted">{promo.applies}</span>
              <span className="text-[12.5px] text-muted">
                {promo.limit ? promo.used + ' / ' + promo.limit : promo.used + ' used'}
              </span>
              <span className="text-[13px] font-semibold text-text">{khr(promo.revenue)}</span>
              <span>
                <Badge tone={promo.status === 'Active' ? 'ok' : 'neutral'}>{promo.status}</Badge>
              </span>
            </GridRow>
          ))}
        </GridTable>
      )}

      {tab === 'Automated Flows' && (
        <Card className="overflow-hidden">
          <div className="px-4.5 pt-3.5 pb-2 text-[13px] text-muted">
            {flowRows.length} trigger-based flows · {flowRows.filter((flow) => flow.on).length} enabled
          </div>
          {flowRows.map((f) => (
            <div key={f.id || f.type} className="flex items-center gap-3.5 border-t border-border px-4.5 py-3.25">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-text">{f.type}</div>
                <div className="text-[12px] text-muted">{f.desc}</div>
              </div>
              <span className="text-[12px] text-faint">{f.sent} seed sends</span>
              <Toggle
                on={f.on}
                onClick={() => {
                  toggleMarketingFlow(f.id || f.type, !f.on);
                  p.notify(`${f.type} ${f.on ? 'paused' : 'enabled'}`);
                }}
                aria-label={`${f.on ? 'Pause' : 'Enable'} ${f.type}`}
              />
            </div>
          ))}
        </Card>
      )}

      {tab === 'In-store Offers' && (
        <div className="grid grid-cols-2 gap-3.5">
          {offerRows.map((o) => (
            <Card key={o.id || o.type} className="flex items-center justify-between gap-3 rounded-[13px] p-4">
              <div>
                <div className="text-[14px] font-semibold text-text">{o.type}</div>
                <div className="text-[12.5px] text-muted">{o.desc}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge tone={o.on ? 'ok' : 'neutral'}>{o.on ? 'Enabled locally' : 'Off'}</Badge>
                <Toggle
                  on={o.on}
                  onClick={() => {
                    toggleOffer(o.id || o.type, !o.on);
                    p.notify(`${o.type} ${o.on ? 'turned off' : 'enabled locally'}`);
                  }}
                  aria-label={`${o.on ? 'Turn off' : 'Turn on'} ${o.type}`}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'Analytics' && (
        <div className="grid grid-cols-4 gap-3.5">
          {kpis.map((k) => (
            <Kpi
              key={k.label}
              label={k.label}
              value={k.value}
              sub={k.sub}
              icon={k.icon}
              tint={k.tint}
            />
          ))}
        </div>
      )}
    </div>
  );
}
