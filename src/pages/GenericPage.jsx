import { useState } from 'react';
import { cn } from '../lib/cn.js';
import { downloadCsv, downloadJson } from '../lib/export.js';
import { toneDot, toneFg } from '../lib/tone.js';
import { Badge, Button, Card, GridRow, GridTable, PageHeader, SectionNote, TextInput, Toggle } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';

/** Default grid: first column wide, the rest even. */
const gridFor = (sec, cols) => sec.grid || cols.map((_, i) => (i === 0 ? '1.6fr' : '1fr')).join(' ');

const normCols = (sec) => (sec.cols || []).map((c) => (typeof c === 'string' ? { label: c } : c));

function liveExportRows(title, data) {
  const payments = () => (data.orders || []).flatMap((order) =>
    (order.payments || []).map((payment) => ({
      order: order.code,
      customer: order.customer,
      orderStatus: order.status,
      ...payment,
    }))
  );

  switch (title) {
    case 'Orders Report':
    case 'Due & Overdue Report':
      return data.orders;
    case 'Shifts Report':
      return data.shifts;
    case 'Customers Report':
      return data.customers;
    case 'Consumables Report':
    case 'Inventory Report':
      return data.inventoryItems;
    case 'Employee Report':
    case 'Payroll Export':
      return (data.members || []).map((member) => ({
        ...member,
        shifts: (data.shifts || []).filter((shift) => shift.name === member.name).length,
        attendanceRecords: (data.attendance || []).filter((row) => row.name === member.name).length,
      }));
    case 'Finance Report':
    case 'Sales Ledger':
      return data.orders;
    case 'Payment Ledger':
      return payments();
    case 'Audit Log':
      return data.auditEvents;
    default:
      return null;
  }
}

