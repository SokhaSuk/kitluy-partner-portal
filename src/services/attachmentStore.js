import { createAttachment } from '../lib/attachments.js';

/**
 * Browser-local blob store for message attachments.
 *
 * IndexedDB rather than localStorage: localStorage holds strings only (a photo
 * would have to be base64, inflating it ~33%) and caps out around 5 MB for the
 * whole origin — which the domain snapshot already shares. IndexedDB stores Blobs
 * natively and has room to work with.
 *
 * The domain keeps only the metadata; this holds the bytes, keyed by storageKey.
 */

const DB_NAME = 'kitluy.partner.attachments';
const DB_VERSION = 1;
const STORE = 'blobs';

let connection = null;

function openDatabase() {
  if (connection) return connection;

  connection = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('This browser has no IndexedDB, so attachments cannot be stored.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Attachment storage could not be opened.'));
  }).catch((error) => {
    connection = null; // Let a later call retry rather than cache the failure forever.
    throw error;
  });

  return connection;
}

function transact(mode, run) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

const keyFor = (id) => `attachment-${id}-${Date.now().toString(36)}`;

/**
 * Writes the bytes and returns the metadata to store on the message.
 * `durationMs` is supplied by the recorder for voice notes; nothing else knows it.
 */
export async function putAttachment(blob, { name, durationMs, width, height } = {}) {
  const storageKey = keyFor(Math.random().toString(36).slice(2, 8));

  // Build (and validate size) before writing, so an oversized file never lands.
  const attachment = createAttachment({
    storageKey,
    name: name || blob.name || 'attachment',
    mime: blob.type,
    size: blob.size,
    durationMs,
    width,
    height,
  });

  await transact('readwrite', (store) => store.put(blob, storageKey));
  return attachment;
}

/** The Blob behind an attachment, or null if it is not on this device. */
export async function getAttachmentBlob(attachment) {
  if (!attachment?.storageKey) return null;
  try {
    return (await transact('readonly', (store) => store.get(attachment.storageKey))) || null;
  } catch {
    return null;
  }
}

/**
 * An object URL for rendering. The caller MUST revoke it when the element unmounts
 * — object URLs are held by the document until then, and a message list churns
 * through them.
 */
export async function getAttachmentUrl(attachment) {
  const blob = await getAttachmentBlob(attachment);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function removeAttachment(attachment) {
  if (!attachment?.storageKey) return;
  try {
    await transact('readwrite', (store) => store.delete(attachment.storageKey));
  } catch {
    // A blob we cannot delete is a leak, not a failure the operator can act on.
  }
}
