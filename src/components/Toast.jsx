import { cn } from "../lib/cn.js";
import { toneClass } from "../lib/tone.js";
import { I, Icon } from "../lib/icons.jsx";
import { FEEDBACK_ICON } from "./ui/index.jsx";
import { usePortal } from "../store/PortalContext.jsx";

/**
 * The toast stack. Newest sits at the bottom, nearest the action that produced
 * it, and older ones ride up — so the eye lands on the newest without hunting.
 *
 * Severity drives the live-region politeness: a failure interrupts, a
 * confirmation waits its turn. Announcing every success assertively would talk
 * over a screen-reader user mid-sentence for no reason.
 */
export default function Toast() {
  const { toasts, dismissToast } = usePortal();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-60 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const urgent = toast.tone === "danger";
        return (
          <div
            key={toast.id}
            role={urgent ? "alert" : "status"}
            aria-live={urgent ? "assertive" : "polite"}
            className={cn(
              "pointer-events-auto flex w-full max-w-105 items-start gap-2.5 rounded-xl border border-border bg-panel py-2.75 pr-2.5 pl-3 shadow-pop",
              toast.leaving ? "animate-ktoastout" : "animate-ktoastin",
            )}
          >
            <span
              className={cn(
                "mt-px flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md",
                toneClass(toast.tone),
              )}
            >
              <Icon
                paths={FEEDBACK_ICON[toast.tone] || FEEDBACK_ICON.info}
                size={13}
                strokeWidth={2.3}
              />
            </span>

            <span className="min-w-0 flex-1 py-px text-[13px] leading-snug font-medium text-text">
              {toast.message}
            </span>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="-mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-faint transition-colors hover:bg-hover hover:text-text focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
            >
              <Icon paths={I.x} size={13} strokeWidth={2.2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
