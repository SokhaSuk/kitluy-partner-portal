import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { ST } from '../data/status.js';
import { STATUS_TONE, METHOD } from '../lib/tone.js';
import { khr } from '../lib/format.js';
import { downloadCsv } from '../lib/export.js';
import { I } from '../lib/icons.jsx';
import {
  Badge,
  Button,
  Card,
  Cell,
  Chip,
  EmptyState,
  GridRow,
  GridTable,
  PageHeader,
  SearchInput,
} from '../components/ui/index.jsx';

const COLS = '1.6fr 1.1fr 1fr .8fr 1fr .9fr';
const STATUS_CHIPS = ['All', 'created', 'paid', 'processing', 'ready', 'collected', 'completed', 'cancelled'];

export default function Orders() {
  const p = usePortal();
  const { orders, meta } = useDomain();
  const q = p.orderSearch.toLowerCase();
  const filtered = orders.filter((order) => {
    const matchesQuery = !q ||
      order.customer.toLowerCase().includes(q) ||
      order.code.toLowerCase().includes(q) ||
      order.service.toLowerCase().includes(q);
    return matchesQuery && (p.orderStatus === 'All' || order.status === p.orderStatus);
  });

  const exportOrders = () => {
    downloadCsv('kitluy-orders.csv', filtered, [
      { key: 'code', label: 'Order' },
      { key: 'customer', label: 'Customer' },
      { key: 'service', label: 'Service' },
      { key: 'detail', label: 'Detail' },
      { key: 'total', label: 'Total KHR' },
      { key: 'method', label: 'Payment' },
      { key: 'due', label: 'Due' },
      { key: 'status', label: 'Status' },
    ]);
    p.notify(`Exported ${filtered.length} orders`);
  };

  return (
    <div className="animate-kfade">
      <PageHeader title="Order Center" subtitle="Saved order data shared across the portal">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-info-bg px-2.75 py-1.25 text-[11.5px] font-semibold text-info-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-info-fg" />
          Updated {new Date(meta.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Button icon={I.download} onClick={exportOrders}>Export CSV</Button>
      </PageHeader>

      <Card className="mb-3.5 p-3 sm:p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={p.orderSearch}
            onChange={(event) => p.set({ orderSearch: event.target.value })}
            placeholder="Search code, customer, service…"
            aria-label="Search orders"
            className="w-full lg:max-w-80"
          />
          <div className="flex min-w-0 flex-1 gap-1.75 overflow-x-auto pb-1 lg:pb-0">
            {STATUS_CHIPS.map((chip) => (
              <Chip
                key={chip}
                active={p.orderStatus === chip}
                aria-pressed={p.orderStatus === chip}
                onClick={() => p.set({ orderStatus: chip })}
              >
                {chip === 'All' ? 'All' : ST[chip]?.label || chip}
              </Chip>
            ))}
          </div>
          <span className="shrink-0 text-[12px] text-muted">{filtered.length} of {orders.length}</span>
        </div>
      </Card>

      {filtered.length > 0 ? (
        <GridTable
          cols={COLS}
          minWidth={820}
          head={['Customer', 'Service', { label: 'Total', align: 'right' }, 'Payment', 'Due', 'Status']}
        >
          {filtered.map((order) => (
            <GridRow
              key={order.id}
              cols={COLS}
              onClick={() => p.set({ page: 'orderdetail', detailId: order.id, nav: 'orders' })}
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-text">{order.customer}</span>
                  <Badge tier={order.tier}>{order.tier}</Badge>
                </div>
                <div className="text-[11.5px] text-faint">{order.code}</div>
              </div>
              <Cell sub={order.detail}>{order.service}</Cell>
              <Cell strong align="right">{khr(order.total)}</Cell>
              <Cell muted>{METHOD[order.method] || order.method}</Cell>
              <Cell muted className="whitespace-nowrap">{order.due}</Cell>
              <span><Badge tone={STATUS_TONE[order.status]}>{ST[order.status]?.label || order.status}</Badge></span>
            </GridRow>
          ))}
          <div className="px-4.5 py-3.25 text-[12.5px] text-muted">Showing {filtered.length} orders</div>
        </GridTable>
      ) : (
        <EmptyState title="No orders match these filters" message="Try a different status or clear your search to see the order queue.">
          <Button className="mt-2" onClick={() => p.set({ orderSearch: '', orderStatus: 'All' })}>Clear filters</Button>
        </EmptyState>
      )}
    </div>
  );
}
