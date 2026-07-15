import { useEffect, useMemo, useState } from 'react';
import { cn } from '../lib/cn.js';
import { I, Icon } from '../lib/icons.jsx';
import { Button, Card, Tab, TextInput, Toggle } from '../components/ui/index.jsx';
import { useDomain } from '../store/DomainContext.jsx';
import { usePortal } from '../store/PortalContext.jsx';
import { downloadCsv, downloadText } from '../lib/export.js';

const SETTINGS_TABS = [
  { id: 'Store', icon: I.tag },
  { id: 'Hours', icon: I.clock },
  { id: 'Notifications', icon: I.chat },
  { id: 'Loyalty', icon: I.gift },
  { id: 'Audit', icon: I.book },
  { id: 'Data', icon: I.download },
];

const LOYALTY_MODES = [
  { id: 'A', title: 'Mode A · 0%', desc: 'No loyalty contribution' },
  { id: 'B', title: 'Mode B · 2%', desc: '0% commission + 2% to loyalty pool' },
];

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.75 block text-[13px] font-semibold text-text">{label}</label>
      {children}
      {error && <div className="mt-1 text-[11.5px] font-medium text-danger-fg">{error}</div>}
    </div>
  );
}

const makeDraft = (settings = {}) => ({
  name: settings.name || '',
  phone: settings.phone || '',
  address: settings.address || '',
  hours: (settings.hours || []).map((row) => ({ ...row })),
});

const auditTitle = (event) => {
  const label = String(event.type || 'activity')
    .split('.')
    .map((part) => part.replaceAll('_', ' '))
    .join(' · ');
  return event.target ? `${label} · ${event.target}` : label;
};

const auditTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value || '')
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

