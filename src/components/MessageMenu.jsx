import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { I, Icon } from '../lib/icons.jsx';

const MENU_WIDTH = 176;

/**
 * Telegram-style message context menu: a floating panel at the pointer, opened by
 * right-click or the hover ⋮, dismissed by Escape, an outside click, or a scroll.
 *
 * It is positioned in fixed coordinates and flipped when it would run off the
 * viewport — a menu opened on the last message in a thread otherwise renders
 * half-off the bottom of the screen.
 */
export function MessageMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ left: x, top: y, ready: false });

  useLayoutEffect(() => {
    const height = menuRef.current?.offsetHeight ?? 0;
    const flipUp = y + height > window.innerHeight - 8;
    const flipLeft = x + MENU_WIDTH > window.innerWidth - 8;

    setPosition({
      left: Math.max(8, flipLeft ? x - MENU_WIDTH : x),
      top: Math.max(8, flipUp ? y - height : y),
      ready: true,
    });
  }, [x, y]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    // `true` — capture, so a scroll inside the feed closes it too, not just window.
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  return (
    <>
      {/* Backdrop catches the outside click, including a right-click elsewhere. */}
      <div
        className="fixed inset-0 z-90"
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
      <div
        ref={menuRef}
        role="menu"
        style={{
          left: position.left,
          top: position.top,
          width: MENU_WIDTH,
          visibility: position.ready ? 'visible' : 'hidden',
        }}
        className="animate-kfade fixed z-100 overflow-hidden rounded-xl border border-border bg-panel p-1 shadow-pop"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              onClose();
              item.onClick();
            }}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
              item.danger
                ? 'text-danger-fg hover:bg-danger-bg'
                : 'text-text hover:bg-hover'
            }`}
          >
            <Icon paths={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

/** The ⋮ that appears on a bubble on hover — Telegram's affordance for "there is a menu here". */
export function MessageMenuButton({ onOpen }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onOpen({ x: rect.left, y: rect.bottom + 4 });
      }}
      title="Message actions"
      aria-label="Message actions"
      aria-haspopup="menu"
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-faint opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-hover hover:text-text focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-(--ring) focus-visible:outline-none"
    >
      <Icon paths={I.more} size={15} />
    </button>
  );
}
