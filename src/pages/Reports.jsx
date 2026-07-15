import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { I } from '../lib/icons.jsx';
import { khr } from '../lib/format.js';
import { downloadCsv } from '../lib/export.js';
import { PageHeader, Card, Button, EmptyState, Kpi } from '../components/ui/index.jsx';
import { MiniBar } from '../charts/MiniBar.jsx';

const HEAD = 'text-[11.5px] font-semibold uppercase tracking-[0.03em] text-muted';
const STATUS_LABELS = { created: 'Created', paid: 'Paid', processing: 'Processing', ready: 'Ready', collected: 'Collected', completed: 'Completed', cancelled: 'Cancelled' };
const METHOD_LABELS = { khqr: 'KHQR', cash: 'Cash', tab: 'Tab (B2B)', coin: 'Loyalty points', split: 'Split payment' };

function groupOrders(orders, keyName, labelMap = {}) {
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return Object.values(orders.reduce((groups, order) => {
    const key = order[keyName] || 'Unknown';
    groups[key] ||= { key, label: labelMap[key] || key, orders: 0, amount: 0 };
    groups[key].orders += 1;
    groups[key].amount += Number(order.total || 0);
    return groups;
  }, {}))
    .map((row) => ({ ...row, pct: total ? Math.round((row.amount / total) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

function exportRows(tab, domain) {
  const validOrders = domain.orders.filter((order) => order.status !== 'cancelled');
  if (tab === 'Services') return groupOrders(validOrders, 'service');
  if (tab === 'Payments') return groupOrders(validOrders, 'method', METHOD_LABELS);
  if (tab === 'Staff') return domain.members.map((member) => {
    const shift = domain.shifts.find((row) => row.name === member.name);
    const attendance = domain.attendance.find((row) => row.name === member.name);
    return { name: member.name, role: member.role, contact: member.contact, shift: shift ? `${shift.time} · ${shift.status}` : 'Not scheduled', attendance: attendance?.status || 'No record', active: member.active };
  });
  if (tab === 'Issues & Rewash') return domain.productionExceptions;
  return validOrders.map((order) => ({ code: order.code, customer: order.customer, status: order.status, service: order.service, total: order.total }));
}

export default function Reports() {
  const p = usePortal();
  const domain = useDomain();
  const validOrders = domain.orders.filter((order) => order.status !== 'cancelled');
  const tabs = {
    Sales: <SalesTab orders={domain.orders} />,
    Services: <MixTab title="Order value by service · non-cancelled saved orders" rows={groupOrders(validOrders, 'service')} />,
    Payments: <MixTab title="Orders by payment method · non-cancelled saved orders" rows={groupOrders(validOrders, 'method', METHOD_LABELS)} />,
    Staff: <StaffTab members={domain.members} shifts={domain.shifts} attendance={domain.attendance} />,
    'Issues & Rewash': <IssuesTab exceptions={domain.productionExceptions} />,
  };

  const exportCurrent = () => {
    const rows = exportRows(p.repTab, domain);
    downloadCsv(`kitluy-${p.repTab.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}.csv`, rows);
    p.notify(`Exported ${rows.length} ${p.repTab.toLowerCase()} rows`);
  };

  return (
    <div className="animate-kfade">
      <PageHeader title="Reports" subtitle="Reports calculated from the data currently saved in this portal">
        <Button variant="default" icon={I.download} onClick={exportCurrent}>Export current CSV</Button>
      </PageHeader>
      {tabs[p.repTab] || <EmptyState title="Report unavailable" message="Choose a report from the navigation." />}
    </div>
  );
}

function SalesTab({ orders }) {
  const valid = orders.filter((order) => order.status !== 'cancelled');
  const gross = valid.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const average = valid.length ? Math.round(gross / valid.length) : 0;
  const open = valid.filter((order) => !['collected', 'completed'].includes(order.status)).length;
  const largest = valid.reduce((max, order) => Math.max(max, Number(order.total || 0)), 0);
  const kpis = [
    { label: 'Recorded order value', value: khr(gross), icon: I.wallet, tint: 0, sub: `${valid.length} non-cancelled orders` },
    { label: 'Average order', value: khr(average), icon: I.receipt, tint: 1, sub: 'across saved orders' },
    { label: 'Open orders', value: String(open), icon: I.calendar, tint: 2, sub: 'not collected or completed' },
    { label: 'Largest order', value: khr(largest), icon: I.dollar, tint: 3, sub: 'highest saved total' },
  ];
  const rows = groupOrders(valid, 'status', STATUS_LABELS);
  const cols = '1.4fr .7fr 1fr 2fr .6fr';

  return (
    <>
      <div className="mb-3.5 grid grid-cols-4 gap-3.5">
        {kpis.map((kpi) => <Kpi key={kpi.label} {...kpi} />)}
      </div>
      <Card className="overflow-hidden">
        <div className="px-4.5 pt-3.75 pb-2.5 text-[15px] font-semibold text-text">Sales grouped by current order status</div>
        <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: cols }}>
          {['Status', 'Orders', 'Amount', 'Share', '%'].map((heading) => <span key={heading} className={HEAD}>{heading}</span>)}
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid items-center gap-3 border-b border-border px-4.5 py-3" style={{ gridTemplateColumns: cols }}>
            <span className="text-[13px] font-medium text-text">{row.label}</span>
            <span className="text-[12.5px] text-muted">{row.orders}</span>
            <span className="text-[13px] font-semibold text-text">{khr(row.amount)}</span>
            <MiniBar value={row.pct} max={100} />
            <span className="text-right text-[12.5px] text-muted">{row.pct}%</span>
          </div>
        ))}
      </Card>
    </>
  );
}

