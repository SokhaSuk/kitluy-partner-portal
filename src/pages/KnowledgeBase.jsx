import { useState } from 'react';
import { I, Icon } from '../lib/icons.jsx';
import { PageHeader } from '../components/ui/index.jsx';
import { cn } from '../lib/cn.js';

const kbArticles = [
  {
    id: 'oil-stains-cotton',
    title: 'Removing oil stains from cotton',
    cat: 'Garment care',
    read: '3 min',
    summary: 'A safe intake-to-wash checklist for fresh cooking and machine-oil marks.',
    steps: [
      'Confirm the fibre and colour-fastness before applying any treatment.',
      'Blot excess oil, then work a small amount of neutral detergent from the outside inward.',
      'Rinse, inspect before drying, and repeat rather than heat-setting a remaining mark.',
    ],
  },
  {
    id: 'dry-clean-fabrics',
    title: 'Dry-clean-only fabrics guide',
    cat: 'Garment care',
    read: '5 min',
    summary: 'How to identify sensitive construction, trims, dyes, and labels at intake.',
    steps: [
      'Photograph the care label, trims, damage, and existing marks with the customer present.',
      'Separate garments with unstable dyes, glued construction, or delicate decoration.',
      'Record special handling and obtain approval before any process outside the care label.',
    ],
  },
  {
    id: 'silk-wool',
    title: 'Handling delicate silk & wool',
    cat: 'Garment care',
    read: '4 min',
    summary: 'Inspection, low-agitation handling, drying, and finishing reminders.',
    steps: [
      'Check for colour transfer, weak seams, shrinkage risk, and insect damage.',
      'Use the approved delicate process and avoid sudden temperature or pH changes.',
      'Dry and finish to the garment shape; do not hang heavy wet knitwear.',
    ],
  },
  {
    id: 'weight-pricing',
    title: 'Setting weight-based prices',
    cat: 'Operations',
    read: '2 min',
    summary: 'A quick method for setting a local price while preserving a margin floor.',
    steps: [
      'Calculate chemical, utility, labour, packaging, rewash, and overhead cost per kilogram.',
      'Apply the approved margin floor and define minimum-order and rounding rules.',
      'Record the change locally, then publish separately when a POS sync is available.',
    ],
  },
];

export default function KnowledgeBase() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Knowledge Base"
        subtitle="Local reference guides for garment care and store operations"
      />

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {kbArticles.map((article) => {
          const open = openId === article.id;
          const headingId = `kb-heading-${article.id}`;
          const panelId = `kb-panel-${article.id}`;
          return (
            <article
              key={article.id}
              className="rounded-[14px] border border-border bg-panel shadow-card"
            >
              <button
                type="button"
                id={headingId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : article.id)}
                className="flex w-full cursor-pointer items-start gap-3 p-4.25 text-left hover:bg-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-(--ring)"
              >
                <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[9px] bg-info-bg text-info-fg">
                  <Icon paths={I.book} size={17} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-text">{article.title}</span>
                  <span className="mt-1 block text-[12px] text-faint">
                    {article.cat} · {article.read} read
                  </span>
                  <span className="mt-2 block text-[12.5px] leading-relaxed text-muted">
                    {article.summary}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1 text-[18px] text-faint transition-transform',
                    open && 'rotate-45'
                  )}
                >
                  +
                </span>
              </button>
              {open && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headingId}
                  className="border-t border-border px-4.25 py-3.5"
                >
                  <ol className="list-decimal space-y-2 pl-5 text-[12.5px] leading-relaxed text-muted">
                    {article.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="mt-3 rounded-lg bg-inset px-3 py-2 text-[11.5px] text-faint">
                    Local guidance only. Follow the garment care label and your store's approved
                    handling policy.
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
