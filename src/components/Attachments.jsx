import { useEffect, useRef, useState } from 'react';
import { I, Icon } from '../lib/icons.jsx';
import { cn } from '../lib/cn.js';
import { formatBytes, formatDuration } from '../lib/attachments.js';
import { getAttachmentUrl } from '../services/attachmentStore.js';

/**
 * Resolves an attachment's bytes into an object URL, and revokes it on unmount.
 *
 * Object URLs are held by the document until revoked; a thread that scrolls through
 * a hundred photos would otherwise pin every one of them in memory for the session.
 */
/**
 * One object URL per stored blob, shared by every component showing it and released
 * only when the last of them lets go.
 *
 * Without this cache each mount minted its own URL and revoked it on unmount — and
 * because the domain snapshot is deep-cloned on every mutation, each attachment gets
 * a NEW object identity on every change in the store. So sending a message, marking
 * an order paid, anything at all, revoked the URL the open image was using.
 */
const urlCache = new Map(); // storageKey -> { url, refs }

function acquireUrl(attachment) {
  const key = attachment.storageKey;
  const held = urlCache.get(key);
  if (held) {
    held.refs += 1;
    return Promise.resolve(held.url);
  }

  const entry = { url: null, refs: 1, pending: null };
  urlCache.set(key, entry);

  entry.pending = getAttachmentUrl(attachment).then((url) => {
    // Released again before the blob even loaded.
    if (!urlCache.has(key)) {
      if (url) URL.revokeObjectURL(url);
      return null;
    }
    entry.url = url;
    return url;
  });

  return entry.pending;
}

function releaseUrl(attachment) {
  const key = attachment.storageKey;
  const held = urlCache.get(key);
  if (!held) return;

  held.refs -= 1;
  if (held.refs > 0) return;

  urlCache.delete(key);
  if (held.url) URL.revokeObjectURL(held.url);
}

function useAttachmentUrl(attachment) {
  const [url, setUrl] = useState(() => urlCache.get(attachment.storageKey)?.url ?? null);
  const [missing, setMissing] = useState(false);

  // Keyed on the storage key, not the attachment object: the object is a fresh clone
  // after every domain mutation, and re-running on that churned the URL for nothing.
  const key = attachment.storageKey;

  useEffect(() => {
    let active = true;

    acquireUrl(attachment)
      .then((next) => {
        if (!active) return;
        if (next) setUrl(next);
        // The metadata is in the backup but the bytes are not — an imported
        // snapshot on a different machine lands here.
        else setMissing(true);
      })
      .catch(() => active && setMissing(true));

    return () => {
      active = false;
      releaseUrl(attachment);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { url, missing };
}

function MissingBlob({ attachment }) {
  return (
    <span className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[12px] text-faint">
      <Icon paths={I.paperclip} size={14} />
      {attachment.name} · not on this device
    </span>
  );
}

/** Full-size viewer. Escape or a click on the backdrop closes it. */
function Lightbox({ url, name, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={name}
      onClick={onClose}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-6"
    >
      <img
        src={url}
        alt={name}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-xl object-contain"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white/15 text-white hover:bg-white/25"
      >
        <Icon paths={I.x} size={17} strokeWidth={2.2} />
      </button>
      <a
        href={url}
        download={name}
        onClick={(event) => event.stopPropagation()}
        className="absolute bottom-5 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-white/25"
      >
        <Icon paths={I.download} size={14} />
        Download
      </a>
    </div>
  );
}

function ImageAttachment({ attachment }) {
  const { url, missing } = useAttachmentUrl(attachment);
  const [open, setOpen] = useState(false);

  if (missing) return <MissingBlob attachment={attachment} />;
  if (!url) return <span className="block h-32 w-44 animate-pulse rounded-xl bg-inset" />;

  return (
    <>
      {/* Opened in place, not in a new tab: a blob: URL in another tab dies the moment
          this document revokes it, which is what made images "not open" at all. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${attachment.name}`}
        className="block cursor-zoom-in border-0 bg-transparent p-0"
      >
        <img
          src={url}
          alt={attachment.name}
          className="max-h-56 max-w-full rounded-xl border border-border object-cover"
        />
      </button>
      {open && <Lightbox url={url} name={attachment.name} onClose={() => setOpen(false)} />}
    </>
  );
}

/** A static waveform. Honest decoration: the real amplitudes are never sampled. */
const WAVE = [6, 11, 8, 14, 9, 5, 12, 7, 10, 6, 13, 8, 11, 7];

/**
 * Voice note UI, not a browser audio element.
 *
 * `<audio controls>` paints its own grey chrome — a full player bar with its own
 * background — which is a second surface inside a bubble that is already a surface.
 * This is just the three things a voice note is: play, waveform, length.
 */
function AudioAttachment({ attachment, onAccent }) {
  const { url, missing } = useAttachmentUrl(attachment);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (missing) return <MissingBlob attachment={attachment} />;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    // A finished element sits at the end; rewinding first makes replay work.
    if (audio.ended) audio.currentTime = 0;
    audio.play();
  };

  return (
    <span className="flex items-center gap-2.5 py-0.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        className={cn(
          'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0',
          onAccent ? 'bg-white text-accent' : 'bg-accent text-accent-text'
        )}
      >
        <Icon paths={playing ? I.pause : I.play} size={12} strokeWidth={2.4} />
      </button>

      <span className="flex items-center gap-0.75" aria-hidden="true">
        {WAVE.map((height, index) => (
          <span
            key={index}
            className={cn('w-[2.5px] rounded-full', onAccent ? 'bg-white' : 'bg-accent')}
            style={{ height, opacity: playing ? 1 : 0.5 }}
          />
        ))}
      </span>

      <span className={cn('text-[11.5px] font-medium tabular-nums', onAccent ? 'text-white/85' : 'text-muted')}>
        {formatDuration(attachment.durationMs)}
      </span>

      <audio
        ref={audioRef}
        src={url || undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </span>
  );
}

/** A file still needs a surface: its name has to stay legible on the accent fill. */
function FileAttachment({ attachment, onAccent }) {
  const { url, missing } = useAttachmentUrl(attachment);
  if (missing) return <MissingBlob attachment={attachment} />;

  return (
    <a
      href={url || undefined}
      download={attachment.name}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px]',
        onAccent
          ? 'bg-white/15 text-accent-text hover:bg-white/25'
          : 'border border-border bg-panel text-text hover:border-accent'
      )}
    >
      <Icon paths={I.paperclip} size={14} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{attachment.name}</span>
        <span className={cn('block text-[11px]', onAccent ? 'text-accent-text/70' : 'text-faint')}>
          {formatBytes(attachment.size)}
        </span>
      </span>
      <Icon paths={I.download} size={14} />
    </a>
  );
}

/**
 * Attachments inside a sent message. `onAccent` means the bubble is the accent fill,
 * so each kind decides its own contrast — rather than the caller dropping a panel
 * behind all of them, which is what put a box around the voice notes.
 */
export function AttachmentList({ attachments = [], onAccent = false }) {
  if (!attachments.length) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {attachments.map((attachment) => {
        if (attachment.kind === 'image') {
          return <ImageAttachment key={attachment.id} attachment={attachment} />;
        }
        if (attachment.kind === 'audio') {
          return <AudioAttachment key={attachment.id} attachment={attachment} onAccent={onAccent} />;
        }
        return <FileAttachment key={attachment.id} attachment={attachment} onAccent={onAccent} />;
      })}
    </div>
  );
}

