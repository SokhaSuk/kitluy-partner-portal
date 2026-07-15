import { I, Icon } from '../lib/icons.jsx';
import { Badge, PageHeader } from '../components/ui/index.jsx';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { cn } from '../lib/cn.js';

const plans = [
  { id: 'starter', name: 'Starter', price: 80000, credit: '20 kg', subscribers: 24 },
  { id: 'family', name: 'Family', price: 150000, credit: '40 kg', subscribers: 41, featured: true },
  { id: 'business', name: 'Business', price: 400000, credit: '120 kg', subscribers: 9 },
];

const reviewKey = (planId) => `subscription.review.${planId}`;

export default function Subscriptions() {
  const p = usePortal();
  const { genericState = { actions: [] }, recordGenericAction } = useDomain();
  const actions = genericState.actions || [];

  const reviewed = new Set(
    actions.filter((action) => action.key.startsWith('subscription.review.')).map((action) => action.key)
  );

  const markReviewed = (plan) => {
    recordGenericAction(reviewKey(plan.id), `${plan.name} seed plan reviewed locally`);
    p.notify(`${plan.name} marked reviewed in this browser. No subscriber or billing record was changed.`);
  };

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Subscriptions"
        subtitle="Phase 2 planning view · no recurring billing or enrollment service is connected"
        freshness="All prices, subscriber counts, credits, and margins below are seed analytics"
      />

      <div className="mb-3 rounded-[11px] border border-info-fg/30 bg-info-bg px-3.5 py-2.75 text-[12.5px] text-info-fg">
        Local-only planning data. Reviewing a plan writes an audit action to this browser; it does not
        publish a plan, enroll a customer, or start billing.
      </div>

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isReviewed = reviewed.has(reviewKey(plan.id));
          return (
            <article
              key={plan.id}
              className={cn(
                'rounded-[14px] border bg-panel p-4.5 shadow-card',
                plan.featured ? 'border-accent' : 'border-border'
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={cn('text-[13px]', plan.featured ? 'font-semibold text-accent' : 'text-muted')}>
                  {plan.name}
                </span>
                {isReviewed && <Badge tone="ok">Reviewed locally</Badge>}
              </div>
              <div className="text-[22px] font-bold text-text">
                ៛{plan.price.toLocaleString('en-US')}
                <span className="text-[12px] font-normal text-muted">/mo</span>
              </div>
              <div className="mt-1 text-[12px] text-faint">
                {plan.credit} seed credit · {plan.subscribers} seed subscribers
              </div>
              <button
                type="button"
                disabled={isReviewed}
                onClick={() => markReviewed(plan)}
                className="mt-3 w-full cursor-pointer rounded-lg border border-border bg-panel px-3 py-2 text-[12.5px] font-semibold text-text hover:bg-hover disabled:cursor-default disabled:opacity-60"
              >
                {isReviewed ? 'Review recorded locally' : 'Mark reviewed locally'}
              </button>
            </article>
          );
        })}
      </div>

      <div className="flex items-center gap-3.5 rounded-[14px] border border-border bg-panel px-4.5 py-3.75 shadow-card">
        <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[9px] bg-ok-bg text-ok-fg">
          <Icon paths={I.chart} size={17} />
        </span>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-text">
            Seed margin monitor · all sample plans above the sample floor
          </div>
          <div className="text-[12px] text-muted">
            Lowest seed margin 11% · sample floor 5% · not calculated from live orders or costs
          </div>
        </div>
      </div>
    </div>
  );
}
