import { cn } from '../lib/cn.js';
import { Card, EmptyState, PageHeader } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';

const barTone = (pct) => (pct >= 90 ? 'bg-danger-fg' : pct >= 70 ? 'bg-gold' : 'bg-accent');

export default function Capacity() {
  const { orders, services } = useDomain();
  const activeOrders = orders.filter((order) => !['cancelled', 'collected', 'completed'].includes(order.status));
  const capacityRows = services.filter((service) => service.active !== false).map((service) => ({
    name: service.name,
    unit: service.weight ? 'kg' : 'items',
    booked: activeOrders
      .filter((order) => order.service === service.name)
      .reduce((total, order) => total + (Number.parseFloat(String(order.detail).replace(/,/g, '')) || 1), 0),
    cap: Number(service.dailyCapacity || Math.max(service.items || 1, 1)),
  }));

  return (
    <div className="animate-kfade">
      <PageHeader title="Capacity" subtitle="Estimated active backlog against each service's configured capacity" />

      <Card className="p-4.5">
        {capacityRows.map((row) => {
          const pct = row.cap > 0 ? Math.min(100, Math.round((row.booked / row.cap) * 100)) : 0;
          const label = `${Math.round(row.booked * 10) / 10} / ${row.cap} ${row.unit}`;
          return (
            <div key={row.name} className="border-t border-border py-3.25">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13.5px] font-semibold text-text">{row.name}</span>
                <span className="text-[12.5px] text-muted">{label} · {pct}%</span>
              </div>
              <div className="h-2.25 overflow-hidden rounded-[6px] bg-inset">
                <div className={cn('h-full rounded-[6px]', barTone(pct))} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {capacityRows.length === 0 && <EmptyState title="No active services" message="Add a service to begin tracking capacity." />}
      </Card>
    </div>
  );
}