/** The staged attachments above the composer, before the message is sent. */
export function PendingTray({ pending, onRemove }) {
  if (!pending.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {pending.map((attachment) => (
        <span
          key={attachment.id}
          className="flex items-center gap-2 rounded-lg border border-border bg-inset px-2.5 py-1.5 text-[11.5px] text-text"
        >
          <Icon
            paths={attachment.kind === 'image' ? I.image : attachment.kind === 'audio' ? I.mic : I.paperclip}
            size={13}
          />
          <span className="max-w-40 truncate">{attachment.name}</span>
          <span className="text-faint">
            {attachment.kind === 'audio' && attachment.durationMs
              ? formatDuration(attachment.durationMs)
              : formatBytes(attachment.size)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(attachment)}
            aria-label={`Remove ${attachment.name}`}
            className="cursor-pointer rounded border-0 bg-transparent text-faint hover:text-danger-fg"
          >
            <Icon paths={I.x} size={13} strokeWidth={2.2} />
          </button>
        </span>
      ))}
    </div>
  );
}

/**
 * Webcam capture. The stream is stopped on unmount and on capture — a camera light
 * left on after the dialog closes is the kind of bug users never forgive.
 */
export function CameraDialog({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((cause) =>
        setError(
          cause?.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow it in the browser’s site settings.'
            : 'No camera is available on this device.'
        )
      );

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      onCapture(blob, { width: canvas.width, height: canvas.height });
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-panel p-4 shadow-pop">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-[15px] font-semibold text-text">Take a photo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="cursor-pointer rounded-lg border-0 bg-transparent p-1 text-muted hover:text-text"
          >
            <Icon paths={I.x} size={16} strokeWidth={2.2} />
          </button>
        </div>

        {error ? (
          <p className="rounded-xl bg-danger-bg px-3 py-2.5 text-[12.5px] text-danger-fg">{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full rounded-xl bg-black object-cover"
          />
        )}

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-border bg-panel px-3 py-2 text-[12.5px] font-semibold text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={Boolean(error)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-accent px-3 py-2 text-[12.5px] font-semibold text-accent-text disabled:opacity-40"
          >
            <Icon paths={I.camera} size={14} />
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Voice-note recorder over MediaRecorder. Returns a blob plus its duration — the
 * duration has to be measured here, because an audio blob's own metadata is
 * unreliable for streams the browser recorded itself.
 */
export function useVoiceRecorder({ onRecorded, onError }) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAt = useRef(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = setInterval(() => setElapsed(Date.now() - startedAt.current), 200);
    return () => clearInterval(timer);
  }, [recording]);

  // A recorder left running after the screen closes keeps the mic light on.
  useEffect(
    () => () => {
      recorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const start = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const durationMs = Date.now() - startedAt.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setElapsed(0);
        if (blob.size) onRecorded(blob, durationMs);
      };

      recorderRef.current = recorder;
      startedAt.current = Date.now();
      recorder.start();
      setRecording(true);
    } catch (cause) {
      onError(
        cause?.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow it in the browser’s site settings.'
          : 'No microphone is available on this device.'
      );
    }
  };

  const stop = () => recorderRef.current?.stop();

  const cancel = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.onstop = null;
    recorder.stop();
    recorder.stream?.getTracks().forEach((track) => track.stop());
    setRecording(false);
    setElapsed(0);
  };

  return { recording, elapsed, start, stop, cancel };
}
