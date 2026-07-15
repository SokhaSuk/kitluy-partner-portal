import { useState } from 'react';
import { cn } from '../lib/cn.js';
import { I, Icon } from '../lib/icons.jsx';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  PageHeader,
  SearchInput,
} from '../components/ui/index.jsx';
import { CAT_COLOR, DEV_TOOLS, MP_CATS } from '../data/marketplace.js';
import { usePortal } from '../store/PortalContext.jsx';
import { useDomain } from '../store/DomainContext.jsx';

const TINT = [
  'bg-info-bg text-info-fg',
  'bg-purple-bg text-purple-fg',
  'bg-gold-bg text-gold-fg',
  'bg-ok-bg text-ok-fg',
];

const PLUS = ['M12 5v14', 'M5 12h14'];
const FIELD =
  'w-full rounded-[9px] border border-border bg-panel px-3 py-2 text-[13px] text-text outline-none focus:border-accent focus:ring-3 focus:ring-(--ring)';

function AppCard({ app, connected, onAction }) {
  const catColor = CAT_COLOR[app.cat] || 'var(--accent)';
  const installsLabel = app.installs === 'native' ? 'Native seed listing' : `${app.installs} seed installs`;

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-panel p-4 shadow-card transition-shadow hover:border-border-strong hover:shadow-pop">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[17px] font-bold"
          style={{
            background: `color-mix(in srgb, ${app.color} 15%, transparent)`,
            color: app.color,
          }}
        >
          {app.name[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.75">
            <span className="text-[14.5px] font-semibold text-text">{app.name}</span>
            {connected && <span className="h-1.75 w-1.75 shrink-0 rounded-full bg-ok-fg" />}
          </div>
          <span
            className="mt-1 inline-block whitespace-nowrap rounded-full px-2.25 py-0.5 text-[11px] font-semibold"
            style={{
              background: `color-mix(in srgb, ${catColor} 13%, transparent)`,
              color: catColor,
            }}
          >
            {app.cat}
          </span>
        </div>
      </div>
      <div className="flex-1 text-[12.5px] leading-relaxed text-muted">{app.desc}</div>
      <div className="flex items-center gap-3 text-[11.5px] text-faint">
        <span className="flex items-center gap-1" title="Seed marketplace rating">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="var(--gold)"
            stroke="none"
            aria-hidden="true"
          >
            <path d="M12 2l2.9 6.3 6.8.6-5.1 4.5 1.5 6.7L12 17.3 5.9 20.6l1.5-6.7L2.3 8.9l6.8-.6z" />
          </svg>
          {app.rating} seed
        </span>
        <span className={cn('ml-auto', connected && 'font-medium text-ok-fg')}>
          {connected ? 'Connected locally' : installsLabel}
        </span>
      </div>
      <Button
        variant={connected ? 'default' : 'primary'}
        onClick={onAction}
        className="w-full justify-center text-[12.5px] font-semibold"
      >
        {connected ? 'Mark disconnected' : 'Mark connected locally'}
      </Button>
    </div>
  );
}

function GroupHead({ label, count }) {
  return (
    <div className="mt-1 mb-3 flex items-center gap-2.25">
      <span className="text-[15px] font-bold text-text">{label}</span>
      <span className="rounded-full bg-inset px-2 py-px text-[12px] font-semibold text-faint">
        {count}
      </span>
    </div>
  );
}

export default function IntegrationHub() {
  const p = usePortal();
  const {
    integrations = [],
    apiKeys = [],
    webhooks = [],
    toggleIntegration,
    addApiKey,
    addWebhook,
    recordGenericAction,
  } = useDomain();
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyLabel, setKeyLabel] = useState('');
  const [keyScope, setKeyScope] = useState('read');
  const [keyError, setKeyError] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState('order.ready');
  const [webhookError, setWebhookError] = useState('');
  const [openTool, setOpenTool] = useState(null);

  const query = (p.intQuery || '').trim().toLowerCase();
  const matches = (integration) =>
    (p.intCat === 'All' || integration.cat === p.intCat) &&
    (!query || `${integration.name} ${integration.desc} ${integration.cat}`.toLowerCase().includes(query));
  const filtered = integrations.filter(matches);
  const installed = filtered.filter((integration) => integration.status === 'connected');
  const marketplace = filtered.filter((integration) => integration.status !== 'connected');
  const showDevPanel = p.intCat === 'Developer API';
  const empty = !showDevPanel && installed.length === 0 && marketplace.length === 0;
  const connectedCount = integrations.filter((integration) => integration.status === 'connected').length;
  const activeWebhookCount = webhooks.filter((webhook) => webhook.status === 'Active').length;
  const gridCols = 'repeat(auto-fill, minmax(250px, 1fr))';
  const kpis = [
    { label: 'Connected locally', value: String(connectedCount), sub: 'browser-local status only', icon: I.plug, tint: 3 },
    { label: 'Marketplace records', value: String(integrations.length), sub: 'seed catalog entries', icon: I.grid, tint: 0 },
    { label: 'Local dev keys', value: String(apiKeys.length), sub: 'not server credentials', icon: I.swap, tint: 1 },
    { label: 'Webhook records', value: String(activeWebhookCount), sub: 'no delivery worker', icon: I.spark, tint: 2 },
  ];

  const changeIntegration = (integration) => {
    const connect = integration.status !== 'connected';
    toggleIntegration(integration.id, connect);
    p.notify(
      connect
        ? `${integration.name} marked connected in this browser only. OAuth and provider credentials are not configured.`
        : `${integration.name} marked disconnected in this browser only.`
    );
  };

  const submitKey = (event) => {
    event.preventDefault();
    if (!keyLabel.trim()) {
      setKeyError('Enter a label for the local development key.');
      return;
    }
    try {
      const key = addApiKey({ label: keyLabel.trim(), scope: keyScope });
      setCreatedKey(key);
      setKeyLabel('');
      setKeyScope('read');
      setKeyError('');
      setKeyOpen(false);
      p.notify('Local development key placeholder saved. It cannot authenticate a server request.');
    } catch (error) {
      setKeyError(error.message || 'The local key placeholder could not be saved.');
    }
  };

  const submitWebhook = (event) => {
    event.preventDefault();
    let parsed;
    try {
      parsed = new URL(webhookUrl);
    } catch {
      setWebhookError('Enter a valid HTTPS endpoint.');
      return;
    }
    if (parsed.protocol !== 'https:') {
      setWebhookError('Webhook records require an HTTPS endpoint.');
      return;
    }
    if (!webhookEvents.trim()) {
      setWebhookError('Enter at least one event name.');
      return;
    }
    try {
      addWebhook({ url: parsed.toString(), events: webhookEvents.trim(), status: 'Active' });
      setWebhookUrl('');
      setWebhookEvents('order.ready');
      setWebhookError('');
      setWebhookOpen(false);
      p.notify('Webhook endpoint saved locally. No backend delivery worker is connected.');
    } catch (error) {
      setWebhookError(error.message || 'The local webhook record could not be saved.');
    }
  };

  const recordRequest = () => {
    recordGenericAction('integration.request', `Integration request recorded for ${p.intCat}`);
    p.notify('Request recorded in local activity only. No support ticket or external message was sent.');
  };

  return (
    <div className="animate-kfade">
      <PageHeader
        title="Integration Hub"
        subtitle="Local integration configuration; no provider connection, OAuth, key service, or webhook worker is running"
        freshness="Marketplace ratings, installs, and descriptions are seed reference data"
      >
        <SearchInput
          className="min-w-52.5"
          value={p.intQuery}
          onChange={(event) => p.set({ intQuery: event.target.value })}
          placeholder="Search local integration records…"
        />
        <Button variant="default" icon={PLUS} onClick={recordRequest}>
          Record request locally
        </Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-[14px] border border-border bg-panel p-4 shadow-card">
            <div className="mb-3 flex items-center gap-2.25">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-[9px]', TINT[kpi.tint])}>
                <Icon paths={kpi.icon} size={16} />
              </span>
              <span className="text-[12.5px] text-muted">{kpi.label}</span>
            </div>
            <div className="text-[21px] font-bold text-text">{kpi.value}</div>
            <div className="mt-1 text-[11.5px] text-faint">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-4.5 flex flex-wrap gap-2">
        {MP_CATS.map((category) => {
          const active = p.intCat === category;
          const count =
            category === 'All'
              ? integrations.length
              : category === 'Developer API'
                ? DEV_TOOLS.length
                : integrations.filter((integration) => integration.cat === category).length;
          return (
            <Chip
              key={category}
              active={active}
              onClick={() => p.set({ intCat: category })}
              className="inline-flex items-center gap-1.75"
            >
              {category}
              <span
                className={cn(
                  'rounded-full px-1.75 py-px text-[11px] font-bold',
                  active
                    ? 'bg-[color-mix(in_srgb,var(--panel)_22%,transparent)] text-panel'
                    : 'bg-inset text-faint'
                )}
              >
                {count}
              </span>
            </Chip>
          );
        })}
      </div>

      {showDevPanel && (
        <div className="flex flex-col gap-3.5">
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {DEV_TOOLS.map((tool) => {
              const open = openTool === tool.name;
              const panelId = `developer-tool-${tool.name.toLowerCase().replaceAll(' ', '-')}`;
              return (
                <div key={tool.name} className="flex flex-col rounded-[14px] border border-border bg-panel p-4 shadow-card">
                  <div className="mb-2.5 flex items-center gap-2.75">
                    <span
                      className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[11px] text-[15px] font-bold"
                      style={{
                        background: `color-mix(in srgb, ${tool.color} 15%, transparent)`,
                        color: tool.color,
                      }}
                    >
                      {tool.name[0]}
                    </span>
                    <div className="min-w-0 flex-1 text-[14px] font-semibold text-text">{tool.name}</div>
                    <span className="whitespace-nowrap rounded-full bg-inset px-2.25 py-0.75 text-[11.5px] font-semibold text-muted">
                      {tool.tag}
                    </span>
                  </div>
                  <div className="mb-3 flex-1 text-[12.5px] leading-normal text-muted">{tool.desc}</div>
                  <Button
                    variant="default"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenTool(open ? null : tool.name)}
                    className="w-full justify-center text-[12.5px] font-semibold"
                  >
                    {open ? 'Hide local notes' : 'View local notes'}
                  </Button>
                  {open && (
                    <div id={panelId} className="mt-2 rounded-lg bg-inset p-2.5 text-[11.5px] text-muted">
                      This is a seed capability description. Server endpoints, authentication, schemas,
                      rate limits, and production documentation are not configured.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 pt-3.5 pb-3">
              <div>
                <div className="text-[14.5px] font-semibold text-text">Local development key placeholders</div>
                <div className="text-[12.5px] text-muted">
                  Stored in this browser · visible to the browser user · not valid server credentials
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setKeyOpen((open) => !open);
                  setKeyError('');
                }}
                aria-expanded={keyOpen}
                aria-controls="new-local-api-key"
              >
                {keyOpen ? 'Cancel' : 'New local placeholder'}
              </Button>
            </div>

            {keyOpen && (
              <form id="new-local-api-key" onSubmit={submitKey} className="grid gap-3 border-t border-border bg-inset px-4.5 py-3.5 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                <label className="text-[12.5px] font-semibold text-text">
                  Label
                  <input
                    value={keyLabel}
                    onChange={(event) => {
                      setKeyLabel(event.target.value);
                      setKeyError('');
                    }}
                    className={`${FIELD} mt-1`}
                    placeholder="Development reader"
                  />
                </label>
                <label className="text-[12.5px] font-semibold text-text">
                  Local scope label
                  <select value={keyScope} onChange={(event) => setKeyScope(event.target.value)} className={`${FIELD} mt-1`}>
                    <option value="read">read</option>
                    <option value="read / write">read / write</option>
                  </select>
                </label>
                <Button type="submit" variant="primary" className="justify-center">Save locally</Button>
                {keyError && <p className="text-[11.5px] text-danger-fg sm:col-span-3">{keyError}</p>}
              </form>
            )}

            {createdKey && (
              <div className="border-t border-border bg-warn-bg px-4.5 py-3 text-[12px] text-warn-fg">
                Created local placeholder <code className="font-mono">{createdKey.key}</code>. It is
                not a secret and cannot authenticate any API.
              </div>
            )}

            {apiKeys.length === 0 ? (
              <div className="border-t border-border px-4.5 py-6 text-center text-[12.5px] text-muted">
                No local key placeholders.
              </div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id || key.label} className="flex flex-wrap items-center gap-3 border-t border-border px-4.5 py-3.25">
                  <div className="min-w-48 flex-1">
                    <div className="text-[13.5px] font-semibold text-text">{key.label}</div>
                    <div className="text-[11.5px] text-faint">created {key.created}</div>
                  </div>
                  <code className="min-w-52 flex-1 font-mono text-[12.5px] text-muted">{key.key}</code>
                  <span className="text-[12px] text-muted">{key.scope}</span>
                  <Badge tone="neutral">Local placeholder</Badge>
                </div>
              ))
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 pt-3.5 pb-3">
              <div>
                <div className="text-[14.5px] font-semibold text-text">Local webhook endpoint records</div>
                <div className="text-[12.5px] text-muted">
                  Saved for development reference only · no events are delivered
                </div>
              </div>
              <Button
                variant="default"
                onClick={() => {
                  setWebhookOpen((open) => !open);
                  setWebhookError('');
                }}
                aria-expanded={webhookOpen}
                aria-controls="new-local-webhook"
              >
                {webhookOpen ? 'Cancel' : 'Add local endpoint'}
              </Button>
            </div>

            {webhookOpen && (
              <form id="new-local-webhook" onSubmit={submitWebhook} className="grid gap-3 border-t border-border bg-inset px-4.5 py-3.5 sm:grid-cols-[1.2fr_1fr_auto] sm:items-end">
                <label className="text-[12.5px] font-semibold text-text">
                  HTTPS endpoint
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(event) => {
                      setWebhookUrl(event.target.value);
                      setWebhookError('');
                    }}
                    className={`${FIELD} mt-1`}
                    placeholder="https://example.test/hooks"
                  />
                </label>
                <label className="text-[12.5px] font-semibold text-text">
                  Event names
                  <input
                    value={webhookEvents}
                    onChange={(event) => {
                      setWebhookEvents(event.target.value);
                      setWebhookError('');
                    }}
                    className={`${FIELD} mt-1`}
                    placeholder="order.ready"
                  />
                </label>
                <Button type="submit" variant="primary" className="justify-center">Save locally</Button>
                {webhookError && <p className="text-[11.5px] text-danger-fg sm:col-span-3">{webhookError}</p>}
              </form>
            )}

            {webhooks.length === 0 ? (
              <div className="border-t border-border px-4.5 py-6 text-center text-[12.5px] text-muted">
                No local webhook endpoint records.
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div key={webhook.id || webhook.url} className="flex flex-wrap items-center gap-3 border-t border-border px-4.5 py-3.25">
                  <code className="min-w-56 flex-1 truncate font-mono text-[12.5px] text-text">{webhook.url}</code>
                  <span className="min-w-48 flex-1 text-[12px] text-muted">{webhook.events}</span>
                  <Badge tone={webhook.tone}>{webhook.status} locally</Badge>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {installed.length > 0 && (
        <>
          <GroupHead label="Connected locally" count={installed.length} />
          <div className="mb-5.5 grid gap-3.5" style={{ gridTemplateColumns: gridCols }}>
            {installed.map((integration) => (
              <AppCard
                key={integration.id || integration.name}
                app={integration}
                connected
                onAction={() => changeIntegration(integration)}
              />
            ))}
          </div>
        </>
      )}

      {marketplace.length > 0 && (
        <>
          <GroupHead label="Marketplace seed catalog" count={marketplace.length} />
          <div className="grid gap-3.5" style={{ gridTemplateColumns: gridCols }}>
            {marketplace.map((integration) => (
              <AppCard
                key={integration.id || integration.name}
                app={integration}
                onAction={() => changeIntegration(integration)}
              />
            ))}
          </div>
        </>
      )}

      {empty && <EmptyState title="No integrations found" message="Try a different category or search term." />}
    </div>
  );
}
