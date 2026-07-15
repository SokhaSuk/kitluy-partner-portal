import { Suspense, lazy } from "react";
import { usePortal } from "../store/PortalContext.jsx";
import { useDomain } from "../store/DomainContext.jsx";
import { Badge, Button, Card, CardHead, Kpi, Skeleton } from "../components/ui/index.jsx";
import { I, Icon } from "../lib/icons.jsx";
import { khr } from "../lib/format.js";
import { cn } from "../lib/cn.js";
import { STATUS_TONE, toneClass } from "../lib/tone.js";
import { ST } from "../data/status.js";

// Recharts is ~560 kB — the largest thing in the app and only the dashboard
// needs it. Loading it lazily keeps it out of the initial bundle.
const RevenueBarChart = lazy(() =>
  import("../charts/index.jsx").then((m) => ({ default: m.RevenueBarChart })),
);
const OrdersByServiceChart = lazy(() =>
  import("../charts/index.jsx").then((m) => ({ default: m.OrdersByServiceChart })),
);

/** Holds the chart's exact height so the card doesn't jump when it loads. */
const ChartFallback = () => <Skeleton className="h-50 w-full rounded-lg" />;

export default function Dashboard() {
  const p = usePortal();
  const { orders, inventoryItems, productionExceptions, stations, storeSettings } = useDomain();
  const nonCancelled = orders.filter((order) => order.status !== "cancelled");
  const revenue = nonCancelled.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const inProduction = orders.filter((order) => ["paid", "processing"].includes(order.status)).length;
  const readyCount = orders.filter((order) => order.status === "ready").length;
  const openTabs = orders.filter((order) => order.method === "tab" && !["collected", "completed", "cancelled"].includes(order.status)).length;
  const openExceptions = productionExceptions.filter((exception) => exception.status !== "resolved");
  const lowSupplies = inventoryItems
    .map((item) => {
      const usage = Number.parseFloat(String(item.usage || ''));
      const days = usage > 0 ? Math.max(0, Math.floor(Number(item.quantity || 0) / usage)) : Number(item.days || 0);
      return { ...item, days };
    })
    .filter((item) => item.days <= 9)
    .sort((a, b) => a.days - b.days)
    .map((item) => ({
      name: item.name,
      left: `${item.days} days remaining`,
      tag: Number(item.days) <= 3 ? "Critical" : "Low",
      tone: Number(item.days) <= 3 ? "danger" : "gold",
      dot: Number(item.days) <= 3 ? "bg-danger-fg" : "bg-gold",
    }));
  const attentionCount = openExceptions.length + lowSupplies.filter((item) => item.tag === "Critical").length + openTabs;
  const attentionPage = openExceptions.length ? "production" : lowSupplies.some((item) => item.tag === "Critical") ? "supplies" : "finance";
  const kpiDef = [
    { label: "Recorded order value", value: khr(revenue), delta: "", icon: I.wallet, tint: 0, tone: "info", sub: `${nonCancelled.length} non-cancelled orders` },
    { label: "Saved orders", value: String(orders.length), delta: "", icon: I.receipt, tint: 1, tone: "purple", sub: `${readyCount} awaiting pickup` },
    { label: "In production", value: String(inProduction), delta: "", icon: I.droplet, tint: 2, tone: "gold", sub: `across ${stations.length} stations` },
    { label: "Ready for pickup", value: String(readyCount), delta: "", icon: I.clock, tint: 3, tone: "ok", sub: "current ready queue" },
  ];
  const revenueData = Object.values(nonCancelled.reduce((groups, order) => {
    const status = ST[order.status]?.label || order.status;
    groups[status] ||= { day: status, revenue: 0 };
    groups[status].revenue += Number(order.total || 0);
    return groups;
  }, {}));
  // Busiest service first: the bars are read against each other, and an ordered
  // axis is what lets the eye do that without measuring.
  const flowData = Object.values(orders.reduce((groups, order) => {
    groups[order.service] ||= { service: order.service, received: 0, ready: 0 };
    groups[order.service].received += 1;
    if (["ready", "collected", "completed"].includes(order.status)) groups[order.service].ready += 1;
    return groups;
  }, {})).sort((a, b) => b.received - a.received);

  const queueRows = orders.filter((o) =>
    ["created", "paid", "processing", "ready"].includes(o.status),
  )
    .slice(0, 5)
    .map((o) => {
      const st = ST[o.status];
      return {
        id: o.id,
        code: o.code,
        customer: o.customer,
        service: o.service,
        total: khr(o.total),
        icon: st.icon,
        statusLabel: st.label,
        tone: STATUS_TONE[o.status],
        open: () =>
          p.set({ page: "orderdetail", detailId: o.id, nav: "orders" }),
      };
    });

  return (
    <div className="flex flex-col gap-4.5 animate-kfade sm:gap-5">
      {/* greeting + store status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="m-0 text-[22px] font-bold tracking-tight text-text sm:text-[25px]">
            Welcome back, {p.user?.name || "Store team"}
          </h1>
          <div className="mt-0.5 text-[13px] text-muted">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date())} · Here's the data saved for {storeSettings.name}.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.25">
          <Button variant="purple" icon={I.spark} onClick={p.go("ai")}>
            Store insights
          </Button>
          <Button onClick={p.go("finance")}>Finance summary</Button>
        </div>
      </div>

      {/* anomaly banner */}
      {p.bannerOpen && attentionCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-gold-bg px-4 py-3.5 sm:flex-nowrap sm:px-4.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--gold)_22%,transparent)] text-gold-fg">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-text">
              {attentionCount} {attentionCount === 1 ? "item needs" : "items need"} your attention
            </div>
            <div className="text-[12.5px] text-muted">
              {openExceptions.length} production exceptions · {lowSupplies.filter((item) => item.tag === "Critical").length} critical supplies · {openTabs} open B2B tabs
            </div>
          </div>
          <Button
            variant="primary"
            onClick={p.go(attentionPage)}
            className="ml-12 shrink-0 text-[12.5px] sm:ml-0"
          >
            Review
          </Button>
          <button
            type="button"
            onClick={p.dismissBanner}
            className="flex shrink-0 cursor-pointer p-1 text-gold-fg transition-opacity hover:opacity-60"
            aria-label="Dismiss"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiDef.map((k) => (
          <Kpi
            key={k.label}
            label={k.label}
            value={k.value}
            delta={k.delta}
            up={k.up}
            sub={k.sub}
            icon={k.icon}
            tone={k.tone}
          />
        ))}
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.15fr_1fr]">
        <Card className="px-4.5 pt-4.5 pb-3.5">
          <CardHead
            className="mb-1.5"
            title="Revenue"
            subtitle="Recorded order value by current status (KHR)"
            right={<span className="rounded-lg border border-border bg-panel px-2.5 py-1.5 text-[12.5px] text-muted">Current data</span>}
          />
          <Suspense fallback={<ChartFallback />}>
            <RevenueBarChart data={revenueData} ariaLabel="Recorded order revenue grouped by current status" />
          </Suspense>
        </Card>

        <Card className="px-4.5 pt-4.5 pb-3.5">
          <CardHead
            className="mb-1.5"
            title="Orders received vs ready"
            subtitle="Saved orders grouped by service"
            right={<div className="flex flex-wrap gap-3.5 pt-0.5">
              <span className="flex items-center gap-1.5 text-[12px] text-muted">
                <span className="h-2.25 w-2.25 rounded-full bg-accent" />
                Received
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-muted">
                {/* Matches the bar fill — the legend swatch and the mark it names
                    have to be the same colour to be a legend at all. */}
                <span className="h-2.25 w-2.25 rounded-full bg-gold-fg" />
                Ready
              </span>
            </div>}
          />
          <Suspense fallback={<ChartFallback />}>
            <OrdersByServiceChart data={flowData} ariaLabel="Saved and ready orders grouped by service" />
          </Suspense>
        </Card>
      </div>

      {/* live queue + side rail */}
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4.5 pt-4 pb-3">
            <div className="flex items-center gap-2.25">
              <div className="text-[15px] font-semibold text-text">
                Current order queue
              </div>
              <span className="flex items-center gap-1.25 rounded-full bg-ok-bg px-2 py-0.5 text-[11px] font-semibold text-ok-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-ok-fg animate-kpulse" />
                Saved
              </span>
            </div>
            <button
              type="button"
              onClick={p.go("orders")}
              className="cursor-pointer border-0 bg-transparent text-[12.5px] font-semibold text-accent"
            >
              Order Center →
            </button>
          </div>
          <div>
            {queueRows.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={r.open}
                className="flex w-full cursor-pointer items-center gap-3 border-x-0 border-t border-b-0 border-border bg-transparent px-4 py-2.75 text-left hover:bg-hover focus-visible:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:px-4.5"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    toneClass(r.tone),
                  )}
                >
                  <Icon paths={r.icon} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-text">
                    {r.customer}
                  </div>
                  <div className="text-[12px] text-faint">
                    {r.code} · {r.service}
                  </div>
                </div>
                <span className="shrink-0 text-[13px] text-muted">
                  {r.total}
                </span>
                <Badge tone={r.tone}>{r.statusLabel}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          {/* AI teaser (purple) */}
          <Card variant="purple" className="overflow-hidden">
            <div className="flex items-center gap-2 bg-purple-bg px-4 py-3">
              <Icon paths={I.spark} size={16} className="text-purple-fg" />
              <span className="text-[12.5px] font-semibold text-purple-fg">
                Local data · suggestion
              </span>
              <span className="ml-auto text-[11px] text-purple-fg opacity-80">
                Rule-based
              </span>
            </div>
            <div className="px-4 py-3.5">
              <div className="mb-2.5 text-[13.5px] leading-normal text-text">
                {lowSupplies[0]
                  ? <><strong>{lowSupplies[0].name}</strong> has {lowSupplies[0].left.toLowerCase()}. Review stock and create a purchase order before it runs out.</>
                  : <><strong>{readyCount} orders</strong> are ready for pickup. Review the fulfillment queue and notify customers.</>}
              </div>
              <button
                type="button"
                onClick={p.go(lowSupplies[0] ? "supplies" : "fulfillment")}
                className="cursor-pointer rounded-lg border-0 bg-purple-bg px-3 py-1.75 text-[12.5px] font-semibold text-purple-fg transition-opacity hover:opacity-85"
              >
                Review now →
              </button>
            </div>
          </Card>

          {/* supplies low stock */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <span className="text-[14px] font-semibold text-text">
                Supplies running low
              </span>
              <button
                type="button"
                onClick={p.go("supplies")}
                className="cursor-pointer border-0 bg-transparent text-[12px] font-semibold text-accent"
              >
                All
              </button>
            </div>
            {lowSupplies.map((sp) => (
              <div
                key={sp.name}
                className="flex items-center gap-2.75 border-t border-border px-4 py-2.25"
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", sp.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-text">{sp.name}</div>
                  <div className="text-[11.5px] text-faint">{sp.left}</div>
                </div>
                <Badge tone={sp.tone}>{sp.tag}</Badge>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
