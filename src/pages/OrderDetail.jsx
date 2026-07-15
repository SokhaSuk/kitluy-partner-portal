import { Fragment } from "react";
import { usePortal } from "../store/PortalContext.jsx";
import { useDomain } from "../store/DomainContext.jsx";
import { useMessages } from "../store/MessagesContext.jsx";
import { ST } from "../data/status.js";
import { STATUS_TONE, METHOD } from "../lib/tone.js";
import { khr } from "../lib/format.js";
import { I, Icon } from "../lib/icons.jsx";
import { cn } from "../lib/cn.js";
import { Badge, Button, Card, EmptyState } from "../components/ui/index.jsx";

const PIPELINE = ["created", "paid", "processing", "ready", "collected", "completed"];

const initialsOf = (name) =>
  (name || "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function OrderDetail() {
  const p = usePortal();
  const { orders, updateOrderStatus, settleOrderPayment } = useDomain();
  const { startConversation, sendMessage, source } = useMessages();
  // Stringwise so a uid (backend) or a numeric seed id (text in the URL) both match.
  const od = orders.find((o) => String(o.id) === String(p.detailId));
  if (!od) {
    return (
      <EmptyState title="Order not found" message="This order may have been removed or the link is no longer valid.">
        <Button className="mt-2" onClick={p.go("orders")}>Back to Order Center</Button>
      </EmptyState>
    );
  }
  const curIdx = PIPELINE.indexOf(od.status);
  const garments = od.garments || [];
  const timeline = od.timeline || [];
  const payments = od.payments || [];
  const nextStatus = curIdx >= 0 ? PIPELINE[curIdx + 1] : null;

  return (
    <div className="animate-kfade">
      <button
        type="button"
        onClick={p.go("orders")}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-muted hover:text-text"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Back to Order Center
      </button>

      {/* header */}
      <div className="mb-4.5 flex flex-wrap items-start gap-4">
        <span className="flex h-12.5 w-12.5 shrink-0 items-center justify-center rounded-[13px] bg-info-bg text-[17px] font-bold text-info-fg">
          {initialsOf(od.customer)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[21px] font-bold tracking-[-0.01em] text-text">
              {od.customer}
            </span>
            <Badge tone={STATUS_TONE[od.status]}>{ST[od.status]?.label || od.status}</Badge>
            <Badge tier={od.tier}>{od.tier}</Badge>
          </div>
          <div className="mt-0.75 text-[13px] text-muted">
            {od.code} · {od.service} · {od.detail} · {od.phone}
          </div>
        </div>
        <div className="flex gap-2.5">
          {nextStatus && (
            <Button
              variant="primary"
              onClick={() => {
                updateOrderStatus(od.id, nextStatus, { title: `Advanced to ${ST[nextStatus].label}`, actor: p.user?.name });
                p.notify(`${od.code} marked ${ST[nextStatus].label}`);
              }}
            >
              Mark {ST[nextStatus].label}
            </Button>
          )}
          <Button
            onClick={async () => {
              // start_conversation dedups on the customer (backend) or `who` (local),
              // so this posts into the existing thread rather than a duplicate.
              const id = await startConversation({
                who: od.customer,
                kind: 'Customers',
                channel: 'Local',
                subtitle: `${od.code} · ${od.service}`,
              });
              if (!id) return;
              sendMessage(id, { text: `Update for ${od.code}: your order is ${ST[od.status]?.label || od.status}.`, by: p.user?.name || 'Portal user' });
              p.notify(`Update sent to ${od.customer}'s thread`);
            }}
          >
            {source === 'backend' ? 'Send order update' : 'Save local update'}
          </Button>
          <Button onClick={() => window.print()}>
            Print slip
          </Button>
        </div>
      </div>

      {/* pipeline */}
      <div className="mb-3.5 rounded-[14px] border border-border bg-panel px-5.5 py-5 shadow-card">
        <div className="flex items-center">
          {PIPELINE.map((step, i) => {
            const done = i <= curIdx && curIdx >= 0;
            const last = i === PIPELINE.length - 1;
            return (
              <Fragment key={step}>
                <div className="flex shrink-0 items-center">
                  <div className="flex flex-col items-center gap-1.75">
                    <span
                      className={cn(
                        "flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        done
                          ? "bg-accent text-white"
                          : "border-[1.5px] border-border-strong bg-inset text-faint",
                      )}
                    >
                      {done && (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="whitespace-nowrap text-[11.5px] text-muted">
                      {ST[step].label}
                    </span>
                  </div>
                </div>
                {!last && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      i < curIdx ? "bg-accent" : "bg-border",
                    )}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-3.5">
        <div className="flex flex-col gap-3.5">
          {/* garments */}
          <Card className="overflow-hidden">
            <div className="px-4.5 pt-3.75 pb-2.5 text-[14px] font-semibold text-text">
              Garment details
            </div>
            {garments.map((g) => (
              <div
                key={g.tag}
                className="flex items-center gap-3 border-t border-border px-4.5 py-2.75"
              >
                <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-inset text-muted">
                  <Icon paths={I.shirt} size={15} strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text">
                    {g.item}
                  </div>
                  <div className="text-[11.5px] text-faint">{g.care}</div>
                </div>
                <span className="font-mono text-[11.5px] text-muted">
                  {g.tag}
                </span>
                <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 text-[11.5px] font-semibold text-accent">
                  Slot {g.slot}
                </span>
              </div>
            ))}
          </Card>

          {/* payments */}
          <Card className="overflow-hidden">
            <div className="px-4.5 pt-3.75 pb-2.5 text-[14px] font-semibold text-text">
              Payments{" "}
              <span className="text-[12px] font-normal text-faint">
                · append-only
              </span>
            </div>
            {payments.map((pay, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-t border-border px-4.5 py-2.75"
              >
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-text">
                    {pay.type}
                  </div>
                  <div className="text-[11.5px] text-faint">
                    {METHOD[pay.method] || (pay.method === 'pickup' ? 'Pay at pickup' : pay.method)} · {pay.when}
                  </div>
                </div>
                <span className="text-[13.5px] font-semibold text-text">
                  {khr(pay.amount)}
                </span>
                {pay.when === 'Outstanding' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      settleOrderPayment(od.id, pay.id, { actor: p.user?.name });
                      p.notify(`${od.code} payment marked settled`);
                    }}
                  >
                    Mark settled
                  </Button>
                )}
              </div>
            ))}
          </Card>
        </div>

        {/* timeline */}
        <Card className="overflow-hidden">
          <div className="px-4.5 pt-3.75 pb-2.5 text-[14px] font-semibold text-text">
            Timeline
          </div>
          <div className="px-4.5 pt-0.5 pb-3.5">
            {timeline.map((t, i) => (
              <div key={t.id || i} className="flex gap-3 py-2.25">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-inset text-accent">
                  <Icon paths={I.box} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] leading-[1.4] text-text">
                    {t.title}
                  </div>
                  <div className="text-[11.5px] text-faint">{t.by || t.meta || 'System'}</div>
                </div>
                <span className="shrink-0 text-[11.5px] text-faint">
                  {t.time || (t.at ? new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
