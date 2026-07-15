import * as localAuth from './localAuth.js';

/**
 * The boundary between the app's session and wherever accounts actually live.
 *
 * SessionContext (app) and PortalContext (portal) call these methods and never
 * touch localAuth or Supabase directly. Swapping the backend is passing a different
 * provider — exactly the seam the domain gateway uses for data.
 *
 * A provider is:
 *
 *   getSession()          -> Promise<user | null>   restore on boot
 *   subscribe(onChange)   -> () => void              auth state changes (optional)
 *   signIn(credentials)   -> Promise<user>
 *   signUp(account)       -> Promise<user>
 *   requestPasswordReset  -> Promise<{ code? }>
 *   verifyPasswordReset   -> Promise<{ resetToken? }>
 *   resetPassword         -> Promise<user | null>
 *   signOut()             -> Promise<void>
 *   kind                  'local' | 'supabase'
 *
 * Both return the same `user` shape, so nothing downstream changes:
 *   { accountId, name, role, contact, phone, email, storeName, store }
 * `accountId` is what scopes the domain store, so it MUST be stable per account —
 * the local id, or the Supabase auth uid.
 */

/** The account today: the device-local auth service, unchanged. */
export function createLocalAuthProvider() {
  return {
    kind: 'local',

    /** Local sessions are readable synchronously, which the app uses to seed boot. */
    currentUser: () => localAuth.getCurrentUser(),
    async getSession() {
      return localAuth.getCurrentUser();
    },
    // A device-local account has no other session to hear about.
    subscribe: null,

    signIn: ({ identifier, password, remember = true }) =>
      localAuth.signIn({ identifier, password, remember }),

    signUp: (account) => localAuth.signUp(account),

    requestPasswordReset: (identifier) => localAuth.requestPasswordReset(identifier),
    verifyPasswordReset: (payload) => localAuth.verifyPasswordReset(payload),
    resetPassword: (payload) => localAuth.resetPassword(payload),

    // No backend to provision against; the device-local account is the store.
    ensureStore: async () => {},

    signOut: () => localAuth.signOut(),
  };
}

/** Projects a Supabase auth user onto the shape the rest of the app already speaks. */
export function supabaseUserToAccount(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    accountId: user.id,
    email: user.email || '',
    phone: user.phone || meta.phone || '',
    name: meta.name || meta.owner_name || user.email || 'Owner',
    role: meta.role || 'Owner',
    contact: user.email || meta.phone || '',
    storeName: meta.store_name || meta.storeName || '',
    store: {
      name: meta.store_name || meta.storeName || '',
      businessType: meta.business_type || meta.businessType || '',
      province: meta.province || '',
    },
  };
}

/**
 * The account on a real backend: Supabase Auth.
 *
 * `client` is a @supabase/supabase-js instance, created per app (the two platforms
 * store the session differently — localStorage vs SecureStore — so the client is
 * injected rather than built here).
 *
 * Identifier handling: Supabase Auth signs in by email or phone, not by a free-form
 * "phone or email" string. A value with an '@' is treated as email, otherwise phone,
 * matching how the sign-in screens already collect it.
 */
