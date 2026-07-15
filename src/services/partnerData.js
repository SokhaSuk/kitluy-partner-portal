/**
 * Reads and writes the Partner backend through the partner_api interface.
 *
 * This is the data counterpart to authProvider: everything the frontend needs from
 * the backend for the *customers* slice, in the shape the domain already speaks. The
 * gateway/screens call these; nothing here reaches a domain schema directly (D-05).
 *
 * `client` is a @supabase/supabase-js instance; null when no backend is configured,
 * in which case every method returns empty/no-ops and the app stays device-local.
 */
export function createPartnerData({ client }) {
  const on = Boolean(client);
  // .from()/.rpc() default to the `public` schema; the interface lives in
  // partner_api (the only exposed non-public schema, per D-05). Bind to it once.
  const api = on ? client.schema('partner_api') : null;

  return {
    enabled: on,

    /**
     * Signup dropdown options — readable by `anon`, so the signup form (pre-session)
     * can fetch them. Return [] when the backend is off; the form falls back to its
     * built-in list.
     */
    async listBusinessTypes() {
      if (!on) return [];
      const { data, error } = await api.from('business_type_options').select('code, label, vertical');
      if (error) throw error;
      return data ?? [];
    },

    async listProvinces() {
      if (!on) return [];
      const { data, error } = await api.from('province_options').select('code, label');
      if (error) throw error;
      return data ?? [];
    },

    /** The customer list, projected onto the frontend `customer` shape. */
    async listCustomers() {
      if (!on) return [];
      const { data, error } = await api
        .from('customers')
        .select('id, name, type, orders, spend, joined, last, active, tier, coins');
      if (error) throw error;
      return data ?? [];
    },

    /** Notes + preferences for the detail screen, keyed by customer id (uid). */
    async listCustomerNotes() {
      if (!on) return [];
      const { data, error } = await api.from('customer_notes').select('id, customer_id, text, pinned, at');
      if (error) throw error;
      return data ?? [];
    },

    /** The gated full phone/email for one customer (detail screen only). */
    async customerPii(customerUid) {
      if (!on) return null;
      const { data, error } = await api.rpc('customer_pii', { p_customer_uid: customerUid });
      if (error) throw error;
      return data?.[0] ?? null;
    },

    /** addCustomer → partner_api.add_customer. Returns the new customer uid. */
    async addCustomer({ name, type = 'B2C', phone = null, email = null }) {
      if (!on) return null;
      const { data, error } = await api.rpc('add_customer', {
        p_name: name,
        p_type: type,
        p_phone: phone,
        p_email: email,
      });
      if (error) throw error;
      return data;
    },

    /** addCustomerNote → partner_api.add_customer_note. */
    async addCustomerNote({ customerId, body }) {
      if (!on) return null;
      const { data, error } = await api.rpc('add_customer_note', {
        p_customer_uid: customerId,
        p_body: body,
      });
      if (error) throw error;
      return data;
    },

    /**
     * Live updates: another device adding a customer pushes an INSERT on
     * customers.customers. Returns an unsubscribe. No-op without a backend.
     */
    subscribeCustomers(onChange) {
      if (!on) return () => {};
      const channel = client
        .channel('partner:customers')
        .on('postgres_changes', { event: '*', schema: 'customers', table: 'customers' }, onChange)
        .subscribe();
      return () => client.removeChannel(channel);
    },
  };
}
