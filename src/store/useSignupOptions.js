import { useEffect, useMemo, useState } from 'react';

import { createPartnerData } from '../services/partnerData.js';
import { getSupabaseClient } from '../services/supabaseClient.js';

/** Built-in fallback — used when the backend is off, unreachable, or empty. */
export const FALLBACK_BUSINESS_TYPES = [
  'Laundry & wash-fold',
  'Dry cleaning',
  'Ironing & press',
  'Self-service laundromat',
];

export const FALLBACK_PROVINCES = [
  'Phnom Penh',
  'Siem Reap',
  'Battambang',
  'Preah Sihanouk',
  'Kampot',
  'Kandal',
  'Other province',
];

/**
 * The signup dropdown options — business types and provinces — from the backend
 * when configured, the built-in lists otherwise.
 *
 * Runs before the user has a session, so it reads the `anon`-granted reference
 * views. A fetch failure quietly falls back rather than blocking signup.
 */
export function useSignupOptions() {
  const data = useMemo(() => createPartnerData({ client: getSupabaseClient() }), []);
  const [businessTypes, setBusinessTypes] = useState(FALLBACK_BUSINESS_TYPES);
  const [provinces, setProvinces] = useState(FALLBACK_PROVINCES);

  useEffect(() => {
    if (!data.enabled) return;
    let active = true;

    Promise.all([data.listBusinessTypes(), data.listProvinces()])
      .then(([types, provs]) => {
        if (!active) return;
        if (types?.length) setBusinessTypes(types.map((t) => t.label));
        if (provs?.length) setProvinces(provs.map((p) => p.label));
      })
      .catch(() => {
        /* keep the fallback lists */
      });

    return () => {
      active = false;
    };
  }, [data]);

  return { businessTypes, provinces };
}
