import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { useDomain } from './DomainContext.jsx';
import { createPartnerMessages } from '../services/partnerMessages.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import {
  dayLabel,
  mapConversationBroadcast,
  mapConversationRow,
  mapMessageBroadcast,
  mapMessageRow,
  relativeLabel,
  timeLabel,
} from '../lib/messageFormat.js';

/**
 * Messages — read, write and LIVE — routed to the backend when it is configured,
 * and to the device-local domain otherwise. One hook so the Messages screen calls
 * it the same way in both modes, exactly like usePartnerCustomers does for the
 * customer slice.
 *
 * Backend mode holds its own normalized store (conversations + messages keyed by
 * uid) fed by an initial load and the org's realtime broadcast topic. Sends are
 * optimistic: a temp bubble shows at once, the RPC confirms it, and the broadcast
 * — which the sender also receives — reconciles by uid so nothing doubles up.
 */

const EMPTY = { convById: {}, msgByConv: {} };

function reducer(state, action) {
  switch (action.type) {
    case 'load': {
      const convById = {};
      for (const c of action.conversations) convById[c.id] = c;
      const msgByConv = {};
      for (const m of action.messages) {
        (msgByConv[m.conversationId] ||= {})[m.id] = m;
      }
      return { convById, msgByConv };
    }
    case 'upsert-conv': {
      const prev = state.convById[action.conv.id];
      return { ...state, convById: { ...state.convById, [action.conv.id]: { ...prev, ...action.conv } } };
    }
    case 'patch-conv': {
      const prev = state.convById[action.convId];
      if (!prev) return state;
      return { ...state, convById: { ...state.convById, [action.convId]: { ...prev, ...action.patch } } };
    }
    case 'upsert-msg': {
      const bucket = { ...(state.msgByConv[action.convId] || {}) };
      // The sender receives its own broadcast: drop the optimistic temp it matches.
      if (action.message.from === 'me') {
        for (const key of Object.keys(bucket)) {
          const existing = bucket[key];
          if (key.startsWith('tmp-') && existing.pending && existing.text === action.message.text) {
            delete bucket[key];
          }
        }
      }
      bucket[action.message.id] = { ...bucket[action.message.id], ...action.message };
      return { ...state, msgByConv: { ...state.msgByConv, [action.convId]: bucket } };
    }
    case 'add-temp': {
      const bucket = { ...(state.msgByConv[action.convId] || {}), [action.message.id]: action.message };
      return { ...state, msgByConv: { ...state.msgByConv, [action.convId]: bucket } };
    }
    case 'replace-temp': {
      const bucket = { ...(state.msgByConv[action.convId] || {}) };
      delete bucket[action.tempId];
      bucket[action.message.id] = { ...bucket[action.message.id], ...action.message };
      return { ...state, msgByConv: { ...state.msgByConv, [action.convId]: bucket } };
    }
    case 'remove-temp': {
      const bucket = { ...(state.msgByConv[action.convId] || {}) };
      delete bucket[action.tempId];
      return { ...state, msgByConv: { ...state.msgByConv, [action.convId]: bucket } };
    }
    case 'patch-msg': {
      const bucket = state.msgByConv[action.convId];
      if (!bucket || !bucket[action.msgId]) return state;
      const next = { ...bucket, [action.msgId]: { ...bucket[action.msgId], ...action.patch } };
      return { ...state, msgByConv: { ...state.msgByConv, [action.convId]: next } };
    }
    default:
      return state;
  }
}

/** A message-shaped record for an optimistic (not-yet-saved) outbound bubble. */
function optimisticMessage(id, text, attachments, meName, pending) {
  const iso = new Date().toISOString();
  return {
    id,
    from: 'me',
    by: meName,
    text,
    attachments,
    deleted: false,
    editedAt: null,
    deliveryStatus: pending ? 'pending' : 'sent',
    pending,
    _ts: iso,
    at: timeLabel(iso),
    day: dayLabel(iso),
  };
}

