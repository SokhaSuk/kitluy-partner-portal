import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { khr } from '../lib/format.js';
import { I, Icon } from '../lib/icons.jsx';
import { METHOD } from '../lib/tone.js';
import { cn } from '../lib/cn.js';
import { Badge, Card, EmptyState, PageHeader, Toggle } from '../components/ui/index.jsx';

const KPI_TINT = [
  'bg-info-bg text-info-fg',
  'bg-purple-bg text-purple-fg',
  'bg-gold-bg text-gold-fg',
  'bg-ok-bg text-ok-fg',
];
const PAYMENT_LABELS = { cash: 'Cash', khqr: 'KHQR', coin: 'Loyalty points', tab: 'Tab (B2B)', split: 'Split payment' };
const ZCOLS = '1.1fr 1fr .6fr .9fr .9fr .8fr .7fr';

function financialOrders(orders) {
  return orders.filter((order) => order.status !== 'cancelled');
}

function paymentLedger(orders) {
  return orders.flatMap((order) => (order.payments || []).map((payment) => ({ ...payment, orderId: order.id })));
}

function Overview({ orders, storeSettings }) {
  const validOrders = financialOrders(orders);
  const payments = paymentLedger(validOrders);
  const gross = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const outstanding = payments.filter((payment) => payment.method === 'tab' && payment.when === 'Outstanding').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paidCount = new Set(payments.filter((payment) => payment.when === 'Recorded').map((payment) => payment.orderId)).size;
  const kpis = [
    { label: 'Recorded order value', value: khr(gross), delta: `${validOrders.length}`, icon: I.wallet, tint: 0, sub: 'non-cancelled orders in this dataset' },
    { label: 'Paid / in progress', value: String(paidCount), delta: `${orders.length} total`, icon: I.dollar, tint: 3, sub: 'orders beyond Created' },
    { label: 'Outstanding B2B tabs', value: khr(outstanding), delta: '', icon: I.receipt, tint: 2, sub: 'open tab-method orders' },
    { label: 'SaaS fee', value: khr(storeSettings.monthlyPlanFee || 0), delta: '/mo', icon: I.repeat, tint: 1, sub: `${storeSettings.commissionPercent || 0}% commission` },
  ];

  return (
    <div className="grid grid-cols-4 gap-3.5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-[14px] border border-border bg-panel p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.25">
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-[9px]', KPI_TINT[kpi.tint])}>
              <Icon paths={kpi.icon} size={16} />
            </span>
            <span className="text-[12.5px] text-muted">{kpi.label}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[21px] font-bold text-text">{kpi.value}</span>
            <span className="text-[12px] font-semibold text-muted">{kpi.delta}</span>
          </div>
          <div className="mt-1 text-[11.5px] text-faint">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}

function Reconciliation({ orders }) {
  const validOrders = financialOrders(orders);
  const payments = paymentLedger(validOrders).filter((payment) => payment.when === 'Recorded');
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const byMethod = Object.values(payments.reduce((groups, payment) => {
    const key = payment.method || 'unknown';
    groups[key] ||= { key, method: PAYMENT_LABELS[key] || METHOD[key] || key, count: 0, amount: 0 };
    groups[key].count += 1;
    groups[key].amount += Number(payment.amount || 0);
    return groups;
  }, {})).sort((a, b) => b.amount - a.amount);

  return byMethod.length ? (
    <Card className="overflow-hidden">
      <div className="px-4.5 pt-3.75 pb-2.5 text-[15px] font-semibold text-text">Recorded payments by method · saved ledger</div>
      {byMethod.map((row) => {
        const pct = total ? Math.round((row.amount / total) * 100) : 0;
        return (
          <div key={row.key} className="grid items-center gap-3.5 border-t border-border px-4.5 py-3.25" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr' }}>
            <span className="text-[13.5px] font-medium text-text">{row.method}</span>
            <span className="text-[12.5px] text-muted">{row.count} records</span>
            <div className="h-2 overflow-hidden rounded-md bg-inset"><div className="h-full rounded-md bg-accent" style={{ width: `${pct}%` }} /></div>
            <span className="text-right text-[13.5px] font-semibold text-text">{khr(row.amount)}</span>
          </div>
        );
      })}
    </Card>
  ) : <EmptyState title="No payment data" message="Non-cancelled orders will appear in reconciliation." />;
}

function Settings({ paymentOptions, setPaymentOption }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4.5 pt-3.5 pb-2 text-[13px] text-muted">Local payment-option configuration · no POS checkout is connected</div>
      {paymentOptions.map((option) => (
        <div key={option.id || option.label} className="flex items-center gap-3.5 border-t border-border px-4.5 py-3.5">
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold text-text">{option.label}</div>
            <div className="text-[12px] text-muted">{option.desc}</div>
          </div>
          <Toggle on={option.on} onClick={() => setPaymentOption(option.id || option.label, !option.on)} />
        </div>
      ))}
    </Card>
  );
}

