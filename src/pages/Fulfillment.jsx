import { I, Icon } from '../lib/icons.jsx';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';

export default function Fulfillment() {
  const p = usePortal();
  const { orders, updateOrderStatus } = useDomain();
  const collectionQueue = orders.filter((order) => order.status === 'ready');

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Fulfillment"
        subtitle="Collection queue from the current order data · delivery unlocks in Phase 2 (HSAL)"
      />

      <div className="grid gap-3.5" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <Card className="overflow-hidden">
          <div className="px-4.5 pt-3.75 pb-2.5 text-[15px] font-semibold text-text">
            Ready for collection · {collectionQueue.length}
          </div>
          {collectionQueue.map((order) => (
            <div key={order.id} className="flex items-center gap-3 border-t border-border px-4.5 py-3.25">
              <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[9px] bg-gold-bg text-gold-fg">
                <Icon paths={I.check} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-text">{order.customer}</div>
                <div className="text-[11.5px] text-faint">{order.code} · {order.detail}</div>
              </div>
              <span className="text-[12px] text-muted">{order.due}</span>
              <Button
                variant="primary"
                onClick={() => {
                  updateOrderStatus(order.id, 'collected', { title: 'Collected by customer', actor: p.user?.name });
                  p.notify(`${order.code} marked collected`);
                }}
              >
                Collect
              </Button>
            </div>
          ))}
          {collectionQueue.length === 0 && (
            <EmptyState title="Collection queue is clear" message="Orders marked Ready will appear here." />
          )}
        </Card>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-panel p-6 text-center shadow-card">
          <span className="mb-3 flex h-11.5 w-11.5 items-center justify-center rounded-xl bg-inset text-faint">
            <Icon paths={I.truck} size={22} strokeWidth={1.8} />
          </span>
          <div className="mb-1 text-[14px] font-semibold text-text">Delivery — Phase 2</div>
          <div className="max-w-55 text-[12.5px] text-muted">
            Attach the HSAL fleet to offer pickup &amp; delivery with live driver tracking.
          </div>
        </div>
      </div>
    </div>
  );
}
