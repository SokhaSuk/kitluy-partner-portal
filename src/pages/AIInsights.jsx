import { useState } from 'react';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { Button, Card, EmptyState, PageHeader } from '../components/ui/index.jsx';
import { I, Icon } from '../lib/icons.jsx';
import { cn } from '../lib/cn.js';
import { toneClass } from '../lib/tone.js';

/**
 * Each recommendation carries its own destination — the action button used to
 * route every card to the promo composer regardless of what it said.
 */
/**
 * Copy rule for this page: short sentences, common words, one idea per line.
 *
 * The old text read like an analyst's report — "projected to lift afternoon volume",
 * "prevents a line stoppage", "lapsed Gold-tier segment". A store owner reading
 * English as a second language has to decode that before they can act on it. Every
 * line below says the same thing in words a person actually speaks.
 */
const RECOMMENDATIONS = [
  {
    id: 'tuesday-promo',
    category: 'Marketing',
    tone: 'purple',
    icon: I.mega,
    title: 'Give a discount on Tuesday afternoon',
    body: 'Tuesday is your quietest day. Take 15% off Wash & Fold from 2pm to 6pm to bring people in.',
    confidence: 92,
    impact: '18% more orders',
    evidence: 'From the last 8 weeks of orders',
    action: 'Create promo',
    target: { page: 'promocreate', nav: 'marketing' },
  },
  {
    id: 'detergent-reorder',
    category: 'Stock',
    tone: 'gold',
    icon: I.box,
    title: 'Buy detergent before Thursday',
    body: 'You use 4.1 litres a day. Only 3 days are left. Order 60 litres so Wash & Fold does not stop.',
    confidence: 97,
    impact: 'Wash & Fold keeps running',
    evidence: 'From 30 days of stock use',
    action: 'Open purchase orders',
    target: { page: 'supplies', nav: 'inventory', supTab: 'Purchase Orders' },
  },
  {
    id: 'winback-gold',
    category: 'Customers',
    tone: 'info',
    icon: I.users,
    title: 'Bring back 14 Gold customers',
    body: 'These 14 customers have not ordered for more than a month. Send them an offer with bonus coins.',
    confidence: 84,
    impact: '៛620,000 a month at risk',
    evidence: 'From their order history',
    action: 'Turn on the offer',
    target: { page: 'loyalty', nav: 'loyalty' },
  },
];

const QUESTIONS = [
  'How much did I make today?',
  'Which service earns the most?',
  'Who are my best customers?',
  'What should I sell this week?',
];

const ARROW = ['M5 12h14', 'M13 6l6 6-6 6'];
const CLOSE = ['M18 6 6 18', 'M6 6l12 12'];

/**
 * How sure the rule is, in words first and a number second.
 *
 * "92% confident" next to a progress bar asks the reader to interpret two things
 * before they learn anything. "Very sure" says it outright; the percentage stays for
 * anyone who wants to compare cards.
 */
function Sureness({ value }) {
  const label = value >= 90 ? 'Very sure' : value >= 75 ? 'Quite sure' : 'Maybe';
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-inset px-2.5 py-1">
      <span className="text-[11.5px] font-semibold text-text">{label}</span>
      <span className="text-[11.5px] text-faint tabular-nums">{value}%</span>
    </span>
  );
}