export function createSupabaseAuthProvider({ client }) {
  if (!client) throw new TypeError('A Supabase client is required');

  const asCredentials = (identifier, password) => {
    const value = String(identifier || '').trim();
    return value.includes('@')
      ? { email: value, password }
      : { phone: value.replace(/\s+/g, ''), password };
  };

  const userFrom = (data) => supabaseUserToAccount(data?.user ?? data ?? null);

  return {
    kind: 'supabase',

    // Supabase restores the session asynchronously; there is no synchronous read.
    currentUser: () => null,

    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return supabaseUserToAccount(data?.session?.user ?? null);
    },

    /** Fires on sign-in, sign-out, and token refresh — the cross-device signal. */
    subscribe(onChange) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        onChange(supabaseUserToAccount(session?.user ?? null));
      });
      return () => data?.subscription?.unsubscribe?.();
    },

    async signIn({ identifier, password }) {
      const { data, error } = await client.auth.signInWithPassword(
        asCredentials(identifier, password)
      );
      if (error) throw error;
      const account = userFrom(data);
      // Close the provisioning gap for accounts created before a session existed.
      // Idempotent; a failure here must not block a valid sign-in.
      try {
        await client.schema('partner_api').rpc('register_store', {
          p_store_name: account.storeName || account.name || 'My Store',
          p_owner_name: account.name || null,
          p_business_type: 'laundry',
          p_province: account.store?.province || null,
          p_phone: account.phone || null,
        });
      } catch {
        /* provisioning is best-effort on sign-in */
      }
      return account;
    },

    async signUp(account) {
      const { email, phone, password, storeName, businessType, province, ownerName } = account;
      const credentials = email
        ? { email: String(email).trim() }
        : { phone: String(phone || '').replace(/\s+/g, '') };

      const { data, error } = await client.auth.signUp({
        ...credentials,
        password,
        options: {
          data: {
            name: ownerName,
            owner_name: ownerName,
            phone: String(phone || '').replace(/\s+/g, ''),
            store_name: storeName,
            business_type: businessType,
            province,
            role: 'Owner',
          },
        },
      });
      if (error) throw error;

      // Provision the tenant: org + profile + active membership. Idempotent, and
      // it needs a live session — so it runs now only if signUp returned one
      // (email confirmation off). Otherwise ensureStore() runs it on first sign-in.
      if (data?.session) {
        await client.schema('partner_api').rpc('register_store', {
          p_store_name: storeName,
          p_owner_name: ownerName,
          p_business_type: businessType || 'laundry',
          p_province: province || null,
          p_phone: String(phone || '').replace(/\s+/g, '') || null,
        });
      }
      return userFrom(data);
    },

    /**
     * Makes sure the signed-in user has an organization. register_store is
     * idempotent — it returns the existing org if there is one — so this is safe
     * to call on every sign-in, and it closes the gap when email confirmation
     * deferred provisioning past signUp.
     */
    async ensureStore(storeName) {
      const { error } = await client.schema('partner_api').rpc('register_store', {
        p_store_name: storeName || 'My Store',
        p_owner_name: null,
        p_business_type: 'laundry',
        p_province: null,
        p_phone: null,
      });
      if (error) throw error;
    },

    /** Sends a reset email/OTP. There is no on-screen code to show as in local mode. */
    async requestPasswordReset(identifier) {
      const value = String(identifier || '').trim();
      if (!value.includes('@')) {
        // Phone reset needs SMS OTP config; email is the supported path here.
        throw new localAuth.LocalAuthError(
          'RESET_UNSUPPORTED',
          'Password reset needs the email on the account.'
        );
      }
      const { error } = await client.auth.resetPasswordForEmail(value);
      if (error) throw error;
      // No dev code to surface — the link/OTP is delivered out of band.
      return { code: '' };
    },

    /** The email OTP is what "verifies"; it also establishes a session to update within. */
    async verifyPasswordReset({ identifier, code }) {
      const { data, error } = await client.auth.verifyOtp({
        email: String(identifier || '').trim(),
        token: String(code || '').trim(),
        type: 'recovery',
      });
      if (error) throw error;
      // The recovery session IS the token for the update step.
      return { resetToken: data?.session?.access_token || 'recovery-session' };
    },

    async resetPassword({ newPassword }) {
      const { data, error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      // Match local behaviour: a password change does not leave you signed in.
      await client.auth.signOut();
      return userFrom(data);
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
  };
}

/**
 * Chooses the provider. Supabase when a client is supplied (env configured),
 * device-local otherwise — so today's behaviour is untouched until a backend is set.
 */
export function createAuthProvider({ client } = {}) {
  return client ? createSupabaseAuthProvider({ client }) : createLocalAuthProvider();
}