export function usePartnerConversations({ notify = () => {}, meName = 'You', sessionKey = null } = {}) {
  const domain = useDomain();
  const data = useMemo(() => createPartnerMessages({ client: getSupabaseClient() }), []);
  const enabled = data.enabled;
  // The hook only has work to do once there is a signed-in account to scope to.
  const active = enabled && Boolean(sessionKey);

  const [store, dispatch] = useReducer(reducer, EMPTY);
  const [loading, setLoading] = useState(active);
  const [error, setError] = useState(null);
  const tmpSeq = useRef(0);

  // A synchronous mirror of the store, so edit/delete can read the current
  // message the way the domain's synchronous mutations do.
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  const refresh = useCallback(async () => {
    const [conversations, messages] = await Promise.all([data.listConversations(), data.listMessages()]);
    dispatch({
      type: 'load',
      conversations: conversations.map(mapConversationRow),
      messages: messages.map((row) => ({ ...mapMessageRow(row), conversationId: row.conversation_id })),
    });
  }, [data]);

  useEffect(() => {
    if (!active) {
      // Signed out (or no backend): drop any prior account's threads.
      dispatch({ type: 'load', conversations: [], messages: [] });
      setLoading(false);
      return undefined;
    }
    let live = true;
    let unsubscribe = () => {};
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // A private broadcast channel is authorized by the caller's JWT — hand the
        // realtime socket the current session token before subscribing.
        const client = getSupabaseClient();
        const { data: sessionData } = await client.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) client.realtime.setAuth(token);

        const orgUid = await data.currentOrgUid();
        if (!live) return;

        await refresh();
        if (!live) return;

        unsubscribe = data.subscribe(orgUid, (payload) => {
          if (payload?.type === 'message') {
            const convId = payload.conversationId;
            // An inbound message for a thread we have not loaded (a brand-new
            // Telegram chat): pull the thread in so it renders.
            if (convId && !storeRef.current.convById[convId]) refresh();
            dispatch({ type: 'upsert-msg', convId, message: mapMessageBroadcast(payload.message) });
          } else if (payload?.type === 'conversation') {
            dispatch({ type: 'upsert-conv', conv: mapConversationBroadcast(payload.conversation) });
          }
        });
      } catch (cause) {
        if (live) setError(cause?.message || 'Could not load messages');
      } finally {
        if (live) setLoading(false);
      }
    })();

    return () => {
      live = false;
      unsubscribe();
    };
  }, [active, data, refresh]);

  const threads = useMemo(() => {
    if (!enabled) return domain.threads || [];
    return Object.values(store.convById)
      .filter((c) => !c.archived)
      .map((c) => {
        const bucket = store.msgByConv[c.id] || {};
        const messages = Object.values(bucket).sort(
          (a, b) => new Date(a._ts || 0).getTime() - new Date(b._ts || 0).getTime()
        );
        const last = messages[messages.length - 1];
        const lastTs = last?._ts || c._lastTs;
        return {
          ...c,
          time: relativeLabel(lastTs),
          messages,
          _sortTs: lastTs ? new Date(lastTs).getTime() : 0,
        };
      })
      .sort((a, b) => b._sortTs - a._sortTs);
  }, [enabled, domain.threads, store]);

  const readThread = useCallback(
    (id) => {
      if (!enabled) return domain.readThread(id);
      dispatch({ type: 'patch-conv', convId: id, patch: { unread: 0 } });
      data.markRead({ conversationId: id }).catch((cause) => setError(cause?.message || null));
      return undefined;
    },
    [enabled, domain, data]
  );

  const sendMessage = useCallback(
    (threadId, input) => {
      if (!enabled) return domain.sendMessage(threadId, input);
      const values = typeof input === 'string' ? { text: input } : input || {};
      const text = String(values.text ?? '').trim();
      const attachments = Array.isArray(values.attachments) ? values.attachments : [];
      if (!text && !attachments.length) return undefined;

      const tempId = `tmp-${(tmpSeq.current += 1)}`;
      dispatch({ type: 'add-temp', convId: threadId, message: optimisticMessage(tempId, text, attachments, meName, true) });
      dispatch({ type: 'patch-conv', convId: threadId, patch: { lastMessageFrom: 'me', _lastTs: new Date().toISOString() } });

      data
        .sendMessage({ conversationId: threadId, text, attachments })
        .then((uid) => {
          if (!uid) return dispatch({ type: 'remove-temp', convId: threadId, tempId });
          return dispatch({
            type: 'replace-temp',
            convId: threadId,
            tempId,
            message: optimisticMessage(uid, text, attachments, meName, false),
          });
        })
        .catch((cause) => {
          dispatch({ type: 'patch-msg', convId: threadId, msgId: tempId, patch: { deliveryStatus: 'failed', pending: false } });
          notify(cause?.message || 'That message could not be sent.');
        });
      return undefined;
    },
    [enabled, domain, data, meName, notify]
  );

  const editMessage = useCallback(
    (threadId, messageId, input) => {
      if (!enabled) return domain.editMessage(threadId, messageId, input);
      const values = typeof input === 'string' ? { text: input } : input || {};
      const text = String(values.text ?? '').trim();

      const message = (storeRef.current.msgByConv[threadId] || {})[messageId];
      if (!message) throw new TypeError('That message was not found');
      if (message.from !== 'me') throw new TypeError('Only your own messages can be edited');
      if (message.deleted) throw new TypeError('A deleted message cannot be edited');
      if (!text && !message.attachments?.length) throw new TypeError('Message is required');
      if (text === message.text) return undefined;

      const previousText = message.text;
      dispatch({ type: 'patch-msg', convId: threadId, msgId: messageId, patch: { text, editedAt: new Date().toISOString() } });
      data.editMessage({ messageId, text }).catch((cause) => {
        dispatch({ type: 'patch-msg', convId: threadId, msgId: messageId, patch: { text: previousText } });
        notify(cause?.message || 'That message could not be edited.');
      });
      return undefined;
    },
    [enabled, domain, data, notify]
  );

  const deleteMessage = useCallback(
    (threadId, messageId) => {
      if (!enabled) return domain.deleteMessage(threadId, messageId);
      const message = (storeRef.current.msgByConv[threadId] || {})[messageId];
      if (!message || message.from !== 'me') return [];
      const orphaned = Array.isArray(message.attachments) ? message.attachments : [];
      dispatch({ type: 'patch-msg', convId: threadId, msgId: messageId, patch: { deleted: true, text: '', attachments: [] } });
      data.deleteMessage({ messageId }).catch((cause) => notify(cause?.message || 'That message could not be deleted.'));
      return orphaned;
    },
    [enabled, domain, data, notify]
  );

  // Always resolves to the conversation id (uid on the backend, local id offline),
  // so the "message this customer" entry points can navigate the same way in both.
  const startConversation = useCallback(
    async (input) => {
      const values = input || {};
      if (!enabled) {
        const thread = domain.createThread({
          who: values.title || values.who,
          kind: values.kind,
          channel: values.channel,
          context: values.subtitle ?? values.context,
        });
        return thread?.id ?? null;
      }
      return data.startConversation({
        title: values.title || values.who,
        channel: values.channel,
        kind: values.kind,
        customerId: values.customerId ?? null,
        subtitle: values.subtitle ?? values.context ?? null,
      });
    },
    [enabled, domain, data]
  );

  return {
    source: enabled ? 'backend' : 'local',
    ready: enabled ? !loading : true,
    loading: enabled ? loading : false,
    error,
    threads,
    readThread,
    sendMessage,
    editMessage,
    deleteMessage,
    startConversation,
  };
}
