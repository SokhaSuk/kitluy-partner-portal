import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { Card, PageHeader, Tab, Badge, GridTable, GridRow, Button, EmptyState } from '../components/ui/index.jsx';
import { Icon } from '../lib/icons.jsx';
import { STATUS_TONE } from '../lib/tone.js';
import { ST } from '../data/status.js';

const PROD_TABS = ['Live Map', 'Work Orders', 'Exceptions'];
const EX_TONE = { pending: 'warn', in_progress: 'info', resolved: 'ok' };
const EX_LABEL = { pending: 'Pending', in_progress: 'In progress', resolved: 'Resolved' };
const ALERT = [
  'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  'M12 9v4',
  'M12 17h.01',
];
const WO_COLS = '1fr 1.4fr 1fr 1fr .9fr';

export default function Production() {
  const p = usePortal();
  const { stations, workOrders, productionExceptions, resolveException } = useDomain();
  const showMap = p.prodTab === 'Live Map';
  const showWorkOrders = p.prodTab === 'Work Orders';
  const showExceptions = p.prodTab === 'Exceptions';

  return (
    <div className="animate-kfade">
      <PageHeader title="Production" subtitle="Station map and garment flow from the saved operational data" />

      <div className="mb-4 flex flex-wrap gap-1">
        {PROD_TABS.map((tab) => (
          <Tab key={tab} active={p.prodTab === tab} onClick={() => p.set({ prodTab: tab })}>{tab}</Tab>
        ))}
      </div>

      {showMap && (
        <div className="grid grid-cols-3 gap-3.5">
          {stations.map((station) => {
            const pct = station.cap > 0 ? Math.round((station.load / station.cap) * 100) : 0;
            const full = pct >= 100;
            const high = pct >= 80;
            return (
              <div key={station.id || station.name} className="rounded-[14px] border border-border bg-panel p-4 shadow-card">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-[14.5px] font-semibold text-text">{station.name}</div>
                    <div className="text-[11.5px] text-faint">{station.note}</div>
                  </div>
                  <Badge tone={full ? 'danger' : high ? 'gold' : 'ok'}>{full ? 'Full' : high ? 'Busy' : 'OK'}</Badge>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 flex-1 overflow-hidden rounded-md bg-inset">
                    <div
                      className={`h-full rounded-md ${full ? 'bg-danger-fg' : high ? 'bg-gold' : 'bg-accent'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <span className="text-[12.5px] font-semibold text-text">{station.load}/{station.cap}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showWorkOrders && (workOrders.length ? (
        <GridTable cols={WO_COLS} head={['Order', 'Customer', 'Station', 'Due', 'Status']}>
          {workOrders.map((workOrder) => (
            <GridRow key={workOrder.id || workOrder.code} cols={WO_COLS}>
              <span className="font-mono text-[13px] font-semibold text-accent">{workOrder.code}</span>
              <div className="min-w-0">
                <div className="text-[13px] text-text">{workOrder.customer}</div>
                <div className="text-[11.5px] text-faint">{workOrder.service}</div>
              </div>
              <span className="text-[12.5px] text-muted">{workOrder.station}</span>
              <span className="text-[12.5px] text-muted">{workOrder.due}</span>
              <span><Badge tone={STATUS_TONE[workOrder.status]}>{ST[workOrder.status]?.label || workOrder.status}</Badge></span>
            </GridRow>
          ))}
        </GridTable>
      ) : <EmptyState title="No active work orders" message="Paid and processing orders will appear here." />)}

      {showExceptions && (
        <Card className="overflow-hidden">
          <div className="px-4.5 pt-3.5 pb-2 text-[13px] text-muted">
            Garment exceptions re-route to a station; resolving one is saved in the audit log.
          </div>
          {productionExceptions.map((exception) => (
            <div key={exception.id || exception.code} className="flex items-center gap-3.5 border-t border-border px-4.5 py-3.25">
              <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[9px] bg-danger-bg text-danger-fg">
                <Icon paths={ALERT} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-text">{exception.item}</div>
                <div className="text-[12px] text-muted">{exception.code} · {exception.reason} · re-routed to {exception.station}</div>
              </div>
              <Badge tone={EX_TONE[exception.status]}>{EX_LABEL[exception.status] || exception.status}</Badge>
              {exception.status !== 'resolved' && (
                <Button
                  variant="default"
                  onClick={() => {
                    resolveException(exception.id, { by: p.user?.name });
                    p.notify(`${exception.code} exception resolved`);
                  }}
                >
                  Resolve
                </Button>
              )}
            </div>
          ))}
          {productionExceptions.length === 0 && <EmptyState title="No production exceptions" message="The exception queue is clear." />}
        </Card>
      )}
    </div>
  );
}
