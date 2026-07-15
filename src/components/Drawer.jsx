import { useEffect, useMemo, useState } from 'react';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { I, Icon } from '../lib/icons.jsx';
import { downloadCsv } from '../lib/export.js';
import { khr } from '../lib/format.js';
import { cn } from '../lib/cn.js';
import { toneClass } from '../lib/tone.js';
import { Badge, Button, Chip, Select, TextInput } from './ui/index.jsx';

const LABEL = 'mb-1.75 block text-[13px] font-semibold text-text';
const PO_TONE = { Draft: 'neutral', Ordered: 'info', Partial: 'gold', Received: 'ok' };
const MOVE_KIND = {
  receipt: { icon: I.box, tone: 'ok' },
  usage: { icon: I.droplet, tone: 'info' },
  adjust: { icon: I.swap, tone: 'warn' },
  count: { icon: I.clipboard, tone: 'purple' },
};
const COUNT_SCOPES = {
  'Full count': () => true,
  'Spot check · chemicals': (item) => /detergent|softener|stain|starch|fragrance/i.test(item.name),
  'Spot check · packaging': (item) => /hanger|bag|roll|label/i.test(item.name),
};

const sameRef = (record, ref) =>
  [record?.id, record?.code, record?.name].some((value) => value === ref);
const findRecord = (rows, ref) => (rows || []).find((row) => sameRef(row, ref)) || null;
const numeric = (value) => {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '');
  return cleaned ? Number(cleaned) : Number.NaN;
};

function InfoBox({ children }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[10px] bg-info-bg px-3.5 py-2.75">
      <Icon paths={I.info || I.clipboard} size={15} className="shrink-0 text-info-fg" />
      <span className="text-[12.5px] text-info-fg">{children}</span>
    </div>
  );
}

function FieldList({ fields }) {
  return (
    <div className="mb-4 rounded-xl border border-border px-3.5 py-0.5">
      {fields.map((field) => (
        <div key={field.label} className="flex items-center justify-between gap-3 border-t border-border py-2.5">
          <span className="shrink-0 text-[12.5px] text-muted">{field.label}</span>
          <span className={cn('text-right text-[13px] font-semibold', field.colorClass || 'text-text')}>{field.value}</span>
        </div>
      ))}
    </div>
  );
}

function ErrorBox({ message }) {
  return message ? <div role="alert" className="rounded-[10px] bg-danger-bg px-3.5 py-2.75 text-[12px] font-medium text-danger-fg">{message}</div> : null;
}

