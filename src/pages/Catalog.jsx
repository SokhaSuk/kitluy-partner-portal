import { useState } from 'react';
import { Badge, Button, Card, PageHeader, Tab, TextInput, Toggle } from '../components/ui/index.jsx';
import { I, Icon } from '../lib/icons.jsx';
import { khr } from '../lib/format.js';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';

const PLUS = ['M12 5v14', 'M5 12h14'];
const ADDON_COLS = '1.3fr 1fr 1.3fr .8fr .7fr';
const CAT_TABS = ['Services', 'Add-ons', 'Price History'];

export default function Catalog({ forcedTab = null }) {
  const p = usePortal();
  const activeTab = forcedTab || p.catTab;
  const {
    services: domainServices,
    addons,
    priceHistory,
    addService,
    addAddon,
    toggleAddon,
  } = useDomain();
  const [builder, setBuilder] = useState(null);
  const [draft, setDraft] = useState({ name: '', price: '', unit: '/ item', turnaround: '24h' });

  const saveBuilder = (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return p.notify('Enter a name first');
    if (builder === 'service') {
      const price = Number(draft.price);
      if (!Number.isFinite(price) || price < 0) return p.notify('Enter a valid price in KHR');
      addService({
        name,
        price,
        priceLabel: khr(price),
        unit: draft.unit,
        turnaround: draft.turnaround,
        weight: draft.unit === '/ kg',
        tag: draft.unit === '/ kg' ? 'Weight-priced' : 'Per item',
        icon: draft.unit === '/ kg' ? 'droplet' : 'tag',
      });
      p.notify(`${name} added to the service catalog`);
    } else {
      addAddon({ name, price: draft.price.trim() || 'Free', applies: 'All services', on: true });
      p.notify(`${name} add-on created`);
    }
    setDraft({ name: '', price: '', unit: '/ item', turnaround: '24h' });
    setBuilder(null);
  };
  const washService = domainServices.find((service) => service.name === 'Wash & Fold');
  const expressService = domainServices.find((service) => service.name === 'Express Wash');

  return (
    <div className="animate-kfade">
      <PageHeader title="Services & Pricing" subtitle="Services, prices, and turnaround saved in this browser · POS publishing needs a backend">
        <Button
          variant="primary"
          icon={PLUS}
          onClick={() => setBuilder((value) => (value === 'service' ? null : 'service'))}
        >
          Add service
        </Button>
      </PageHeader>

      {builder && (
        <Card className="mb-4 p-4">
          <form onSubmit={saveBuilder} className="grid gap-3 md:grid-cols-[1.3fr_1fr_.8fr_.8fr_auto]">
            <TextInput
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              placeholder={builder === 'service' ? 'Service name' : 'Add-on name'}
              aria-label="Catalog item name"
            />
            <TextInput
              value={draft.price}
              onChange={(event) => setDraft((value) => ({ ...value, price: event.target.value }))}
              placeholder={builder === 'service' ? 'Price in KHR' : 'e.g. ៛2,000 / order'}
              inputMode={builder === 'service' ? 'numeric' : 'text'}
              aria-label="Price"
            />
            {builder === 'service' ? (
              <>
                <select
                  value={draft.unit}
                  onChange={(event) => setDraft((value) => ({ ...value, unit: event.target.value }))}
                  className="rounded-[10px] border border-border bg-inset px-3 text-[13px] text-text"
                >
                  <option value="/ item">Per item</option>
                  <option value="/ kg">Per kg</option>
                  <option value="/ order">Per order</option>
                </select>
                <TextInput
                  value={draft.turnaround}
                  onChange={(event) => setDraft((value) => ({ ...value, turnaround: event.target.value }))}
                  placeholder="24h"
                  aria-label="Turnaround"
                />
              </>
            ) : (
              <div className="md:col-span-2" />
            )}
            <Button type="submit" variant="primary" className="justify-center">Save</Button>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-1">
        {CAT_TABS.map((t) => (
          <Tab
            key={t}
            active={activeTab === t}
            onClick={() => p.set({ storeTab: 'Services & Pricing', catTab: t })}
          >
            {t}
          </Tab>
        ))}
      </div>

      {activeTab === 'Services' && (
        <>
          <div className="mb-3.5 grid grid-cols-2 gap-3.5">
            {domainServices.map((sv) => (
              <div key={sv.name} className="rounded-[14px] border border-border bg-panel p-4.25 shadow-card">
                <div className="mb-3.5 flex items-start justify-between">
                  <div className="flex items-center gap-2.75">
                    <span className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                      <Icon paths={I[sv.icon] || I.tag} size={19} strokeWidth={1.9} />
                    </span>
                    <div>
                      <div className="text-[14.5px] font-semibold text-text">{sv.name}</div>
                      <div className="text-[11.5px] text-faint">{sv.items} orders this month</div>
                    </div>
                  </div>
                  <Badge tone={sv.weight ? 'info' : 'neutral'}>{sv.tag}</Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[23px] font-bold tracking-[-0.02em] text-text">{sv.priceLabel || khr(sv.price)}</span>
                    <span className="text-[12.5px] text-muted">{sv.unit}</span>
                  </div>
                  <span className="flex items-center gap-1.25 text-[12px] text-muted">
                    <Icon paths={I.clock} size={13} />
                    {sv.turnaround} turnaround
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[14px] border border-border bg-panel p-4.5 shadow-card">
            <div className="mb-1.5 flex items-center gap-2.75">
              <span className="flex h-8.5 w-8.5 items-center justify-center rounded-[9px] bg-info-bg text-info-fg">
                <Icon paths={I.droplet} size={17} />
              </span>
              <div>
                <div className="text-[14px] font-semibold text-text">Weight-based pricing</div>
                <div className="text-[12px] text-muted">USB scale at T1 reads kg → POS multiplies by ៛/kg automatically</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-[11px] border border-border p-3.25">
                <div className="mb-1 text-[12px] text-muted">Wash & Fold</div>
                <div className="text-[18px] font-bold text-text">
                  {washService?.priceLabel || khr(washService?.price || 0)}{' '}
                  <span className="text-[12px] font-normal text-muted">{washService?.unit || '/ kg'}</span>
                </div>
              </div>
              <div className="rounded-[11px] border border-border p-3.25">
                <div className="mb-1 text-[12px] text-muted">Express (+50%)</div>
                <div className="text-[18px] font-bold text-text">
                  {expressService?.priceLabel || khr(expressService?.price || 0)}{' '}
                  <span className="text-[12px] font-normal text-muted">{expressService?.unit || '/ kg'}</span>
                </div>
              </div>
              <div className="rounded-[11px] border border-border p-3.25">
                <div className="mb-1 text-[12px] text-muted">Minimum charge</div>
                <div className="text-[18px] font-bold text-text">៛8,000</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Add-ons' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4.5 py-3.25">
            <span className="text-[13px] text-muted">Optional extras cashiers can attach to any order line at the POS</span>
            <Button
              variant="default"
              icon={PLUS}
              className="shrink-0"
              onClick={() => setBuilder((value) => (value === 'addon' ? null : 'addon'))}
            >
              New add-on
            </Button>
          </div>
          <div
            className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75"
            style={{ gridTemplateColumns: ADDON_COLS }}
          >
            {['Add-on', 'Price', 'Applies to', 'Attach rate', 'Status'].map((h) => (
              <span key={h} className="text-[11.5px] font-semibold uppercase tracking-[0.03em] text-muted">
                {h}
              </span>
            ))}
          </div>
          {addons.map((a) => {
            return (
              <div
                key={a.name}
                className="grid items-center gap-3 border-b border-border px-4.5 py-3.25"
                style={{ gridTemplateColumns: ADDON_COLS }}
              >
                <span className="text-[13.5px] font-medium text-text">{a.name}</span>
                <span className="text-[13px] font-semibold text-text">{a.price}</span>
                <span className="text-[12.5px] text-muted">{a.applies}</span>
                <span className="text-[12.5px] text-muted">{a.rate} of orders</span>
                <span>
                  <Toggle on={a.on} onClick={() => toggleAddon(a.id)} />
                </span>
              </div>
            );
          })}
        </Card>
      )}

      {activeTab === 'Price History' && (
        <Card className="overflow-hidden">
          <div className="px-4.5 pt-3.5 pb-2 text-[13px] text-muted">
            Append-only log of price changes — the POS re-publishes automatically after each change
          </div>
          {priceHistory.map((pl) => (
            <div key={pl.service + pl.date} className="flex items-center gap-3 border-t border-border px-4.5 py-3">
              <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-inset text-muted">
                <Icon paths={I.tag} size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-text">
                  <strong className="font-semibold">{pl.service}</strong> · {pl.from} → {pl.to}
                </div>
                <div className="text-[11.5px] text-faint">Changed by {pl.by}</div>
              </div>
              <span className="rounded-full bg-gold-bg px-2 py-0.5 text-[11.5px] font-semibold text-gold-fg">{pl.pct}</span>
              <span className="w-21.5 shrink-0 text-right text-[11.5px] text-faint">{pl.date}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
