import { cn } from "../lib/cn.js";
import { khr } from "../lib/format.js";
import { Icon } from "../lib/icons.jsx";
import { toneClass, STATUS_TONE } from "../lib/tone.js";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Kpi,
  TextInput,
} from "../components/ui/index.jsx";
import { usePortal } from "../store/PortalContext.jsx";
import { useDomain } from "../store/DomainContext.jsx";
import { useMessages } from "../store/MessagesContext.jsx";
import { usePartnerCustomers } from "../store/usePartnerCustomers.js";
import { useCustomerNotes } from "../store/useCustomerNotes.js";
import { ST } from "../data/status.js";
import { downloadCsv } from "../lib/export.js";

export default function CustomerDetail() {
  const p = usePortal();
  const { customerPreferences, orders } = useDomain();
  const { startConversation } = useMessages();
  const { customers } = usePartnerCustomers();
  // Called before the early return, so hook order stays stable.
  const { notes: cdNotes, addNote } = useCustomerNotes(p.custDetailId);

  // Stringwise: the URL id is always a string (a uid from the backend, or the
  // seed's numeric id as text). Never compare a numeric seed id to a string uid.
  const cd = customers.find((c) => String(c.id) === String(p.custDetailId));
  if (!cd) {
    return (
      <EmptyState
        title="Customer not found"
        message="This customer may have been removed or the link is no longer valid."
      >
        <Button className="mt-2" onClick={p.go("customers")}>
          Back to Customers
        </Button>
      </EmptyState>
    );
  }
  const cdAvg = Math.round(cd.spend / Math.max(cd.orders, 1) / 100) * 100;
  const cdIsB2B = cd.type === "B2B";
  const overdue = !!cd.tabOverdue;
  const tabBalance = cd.tabBalance ?? 0;
  const creditLimit = cd.creditLimit || 2000000;
  const cdTabPct = Math.min(100, Math.round((tabBalance / creditLimit) * 100));
  const cdJoined = new Date(cd.joined + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    },
  );

  const rawOrders = orders.filter((o) => o.customer === cd.name);
  const cdLive = rawOrders.map((o) => ({
    code: o.code,
    service: o.service,
    detail: o.detail,
    total: khr(o.total),
    when: o.due,
    statusLabel: ST[o.status].label,
    tone: STATUS_TONE[o.status],
    icon: ST[o.status].icon,
    open: () => p.set({ page: "orderdetail", detailId: o.id, nav: "orders" }),
  }));
  const cdOrders = cdLive.slice(0, 5);

  const cdKpis = [
    {
      label: "Orders",
      value: String(cd.orders),
      sub: "since " + cd.joined.slice(0, 4),
    },
    { label: "Lifetime value", value: khr(cd.spend), sub: "all services" },
    { label: "Avg order", value: khr(cdAvg), sub: "per visit" },
    cd.type === "B2B"
      ? {
          label: "Tab balance",
          value: khr(tabBalance),
          sub: `limit ${khr(creditLimit)}`,
        }
      : {
          label: "Loyalty points",
          value: (cd.coins ?? 0) + " ⭐",
          sub: "KitLuy points",
        },
  ];

  const cdPrefs =
    customerPreferences[cd.id] || customerPreferences[cd.name] || [];

  const toggleNote = () => p.set({ noteOpen: !p.noteOpen });
  const setNoteText = (e) => p.set({ noteText: e.target.value });
  const saveNote = async () => {
    const t = p.noteText.trim();
    if (!t) return;
    try {
      await addNote(t);
      p.set({ noteText: "", noteOpen: false });
      p.notify("Note added");
    } catch (error) {
      p.notify(error?.message || "That note could not be saved.");
    }
  };

  const openMessages = async () => {
    // start_conversation dedups on the customer (backend) or `who` (local), so this
    // reopens the existing thread rather than starting a duplicate.
    const id = await startConversation({
      who: cd.name,
      kind: "Customers",
      channel: "Local",
      subtitle: cd.phone,
      customerId: cd.id,
    });
    if (id) p.set({ page: "messages", nav: "messages", messageThreadId: id });
  };

  const exportHistory = () => {
    const filename = `${cd.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-orders.csv`;
    downloadCsv(filename, rawOrders, [
      { key: "code", label: "Order" },
      { key: "service", label: "Service" },
      { key: "detail", label: "Detail" },
      { key: "total", label: "Total KHR" },
      { key: "status", label: "Status" },
      { key: "due", label: "Due" },
    ]);
    p.notify(`${rawOrders.length} orders exported`);
  };

  return (
    <div className="animate-kfade">
      <button
        onClick={p.go("customers")}
        className="mb-4 flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-muted hover:text-text"
      >
        <Icon paths={["M19 12H5", "M12 19l-7-7 7-7"]} size={16} />
        Back to Customers
      </button>

      <div className="mb-4.5 flex flex-wrap items-start gap-4">
        <Avatar name={cd.name} tier={cd.tier} className="h-12.5 w-12.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[21px] font-bold tracking-[-0.01em] text-text">
              {cd.name}
            </span>
            <Badge tier={cd.tier}>{cd.tier}</Badge>
            <Badge tone="neutral">{cd.type}</Badge>
          </div>
          <div className="mt-0.75 text-[13px] text-muted">
            {cd.phone} · Member since {cdJoined} · Last visit {cd.last}
          </div>
        </div>
        <div className="flex gap-2.25">
          <Button onClick={openMessages}>Message</Button>
          <Button onClick={exportHistory}>Export history</Button>
        </div>
      </div>

      <div className="mb-3.5 grid grid-cols-4 gap-3.5">
        {cdKpis.map((k, i) => (
          <Kpi key={i} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: "1.5fr 1fr" }}
      >
        <Card className="self-start overflow-hidden">
          <div className="px-4.5 pb-2.5 pt-3.75 text-[14px] font-semibold text-text">
            Order history
          </div>
          {cdOrders.map((o, i) => (
            <div
              key={i}
              onClick={o.open}
              className="flex cursor-pointer items-center gap-3 border-t border-border px-4.5 py-2.75 hover:bg-hover"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  toneClass(o.tone),
                )}
              >
                <Icon paths={o.icon} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-text">
                  {o.code} · {o.service}
                </div>
                <div className="text-[11.5px] text-faint">
                  {o.detail} · {o.when}
                </div>
              </div>
              <span className="shrink-0 text-[13px] text-muted">{o.total}</span>
              <Badge tone={o.tone}>{o.statusLabel}</Badge>
            </div>
          ))}
          {cdOrders.length === 0 && (
            <div className="border-t border-border px-4.5 py-6 text-center text-[12.5px] text-muted">
              No orders are linked to this customer yet.
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3.5">
          {cdIsB2B && (
            <Card className="p-4.25">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold text-text">
                    B2B tab
                  </div>
                  <div className="text-[11.5px] text-faint">
                    {cd.settlementPeriod || "Monthly"} settlement · limit{" "}
                    {khr(creditLimit)}
                  </div>
                </div>
                <Badge tone={overdue ? "danger" : "ok"}>
                  {overdue ? "Overdue" : "Current"}
                </Badge>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2 flex-1 overflow-hidden rounded-md bg-inset">
                  <div
                    className={cn(
                      "h-full rounded-md",
                      overdue ? "bg-danger-fg" : "bg-ok-fg",
                    )}
                    style={{ width: cdTabPct + "%" }}
                  />
                </div>
                <span className="text-[12.5px] font-semibold text-text">
                  {khr(tabBalance)}
                </span>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="px-4.5 pb-2.5 pt-3.75 text-[14px] font-semibold text-text">
              Preferences{" "}
              <span className="text-[12px] font-normal text-faint">
                · stored locally for order entry
              </span>
            </div>
            {cdPrefs.map((pref, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 border-t border-border px-4.5 py-2.75"
              >
                <span className="text-[12.5px] text-muted">{pref.key}</span>
                <span className="text-right text-[13px] text-text">
                  {pref.value}
                </span>
              </div>
            ))}
            {cdPrefs.length === 0 && (
              <div className="border-t border-border px-4.5 py-4 text-[12.5px] text-muted">
                No saved preferences.
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4.5 pb-2.5 pt-3.75">
              <span className="text-[14px] font-semibold text-text">Notes</span>
              <button
                onClick={toggleNote}
                className="cursor-pointer border-none bg-transparent text-[12px] font-semibold text-accent"
              >
                {p.noteOpen ? "Cancel" : "Add note"}
              </button>
            </div>
            {p.noteOpen && (
              <div className="flex gap-2 px-4.5 pb-3">
                <TextInput
                  value={p.noteText}
                  onChange={setNoteText}
                  placeholder="Add a note for the counter team…"
                  className="flex-1"
                />
                <button
                  onClick={saveNote}
                  className="cursor-pointer rounded-lg border-none bg-primary px-3.5 text-[12.5px] font-semibold text-primary-text hover:opacity-90"
                >
                  Save
                </button>
              </div>
            )}
            {cdNotes.map((n, i) => (
              <div key={i} className="border-t border-border px-4.5 py-2.75">
                <div className="text-[13px] leading-normal text-text">
                  {n.text}
                </div>
                {n.meta && (
                  <div className="mt-1 text-[11.5px] text-faint">{n.meta}</div>
                )}
              </div>
            ))}
            {cdNotes.length === 0 && (
              <div className="border-t border-border px-4.5 py-4 text-[12.5px] text-muted">
                No notes yet.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