export default function Drawer() {
  const p = usePortal();
  const d = p.drawer;
  const {
    inventoryItems,
    purchaseOrders,
    suppliers,
    adjustments,
    counts,
    stockMoves,
    members,
    permissions,
    orders,
    receivePurchaseOrder,
    addPurchaseOrder,
    recordAdjustment,
    startCount,
    completeCount,
    addMember,
    recordGenericAction,
  } = useDomain();

  const [error, setError] = useState('');
  const [poSelection, setPoSelection] = useState({});
  const [poSupplier, setPoSupplier] = useState('');
  const [poExpected, setPoExpected] = useState('');
  const [poTotal, setPoTotal] = useState('');
  const [adjustItem, setAdjustItem] = useState('');
  const [adjustDirection, setAdjustDirection] = useState('remove');
  const [adjustQuantity, setAdjustQuantity] = useState('1');
  const [adjustReason, setAdjustReason] = useState('Waste');
  const [adjustNote, setAdjustNote] = useState('');
  const [countScope, setCountScope] = useState('Full count');
  const [countValues, setCountValues] = useState({});
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('Cashier');
  const [memberPhone, setMemberPhone] = useState('');

  const closeDrawer = p.closeDrawer;

  useEffect(() => {
    if (!d) return;
    setError('');
    if (d.type === 'newpo') {
      setPoSelection(
        Object.fromEntries(
          (inventoryItems || [])
            .filter((item) => Number(item.days || 0) <= 9)
            .map((item) => [item.id || item.name, true])
        )
      );
      setPoSupplier(suppliers?.[0]?.name || '');
      setPoExpected('');
      setPoTotal('');
    }
    if (d.type === 'adjust') {
      setAdjustItem(d.itemId || inventoryItems?.[0]?.id || inventoryItems?.[0]?.name || '');
      setAdjustDirection('remove');
      setAdjustQuantity('1');
      setAdjustReason(d.reason || 'Waste');
      setAdjustNote('');
    }
    if (d.type === 'newcount') setCountScope('Full count');
    if (d.type === 'count') {
      const count = findRecord(counts, d.id);
      const existing = Object.fromEntries((count?.lines || []).map((line) => [line.itemId, String(line.counted)]));
      setCountValues(existing);
    }
    if (d.type === 'newmember') {
      setMemberName('');
      setMemberRole('Cashier');
      setMemberPhone('');
    }
  }, [d?.type, d?.id, d?.itemId, d?.reason, counts, inventoryItems, suppliers]);

  useEffect(() => {
    if (!d) return undefined;
    const onKey = (event) => event.key === 'Escape' && closeDrawer();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d, closeDrawer]);

  useEffect(() => {
    if (!d) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [d]);

  const itemMoves = useMemo(() => {
    if (!d || d.type !== 'item') return [];
    const item = findRecord(inventoryItems, d.id);
    if (!item) return [];
    const token = item.name.split(' ')[0].toLowerCase();
    return [...(stockMoves || [])]
      .reverse()
      .filter((move) => String(move.title || '').toLowerCase().includes(token))
      .slice(0, 5);
  }, [d, inventoryItems, stockMoves]);

  if (!d) return null;

  let title = '';
  let subtitle = '';
  let badge = '';
  let badgeTone = 'neutral';
  let fields = [];
  let body = null;

  if (d.type === 'item') {
    const item = findRecord(inventoryItems, d.id);
    if (!item) {
      title = 'Inventory item not found';
      body = <ErrorBox message="This item no longer exists in the canonical inventory." />;
    } else {
      const quantity = Number(item.quantity || 0);
      const usage = Number.parseFloat(String(item.usage || ''));
      const days = usage > 0 ? Math.max(0, Math.floor(quantity / usage)) : Number(item.days || 0);
      const critical = days <= 3;
      const low = days <= 9;
      title = item.name;
      subtitle = 'Canonical inventory item';
      badge = critical ? 'Critical' : low ? 'Low' : 'OK';
      badgeTone = critical ? 'danger' : low ? 'gold' : 'ok';
      fields = [
        { label: 'In stock', value: item.stock || `${quantity} ${item.unit || ''}`.trim() },
        { label: 'Daily usage', value: item.usage || 'Not recorded' },
        { label: 'Days remaining', value: `${days} days`, colorClass: critical ? 'text-danger-fg' : low ? 'text-gold-fg' : 'text-ok-fg' },
        { label: 'Suggested reorder', value: item.reorder || 'Not set' },
      ];
      const createReorder = () => {
        try {
          const supplier = suppliers?.[0]?.name;
          if (!supplier) throw new Error('Add a supplier before creating a purchase order.');
          const purchaseOrder = addPurchaseOrder({
            supplier,
            items: `${item.name} ${item.reorder || ''}`.trim(),
            qty: '1 line item',
            total: 0,
            expected: 'Not set',
            status: 'Draft',
            lines: [{ name: item.name, qty: item.reorder || `1 ${item.unit || 'unit'}`, cost: 0 }],
          });
          p.set({ drawer: null, page: 'supplies', nav: 'inventory', supTab: 'Purchase Orders' });
          p.notify(`${purchaseOrder.code} saved as a draft`);
        } catch (actionError) {
          setError(actionError?.message || 'The draft purchase order could not be created.');
        }
      };
      body = (
        <>
          <div className="mb-2 text-[13px] font-semibold text-text">Recent movements</div>
          <div className="mb-4 overflow-hidden rounded-xl border border-border">
            {itemMoves.length ? itemMoves.map((move) => {
              const kind = MOVE_KIND[move.kind] || MOVE_KIND.adjust;
              return <div key={move.id || `${move.title}-${move.time}`} className="flex items-center gap-2.75 border-b border-border px-3.25 py-2.5"><span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', toneClass(kind.tone))}><Icon paths={kind.icon} size={13} /></span><div className="min-w-0 flex-1"><div className="text-[12.5px] text-text">{move.title}</div><div className="text-[11px] text-faint">{move.meta}</div></div><span className={cn('text-[12.5px] font-semibold', String(move.qty).startsWith('+') ? 'text-ok-fg' : 'text-danger-fg')}>{move.qty}</span></div>;
            }) : <div className="px-3.25 py-3 text-[12.5px] text-muted">No movements recorded for this item.</div>}
          </div>
          <ErrorBox message={error} />
          <div className="mt-3 flex gap-2.25"><Button variant="primary" className="flex-1 justify-center" onClick={createReorder}>Create reorder PO</Button><Button className="flex-1 justify-center" onClick={() => p.set({ drawer: { type: 'adjust', itemId: item.id || item.name, reason: 'Recount' } })}>Record adjustment</Button></div>
        </>
      );
    }
  }

  if (d.type === 'po') {
    const po = findRecord(purchaseOrders, d.id);
    if (!po) {
      title = 'Purchase order not found';
      body = <ErrorBox message="This purchase order no longer exists." />;
    } else {
      title = po.code;
      subtitle = `${po.supplier} · expected ${po.expected || 'not set'}`;
      badge = po.status;
      badgeTone = PO_TONE[po.status] || 'neutral';
      fields = [
        { label: 'Supplier', value: po.supplier },
        { label: 'Expected', value: po.expected || 'Not set' },
        { label: 'Line items', value: String(po.lines?.length || 0) },
        { label: 'Total', value: khr(Number(po.total || 0)) },
      ];
      const receive = () => {
        try {
          receivePurchaseOrder(po.id || po.code, { lines: po.lines, by: p.user?.name || 'Portal user' });
          p.closeDrawer();
          p.notify(`${po.code} received; stock and movement history were updated`);
        } catch (actionError) {
          setError(actionError?.message || 'The purchase order could not be received.');
        }
      };
      body = (
        <>
          <div className="mb-2 text-[13px] font-semibold text-text">Line items</div>
          <div className="mb-3.5 overflow-hidden rounded-xl border border-border">
            {(po.lines || []).map((line, index) => <div key={`${line.name}-${index}`} className="flex items-center gap-3 border-b border-border px-3.25 py-2.75"><div className="min-w-0 flex-1"><div className="text-[13px] text-text">{line.name}</div><div className="text-[11.5px] text-faint">{line.qty}</div></div><span className="text-[13px] font-semibold text-text">{khr(Number(line.cost || 0))}</span></div>)}
          </div>
          <ErrorBox message={error} />
          {po.status !== 'Received' && <><Button variant="primary" className="mt-3 w-full justify-center" onClick={receive}>Mark as received</Button><div className="mt-2 text-center text-[11.5px] text-faint">Receiving posts each line to stock and Inventory History.</div></>}
        </>
      );
    }
  }

  if (d.type === 'newpo') {
    title = 'New purchase order';
    subtitle = 'Create a persisted draft from canonical stock items';
    const selectedItems = (inventoryItems || []).filter((item) => poSelection[item.id || item.name]);
    const createPurchaseOrder = () => {
      if (!selectedItems.length) return setError('Select at least one item.');
      if (!poSupplier) return setError('Choose a supplier.');
      const total = numeric(poTotal);
      if (poTotal && !Number.isFinite(total)) return setError('Enter a valid estimated total.');
      try {
        const po = addPurchaseOrder({
          supplier: poSupplier,
          items: selectedItems.map((item) => `${item.name} ${item.reorder || ''}`.trim()).join(' · '),
          qty: `${selectedItems.length} line item${selectedItems.length === 1 ? '' : 's'}`,
          total: poTotal ? total : 0,
          expected: poExpected.trim() || 'Not set',
          status: 'Draft',
          lines: selectedItems.map((item) => ({ name: item.name, qty: item.reorder || `1 ${item.unit || 'unit'}`, cost: 0 })),
        });
        p.set({ drawer: null, page: 'supplies', nav: 'inventory', supTab: 'Purchase Orders' });
        p.notify(`${po.code} saved as a draft`);
      } catch (actionError) {
        setError(actionError?.message || 'The purchase order could not be created.');
      }
    };
    body = (
      <div className="flex flex-col gap-3.75">
        <div><label className={LABEL}>Supplier</label><Select value={poSupplier} onChange={(event) => setPoSupplier(event.target.value)}>{(suppliers || []).map((supplier) => <option key={supplier.id || supplier.name} value={supplier.name}>{supplier.name}</option>)}</Select></div>
        <div><label className={LABEL}>Items</label><div className="rounded-xl border border-border px-3.5 py-0.5">{(inventoryItems || []).map((item) => { const key = item.id || item.name; const on = Boolean(poSelection[key]); return <button key={key} type="button" onClick={() => setPoSelection((current) => ({ ...current, [key]: !on }))} className="flex w-full items-center gap-3 border-t border-border py-2.75 text-left"><span className={cn('flex h-4.5 w-4.5 items-center justify-center rounded-[5px]', on ? 'bg-accent text-white' : 'border border-border-strong')}>{on ? '✓' : ''}</span><span className="min-w-0 flex-1 text-[13px] font-medium text-text">{item.name}</span><span className="text-[12px] text-muted">{item.reorder || 'No reorder quantity'}</span></button>; })}</div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className={LABEL}>Expected</label><TextInput value={poExpected} onChange={(event) => setPoExpected(event.target.value)} placeholder="e.g. 18 Jul" /></div><div><label className={LABEL}>Estimated total (៛)</label><TextInput value={poTotal} onChange={(event) => setPoTotal(event.target.value)} inputMode="numeric" placeholder="Optional" /></div></div>
        <ErrorBox message={error} />
        <Button variant="primary" className="w-full justify-center" onClick={createPurchaseOrder}>Create draft PO</Button>
      </div>
    );
  }

  if (d.type === 'adjust') {
    title = 'New stock adjustment';
    subtitle = 'Persisted, append-only inventory correction';
    const saveAdjustment = () => {
      const item = findRecord(inventoryItems, adjustItem);
      const quantity = numeric(adjustQuantity);
      if (!item) return setError('Choose an inventory item.');
      if (!(quantity > 0)) return setError('Enter a quantity greater than zero.');
      try {
        const sign = adjustDirection === 'add' ? '+' : '−';
        const adjustment = recordAdjustment({
          item: item.name,
          itemId: item.id,
          quantity,
          unit: item.unit,
          direction: adjustDirection,
          change: `${sign}${quantity} ${item.unit || ''}`.trim(),
          reason: adjustReason,
          note: adjustNote.trim() || 'Manual adjustment',
          by: p.user?.name || 'Portal user',
          time: 'Just now',
        });
        p.set({ drawer: null, page: 'supplies', nav: 'inventory', supTab: adjustReason === 'Waste' ? 'Waste' : 'Adjustments' });
        p.notify(`${adjustment.item} ${adjustment.change} recorded`);
      } catch (actionError) {
        setError(actionError?.message || 'The adjustment could not be recorded.');
      }
    };
    body = (
      <div className="flex flex-col gap-3.75">
        <div><label className={LABEL}>Item</label><div className="flex flex-wrap gap-1.75">{(inventoryItems || []).map((item) => <Chip key={item.id || item.name} active={sameRef(item, adjustItem)} onClick={() => setAdjustItem(item.id || item.name)}>{item.name}</Chip>)}</div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className={LABEL}>Direction</label><div className="flex gap-1.75"><Chip active={adjustDirection === 'remove'} onClick={() => setAdjustDirection('remove')}>Remove −</Chip><Chip active={adjustDirection === 'add'} onClick={() => setAdjustDirection('add')}>Add +</Chip></div></div><div><label className={LABEL}>Quantity</label><TextInput value={adjustQuantity} onChange={(event) => setAdjustQuantity(event.target.value)} inputMode="decimal" /></div></div>
        <div><label className={LABEL}>Reason</label><div className="flex flex-wrap gap-1.75">{['Waste', 'Damage', 'Recount', 'Loss'].map((reason) => <Chip key={reason} active={adjustReason === reason} onClick={() => setAdjustReason(reason)}>{reason}</Chip>)}</div></div>
        <div><label className={LABEL}>Note</label><TextInput value={adjustNote} onChange={(event) => setAdjustNote(event.target.value)} placeholder="What happened?" /></div>
        <ErrorBox message={error} />
        <Button variant="primary" className="w-full justify-center" onClick={saveAdjustment}>Record adjustment</Button>
        <div className="text-center text-[11.5px] text-faint">The adjustment updates canonical quantity, movements and audit history.</div>
      </div>
    );
  }

  if (d.type === 'count') {
    const count = findRecord(counts, d.id);
    if (!count) {
      title = 'Inventory count not found';
      body = <ErrorBox message="This inventory count no longer exists." />;
    } else {
      title = count.code;
      subtitle = count.scope;
      badge = count.status;
      badgeTone = count.status === 'Completed' ? 'ok' : 'info';
      fields = [
        { label: 'Scope', value: count.scope },
        { label: 'Date', value: count.date },
        { label: 'Items', value: count.items },
        { label: 'Variance', value: count.variance || '—', colorClass: count.neg ? 'text-danger-fg' : 'text-text' },
      ];
      const matcher = count.scope?.includes('chemicals')
        ? COUNT_SCOPES['Spot check · chemicals']
        : count.scope?.includes('packaging')
          ? COUNT_SCOPES['Spot check · packaging']
          : COUNT_SCOPES['Full count'];
      const countItems = (inventoryItems || []).filter(matcher);
      const exportRows = count.status === 'Completed' && count.lines?.length
        ? count.lines.map((line) => ({
            item: line.name,
            bookStock: line.book,
            unit: line.unit,
            counted: line.counted,
            variance: line.variance,
          }))
        : countItems.map((item) => ({
            item: item.name,
            bookStock: item.stock,
            unit: item.unit,
            counted: countValues[item.id] ?? '',
            variance: '',
          }));
      const exportCount = () => {
        const exported = downloadCsv(
          `${count.code}-count-sheet.csv`,
          exportRows,
          [
            { key: 'item', label: 'Item' },
            { key: 'bookStock', label: 'Book stock' },
            { key: 'unit', label: 'Unit' },
            { key: 'counted', label: 'Counted' },
            { key: 'variance', label: 'Variance' },
          ]
        );
        if (!exported) return setError('Downloads are unavailable in this browser.');
        recordGenericAction(`inventory:count-export:${count.id || count.code}`, `Exported count sheet ${count.code}`);
        p.notify(`${count.code} count sheet downloaded`);
      };
      const finishCount = () => {
        try {
          const entries = countItems.map((item) => ({
            itemId: item.id,
            counted: countValues[item.id],
          }));
          if (entries.some((entry) => entry.counted === '' || entry.counted == null)) {
            return setError('Enter a counted quantity for every item in scope.');
          }
          completeCount(count.id || count.code, entries);
          setError('');
          p.notify(`${count.code} completed and stock variances posted`);
        } catch (actionError) {
          setError(actionError?.message || 'The count could not be completed.');
        }
      };
      body = (
        <div className="flex flex-col gap-3">
          <InfoBox>
            {count.status === 'Completed'
              ? 'This count is complete. Posted variances are included in stock history.'
              : 'Enter the physical quantity for every item; completing posts differences atomically.'}
          </InfoBox>
          {count.status !== 'Completed' && countItems.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_90px_80px] items-center gap-2">
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium text-text">{item.name}</div>
                <div className="text-[11px] text-faint">Book: {item.stock}</div>
              </div>
              <TextInput
                value={countValues[item.id] ?? ''}
                onChange={(event) => setCountValues((values) => ({ ...values, [item.id]: event.target.value }))}
                inputMode="decimal"
                aria-label={`${item.name} counted quantity`}
              />
              <span className="text-[12px] text-muted">{item.unit}</span>
            </div>
          ))}
          <ErrorBox message={error} />
          <div className="flex gap-2">
            <Button className="flex-1 justify-center" onClick={exportCount}>Export count sheet</Button>
            {count.status !== 'Completed' && (
              <Button variant="primary" className="flex-1 justify-center" onClick={finishCount}>
                Complete count
              </Button>
            )}
          </div>
        </div>
      );
    }
  }

  if (d.type === 'newcount') {
    title = 'Start inventory count';
    subtitle = 'Create a persisted physical-count record';
    const beginCount = () => {
      const matcher = COUNT_SCOPES[countScope];
      const itemCount = (inventoryItems || []).filter(matcher).length;
      try {
        const count = startCount({
          scope: countScope === 'Full count' ? 'Full count · all storage' : countScope,
          date: 'Today · in progress',
          items: `${itemCount} items`,
          itemCount,
          variance: '—',
          status: 'In progress',
          by: p.user?.name || 'Portal user',
        });
        p.set({ drawer: null, page: 'supplies', nav: 'inventory', supTab: 'Counts' });
        p.notify(`${count.code} started`);
      } catch (actionError) {
        setError(actionError?.message || 'The inventory count could not be started.');
      }
    };
    body = <div className="flex flex-col gap-3.75"><div><label className={LABEL}>Scope</label><div className="flex flex-wrap gap-1.75">{Object.keys(COUNT_SCOPES).map((scope) => <Chip key={scope} active={countScope === scope} onClick={() => setCountScope(scope)}>{scope}</Chip>)}</div></div><InfoBox>Sales can continue while this local count record is in progress.</InfoBox><ErrorBox message={error} /><Button variant="primary" className="w-full justify-center" onClick={beginCount}>Begin count</Button></div>;
  }

  if (d.type === 'supplier') {
    const supplier = findRecord(suppliers, d.id);
    if (!supplier) {
      title = 'Supplier not found';
      body = <ErrorBox message="This supplier no longer exists." />;
    } else {
      title = supplier.name;
      subtitle = supplier.category;
      badge = 'Active';
      badgeTone = 'ok';
      fields = [
        { label: 'Phone', value: supplier.phone },
        { label: 'Lead time', value: supplier.lead },
        { label: 'Items supplied', value: `${supplier.items} items` },
        { label: 'Last order', value: supplier.last },
      ];
      const supplierOrders = (purchaseOrders || []).filter((po) => po.supplier === supplier.name).slice(-5).reverse();
      body = <><div className="mb-2 text-[13px] font-semibold text-text">Purchase orders</div><div className="mb-4 rounded-xl border border-border px-3.5 py-0.5">{supplierOrders.length ? supplierOrders.map((po) => <div key={po.id || po.code} className="flex items-center gap-3 border-t border-border py-2.5"><span className="flex-1 font-mono text-[12.5px] font-semibold text-accent">{po.code}</span><span className="text-[12.5px] text-muted">{khr(Number(po.total || 0))}</span><Badge tone={PO_TONE[po.status] || 'neutral'}>{po.status}</Badge></div>) : <div className="py-3 text-[12.5px] text-muted">No purchase orders yet.</div>}</div><Button variant="primary" className="w-full justify-center" onClick={p.openDrawer('newpo')}>New purchase order</Button></>;
    }
  }

  if (d.type === 'member') {
    const member = findRecord(members, d.id);
    if (!member) {
      title = 'Team member not found';
      body = <ErrorBox message="This member no longer exists." />;
    } else {
      title = member.name;
      subtitle = `${member.role} · ${member.contact}`;
      badge = member.active;
      badgeTone = member.active === 'Now' ? 'ok' : 'neutral';
      fields = [
        { label: 'Role', value: member.role },
        { label: 'Portal access', value: ['Owner', 'Manager'].includes(member.role) ? 'Portal + POS' : 'POS only' },
        { label: 'PIN scope', value: member.pin },
        { label: 'Last active', value: member.active },
      ];
      const roleIndex = { Owner: 0, Manager: 1, Cashier: 2, Staff: 3 }[member.role] ?? 2;
      const allowed = (permissions || []).filter((permission) => permission.cells?.[roleIndex] !== 'no');
      const recordMemberAction = (kind) => {
        const reset = kind === 'pin-reset';
        recordGenericAction(`team:member:${member.id || member.name}:${kind}`, `${reset ? 'PIN reset requested' : 'Deactivation requested'} for ${member.name}`);
        p.notify(reset ? 'PIN reset request recorded locally; no PIN was generated or sent' : 'Deactivation request recorded locally; member access is unchanged');
      };
      body = <><div className="mb-2 text-[13px] font-semibold text-text">Role permissions</div><div className="mb-4.5 flex flex-wrap gap-1.75">{allowed.map((permission) => <span key={permission.id || permission.label} className="rounded-full border border-border px-2.75 py-1.25 text-[12px] text-muted">{permission.label}{permission.cells[roleIndex] === 'ltd' ? ' · limited' : ''}</span>)}</div><div className="flex gap-2.25"><Button className="flex-1 justify-center" onClick={() => recordMemberAction('pin-reset')}>Record PIN reset</Button><Button variant="danger" className="flex-1 justify-center" onClick={() => recordMemberAction('deactivate')}>Record deactivation</Button></div><div className="mt-2 text-center text-[11.5px] text-faint">These actions are audited locally; no identity provider is connected.</div></>;
    }
  }

  if (d.type === 'z') {
    const validOrders = (orders || []).filter((order) => order.status !== 'cancelled');
    const cash = validOrders.filter((order) => order.method === 'cash').reduce((sum, order) => sum + Number(order.total || 0), 0);
    const khqr = validOrders.filter((order) => order.method === 'khqr').reduce((sum, order) => sum + Number(order.total || 0), 0);
    title = d.id || 'Operational summary';
    subtitle = 'Derived from canonical saved orders';
    badge = 'Current';
    badgeTone = 'info';
    fields = [
      { label: 'Orders', value: String(validOrders.length) },
      { label: 'Cash recorded', value: khr(cash) },
      { label: 'KHQR recorded', value: khr(khqr) },
      { label: 'Total recorded', value: khr(cash + khqr) },
      { label: 'Physical variance', value: 'Not recorded' },
    ];
    const printReport = () => {
      if (typeof window.print !== 'function') return setError('Printing is unavailable in this browser.');
      window.print();
      recordGenericAction(`finance:z-print:${d.id || 'current'}`, `Printed operational summary ${d.id || 'current'}`);
    };
    body = <><ErrorBox message={error} /><Button className="mt-3 w-full justify-center" onClick={printReport}>Print report</Button><div className="mt-2 text-center text-[11.5px] text-faint">Uses the browser print dialog; nothing is sent to a printer service.</div></>;
  }

  if (d.type === 'newmember') {
    title = 'Add team member';
    subtitle = 'Persist a local member record';
    const saveMember = () => {
      const name = memberName.trim();
      if (!name) return setError("Enter the member's name.");
      if ((members || []).some((member) => member.name.toLowerCase() === name.toLowerCase())) return setError('A member with this name already exists.');
      try {
        const member = addMember({
          name,
          role: memberRole,
          phone: memberPhone.trim(),
          contact: memberPhone.trim() || 'PIN not configured',
          pin: memberRole === 'Manager' ? 'Manager PIN scope' : 'POS only',
          active: 'Added locally',
          by: p.user?.name || 'Portal user',
        });
        p.set({ drawer: null, page: 'team', nav: 'employees', teamTab: 'Members' });
        p.notify(`${member.name} added to the local team`);
      } catch (actionError) {
        setError(actionError?.message || 'The team member could not be added.');
      }
    };
    body = <div className="flex flex-col gap-3.75"><div><label className={LABEL}>Full name</label><TextInput value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="e.g. Bopha Chhim" /></div><div><label className={LABEL}>Role</label><div className="flex flex-wrap gap-1.75">{['Manager', 'Cashier', 'Staff'].map((role) => <Chip key={role} active={memberRole === role} onClick={() => setMemberRole(role)}>{role}</Chip>)}</div></div><div><label className={LABEL}>Phone <span className="font-normal text-faint">· optional</span></label><TextInput value={memberPhone} onChange={(event) => setMemberPhone(event.target.value)} placeholder="+855 …" /></div><InfoBox>This stores the member locally. No invitation or PIN is sent.</InfoBox><ErrorBox message={error} /><Button variant="primary" className="w-full justify-center" onClick={saveMember}>Add member</Button></div>;
  }

  return (
    <>
      <button type="button" aria-label="Close drawer" onClick={closeDrawer} className="animate-kfadein fixed inset-0 z-50 border-0 bg-(--scrim)" />
      <div role="dialog" aria-modal="true" aria-label={title} className="animate-kslidein fixed inset-y-0 right-0 z-51 flex w-115 max-w-[92vw] flex-col border-l border-border bg-panel shadow-pop">
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2.25"><span className="text-[16px] font-bold text-text">{title}</span>{badge && <Badge tone={badgeTone}>{badge}</Badge>}</div><div className="mt-px text-[12px] text-muted">{subtitle}</div></div>
          <button type="button" onClick={closeDrawer} className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border text-muted hover:bg-hover" aria-label="Close"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4.5">{fields.length > 0 && <FieldList fields={fields} />}{body}</div>
      </div>
    </>
  );
}
