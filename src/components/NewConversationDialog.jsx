import { useMemo, useState } from 'react';

import { Avatar, Button, Chip, TextInput } from './ui/index.jsx';
import { usePartnerCustomers } from '../store/usePartnerCustomers.js';
import { I, Icon } from '../lib/icons.jsx';

const KINDS = ['Customers', 'Team', 'Platform'];
// The channel a new thread opens on, per kind. Customer threads default to Telegram
// so they are ready to bridge once the bot is connected; others are in-app.
const CHANNEL_FOR_KIND = { Customers: 'Telegram', Team: 'Team', Platform: 'Platform' };

/**
 * Starts a new conversation from the inbox. Typing a customer's name suggests
 * existing customers (so the thread links to one and dedups); any name also works
 * for a team or ad-hoc thread. Calls `onCreate` (the shared startConversation) and
 * hands the resulting id back through `onClose(id)` so the caller can open it.
 */
export function NewConversationDialog({ onClose, onCreate }) {
  const { customers } = usePartnerCustomers();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('Customers');
  const [subtitle, setSubtitle] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q || kind !== 'Customers' || customerId) return [];
    return (customers || []).filter((c) => c.name?.toLowerCase().includes(q)).slice(0, 5);
  }, [customers, name, kind, customerId]);

  const pick = (customer) => {
    setName(customer.name);
    setCustomerId(customer.id);
  };

  const submit = async () => {
    const who = name.trim();
    if (!who) {
      setError('Enter who this conversation is with.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const id = await onCreate({
        who,
        kind,
        channel: CHANNEL_FOR_KIND[kind] || 'Local',
        subtitle: subtitle.trim() || null,
        customerId: kind === 'Customers' ? customerId : null,
      });
      if (id) onClose(id);
      else setError('That conversation could not be created.');
    } catch (cause) {
      setError(cause?.message || 'That conversation could not be created.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={() => onClose(null)}
        className="animate-kfadein fixed inset-0 z-50 border-0 bg-(--scrim)"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New conversation"
        className="animate-kslidein fixed top-1/2 left-1/2 z-51 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-panel p-5 shadow-pop"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-text">New conversation</h2>
          <button
            type="button"
            onClick={() => onClose(null)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border text-muted hover:bg-hover"
          >
            <Icon paths={I.x} size={15} strokeWidth={2.2} />
          </button>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex flex-col gap-3.5">
          <div>
            <span className="mb-1.75 block text-[13px] font-semibold text-text">Type</span>
            <div className="flex gap-1.75">
              {KINDS.map((k) => (
                <Chip key={k} active={kind === k} onClick={() => { setKind(k); setCustomerId(null); }}>
                  {k}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="nc-name" className="mb-1.75 block text-[13px] font-semibold text-text">
              {kind === 'Customers' ? 'Customer or name' : 'Name'}
            </label>
            <TextInput
              id="nc-name"
              value={name}
              onChange={(event) => { setName(event.target.value); setCustomerId(null); }}
              placeholder={
                kind === 'Customers' ? 'e.g. Sophea Chan' : kind === 'Team' ? 'e.g. Maly Sok' : 'e.g. KitLuy Platform'
              }
              autoFocus
            />
            {suggestions.length > 0 && (
              <div className="mt-1.5 overflow-hidden rounded-xl border border-border">
                {suggestions.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => pick(customer)}
                    className="flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-hover"
                  >
                    <Avatar name={customer.name} className="h-7 w-7" />
                    <span className="text-[13px] text-text">{customer.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="nc-about" className="mb-1.75 block text-[13px] font-semibold text-text">
              About <span className="font-normal text-faint">· optional</span>
            </label>
            <TextInput
              id="nc-about"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              placeholder="e.g. Order #1042 · Wash & Fold"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-[10px] bg-danger-bg px-3.5 py-2.5 text-[12px] font-medium text-danger-fg">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" loading={busy} className="w-full justify-center">
            Start conversation
          </Button>
        </form>
      </div>
    </>
  );
}
