import { I, Icon } from '../lib/icons.jsx';
import { khr } from '../lib/format.js';
import { cn } from '../lib/cn.js';
import { toneClass } from '../lib/tone.js';
import { Badge, Button, Card, GridRow, PageHeader, Toggle } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';

const PO_TONE = { Draft: 'neutral', Ordered: 'info', Partial: 'gold', Received: 'ok' };
const ADJ_TONE = { Damage: 'danger', Waste: 'warn', Recount: 'info', Loss: 'danger' };
const MOVE_KIND = {
  receipt: { icon: I.box, tone: 'ok' },
  usage: { icon: I.droplet, tone: 'info' },
  adjust: { icon: I.swap, tone: 'warn' },
  count: { icon: I.clipboard, tone: 'purple' },
};
const KPI_TINT = [
  'bg-info-bg text-info-fg',
  'bg-purple-bg text-purple-fg',
  'bg-gold-bg text-gold-fg',
  'bg-ok-bg text-ok-fg',
];
const ITEM_COLS = '1.6fr 1fr 1fr 1fr 1fr .8fr';
const PO_COLS = '.8fr 1.2fr 1.7fr .8fr 1fr .8fr';
const COUNT_COLS = '.7fr 1.5fr 1fr .8fr 1fr .8fr';

const inventoryToggleMeta = [
  {
    key: 'deduct',
    label: 'Auto-deduct on order completion',
    desc: 'Service recipes deduct supplies when an order is marked Ready',
  },
  {
    key: 'negative',
    label: 'Allow negative stock',
    desc: 'Record usage below zero and flag it for a recount',
  },
  {
    key: 'alerts',
    label: 'Low-stock alerts',
    desc: 'Enable low-stock alerts for items below their reorder point',
  },
];

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function BarButton({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 items-center gap-1.75 rounded-[9px] border border-border bg-panel px-3 py-1.75 text-[12.5px] font-semibold text-text transition-colors hover:bg-hover">
      {children}
    </button>
  );
}

function TableHead({ cols, labels }) {
  return (
    <div className="grid items-center gap-3 border-b border-border bg-panel-2 px-4.5 py-2.75" style={{ gridTemplateColumns: cols }}>
      {labels.map((label) => (
        <span key={label} className="text-[11.5px] font-semibold tracking-[0.03em] text-muted uppercase">{label}</span>
      ))}
    </div>
  );
}

function IconChip({ paths, className, size = 14, box = 'h-7.5 w-7.5 rounded-lg' }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center', box, className)}>
      <Icon paths={paths} size={size} />
    </span>
  );
}

function itemView(item) {
  const quantity = Number(item.quantity ?? Number.parseFloat(item.stock) ?? 0);
  const usageRate = Number.parseFloat(String(item.usage || ''));
  const computedDays = usageRate > 0 ? Math.max(0, Math.floor(quantity / usageRate)) : Number(item.days || 0);
  const critical = computedDays <= 3;
  const low = computedDays <= 9;
  return {
    ...item,
    stock: item.stock || `${quantity} ${item.unit || ''}`.trim(),
    daysValue: computedDays,
    daysLabel: `${computedDays} days`,
    status: critical ? 'Critical' : low ? 'Low' : 'OK',
    tone: critical ? 'danger' : low ? 'gold' : 'ok',
    dotClass: critical ? 'bg-danger-fg' : low ? 'bg-gold' : 'bg-ok-fg',
  };
}

function movementView(move) {
  const kind = MOVE_KIND[move.kind] || MOVE_KIND.adjust;
  return {
    ...move,
    icon: kind.icon,
    tone: kind.tone,
    qtyClass: String(move.qty || '').startsWith('+') ? 'text-ok-fg' : 'text-danger-fg',
  };
}