function MixTab({ title, rows }) {
  const cols = '1.1fr .7fr 2fr .9fr .5fr';
  return rows.length ? (
    <Card className="overflow-hidden">
      <div className="px-4.5 pt-3.75 pb-2.5 text-[15px] font-semibold text-text">{title}</div>
      {rows.map((row) => (
        <div key={row.key} className="grid items-center gap-3.5 border-t border-border px-4.5 py-3.25" style={{ gridTemplateColumns: cols }}>
          <span className="text-[13.5px] font-medium text-text">{row.label}</span>
          <span className="text-[12.5px] text-muted">{row.orders} orders</span>
          <MiniBar value={row.pct} max={100} />
          <span className="text-right text-[13.5px] font-semibold text-text">{khr(row.amount)}</span>
          <span className="text-right text-[12.5px] text-muted">{row.pct}%</span>
        </div>
      ))}
    </Card>
  ) : <EmptyState title="No report data" message="Orders will appear here once recorded." />;
}

function StaffTab({ members, shifts, attendance }) {
  const cols = '1.4fr .9fr 1.1fr 1fr 1fr';
  return members.length ? (
    <Card className="overflow-hidden">
      <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: cols }}>
        {['Staff', 'Role', 'Contact', 'Current shift', 'Attendance'].map((heading) => <span key={heading} className={HEAD}>{heading}</span>)}
      </div>
      {members.map((member) => {
        const shift = shifts.find((row) => row.name === member.name);
        const attend = attendance.find((row) => row.name === member.name);
        const initials = member.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div key={member.id || member.name} className="grid items-center gap-3 border-b border-border px-4.5 py-3 last:border-b-0" style={{ gridTemplateColumns: cols }}>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--purple))] text-[11px] font-semibold text-white">{initials}</span>
              <span className="text-[13.5px] font-medium text-text">{member.name}</span>
            </div>
            <span className="text-[12.5px] text-muted">{member.role}</span>
            <span className="text-[12.5px] text-muted">{member.contact}</span>
            <span className="text-[12.5px] text-muted">{shift ? `${shift.time} · ${shift.status}` : 'Not scheduled'}</span>
            <span className="text-[12.5px] text-muted">{attend?.status || 'No record'}</span>
          </div>
        );
      })}
    </Card>
  ) : <EmptyState title="No team members" message="Add a member to populate this report." />;
}

function IssuesTab({ exceptions }) {
  const cols = '1fr 1fr 1.4fr 1fr .9fr';
  return exceptions.length ? (
    <Card className="overflow-hidden">
      <div className="px-4.5 pt-3.5 pb-2 text-[13px] text-muted">Production exceptions currently saved in the portal</div>
      <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: cols }}>
        {['Order', 'Reason', 'Item', 'Station', 'Status'].map((heading) => <span key={heading} className={HEAD}>{heading}</span>)}
      </div>
      {exceptions.map((exception) => (
        <div key={exception.id || exception.code} className="grid items-center gap-3 border-b border-border px-4.5 py-3 last:border-b-0" style={{ gridTemplateColumns: cols }}>
          <span className="font-mono text-[12.5px] text-text">{exception.code}</span>
          <span className="text-[13px] text-text">{exception.reason}</span>
          <span className="text-[12.5px] text-muted">{exception.item}</span>
          <span className="text-[12.5px] text-muted">{exception.station}</span>
          <span className="text-[12.5px] font-semibold text-text">{exception.status.replace('_', ' ')}</span>
        </div>
      ))}
    </Card>
  ) : <EmptyState title="No production issues" message="The exception report is clear." />;
}