function TableSection({ sec }) {
  const cols = normCols(sec);
  const grid = gridFor(sec, cols);

  return (
    <GridTable cols={grid} head={cols}>
      {(sec.rows || []).map((r, ri) => {
        const cells = r.cells || r;
        return (
          <GridRow key={ri} cols={grid}>
            {cells.map((raw, ci) => {
              const c = typeof raw === 'string' ? { t: raw } : raw;
              const align = c.align || cols[ci]?.align;
              return (
                <div key={ci} className={cn('min-w-0', align === 'right' && 'text-right')}>
                  {c.badge ? (
                    <Badge tone={c.tone}>{c.t}</Badge>
                  ) : (
                    <>
                      <div
                        className={cn(
                          'truncate text-[13px]',
                          c.muted ? 'text-faint' : 'text-text',
                          c.strong ? 'font-semibold' : 'font-normal',
                          c.mono && 'font-mono'
                        )}
                      >
                        {c.t}
                      </div>
                      {c.sub && <div className="truncate text-[11.5px] text-faint">{c.sub}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </GridRow>
        );
      })}
    </GridTable>
  );
}

function ListSection({ sec }) {
  return (
    <Card className="overflow-hidden">
      {(sec.items || []).map((it, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border px-4.5 py-3.25 last:border-b-0"
        >
          {it.dot && <span className={cn('h-1.75 w-1.75 shrink-0 rounded-full', toneDot(it.dot))} />}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-text">{it.title}</div>
            {it.meta && <div className="truncate text-[11.5px] text-faint">{it.meta}</div>}
          </div>
          {it.value && (
            <div
              className={cn(
                'shrink-0 text-[13px] font-semibold',
                it.valueTone ? toneFg(it.valueTone) : 'text-text'
              )}
            >
              {it.value}
            </div>
          )}
          {it.badge && <Badge tone={it.tone}>{it.badge}</Badge>}
        </div>
      ))}
    </Card>
  );
}

function KvSection({ sec, pageKey, sectionIndex }) {
  const p = usePortal();
  const { genericState, setGenericToggle } = useDomain();
  return (
    <Card className="overflow-hidden">
      {(sec.rows || []).map((row, rowIndex) => {
        const toggleKey = `${pageKey}:section-${sectionIndex}:${row.label}`;
        const hasOverride = Object.prototype.hasOwnProperty.call(
          genericState?.toggles || {},
          toggleKey
        );
        const on = hasOverride ? genericState.toggles[toggleKey] : Boolean(row.on);
        return (
          <div
            key={row.label || rowIndex}
            className="flex items-center gap-3 border-b border-border px-4.5 py-3.25 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-text">{row.label}</div>
              {row.desc && <div className="text-[11.5px] text-faint">{row.desc}</div>}
            </div>
            {row.value && <div className="shrink-0 text-[13px] text-muted">{row.value}</div>}
            {row.on !== undefined && (
              <Toggle
                on={on}
                onClick={() => {
                  setGenericToggle(toggleKey, !on);
                  p.notify(`${row.label} ${on ? 'disabled' : 'enabled'}`);
                }}
                aria-label={`${on ? 'Disable' : 'Enable'} ${row.label}`}
              />
            )}
          </div>
        );
      })}
    </Card>
  );
}

function Section({ sec, pageKey, sectionIndex }) {
  if (sec.type === 'note') return <SectionNote>{sec.text}</SectionNote>;

  const body =
    sec.type === 'table' ? (
      <TableSection sec={sec} />
    ) : sec.type === 'list' ? (
      <ListSection sec={sec} />
    ) : sec.type === 'kv' ? (
      <KvSection sec={sec} pageKey={pageKey} sectionIndex={sectionIndex} />
    ) : null;

  if (!sec.title) return body;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-text">{sec.title}</div>
          {sec.subtitle && <div className="text-[12.5px] text-muted">{sec.subtitle}</div>}
        </div>
        {sec.tag && <Badge tone={sec.tagTone || 'neutral'}>{sec.tag}</Badge>}
      </div>
      {body}
    </div>
  );
}

/**
 * Renders any entry of the GENERIC spec registry — reference modules whose
 * toggles and workflow notes persist locally while their seed rows stay labelled.
 */
export default function GenericPage({ spec }) {
  const p = usePortal();
  const { data, genericState, meta, recordGenericAction } = useDomain();
  const [actionOpen, setActionOpen] = useState(false);
  const [actionNote, setActionNote] = useState('');
  if (!spec) return null;

  const kpis = spec.kpis || [];
  const cols = Math.min(kpis.length || 1, 4);
  const pageKey = String(spec.title || 'generic-page')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const runAction = () => {
    const label = spec.action;
    const actionKey = `${pageKey}:action:${label}`;
    try {
      if (/^export\b/i.test(label)) {
        const rows = liveExportRows(spec.title, data);
        const downloaded = rows
          ? downloadCsv(`${pageKey || 'portal-data'}.csv`, rows)
          : downloadJson(`${pageKey || 'portal-data'}.json`, {
              title: spec.title,
              exportKind: 'seed-reference',
              exportedAt: new Date().toISOString(),
              kpis,
              sections: spec.sections || [],
              savedToggles: genericState?.toggles || {},
            });
        if (!downloaded) throw new Error('Downloads are unavailable in this browser.');
        recordGenericAction(actionKey, label);
        p.notify(`${spec.title} ${rows ? 'live local data' : 'seed reference'} export downloaded`);
        return;
      }
      if (/print|preview/i.test(label)) {
        if (typeof window === 'undefined' || typeof window.print !== 'function') {
          throw new Error('Printing is unavailable in this browser.');
        }
        window.print();
        recordGenericAction(actionKey, label);
        return;
      }
      setActionOpen(true);
    } catch (error) {
      p.notify(error?.message || `${label} could not be completed`);
    }
  };

  const saveAction = (event) => {
    event.preventDefault();
    const detail = actionNote.trim();
    if (!detail) {
      p.notify('Add a short description for this local record');
      return;
    }
    recordGenericAction(`${pageKey}:action:${spec.action}`, `${spec.action}: ${detail}`);
    setActionNote('');
    setActionOpen(false);
    p.notify(`${spec.action} saved to local activity`);
  };

  const recentActions = (genericState?.actions || [])
    .filter((action) => action.key === `${pageKey}:action:${spec.action}`)
    .slice(-3)
    .reverse();
  const savedAt = meta?.updatedAt
    ? new Date(meta.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="flex flex-col gap-4.5 animate-kfade">
      <PageHeader
        title={spec.title}
        subtitle={spec.subtitle}
        freshness={savedAt ? `Local snapshot · saved ${savedAt}` : undefined}
      >
        {spec.action && (
          <Button variant="primary" onClick={runAction}>
            {spec.action}
          </Button>
        )}
      </PageHeader>

      <SectionNote>
        <strong>Local reference module.</strong> Rows and KPIs below are seed examples unless they
        change through a saved toggle or appear in Recent local activity. No server, device,
        payment, delivery, sync, or AI status shown in a seed row is a live provider result.
      </SectionNote>

      {actionOpen && (
        <Card className="p-4">
          <form onSubmit={saveAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TextInput
              autoFocus
              value={actionNote}
              onChange={(event) => setActionNote(event.target.value)}
              placeholder={`Describe “${spec.action}” for the local record`}
              aria-label={`${spec.action} details`}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button onClick={() => setActionOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Save locally</Button>
            </div>
          </form>
          <div className="mt-2 text-[11.5px] text-faint">
            This records local workflow intent only; external services require their configured provider.
          </div>
        </Card>
      )}

      {recentActions.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 text-[12px] font-semibold text-muted">Recent local activity</div>
          {recentActions.map((action) => (
            <div key={action.id} className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
              <span className="text-[12.5px] text-text">{action.label}</span>
              <span className="shrink-0 text-[11px] text-faint">
                {new Date(action.at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          ))}
        </Card>
      )}

      {kpis.length > 0 && (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {kpis.map((k, i) => (
            <Card key={i} className="p-4">
              <div className="text-[12.5px] font-medium text-muted">{k.label}</div>
              <div className="mt-1.5 text-[22px] font-bold tracking-[-0.01em] text-text">
                {k.value}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                {k.delta && (
                  <span
                    className={cn(
                      'text-[12px] font-semibold',
                      k.up === false ? 'text-danger-fg' : 'text-ok-fg'
                    )}
                  >
                    {k.delta}
                  </span>
                )}
                {k.sub && <span className="truncate text-[11.5px] text-faint">{k.sub}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {(spec.sections || []).map((sec, i) => (
        <Section key={i} sec={sec} pageKey={pageKey} sectionIndex={i} />
      ))}
    </div>
  );
}
