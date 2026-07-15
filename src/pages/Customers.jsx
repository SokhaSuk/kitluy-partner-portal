import { useState } from 'react';
import { cn } from '../lib/cn.js';
import { khr } from '../lib/format.js';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  GridRow,
  GridTable,
  PageHeader,
  SearchInput,
  Tab,
  TextInput,
} from '../components/ui/index.jsx';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePartnerCustomers } from '../store/usePartnerCustomers.js';

const COLS = '1.8fr .8fr .7fr 1fr .9fr .8fr';

const CUST_TABS = ['All', 'B2C', 'B2B'];

export default function Customers({ forcedTab = null, heading = 'Customers' }) {
  const p = usePortal();
  const activeTab = forcedTab || p.custTab;
  const { customerPreferences } = useDomain();
  // Customers (read + write) come from the backend when configured, local otherwise.
  const { customers, addCustomer, source } = usePartnerCustomers();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', phone: '', type: forcedTab === 'B2B' ? 'B2B' : 'B2C' });

  const q = p.custSearch.toLowerCase();
  const rows = customers.filter((c) => {
    // phone is masked-out of the backend list, so guard it.
    const okq = !q || c.name.toLowerCase().includes(q) || (c.phone || '').includes(q);
    return okq && (activeTab === 'All' || c.type === activeTab);
  });

  const showB2B = activeTab !== 'B2C';

  const b2bAccounts = customers.filter((c) => c.type === 'B2B').map((c) => ({
    id: c.id,
    name: c.name,
    limit: khr(2000000),
    balance: khr(c.tabBalance ?? 0),
    pct: Math.min(100, Math.round(((c.tabBalance ?? 0) / (c.creditLimit || 2000000)) * 100)),
    period: c.settlementPeriod || 'Monthly',
    overdue: !!c.tabOverdue,
    statusLabel: c.tabOverdue ? 'Overdue' : 'Current',
  }));

  const savedPrefs = Object.entries(customerPreferences || {})
    .flatMap(([cust, preferences]) =>
      (preferences || []).map((preference) => ({ ...preference, cust }))
    )
    .slice(0, 6);

  const submitCustomer = async (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    const phone = draft.phone.trim();
    if (!name || !phone) {
      p.notify('Enter the customer name and phone number');
      return;
    }
    // The backend allows shared phones by design (D-12); only guard duplicates
    // locally, where the phone is actually visible on the list.
    if (
      source === 'local' &&
      customers.some((customer) => (customer.phone || '').replace(/\s/g, '') === phone.replace(/\s/g, ''))
    ) {
      p.notify('A customer with this phone number already exists');
      return;
    }
    try {
      await addCustomer({
        name,
        phone,
        type: draft.type,
        tier: draft.type === 'B2B' ? 'B2B' : 'Silver',
        orders: 0,
        spend: 0,
        coins: 0,
        last: 'New',
        joined: new Date().toISOString().slice(0, 10),
        ...(draft.type === 'B2B'
          ? { creditLimit: 2000000, tabBalance: 0, settlementPeriod: 'Monthly' }
          : {}),
      });
      setDraft({ name: '', phone: '', type: forcedTab === 'B2B' ? 'B2B' : 'B2C' });
      setAdding(false);
      p.notify(`${name} added${source === 'backend' ? ' · synced' : ''}`);
    } catch (error) {
      p.notify(error?.message || 'That customer could not be saved.');
    }
  };

  return (
    <div className="animate-kfade">
      <PageHeader
        title={heading}
        subtitle={
          source === 'backend'
            ? 'Live · synced with your store across web and mobile'
            : 'Browser-local customer records shared across the portal'
        }
      >
        <Button
          variant="primary"
          icon={['M12 5v14', 'M5 12h14']}
          onClick={() => setAdding((value) => !value)}
        >
          {forcedTab === 'B2B' ? 'Add B2B account' : 'Add customer'}
        </Button>
      </PageHeader>

      {adding && (
        <Card className="mb-3.5 p-4">
          <form onSubmit={submitCustomer} className="grid gap-3 md:grid-cols-[1.2fr_1fr_.7fr_auto]">
            <TextInput
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              placeholder="Customer or business name"
              aria-label="Customer name"
            />
            <TextInput
              value={draft.phone}
              onChange={(event) => setDraft((value) => ({ ...value, phone: event.target.value }))}
              placeholder="Phone number"
              aria-label="Phone number"
            />
            <select
              value={draft.type}
              onChange={(event) => setDraft((value) => ({ ...value, type: event.target.value }))}
              disabled={forcedTab === 'B2B'}
              className="rounded-[10px] border border-border bg-inset px-3 py-2 text-[13px] text-text outline-none focus:border-accent"
              aria-label="Customer type"
            >
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
            <Button type="submit" variant="primary" className="justify-center">
              Save customer
            </Button>
          </form>
        </Card>
      )}

      <div className="mb-3.5 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {CUST_TABS.map((t) => (
            <Tab
              key={t}
              active={activeTab === t}
              onClick={() => p.set({ page: 'customers', nav: 'customers', custTab: t })}
            >
              {t === 'All' ? 'All customers' : t}
            </Tab>
          ))}
        </div>
        <div className="flex-1" />
        <SearchInput
          value={p.custSearch}
          onChange={(e) => p.set({ custSearch: e.target.value })}
          placeholder="Search name or phone…"
          className="min-w-55"
        />
      </div>

      {rows.length > 0 ? (
        <GridTable
          className="mb-3.5"
          cols={COLS}
          head={['Customer', 'Tier', 'Orders', 'Lifetime', 'Coins', 'Last']}
        >
          {rows.map((c) => (
          <GridRow
            key={c.id}
            cols={COLS}
            onClick={() =>
              p.set({ page: 'custdetail', custDetailId: c.id, nav: 'customers' })
            }
          >
            <div className="flex min-w-0 items-center gap-2.75">
              <Avatar name={c.name} tier={c.tier} className="h-8 w-8" />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-text">{c.name}</div>
                <div className="text-[11.5px] text-faint">{c.phone}</div>
              </div>
            </div>
            <div>
              <Badge tier={c.tier}>{c.tier}</Badge>
            </div>
            <div className="text-[13px] text-text">{c.orders}</div>
            <div className="text-[13px] font-semibold text-text">{khr(c.spend)}</div>
            <div className="text-[12.5px] text-gold-fg">
              {c.type === 'B2B' ? '—' : c.coins + ' ⭐'}
            </div>
            <div className="text-[12.5px] text-muted">{c.last}</div>
          </GridRow>
          ))}
        </GridTable>
      ) : (
        <EmptyState
          title="No customers match these filters"
          message="Clear the search or switch customer type to see saved customers."
        >
          <Button className="mt-2" onClick={() => p.set({ page: 'customers', nav: 'customers', custSearch: '', custTab: 'All' })}>
            Clear filters
          </Button>
        </EmptyState>
      )}

      {showB2B && (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <Card className="overflow-hidden">
            <div className="px-4.5 pb-2.5 pt-3.75 text-[15px] font-semibold text-text">
              B2B accounts &amp; tabs
            </div>
            {b2bAccounts.map((b) => (
              <div key={b.id} className="border-t border-border px-4.5 py-3.25">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-[13.5px] font-semibold text-text">{b.name}</div>
                    <div className="text-[11.5px] text-faint">
                      {b.period} settlement · limit {b.limit}
                    </div>
                  </div>
                  <Badge tone={b.overdue ? 'danger' : 'ok'}>{b.statusLabel}</Badge>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 flex-1 overflow-hidden rounded-md bg-inset">
                    <div
                      className={cn('h-full rounded-md', b.overdue ? 'bg-danger-fg' : 'bg-ok-fg')}
                      style={{ width: b.pct + '%' }}
                    />
                  </div>
                  <span className="text-[12.5px] font-semibold text-text">{b.balance}</span>
                </div>
              </div>
            ))}
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4.5 pb-2.5 pt-3.75 text-[15px] font-semibold text-text">
              Saved preferences{' '}
              <span className="text-[12px] font-normal text-faint">· stored locally for order entry</span>
            </div>
            {savedPrefs.map((pref, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 border-t border-border px-4.5 py-2.75"
              >
                <div>
                  <div className="text-[13px] text-text">{pref.value}</div>
                  <div className="text-[11.5px] text-faint">
                    {pref.key} · {pref.cust}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
