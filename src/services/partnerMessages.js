/**
 * The Messages slice of the Partner backend, through the partner_api interface.
 *
 * Counterpart to partnerData (customers): everything the Messages screen needs
 * from the backend — the thread list, the bubbles, the five writes, and the live
 * channel. Nothing here reaches a domain schema directly (D-05); it all goes
 * through partner_api views + RPCs.
 *
 * `client` is a @supabase/supabase-js instance; null when no backend is
 * configured, in which case `enabled` is false and the caller stays on the
 * device-local domain store.
 */
export function createPartnerMessages({ client }) {
  const on = Boolean(client);
  const api = on ? client.schema('partner_api') : null;

  return {
    enabled: on,

    /** The org uid — the realtime topic key the client subscribes to. */
    async currentOrgUid() {
      if (!on) return null;
      const { data, error } = await api.rpc('current_org_uid');
      if (error) throw error;
      return data ?? null;
    },

    /** The thread list, projected onto the frontend `thread` header shape. */
    async listConversations() {
      if (!on) return [];
      const { data, error } = await api
        .from('conversations')
        .select(
          'id, who, kind, channel, tier, context, presence, unread, last_message_at, last_message_preview, last_message_from, customer_id, created_at'
        )
        .order('last_message_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },

    /** Every message in the org's threads (this inbox is small enough to load whole). */
    async listMessages() {
      if (!on) return [];
      const { data, error } = await api
        .from('messages')
        .select('id, conversation_id, direction, author_kind, by, text, attachments, deleted, edited_at, delivery_status, at')
        .order('at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },

    /** start_conversation → returns the conversation uid (existing or new). */
    async startConversation({ title, channel = 'local', kind = 'Customers', customerId = null, subtitle = null }) {
      if (!on) return null;
      const { data, error } = await api.rpc('start_conversation', {
        p_title: title,
        p_channel: channel,
        p_kind: kind,
        p_customer_uid: customerId,
        p_subtitle: subtitle,
      });
      if (error) throw error;
      return data;
    },

    /** send_message → returns the new message uid. */
    async sendMessage({ conversationId, text = '', attachments = [] }) {
      if (!on) return null;
      const { data, error } = await api.rpc('send_message', {
        p_conversation_uid: conversationId,
        p_text: text,
        p_attachments: attachments,
      });
      if (error) throw error;
      return data;
    },

    /** edit_message → returns the message uid. */
    async editMessage({ messageId, text }) {
      if (!on) return null;
      const { data, error } = await api.rpc('edit_message', { p_message_uid: messageId, p_text: text });
      if (error) throw error;
      return data;
    },

    /** delete_message (soft) → returns the message uid. */
    async deleteMessage({ messageId }) {
      if (!on) return null;
      const { data, error } = await api.rpc('delete_message', { p_message_uid: messageId });
      if (error) throw error;
      return data;
    },

    /** mark_read → clears the unread badge for a thread. */
    async markRead({ conversationId }) {
      if (!on) return;
      const { error } = await api.rpc('mark_read', { p_conversation_uid: conversationId });
      if (error) throw error;
    },

    /**
     * Live updates on the org's private broadcast topic. The DB triggers push a
     * curated `message` or `conversation` payload; `onEvent` receives it. Returns
     * an unsubscribe. No-op without a backend or an org uid.
     *
     * The channel is private, so the caller must have set the realtime auth token
     * (client.realtime.setAuth) before this runs, or the RLS policy on
     * realtime.messages will refuse the subscription.
     */
    subscribe(orgUid, onEvent) {
      if (!on || !orgUid) return () => {};
      const channel = client
        .channel(`org:${orgUid}`, { config: { private: true } })
        .on('broadcast', { event: 'message' }, (msg) => onEvent(msg.payload))
        .on('broadcast', { event: 'conversation' }, (msg) => onEvent(msg.payload))
        .subscribe();
      return () => client.removeChannel(channel);
    },
  };
}