function ShiftFinance({ orders, members }) {
  const validOrders = financialOrders(orders);
  const payments = paymentLedger(validOrders).filter((payment) => payment.when === 'Recorded');
  const cash = payments.filter((payment) => payment.method === 'cash').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const khqr = payments.filter((payment) => payment.method === 'khqr').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const responsible = members.find((member) => member.role === 'Manager')?.name || members[0]?.name || 'Not assigned';
  const cashRows = [
    { label: 'Recorded cash sales', value: khr(cash) },
    { label: 'Counted drawer', value: 'Not recorded' },
    { label: 'Variance', value: 'Not available' },
  ];

  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
      <Card className="p-4.5">
        <div className="text-[15px] font-semibold text-text">Cash drawer · current data</div>
        <div className="mb-2.5 text-[12.5px] text-muted">No physical drawer count has been entered</div>
        {cashRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-t border-border py-2.5">
            <span className="text-[13px] text-muted">{row.label}</span>
            <span className="text-[13.5px] font-semibold text-text">{row.value}</span>
          </div>
        ))}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4.5 pt-3.75 pb-2.5 text-[15px] font-semibold text-text">
          Operational summary <span className="text-[12px] font-normal text-faint">· derived from saved orders</span>
        </div>
        <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: ZCOLS }}>
          {['Scope', 'Responsible', 'Orders', 'Cash', 'KHQR', 'Variance', 'Status'].map((heading) => (
            <span key={heading} className="text-[11.5px] font-semibold uppercase tracking-[0.03em] text-muted">{heading}</span>
          ))}
        </div>
        <div className="grid items-center gap-3 border-b border-border px-4.5 py-3" style={{ gridTemplateColumns: ZCOLS }}>
          <span className="text-[13px] font-medium text-text">All saved</span>
          <span className="text-[12.5px] text-muted">{responsible}</span>
          <span className="text-[12.5px] text-muted">{validOrders.length}</span>
          <span className="text-[13px] text-text">{khr(cash)}</span>
          <span className="text-[13px] text-text">{khr(khqr)}</span>
          <span className="text-[13px] text-muted">Not counted</span>
          <span><Badge tone="info">Open</Badge></span>
        </div>
      </Card>
    </div>
  );
}

export default function Finance({ forcedTab = null }) {
  const p = usePortal();
  const { orders, members, paymentOptions, setPaymentOption, storeSettings } = useDomain();
  const activeTab = forcedTab || p.finTab;
  return (
    <div className="animate-kfade">
      <PageHeader title="Finance" subtitle="Operational totals derived from the orders saved in this portal" />
      {activeTab === 'Overview' && <Overview orders={orders} storeSettings={storeSettings} />}
      {activeTab === 'Reconciliation' && <Reconciliation orders={orders} />}
      {activeTab === 'Shift Finance' && <ShiftFinance orders={orders} members={members} />}
      {activeTab === 'Settings' && <Settings paymentOptions={paymentOptions} setPaymentOption={setPaymentOption} />}
    </div>
  );
}
