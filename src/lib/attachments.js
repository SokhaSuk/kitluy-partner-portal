/**
 * The attachment *metadata* carried inside a message. The bytes never live here.
 *
 * The domain snapshot is JSON in browser/device storage with a 5 MB import ceiling,
 * so base64-ing a photo into it would break backup and restore after two pictures.
 * The bytes go to a platform blob store — IndexedDB in the portal, the file system
 * in the app — and the domain keeps only what it takes to find and describe them.
 */

export const ATTACHMENT_KINDS = ['image', 'audio', 'file'];

/** Blobs bigger than this are refused: the stores are a device, not a CDN. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** How many can ride on a single message. */
export const MAX_ATTACHMENTS_PER_MESSAGE = 6;

/** Buckets a MIME type into the three shapes the UI knows how to render. */
export function attachmentKind(mime = '') {
  const type = String(mime).toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('audio/')) return 'audio';
  return 'file';
}

export function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** mm:ss for a voice note. */
export function formatDuration(ms) {
  const total = Math.max(0, Math.round(Number(ms || 0) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Normalizes what a picker handed us into the record stored on the message.
 * `storageKey` is how the platform store finds the bytes again.
 */
export function createAttachment({
  id,
  storageKey,
  name,
  mime,
  size,
  durationMs,
  width,
  height,
}) {
  const type = String(mime || 'application/octet-stream');
  const bytes = Number(size || 0);

  if (!storageKey) throw new TypeError('An attachment needs a storage key');
  if (bytes > MAX_ATTACHMENT_BYTES) {
    throw new RangeError(`${name || 'That file'} is larger than ${formatBytes(MAX_ATTACHMENT_BYTES)}`);
  }

  return {
    id: id || storageKey,
    storageKey,
    kind: attachmentKind(type),
    name: String(name || 'attachment'),
    mime: type,
    size: bytes,
    ...(durationMs ? { durationMs: Number(durationMs) } : {}),
    ...(width && height ? { width: Number(width), height: Number(height) } : {}),
  };
}

/** Guards the count and shape before a message is committed. */
export function validateAttachments(attachments) {
  if (!attachments) return [];
  if (!Array.isArray(attachments)) throw new TypeError('Attachments must be an array');
  if (attachments.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new RangeError(`A message carries at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments`);
  }
  attachments.forEach((attachment) => {
    if (!attachment?.storageKey) throw new TypeError('An attachment is missing its storage key');
    if (!ATTACHMENT_KINDS.includes(attachment.kind)) {
      throw new TypeError(`Unsupported attachment kind: ${attachment.kind}`);
    }
  });
  return attachments;
}

/** The tombstone left where a deleted message was. */
export const DELETED_MESSAGE_TEXT = 'This message was deleted';

/** The marker shown next to an edited message's timestamp. */
export const EDITED_MESSAGE_LABEL = 'edited';

/**
 * Can this message be edited or deleted?
 *
 * Only outgoing messages: rewriting what a customer said would be falsifying the
 * record. A deleted message is already a tombstone — there is nothing left to act on.
 */
export function canModifyMessage(message) {
  return Boolean(message) && message.from === 'me' && !message.deleted;
}

/** What a message with no words is called in a thread list preview. */
export function attachmentSummary(attachments = []) {
  if (!attachments.length) return '';
  if (attachments.length === 1) {
    const [only] = attachments;
    if (only.kind === 'image') return '📷 Photo';
    if (only.kind === 'audio') return `🎤 Voice note · ${formatDuration(only.durationMs)}`;
    return `📎 ${only.name}`;
  }
  return `📎 ${attachments.length} attachments`;
}
