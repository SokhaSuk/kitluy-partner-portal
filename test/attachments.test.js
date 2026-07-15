import assert from 'node:assert/strict';
import test from 'node:test';

import {
  attachmentKind,
  attachmentSummary,
  canModifyMessage,
  createAttachment,
  formatBytes,
  formatDuration,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
  validateAttachments,
} from '../src/lib/attachments.js';

test('only your own, still-live messages can be edited or deleted', () => {
  assert.equal(canModifyMessage({ from: 'me', text: 'Hi' }), true);

  // Rewriting what a customer said would falsify the record, not fix a typo.
  assert.equal(canModifyMessage({ from: 'them', text: 'Hi' }), false);

  // A tombstone has nothing left to act on.
  assert.equal(canModifyMessage({ from: 'me', deleted: true }), false);

  assert.equal(canModifyMessage(null), false);
  assert.equal(canModifyMessage(undefined), false);
});

test('mime types bucket into the three shapes the UI can render', () => {
  assert.equal(attachmentKind('image/jpeg'), 'image');
  assert.equal(attachmentKind('IMAGE/PNG'), 'image', 'case must not matter');
  assert.equal(attachmentKind('audio/webm'), 'audio');
  assert.equal(attachmentKind('application/pdf'), 'file');
  assert.equal(attachmentKind(''), 'file', 'an unknown type is still a file, not a crash');
  assert.equal(attachmentKind(undefined), 'file');
});

test('an attachment records where its bytes live, never the bytes', () => {
  const attachment = createAttachment({
    storageKey: 'attachment-abc',
    name: 'receipt.pdf',
    mime: 'application/pdf',
    size: 2048,
  });

  assert.equal(attachment.storageKey, 'attachment-abc');
  assert.equal(attachment.kind, 'file');
  assert.equal(attachment.size, 2048);
  assert.equal(attachment.id, 'attachment-abc', 'the id falls back to the storage key');
  assert.ok(!('data' in attachment), 'bytes must never enter the domain snapshot');
  assert.ok(!('blob' in attachment));
});

test('a voice note carries its duration; a photo carries its dimensions', () => {
  const voice = createAttachment({
    storageKey: 'a1',
    name: 'note.webm',
    mime: 'audio/webm',
    size: 900,
    durationMs: 4200,
  });
  assert.equal(voice.kind, 'audio');
  assert.equal(voice.durationMs, 4200);

  const photo = createAttachment({
    storageKey: 'a2',
    name: 'p.jpg',
    mime: 'image/jpeg',
    size: 900,
    width: 1280,
    height: 720,
  });
  assert.equal(photo.width, 1280);
  assert.equal(photo.height, 720);
  assert.ok(!('durationMs' in photo), 'a photo has no duration key at all');
});

test('an oversized file is refused before anything is written', () => {
  assert.throws(
    () =>
      createAttachment({
        storageKey: 'big',
        name: 'huge.mov',
        mime: 'video/quicktime',
        size: MAX_ATTACHMENT_BYTES + 1,
      }),
    /larger than/
  );
});

test('an attachment without a storage key is meaningless', () => {
  assert.throws(() => createAttachment({ name: 'x', mime: 'image/png', size: 1 }), /storage key/);
});

test('validateAttachments guards the count and the shape', () => {
  assert.deepEqual(validateAttachments(undefined), [], 'a message with none is fine');

  const one = [{ storageKey: 'k', kind: 'image' }];
  assert.equal(validateAttachments(one).length, 1);

  const tooMany = Array.from({ length: MAX_ATTACHMENTS_PER_MESSAGE + 1 }, (_, i) => ({
    storageKey: `k${i}`,
    kind: 'file',
  }));
  assert.throws(() => validateAttachments(tooMany), /at most/);

  assert.throws(() => validateAttachments([{ kind: 'image' }]), /storage key/);
  assert.throws(() => validateAttachments([{ storageKey: 'k', kind: 'video' }]), /Unsupported/);
  assert.throws(() => validateAttachments('nope'), /must be an array/);
});

test('a wordless message still reads as something in the thread list', () => {
  assert.equal(attachmentSummary([]), '');
  assert.equal(attachmentSummary([{ kind: 'image', name: 'p.jpg' }]), '📷 Photo');
  assert.equal(
    attachmentSummary([{ kind: 'audio', name: 'v.webm', durationMs: 8000 }]),
    '🎤 Voice note · 0:08'
  );
  assert.equal(attachmentSummary([{ kind: 'file', name: 'invoice.pdf' }]), '📎 invoice.pdf');
  assert.equal(
    attachmentSummary([{ kind: 'image' }, { kind: 'file' }]),
    '📎 2 attachments'
  );
});

test('sizes and durations read the way a human writes them', () => {
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2 KB');
  assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB');

  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(8000), '0:08');
  assert.equal(formatDuration(65000), '1:05');
  assert.equal(formatDuration(undefined), '0:00');
});
