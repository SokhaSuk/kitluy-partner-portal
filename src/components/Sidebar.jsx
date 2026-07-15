import { useState } from "react";
import { cn } from "../lib/cn.js";
import { Icon } from "../lib/icons.jsx";
import { NAV } from "../data/nav.js";
import { usePortal } from "../store/PortalContext.jsx";
import { useDomain } from "../store/DomainContext.jsx";
import { SearchInput } from "./ui/index.jsx";

const Chevron = ({ className, size = 12, width = 2.2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const SIGN_OUT = [
  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
  "M16 17l5-5-5-5",
  "M21 12H9",
];

const BADGE = {
  default:
    "text-[10.5px] font-semibold text-muted bg-inset px-1.75 rounded-full",
  danger:
    "text-[10.5px] font-bold text-white bg-danger-fg w-4 h-4 rounded-full flex items-center justify-center",
};

/** "Het Sovannara" -> "HS" */
const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Normalizes the two shapes a nav child can take. */
const kids = (item) =>
  (item.children || []).map((c) =>
    typeof c === "string" ? { tab: c, label: c } : c,
  );

function NavItem({ item, liveBadges, searchQuery }) {
  const p = usePortal();
  const allChildren = kids(item);
  const itemMatches = item.label.toLowerCase().includes(searchQuery);
  const children = searchQuery
    ? itemMatches
      ? allChildren
      : allChildren.filter((child) =>
          child.label.toLowerCase().includes(searchQuery),
        )
    : allChildren;
  const onPage = p.page === item.page;
  const hasLiveBadge = Object.prototype.hasOwnProperty.call(
    liveBadges,
    item.id,
  );
  const badge = hasLiveBadge ? liveBadges[item.id] : (item.badge ?? null);
  // A group remembers its own open state once toggled; until then it follows
  // whether you're on its page.
  const openState = p.open[item.id] !== undefined ? p.open[item.id] : onPage;
  const hasChildren = children.length > 0;
  const subOpen = hasChildren && (searchQuery ? true : openState);

  const go = () => {
    if (!hasChildren) {
      p.set({ page: item.page, nav: item.id, mobileNavOpen: false });
      return;
    }
    if (onPage) {
      p.set({ open: { ...p.open, [item.id]: !openState } });
    } else {
      p.set({
        page: item.page,
        [item.tabKey]: children[0].tab,
        nav: item.id,
        mobileNavOpen: false,
        open: { ...p.open, [item.id]: true },
      });
    }
  };

  const leafActive = onPage && !hasChildren;

  return (
    <div>
      <button
        type="button"
        onClick={go}
        aria-current={leafActive ? "page" : undefined}
        aria-expanded={hasChildren ? subOpen : undefined}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2.75 rounded-[10px] border-0 px-2.5 py-2 text-left text-[13px] whitespace-nowrap hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)",
          leafActive
            ? "bg-active font-semibold text-text"
            : onPage
              ? "font-semibold text-text"
              : "font-medium text-muted",
        )}
      >
        <Icon
          paths={item.icon}
          size={17}
          strokeWidth={1.85}
          className="shrink-0 opacity-95"
        />
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {item.label}
        </span>
        {badge !== null && badge !== undefined && (
          <span className={BADGE.default}>{badge}</span>
        )}
        {hasChildren && (
          <Chevron
            size={13}
            className={cn(
              "shrink-0 opacity-60 transition-transform",
              !subOpen && "-rotate-90",
            )}
          />
        )}
      </button>

      {subOpen && (
        <div className="mt-0.5 mb-1 ml-4.5 flex flex-col gap-px border-l border-border pl-2">
          {children.map((c) => {
            const active = onPage && p[item.tabKey] === c.tab;
            return (
              <button
                type="button"
                key={c.tab}
                aria-current={active ? "page" : undefined}
                onClick={() =>
                  p.set({
                    page: item.page,
                    [item.tabKey]: c.tab,
                    nav: item.id,
                    mobileNavOpen: false,
                    open: { ...p.open, [item.id]: true },
                  })
                }
                className={cn(
                  // py-[6.5px] stays arbitrary: the spacing scale only accepts
                  // 0.25 steps, and 6.5px would be py-1.625.
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 px-2.5 py-[6.5px] text-left text-[12.5px] whitespace-nowrap hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)",
                  active
                    ? "bg-active font-semibold text-text"
                    : "font-medium text-muted",
                )}
              >
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const p = usePortal();
  const { storeSettings = {}, orders = [], threads = [] } = useDomain();
  const user = p.user || {};
  const [navQuery, setNavQuery] = useState("");

  // Sign-out drops every unsaved screen state in the portal, and the button
  // sits one stray click from the user card. It asks first.
  const confirmSignOut = () =>
    p.confirm({
      title: "Sign out of KitLuy?",
      message:
        "You will need your password to sign back in on this browser. Your store's local data stays on this device.",
      confirmLabel: "Sign out",
      onConfirm: p.signOut,
    });
  const searchQuery = navQuery.trim().toLowerCase();
  const liveBadges = {
    orders: orders.filter(
      (order) =>
        !["completed", "collected", "cancelled"].includes(order.status),
    ).length,
    messages: threads.reduce(
      (sum, thread) => sum + Number(thread.unread || 0),
      0,
    ),
  };
  const filteredGroups = NAV.map((group) => {
    const groupMatches = group.group.toLowerCase().includes(searchQuery);
    const items =
      !searchQuery || groupMatches
        ? group.items
        : group.items.filter((item) =>
            [item.label, ...kids(item).map((child) => child.label)].some(
              (label) => label.toLowerCase().includes(searchQuery),
            ),
          );
    return { ...group, items, itemQuery: groupMatches ? "" : searchQuery };
  }).filter((group) => group.items.length > 0);
  const storeName = storeSettings.name || user.storeName || "KitLuy store";

  return (
    <>
      {p.mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={p.closeMobileNav}
          className="fixed inset-0 z-40 cursor-default border-0 bg-(--scrim) animate-kfadein md:hidden"
        />
      )}
      <aside
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-68 shrink-0 overflow-hidden border-r border-border bg-panel shadow-pop transition-transform duration-200 ease-out md:relative md:z-auto md:translate-x-0 md:shadow-none md:transition-[width]",
          p.mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          p.collapsed ? "md:w-0" : "md:w-63",
        )}
      >
        <div className="flex h-full w-68 shrink-0 flex-col md:w-63">
          {/* workspace / store switcher */}
          <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
            <button
              type="button"
              onClick={() =>
                p.set({
                  page: "settings",
                  nav: "settings",
                  mobileNavOpen: false,
                })
              }
              title="Open store settings"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-panel p-2 text-left hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-(--ring)"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold text-text">
                  {storeName}
                </span>
                <span className="flex items-center gap-1.25">
                  <span className="text-[10.5px] font-semibold text-ok-fg">
                    ● Open
                  </span>
                  <span className="text-[10.5px] text-faint">· Laundry</span>
                </span>
              </span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-faint"
                aria-hidden="true"
              >
                <path d="M7 15l5 5 5-5" />
                <path d="M7 9l5-5 5 5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={p.closeMobileNav}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-muted hover:bg-hover md:hidden"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          </div>

          {/* search */}
          <div className="px-3.5 pb-1.5">
            <SearchInput
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
              placeholder="Search navigation…"
              aria-label="Search navigation"
            />
          </div>

          {/* nav groups */}
          <nav className="flex-1 overflow-x-hidden overflow-y-auto px-2.5 pt-1.5 pb-2">
            {filteredGroups.map((g) => {
              const open = searchQuery ? true : p.groups[g.group] !== false;
              return (
                <div key={g.group} className="mb-1">
                  <button
                    type="button"
                    onClick={() =>
                      p.set({
                        groups: {
                          ...p.groups,
                          [g.group]: p.groups[g.group] === false,
                        },
                      })
                    }
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-2 pt-2.25 pb-1.25"
                  >
                    <span className="text-[10.5px] font-semibold tracking-wider text-faint uppercase">
                      {g.group}
                    </span>
                    <Chevron
                      className={cn(
                        "text-faint transition-transform",
                        !open && "-rotate-90",
                      )}
                    />
                  </button>
                  {open && (
                    <div className="flex flex-col gap-px">
                      {g.items.map((item) => (
                        <NavItem
                          key={item.id}
                          item={item}
                          liveBadges={liveBadges}
                          searchQuery={g.itemQuery}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredGroups.length === 0 && (
              <div className="px-3 py-8 text-center text-[12.5px] text-muted">
                No navigation matches "{navQuery.trim()}".
              </div>
            )}
          </nav>

          {/* trial / plan card */}
          {p.promoOpen && (
            <div
              className="mx-3.5 my-1.5 rounded-xl border border-border p-3.25"
              style={{
                background:
                  "linear-gradient(140deg, color-mix(in srgb, var(--accent) 10%, var(--panel)), var(--panel))",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Normal case, not 10px ALL-CAPS: the smallest type on screen should
                    not also be the hardest shape to read. */}
                <span className="text-[12px] font-semibold text-text">Commerce plan</span>
                <span className="shrink-0 rounded-full bg-gold-bg px-2 py-0.5 text-[11px] font-semibold text-gold-fg">
                  6 days left
                </span>
              </div>

              {/* The price is the point of the card, so it gets the size. */}
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[20px] font-bold tracking-[-0.01em] text-text">៛30</span>
                <span className="text-[12px] text-muted">a month</span>
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-ok-fg">
                No commission on sales
              </div>

              <p className="mt-2 text-[12px] leading-normal text-muted">
                Billing is not connected yet. You will not be charged.
              </p>

              {/* Disabled on purpose. This used to be a solid primary button whose label
                  was a status, not an action, and whose only effect was a toast saying
                  the same thing. A button that cannot do its job should look like it. */}
              <button
                type="button"
                disabled
                title="Billing needs a payment provider and a merchant account, which this build does not have."
                className="mt-2.5 w-full cursor-not-allowed rounded-lg border border-border bg-inset p-2 text-[12.5px] font-semibold text-faint"
              >
                Set up billing · not yet available
              </button>
            </div>
          )}

          {/* footer / profile */}
          <div className="flex flex-col gap-px border-t border-border px-3 py-1.75">
            <div className="flex items-center gap-2.5 rounded-[9px] px-2 py-1.75 hover:bg-hover">
              <span
                className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent), var(--purple))",
                }}
              >
                {initials(user.name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-text">
                  {user.name}
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-faint">
                  {[user.role, user.contact].filter(Boolean).join(" · ")}
                </span>
              </span>
              <button
                type="button"
                onClick={confirmSignOut}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-faint hover:bg-inset hover:text-danger-fg focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
              >
                <Icon paths={SIGN_OUT} size={15} strokeWidth={1.9} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
