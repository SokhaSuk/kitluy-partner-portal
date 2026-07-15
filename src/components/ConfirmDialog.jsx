import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn.js';
import { toneClass } from '../lib/tone.js';
import { Icon } from '../lib/icons.jsx';
import { Alert, Button, FEEDBACK_ICON } from './ui/index.jsx';
import { usePortal } from '../store/PortalContext.jsx';

/**
 * The single confirm dialog, driven by `p.confirm(options)` in PortalContext.
 * Replaces `window.confirm`, which cannot be styled or themed, blocks the main
 * thread, and offers no way to report a failure except a second alert.
 *
 * When `options.onConfirm` is an async function the dialog stays open and busy
 * while it runs, and a rejection renders *inside* the dialog — the decision and
 * its outcome stay in one place instead of a toast behind a modal.
 */
export default function ConfirmDialog() {
  const { confirmState, closeConfirm } = usePortal();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  // Stops are queried rather than ref-forwarded: `Button` is a plain function
  // component by house convention, so it cannot carry a ref on React 18.
  // The selector covers anything focusable, not just <button>, because the
  // `details` slot renders arbitrary JSX — a link or input in there would
  // otherwise be trapped out of reach rather than into it.
  const FOCUSABLE =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const stopsIn = () =>
    [...(panelRef.current?.querySelectorAll(FOCUSABLE) || [])].filter((node) => !node.disabled);

  // Per-dialog state, scroll lock, and focus handoff. Keyed on the options
  // object, so a second confirm raised over a first still resets and refocuses.
  useEffect(() => {
    if (!confirmState) return undefined;

    restoreRef.current = document.activeElement;
    setBusy(false);
    setError('');

    const frame = requestAnimationFrame(() =>
      panelRef.current?.querySelector('[data-confirm-accept]')?.focus()
    );
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      // Restore focus to whatever opened the dialog — otherwise focus falls to
      // the top of the document and a keyboard user re-walks the whole page.
      // The trigger may be gone (a delete button on the row it just deleted),
      // and focusing a detached node silently does nothing, so check first.
      const trigger = restoreRef.current;
      if (trigger && document.contains(trigger)) trigger.focus?.();
    };
  }, [confirmState]);

  // Both buttons are disabled while an async onConfirm runs, which leaves the
  // trap with nothing to hold — the browser drops focus to <body>, behind the
  // scrim. Parking focus on the panel keeps it inside the dialog.
  useEffect(() => {
    if (busy) panelRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    if (!confirmState) return undefined;

    const onKeyDown = (event) => {
      // Escape must not abandon work that is already running.
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        closeConfirm(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const stops = stopsIn();
      const active = document.activeElement;

      // Nothing focusable left (both buttons disabled while busy). Tab must
      // still not walk out into the page behind the scrim.
      if (!stops.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = stops[0];
      const last = stops[stops.length - 1];
      // `!stops.includes(active)` catches focus already sitting outside the
      // buttons — on the panel, or on <body> after a click on the title text.
      const outside = !stops.includes(active);

      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmState, busy, closeConfirm]);

  if (!confirmState) return null;

  const {
    title,
    message,
    tone = 'danger',
    icon,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant,
    onConfirm,
    details,
  } = confirmState;

  const accept = async () => {
    if (busy) return;
    if (typeof onConfirm !== 'function') {
      closeConfirm(true);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onConfirm();
      // Cleared before closing, not left to the next open-effect: effects run
      // after paint, so a stale `busy` would give the *next* dialog one frame
      // with a spinner and both buttons disabled.
      setBusy(false);
      closeConfirm(true);
    } catch (actionError) {
      setError(actionError?.message || 'That action could not be completed.');
      setBusy(false);
    }
  };

  const dismiss = () => {
    if (!busy) closeConfirm(false);
  };

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={dismiss}
        className="animate-kfadein fixed inset-0 z-70 border-0 bg-(--scrim)"
      />
      <div className="pointer-events-none fixed inset-0 z-71 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          // `alertdialog`, not `dialog`: it tells a screen reader this interrupts,
          // and makes it announce the message without being asked for it.
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby={message ? 'confirm-message' : undefined}
          // Focusable, but not a tab stop: it is the trap's fallback anchor for
          // the window in which both buttons are disabled.
          tabIndex={-1}
          className="animate-kpopin pointer-events-auto w-full max-w-105 rounded-2xl border border-border bg-panel p-5 shadow-pop focus:outline-none"
        >
          <div className="flex items-start gap-3.5">
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]',
                toneClass(tone)
              )}
            >
              <Icon
                paths={icon || FEEDBACK_ICON[tone] || FEEDBACK_ICON.info}
                size={17}
                strokeWidth={2}
              />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="confirm-title"
                className="m-0 text-[15.5px] font-bold tracking-[-0.01em] text-text"
              >
                {title}
              </h2>
              {message && (
                <p id="confirm-message" className="mt-1.5 text-[13px] leading-normal text-muted">
                  {message}
                </p>
              )}
            </div>
          </div>

          {details && <div className="mt-3.5">{details}</div>}

          {error && (
            <Alert tone="danger" className="mt-3.5">
              {error}
            </Alert>
          )}

          <div className="mt-5 flex justify-end gap-2.5">
            <Button onClick={dismiss} disabled={busy} className="px-4 py-2.25">
              {cancelLabel}
            </Button>
            <Button
              data-confirm-accept=""
              variant={confirmVariant || (tone === 'danger' ? 'danger' : 'accent')}
              onClick={accept}
              loading={busy}
              className="px-4 py-2.25 font-semibold"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
