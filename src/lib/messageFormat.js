/**
 * Turning backend message rows into the shape the Messages screen renders.
 *
 * The domain used to store display strings (day: 'Today', at: '09:14') directly.
 * The backend stores real timestamps instead, so day dividers and clocks stay
 * correct regardless of the device's clock — these helpers derive the labels the
 * UI expects from a single `created_at`.
 */

const pad2 = (n) => String(n).padStart(2, '0');

/** 24h HH:MM, matching the original seed's `at` field. */
export function timeLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** 'Today' / 'Yesterday' / '12 Jul' — the divider between message groups. */
export function dayLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  const diffDays = Math.round((today - day) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** '2m' / '3h' / '1d' — the compact stamp on a thread row. */
export function relativeLabel(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 45) return 'now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * A backend message row (from partner_api.messages) → the render shape.
 * `_ts` is the raw timestamp kept for sorting and day-grouping.
 */
export function mapMessageRow(row) {
  const at = row.at;
  return {
    id: row.id,
    from: row.direction === 'out' ? 'me' : 'them',
    authorKind: row.author_kind,
    by: row.by,
    text: row.text || '',
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    deleted: Boolean(row.deleted),
    editedAt: row.edited_at || null,
    deliveryStatus: row.delivery_status,
    _ts: at,
    at: timeLabel(at),
    day: dayLabel(at),
  };
}

/**
 * A realtime `message` broadcast payload → the same render shape. The trigger
 * already maps direction→from and blanks a deleted body, so the fields differ
 * slightly from the REST row.
 */
export function mapMessageBroadcast(m) {
  const at = m.at;
  return {
    id: m.id,
    from: m.from,
    authorKind: m.authorKind,
    by: m.by,
    text: m.text || '',
    attachments: Array.isArray(m.attachments) ? m.attachments : [],
    deleted: Boolean(m.deleted),
    editedAt: m.editedAt || null,
    deliveryStatus: m.deliveryStatus,
    _ts: at,
    at: timeLabel(at),
    day: dayLabel(at),
  };
}

/** A conversation row (partner_api.conversations) → the thread header shape. */
export function mapConversationRow(row) {
  return {
    id: row.id,
    who: row.who,
    kind: row.kind,
    channel: row.channel,
    tier: row.tier,
    context: row.context,
    presence: row.presence,
    unread: Number(row.unread || 0),
    customerId: row.customer_id || null,
    lastMessageFrom: row.last_message_from || null,
    _lastTs: row.last_message_at || row.created_at || null,
  };
}

/**
 * A realtime `conversation` broadcast payload → the thread header shape.
 * customer_id is intentionally omitted: the broadcast does not carry it, so it
 * is left for the reducer to preserve from the row that was loaded over REST.
 */
export function mapConversationBroadcast(c) {
  return {
    id: c.id,
    who: c.who,
    kind: c.kind,
    channel: c.channel,
    tier: c.tier,
    context: c.subtitle,
    presence: c.presence,
    unread: Number(c.unread || 0),
    lastMessageFrom: c.lastMessageFrom || null,
    _lastTs: c.lastMessageAt || null,
    archived: Boolean(c.archived),
  };
}
