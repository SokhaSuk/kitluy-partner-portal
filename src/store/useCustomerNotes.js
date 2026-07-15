import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDomain } from './DomainContext.jsx';
import { createPartnerData } from '../services/partnerData.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

/**
 * Notes for one customer — from the backend when configured, local otherwise.
 * Read + append, keyed by the customer id (a backend uid, or the local id).
 *
 * Completes the customers slice: the list and add-customer already route to the
 * backend; this is the last write (add_customer_note) and its read.
 */
export function useCustomerNotes(customerId) {
  const { customerNotes, addCustomerNote: addLocal } = useDomain();
  const data = useMemo(() => createPartnerData({ client: getSupabaseClient() }), []);

  const [remote, setRemote] = useState(null);

  const localNotes = useMemo(
    () => (customerNotes?.[customerId] || []).map((n) => ({ text: n.text, meta: n.by ? `${n.by} · ${n.time}` : '' })),
    [customerNotes, customerId]
  );

  const refresh = useCallback(() => {
    if (!data.enabled) return Promise.resolve();
    return data
      .listCustomerNotes()
      .then((rows) => setRemote(rows.filter((n) => n.customer_id === customerId)))
      .catch(() => setRemote([]));
  }, [data, customerId]);

  useEffect(() => {
    if (data.enabled && customerId) refresh();
  }, [data, customerId, refresh]);

  const notes = data.enabled
    ? (remote || []).map((n) => ({
        text: n.text,
        meta: new Date(n.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      }))
    : localNotes;

  const addNote = useCallback(
    async (text) => {
      if (!data.enabled) return addLocal(customerId, { text, time: 'just now' });
      await data.addCustomerNote({ customerId, body: text });
      await refresh();
    },
    [addLocal, customerId, data, refresh]
  );

  return { notes, addNote, source: data.enabled ? 'backend' : 'local' };
}