function InsightCard({ rec, onAct, onWhy, onDismiss }) {
  return (
    <Card className="group p-4.5 transition-shadow hover:border-border-strong hover:shadow-pop">
      <div className="flex gap-3.5 sm:gap-4">
        {/* Bigger: the icon is the one thing that says what a card is about before
            any of it is read. */}
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-current/15',
            toneClass(rec.tone)
          )}
        >
          <Icon paths={rec.icon} size={22} strokeWidth={1.9} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {/* Sentence case, not uppercase micro-type: ALL-CAPS at 10px is the
                  hardest thing on the page to read. */}
              <span className={cn('rounded-full px-2.5 py-1 text-[11.5px] font-semibold', toneClass(rec.tone))}>
                {rec.category}
              </span>
              <Sureness value={rec.confidence} />
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={`Hide: ${rec.title}`}
              title="Hide this suggestion"
              // Hover-reveal on pointer devices; always visible on touch, where
              // there is no hover to reveal it with.
              className="-mt-1 -mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-faint transition-opacity hover:bg-inset hover:text-text focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none md:opacity-0 md:group-hover:opacity-100"
            >
              <Icon paths={CLOSE} size={14} strokeWidth={2.2} />
            </button>
          </div>

          {/* The title is the instruction. It gets the size. */}
          <h3 className="mt-2.5 text-[17px] leading-snug font-semibold tracking-[-0.01em] text-text">
            {rec.title}
          </h3>
          <p className="mt-1.5 text-[14px] leading-[1.65] text-muted">{rec.body}</p>

          {/* The result of doing it — the reason to care. Promoted out of a grey chip
              and given the accent, because this is what makes the card worth reading. */}
          <p
            className={cn(
              'mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold',
              toneClass(rec.tone)
            )}
          >
            <Icon paths={I.chart} size={14} strokeWidth={2.3} />
            {rec.impact}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={onAct} className="gap-2">
              {rec.action}
              <Icon paths={ARROW} size={13} strokeWidth={2.4} />
            </Button>
            <Button variant="subtle" onClick={onWhy}>
              Why this?
            </Button>
            {/* The evidence is a footnote, so it reads like one. */}
            <span className="ml-auto text-[12px] text-faint">{rec.evidence}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AIInsights() {
  const p = usePortal();
  const {
    orders,
    inventoryItems,
    storeSettings,
    genericState,
    setGenericToggle,
    recordGenericAction,
  } = useDomain();
  const [ask, setAsk] = useState('');
  const [answer, setAnswer] = useState('');
  const [refreshedAt, setRefreshedAt] = useState(() => new Date());

  const open = RECOMMENDATIONS.filter((r) => !genericState.toggles[`ai.dismissed.${r.id}`]);

  const submitAsk = () => {
    const q = ask.trim();
    if (!q) return;
    const normalized = q.toLowerCase();
    const active = orders.filter((order) => !['completed', 'cancelled', 'collected'].includes(order.status));
    const revenue = orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const low = inventoryItems.filter((item) => Number(item.days) <= 7);
    // Plain sentences, one fact each. The old answers were single sentences with
    // three clauses in them ("recorded non-cancelled order value across N orders").
    let response = `You have ${orders.length} orders. ${active.length} are still being worked on. ${low.length} supplies are running low.`;
    if (/revenue|sales|money|earn|make/.test(normalized)) {
      const counted = orders.filter((order) => order.status !== 'cancelled').length;
      response = `You made ៛${revenue.toLocaleString('en-US')} from ${counted} orders. Cancelled orders are not counted.`;
    } else if (/stock|supply|inventory|detergent|buy/.test(normalized)) {
      response = low.length
        ? `Buy these soon: ${low.map((item) => `${item.name} — ${item.days} days left`).join('; ')}.`
        : 'Nothing is running low. Every supply has more than a week left.';
    } else if (/ready|pickup|production|order/.test(normalized)) {
      const ready = orders.filter((order) => order.status === 'ready');
      response = ready.length
        ? `${active.length} orders are still being worked on. ${ready.length} are ready for pickup: ${ready.map((order) => order.code).join(', ')}.`
        : `${active.length} orders are still being worked on. None are ready for pickup yet.`;
    }
    setAnswer(response);
    recordGenericAction('ai.question', q);
    setAsk('');
  };

  const refresh = () => {
    setRefreshedAt(new Date());
    recordGenericAction('ai.refresh', 'Recomputed local insights');
    p.notify('Insights recomputed from current local records');
  };

  return (
    <div className="animate-kfade">
      <PageHeader
        title="AI Insights"
        subtitle={`Ideas from ${storeSettings.name}'s own records. Nothing is sent to the internet.`}
        freshness={`Updated ${refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
      >
        <Button
          variant="default"
          icon={I.repeat}
          onClick={refresh}
        >
          Refresh
        </Button>
      </PageHeader>

      {/* ---------------------------------------------------------- copilot */}
      <Card
        variant="purple"
        className="p-4.5"
        style={{
          background:
            'linear-gradient(140deg, color-mix(in srgb, var(--purple) 12%, var(--panel)), var(--panel) 60%)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-bg text-purple-fg">
            <Icon paths={I.spark} size={15} strokeWidth={2} />
          </span>
          <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-text">
            Ask about your store
          </span>
        </div>

        {answer && (
          <div className="mt-3 rounded-xl border border-purple/25 bg-panel px-3.5 py-3 text-[14px] leading-[1.65] text-text">
            {answer}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-panel px-3.5 py-1 transition-[border-color,box-shadow] focus-within:border-purple focus-within:ring-3 focus-within:ring-purple/20">
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAsk()}
            aria-label="Ask for local store insights"
            placeholder="Ask about money, orders or stock"
            className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[13.5px] text-text outline-none placeholder:text-faint"
          />
          <Button
            variant="purple"
            onClick={submitAsk}
            disabled={!ask.trim()}
            className="my-1 shrink-0 gap-1.5"
          >
            Ask
            <Icon paths={ARROW} size={13} strokeWidth={2.4} />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAsk(q)}
              className="cursor-pointer rounded-full border border-border bg-panel px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:border-purple hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
            >
              {q}
            </button>
          ))}
        </div>

        <p className="mt-3.5 flex items-center gap-1.75 text-[11.5px] text-faint">
          <Icon paths={I.shield} size={12} strokeWidth={2} />
          Answers come from your saved records. Your question never leaves this browser.
        </p>
      </Card>

      {/* -------------------------------------------------- recommendations */}
      <div className="mt-6 mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-text">
            Things you can do
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Ideas to look at. Nothing happens until you choose it.
          </p>
        </div>
        <span className="text-[12.5px] font-medium text-faint tabular-nums">
          {open.length} of {RECOMMENDATIONS.length} left
        </span>
      </div>

      {open.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          message="Every recommendation has been actioned or dismissed. New ones appear as your store trades."
        >
          <Button
            variant="default"
            className="mt-2"
            onClick={() => {
              RECOMMENDATIONS.forEach((rec) => setGenericToggle(`ai.dismissed.${rec.id}`, false));
              p.notify('Dismissed insights restored');
            }}
          >
            Restore dismissed
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {open.map((rec) => (
            <InsightCard
              key={rec.id}
              rec={rec}
              onAct={() => p.set(rec.target)}
              onWhy={() => p.notify(`Based on ${rec.evidence.toLowerCase()} · ${rec.confidence}% seed confidence`)}
              onDismiss={() => {
                setGenericToggle(`ai.dismissed.${rec.id}`, true);
                p.notify('Insight dismissed');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