function AdjustmentRow({ adjustment }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4.5 py-3 last:border-b-0">
      <span className={cn('flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg font-bold', adjustment.neg ? 'bg-warn-bg text-warn-fg' : 'bg-ok-bg text-ok-fg')}>
        {adjustment.neg ? '−' : '+'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-text">{adjustment.item} · {adjustment.change}</div>
        <div className="text-[11.5px] text-faint">{adjustment.note || 'No note'} · by {adjustment.by || 'Portal user'}</div>
      </div>
      <Badge tone={ADJ_TONE[adjustment.reason] || 'neutral'}>{adjustment.reason}</Badge>
      <span className="w-24 shrink-0 text-right text-[11.5px] text-faint">{adjustment.time || 'Just now'}</span>
    </div>
  );
}

function MovementRows({ rows, compact = false }) {
  return rows.map((move) => (
    <div key={move.id || `${move.title}-${move.time}`} className={cn('flex items-center gap-3 border-t border-border', compact ? 'px-4 py-2.5' : 'px-4.5 py-2.75')}>
      <IconChip paths={move.icon} className={toneClass(move.tone)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-text">{move.title}</div>
        <div className="text-[11.5px] text-faint">{move.meta}</div>
      </div>
      <span className={cn('shrink-0 text-[13px] font-semibold', move.qtyClass)}>{move.qty}</span>
      {!compact && <span className="w-21.5 shrink-0 text-right text-[11.5px] text-faint">{move.time}</span>}
    </div>
  ));
}

export default function Supplies({ forcedTab = null }) {
  const p = usePortal();
  const activeTab = forcedTab || p.supTab;
  const {
    inventoryItems,
    purchaseOrders,
    suppliers,
    adjustments,
    counts,
    stockMoves,
    inventorySettings,
    updateInventorySettings,
  } = useDomain();
  const items = (inventoryItems || []).map(itemView);
  const lowItems = items.filter((item) => item.status !== 'OK');
  const moves = [...(stockMoves || [])].reverse().map(movementView);
  const openPurchaseOrders = (purchaseOrders || []).filter((po) => po.status !== 'Received');
  const openPurchaseOrderValue = openPurchaseOrders.reduce((sum, po) => sum + Number(po.total || 0), 0);
  const wasteRows = (adjustments || []).filter((row) => ['Waste', 'Damage', 'Loss'].includes(row.reason));
  const kpis = [
    { label: 'Tracked items', value: String(items.length), delta: `${items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} units`, icon: I.box, tint: 0, sub: 'Canonical inventory records' },
    { label: 'Low / critical items', value: String(lowItems.length), delta: `${lowItems.filter((item) => item.status === 'Critical').length} critical`, icon: I.droplet, tint: 2, sub: 'Computed from quantity and usage' },
    { label: 'Open purchase orders', value: String(openPurchaseOrders.length), delta: khr(openPurchaseOrderValue), icon: I.truck, tint: 1, sub: 'Draft, ordered or partial' },
    { label: 'Stock movements', value: String(moves.length), delta: `${wasteRows.length} write-offs`, icon: I.chart, tint: 3, sub: 'Receipts, usage and adjustments' },
  ];
  const openAdjustment = (reason = 'Waste') => p.set({ drawer: { type: 'adjust', reason } });

  return (
    <div className="animate-kfade">
      <PageHeader title="Inventory Management" subtitle="Canonical stock, purchase orders, counts and movement history">
        <Button variant="primary" onClick={p.openDrawer('newpo')}>Reorder stock</Button>
      </PageHeader>

      {activeTab === 'Overview' && (
        <div>
          <div className="mb-3.5 grid grid-cols-4 gap-3.5">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="p-4">
                <div className="mb-3 flex items-center gap-2.25"><IconChip paths={kpi.icon} size={16} box="h-8 w-8 rounded-[9px]" className={KPI_TINT[kpi.tint]} /><span className="text-[12.5px] text-muted">{kpi.label}</span></div>
                <div className="flex items-end justify-between"><span className="text-[21px] font-bold text-text">{kpi.value}</span><span className="text-[12px] font-semibold text-muted">{kpi.delta}</span></div>
                <div className="mt-1 text-[11.5px] text-faint">{kpi.sub}</div>
              </Card>
            ))}
          </div>
          <div className="grid items-start gap-3.5" style={{ gridTemplateColumns: '1.05fr .95fr' }}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5"><span className="text-sm font-semibold text-text">Running low</span><BarButton onClick={p.openDrawer('newpo')}>Reorder</BarButton></div>
              {lowItems.map((item) => <div key={item.id || item.name} className="flex items-center gap-2.75 border-t border-border px-4 py-2.75"><span className={cn('h-2 w-2 rounded-full', item.dotClass)} /><span className="flex-1 text-[13px] font-medium text-text">{item.name}</span><span className="text-[12px] text-muted">{item.daysLabel}</span><Badge tone={item.tone}>{item.status}</Badge></div>)}
            </Card>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5"><span className="text-sm font-semibold text-text">Recent movements</span><button type="button" onClick={() => p.set({ supTab: 'History' })} className="text-[12.5px] font-semibold text-accent">View history</button></div>
              <MovementRows rows={moves.slice(0, 5)} compact />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'Items' && (
        <Card className="overflow-hidden">
          <TableHead cols={ITEM_COLS} labels={['Item', 'In stock', 'Usage', 'Left', 'Reorder', 'Status']} />
          {items.map((item) => <GridRow key={item.id || item.name} cols={ITEM_COLS} onClick={p.openDrawer('item', item.id || item.name)}><div className="flex items-center gap-2.5"><span className={cn('h-2 w-2 rounded-full', item.dotClass)} /><span className="text-[13.5px] font-medium text-text">{item.name}</span></div><span className="text-[13px] text-text">{item.stock}</span><span className="text-[12.5px] text-muted">{item.usage}</span><span className="text-[13px] text-text">{item.daysLabel}</span><span className="text-[12.5px] text-muted">{item.reorder}</span><Badge tone={item.tone}>{item.status}</Badge></GridRow>)}
        </Card>
      )}

      {activeTab === 'Purchase Orders' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4.5 py-3.25"><span className="text-[13px] text-muted">Receiving a PO updates stock and movement history.</span><BarButton onClick={p.openDrawer('newpo')}><PlusIcon />New purchase order</BarButton></div>
          <TableHead cols={PO_COLS} labels={['PO', 'Supplier', 'Items', 'Total', 'Expected', 'Status']} />
          {(purchaseOrders || []).map((po) => <GridRow key={po.id || po.code} cols={PO_COLS} onClick={p.openDrawer('po', po.id || po.code)}><span className="font-mono text-[13px] font-semibold text-accent">{po.code}</span><span className="text-[13px] text-text">{po.supplier}</span><div className="min-w-0"><div className="truncate text-[13px] text-text">{po.items}</div><div className="text-[11.5px] text-faint">{po.qty}</div></div><span className="text-[13px] font-semibold text-text">{khr(Number(po.total || 0))}</span><span className="text-[12.5px] text-muted">{po.expected}</span><Badge tone={PO_TONE[po.status] || 'neutral'}>{po.status}</Badge></GridRow>)}
        </Card>
      )}

      {activeTab === 'Suppliers' && (
        <div className="grid grid-cols-2 gap-3.5">
          {(suppliers || []).map((supplier) => <button key={supplier.id || supplier.name} type="button" onClick={p.openDrawer('supplier', supplier.id || supplier.name)} className="rounded-[14px] border border-border bg-panel p-4.25 text-left shadow-card hover:bg-hover"><div className="mb-3 flex items-center gap-3.25"><span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-info-bg font-bold text-info-fg">{supplier.name[0]}</span><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-text">{supplier.name}</div><div className="text-[12px] text-muted">{supplier.category} · {supplier.phone}</div></div><Badge tone="ok">Active</Badge></div><div className="flex gap-4 border-t border-border pt-2.75 text-[12px] text-muted"><span>Lead <strong className="text-text">{supplier.lead}</strong></span><span>Supplies <strong className="text-text">{supplier.items} items</strong></span><span className="ml-auto text-faint">Last order {supplier.last}</span></div></button>)}
        </div>
      )}

      {activeTab === 'Adjustments' && (
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-4.5 py-3.25"><span className="text-[13px] text-muted">Append-only stock corrections with actor and reason.</span><BarButton onClick={() => openAdjustment('Recount')}><PlusIcon />New adjustment</BarButton></div>{[...(adjustments || [])].reverse().map((row) => <AdjustmentRow key={row.id || `${row.item}-${row.time}`} adjustment={row} />)}</Card>
      )}

      {activeTab === 'Counts' && (
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-4.5 py-3.25"><span className="text-[13px] text-muted">Physical counts keep canonical book stock auditable.</span><BarButton onClick={p.openDrawer('newcount')}><PlusIcon />Start count</BarButton></div><TableHead cols={COUNT_COLS} labels={['Count', 'Scope', 'Date', 'Items', 'Variance', 'Status']} />{[...(counts || [])].reverse().map((count) => <GridRow key={count.id || count.code} cols={COUNT_COLS} onClick={p.openDrawer('count', count.id || count.code)}><span className="font-mono text-[13px] font-semibold text-accent">{count.code}</span><span className="text-[13px] text-text">{count.scope}</span><span className="text-[12.5px] text-muted">{count.date}</span><span className="text-[12.5px] text-muted">{count.items}</span><span className={cn('text-[13px] font-semibold', count.neg ? 'text-danger-fg' : 'text-muted')}>{count.variance}</span><Badge tone={count.status === 'Completed' ? 'ok' : 'info'}>{count.status}</Badge></GridRow>)}</Card>
      )}

      {activeTab === 'History' && <Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 px-4.5 pt-3.5 pb-2"><span className="text-[13px] text-muted">Every canonical receipt, usage, adjustment and count movement.</span><Button onClick={() => p.set({ supTab: 'Purchase Orders' })}>Open purchase orders</Button></div><MovementRows rows={moves} /></Card>}

      {activeTab === 'Waste' && <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-4.5 py-3.25"><span className="text-[13px] text-muted">{wasteRows.length} persisted waste, damage or loss records.</span><BarButton onClick={() => openAdjustment('Waste')}><PlusIcon />Record waste</BarButton></div>{[...wasteRows].reverse().map((row) => <AdjustmentRow key={row.id || `${row.item}-${row.time}`} adjustment={row} />)}</Card>}

      {activeTab === 'InvSettings' && (
        <div className="flex max-w-205 flex-col gap-3.5">
          <Card className="overflow-hidden"><div className="px-4.5 pt-3.5 pb-2.5"><div className="text-sm font-semibold text-text">Stock tracking</div><div className="text-[12.5px] text-muted">Persisted inventory behavior</div></div>{inventoryToggleMeta.map((toggle) => { const on = Boolean(inventorySettings?.[toggle.key]); return <div key={toggle.key} className="flex items-center gap-3.5 border-t border-border px-4.5 py-3.25"><div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-text">{toggle.label}</div><div className="text-[12px] text-muted">{toggle.desc}</div></div><Toggle on={on} onClick={() => { updateInventorySettings({ [toggle.key]: !on }); p.notify(`${toggle.label} ${on ? 'disabled' : 'enabled'}`); }} /></div>; })}</Card>
          <Card className="overflow-hidden"><div className="px-4.5 pt-3.5 pb-2.5"><div className="text-sm font-semibold text-text">Counting & valuation</div></div>{[['Count reminder', inventorySettings?.countReminder], ['Valuation method', inventorySettings?.valuationMethod], ['Default units', inventorySettings?.defaultUnits], ['Reorder basis', inventorySettings?.reorderBasis]].map(([label, value]) => <div key={label} className="flex items-center gap-3 border-t border-border px-4.5 py-3.25"><span className="flex-1 text-[13.5px] text-text">{label}</span><span className="text-[13px] font-medium text-muted">{value}</span></div>)}</Card>
        </div>
      )}
    </div>
  );
}
