import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDomain } from './DomainContext.jsx';
import { createPartnerData } from '../services/partnerData.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

/**
 * Customers — read and write — routed to the backend when it is configured, and to
 * the device-local domain otherwise. The whole slice (list, add, live updates) sits
 * behind one hook so a screen calls it the same way in both modes.
 *
 * Live: adding a customer anywhere pushes an INSERT on customers.customers, so the
 * list refreshes without a manual reload — the web↔mobile loop.
 */
export function usePartnerCustomers() {
  const { customers: localCustomers, addCustomer: addLocal } = useDomain();
  const data = useMemo(() => createPartnerData({ client: getSupabaseClient() }), []);

  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(data.enabled);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!data.enabled) return Promise.resolve();
    return data
      .listCustomers()
      .then(setRemote)
      .catch((cause) => setError(cause?.message || 'Could not load customers'))
      .finally(() => setLoading(false));
  }, [data]);

  useEffect(() => {
    if (!data.enabled) return undefined;
    let active = true;
    refresh();
    const unsubscribe = data.subscribeCustomers(() => active && refresh());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [data, refresh]);

  /** Routes the write. Backend: the RPC, then a refresh so it shows at once. */
  const addCustomer = useCallback(
    async (input) => {
      if (!data.enabled) return addLocal(input);
      const uid = await data.addCustomer({
        name: input.name,
        type: input.type,
        phone: input.phone ?? null,
        email: input.email ?? null,
      });
      await refresh();
      return uid;
    },
    [addLocal, data, refresh]
  );

  return {
    source: data.enabled ? 'backend' : 'local',
    customers: data.enabled ? remote ?? [] : localCustomers,
    loading,
    error,
    addCustomer,
  };
}