export default function Settings({ forcedTab = null, heading = 'Settings' }) {
  const p = usePortal();
  const activeTab = forcedTab || p.setTab;
  const {
    meta,
    storeSettings,
    notifications,
    loyaltyMode,
    auditEvents,
    updateStoreSettings,
    setNotification,
    setLoyaltyMode,
    exportData,
    replaceData,
    resetData,
  } = useDomain();
  const canonical = useMemo(() => makeDraft(storeSettings), [storeSettings]);
  const canonicalKey = JSON.stringify(canonical);
  const [draft, setDraft] = useState(canonical);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setDraft(canonical);
    setErrors({});
    // canonicalKey changes only when persisted store settings change. Other
    // domain mutations must not erase an in-progress store form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canonicalKey]);

  const dirty = JSON.stringify(draft) !== canonicalKey;
  const updateField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '', form: '' }));
  };
  const updateHour = (index, value) => {
    setDraft((current) => ({
      ...current,
      hours: current.hours.map((row, rowIndex) =>
        rowIndex === index ? { ...row, hours: value } : row
      ),
    }));
    setErrors((current) => ({ ...current, hours: '', form: '' }));
  };

  const cancel = () => {
    setDraft(canonical);
    setErrors({});
  };

  const save = () => {
    const next = {};
    if (!draft.name.trim()) next.name = 'Enter the store name.';
    if (!draft.phone.trim()) next.phone = 'Enter the store phone number.';
    if (!draft.address.trim()) next.address = 'Enter the store address.';
    if (draft.hours.some((row) => !row.hours.trim())) next.hours = 'Every day needs hours or “Closed”.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      updateStoreSettings({
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        hours: draft.hours.map((row) => ({ ...row, hours: row.hours.trim() })),
      });
      p.notify('Store settings saved locally', 'ok');
    } catch (error) {
      setErrors({ form: error?.message || 'Store settings could not be saved.' });
    }
  };

  const SaveBar = () => (
    <div className="mt-5.5 flex items-center justify-between gap-3 border-t border-border pt-4.5">
      <span className="text-[11.5px] text-faint">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
      <div className="flex gap-2.5">
        <Button variant="default" onClick={cancel} disabled={!dirty}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </div>
  );

  const orderedAudit = [...(auditEvents || [])].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  const downloadBackup = () => {
    downloadText(
      `kitluy-partner-backup-${new Date().toISOString().slice(0, 10)}.json`,
      exportData({ pretty: true }),
      'application/json;charset=utf-8'
    );
    p.notify('Local data backup downloaded', 'ok');
  };

  const downloadAudit = () => {
    downloadCsv(`kitluy-audit-${new Date().toISOString().slice(0, 10)}.csv`, orderedAudit, [
      { key: 'at', label: 'Timestamp' },
      { key: 'actor', label: 'Actor' },
      { key: 'type', label: 'Event' },
      { key: 'target', label: 'Target' },
      { key: 'details', label: 'Details', value: (event) => JSON.stringify(event.details || {}) },
    ]);
    p.notify(`Exported ${orderedAudit.length} local audit events`, 'ok');
  };

  /**
   * `replaceData` overwrites every record in this scope. The file picker has
   * already closed by the time we get here, so this dialog is the last stop
   * before the current data is gone — it used to have none at all.
   */
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    p.confirm({
      title: 'Replace all local data?',
      message: `Importing “${file.name}” overwrites every order, customer and inventory record held for this store in this browser. It cannot be undone.`,
      confirmLabel: 'Replace data',
      // A parse failure surfaces inside the dialog, so the user can pick a
      // different file without having to find the button again.
      onConfirm: async () => {
        replaceData(await file.text());
        p.notify('Local data backup restored', 'ok');
      },
    });
  };

  const resetLocalData = () =>
    p.confirm({
      title: 'Reset local portal data?',
      message:
        'Every local order, customer and inventory record returns to the initial seed data. Your account and store identity are kept.',
      confirmLabel: 'Reset data',
      onConfirm: () => {
        resetData();
        p.notify('Local portal data reset', 'ok');
      },
    });

  return (
    <div className="mx-auto max-w-250 animate-kfade">
      <div className="mb-0.75 text-[21px] font-bold tracking-[-0.01em] text-text">{heading}</div>
      <div className="mb-5 text-[13px] text-muted">
        Store configuration, hours, notifications and audit
      </div>

      <div className="grid items-start gap-4.5" style={{ gridTemplateColumns: '200px 1fr' }}>
        <div className="sticky top-0 flex flex-col gap-0.5">
          {SETTINGS_TABS.map((tab) => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => p.set({ page: 'settings', nav: 'settings', setTab: tab.id })}
              className="flex w-full items-center justify-start gap-2.5 text-left"
            >
              <Icon paths={tab.icon} size={16} strokeWidth={1.9} className="opacity-90" />
              {tab.id}
            </Tab>
          ))}
        </div>

        <Card className="p-6">
          {activeTab === 'Store' && (
            <div>
              <div className="mb-4.5 text-[16px] font-semibold text-text">Store profile</div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <Field label="Store name" error={errors.name}>
                  <TextInput value={draft.name} onChange={(event) => updateField('name', event.target.value)} invalid={!!errors.name} />
                </Field>
                <Field label="Vertical">
                  <TextInput value={storeSettings?.vertical || ''} disabled className="disabled:text-faint" />
                </Field>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <Field label="Phone" error={errors.phone}>
                  <TextInput value={draft.phone} onChange={(event) => updateField('phone', event.target.value)} invalid={!!errors.phone} />
                </Field>
                <Field label="Currency">
                  <TextInput value={`${storeSettings?.currency || 'KHR'} (integer)`} disabled className="disabled:text-faint" />
                </Field>
              </div>
              <Field label="Address" error={errors.address}>
                <TextInput value={draft.address} onChange={(event) => updateField('address', event.target.value)} invalid={!!errors.address} />
              </Field>
              {errors.form && <div role="alert" className="mt-3 text-[12px] font-medium text-danger-fg">{errors.form}</div>}
              <SaveBar />
            </div>
          )}

          {activeTab === 'Hours' && (
            <div>
              <div className="mb-1.5 text-[16px] font-semibold text-text">Operating hours</div>
              <div className="mb-3 text-[12.5px] text-muted">Use a time range such as 07:00 – 20:00, or enter Closed.</div>
              {draft.hours.map((row, index) => (
                <div key={row.day} className="grid grid-cols-[1fr_220px] items-center gap-4 border-t border-border py-2.5">
                  <span className="text-[13.5px] font-medium text-text">{row.day}</span>
                  <TextInput value={row.hours} onChange={(event) => updateHour(index, event.target.value)} aria-label={`${row.day} operating hours`} />
                </div>
              ))}
              {errors.hours && <div role="alert" className="mt-2 text-[12px] font-medium text-danger-fg">{errors.hours}</div>}
              {errors.form && <div role="alert" className="mt-2 text-[12px] font-medium text-danger-fg">{errors.form}</div>}
              <SaveBar />
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div>
              <div className="mb-1.5 text-[16px] font-semibold text-text">Notification templates</div>
              <div className="mb-2 text-[13px] text-muted">Browser-local trigger preferences; no SMS, Telegram, or email sender is connected.</div>
              {(notifications || []).map((notification) => (
                <div key={notification.id || notification.label} className="flex items-center justify-between gap-4 border-t border-border py-3.5">
                  <div>
                    <div className="text-[13.5px] font-semibold text-text">{notification.label}</div>
                    <div className="text-[12.5px] text-muted">{notification.desc}</div>
                  </div>
                  <Toggle
                    on={notification.on}
                    onClick={() => {
                      setNotification(notification.id || notification.label, !notification.on);
                      p.notify(`${notification.label} ${notification.on ? 'disabled' : 'enabled'}`);
                    }}
                    aria-label={`${notification.on ? 'Disable' : 'Enable'} ${notification.label}`}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Loyalty' && (
            <div>
              <div className="mb-1.5 text-[16px] font-semibold text-text">Loyalty preference</div>
              <div className="mb-4 text-[13px] text-muted">Choose how much gross revenue funds the loyalty rewards pool.</div>
              <div className="flex flex-col gap-2.5">
                {LOYALTY_MODES.map((mode) => {
                  const active = loyaltyMode?.id === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        if (active) return;
                        setLoyaltyMode(mode);
                        p.notify(`${mode.title} saved locally`);
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-[11px] border p-3.5 text-left',
                        active
                          ? 'border-accent bg-[color-mix(in_srgb,var(--accent)_7%,var(--panel))]'
                          : 'border-border'
                      )}
                    >
                      <div>
                        <div className="text-[13.5px] font-semibold text-text">{mode.title}</div>
                        <div className="text-[12px] text-muted">{mode.desc}</div>
                      </div>
                      {active ? (
                        <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent">
                          <span className="h-1.75 w-1.75 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="h-4.5 w-4.5 rounded-full border-2 border-border-strong" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'Audit' && (
            <div>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1.5 text-[16px] font-semibold text-text">Audit log</div>
                  <div className="text-[13px] text-muted">Persisted record of local domain mutations</div>
                </div>
                <Button onClick={downloadAudit}>Export CSV</Button>
              </div>
              {orderedAudit.map((event) => (
                <div key={event.id} className="flex items-center gap-3 border-t border-border py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] capitalize text-text">{auditTitle(event)}</div>
                    <div className="text-[11.5px] text-faint">{event.actor || 'Portal user'}</div>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-faint">{auditTime(event.at)}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Data' && (
            <div>
              <div className="mb-1.5 text-[16px] font-semibold text-text">Local data</div>
              <div className="mb-4 text-[13px] leading-relaxed text-muted">
                Export a JSON backup before moving devices or resetting this local-first build.
                Imports are schema-validated before anything is replaced.
              </div>
              {meta?.recoveryRequired && (
                <div role="alert" className="mb-4 rounded-xl border border-danger-fg/35 bg-danger-bg px-3.5 py-3 text-[12.5px] leading-relaxed text-danger-fg">
                  The saved snapshot could not be loaded, so this account is running from an
                  in-memory recovery copy. The original browser value has not been overwritten.
                  Import a valid backup or explicitly reset local data to restore persistence.
                </div>
              )}
              {meta?.persistence === 'memory' && !meta?.recoveryRequired && (
                <div role="status" className="mb-4 rounded-xl border border-warn-fg/35 bg-warn-bg px-3.5 py-3 text-[12.5px] leading-relaxed text-warn-fg">
                  Browser storage is unavailable. Changes currently survive only for this open
                  session. {meta.persistenceError || 'Export a backup before closing the page.'}
                </div>
              )}
              <div className="flex flex-wrap gap-2.5">
                <Button variant="primary" onClick={downloadBackup}>Export backup</Button>
                <label className="inline-flex cursor-pointer items-center rounded-[9px] border border-border bg-panel px-3.25 py-2 text-[13px] font-medium text-text hover:bg-hover">
                  Import backup
                  <input type="file" accept="application/json,.json" className="sr-only" onChange={importBackup} />
                </label>
                <Button variant="danger" onClick={resetLocalData}>Reset local data</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
