import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createAuthProvider } from '../services/authProvider.js';
import { getSupabaseClient } from '../services/supabaseClient.js';
import { useDomain } from './DomainContext.jsx';

const PortalContext = createContext(null);

const UI_PREFS_KEY = 'kitluy.partner.ui-preferences.v1';
const UI_PREFS_VERSION = 1;

/** Beyond three, the stack covers content and nobody reads the bottom one. */
const TOAST_MAX = 3;
/** Must stay >= the --animate-ktoastout duration, or a toast unmounts mid-exit. */
const TOAST_EXIT_MS = 180;
/** Failures stay put long enough to be read; confirmations get out of the way. */
const TOAST_MS = { danger: 5200, warn: 4600 };
const TOAST_DEFAULT_MS = 2600;

// Clean, history-based URLs (/dashboard, /customers/<uid>) rather than hash routes.
// IDs are kept as OPAQUE STRINGS — never coerced to a number. Real records are
// addressed by their public uid (a UUID from partner_api), which is unguessable;
// only the local demo seed still uses short numeric ids, and those never leave the
// device. Stringwise comparison in the detail screens matches both.
function readRoute() {
  if (typeof window === 'undefined') return {};
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (!parts.length) return {};
  if (parts[0] === 'orders' && parts[1]) {
    return { page: 'orderdetail', nav: 'orders', detailId: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === 'customers' && parts[1]) {
    return { page: 'custdetail', nav: 'customers', custDetailId: decodeURIComponent(parts[1]) };
  }
  return { page: parts[0], nav: parts[0] };
}

function routeFor(state) {
  if (state.page === 'orderdetail') return `/orders/${encodeURIComponent(state.detailId)}`;
  if (state.page === 'custdetail') return `/customers/${encodeURIComponent(state.custDetailId)}`;
  return `/${state.page || 'dashboard'}`;
}

/** UI-only preferences. Server/domain data must never be persisted here. */
function readUiPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(UI_PREFS_KEY));
    return value?.version === UI_PREFS_VERSION ? value : null;
  } catch {
    return null;
  }
}

function writeUiPreferences({ theme, collapsed }) {
  try {
    localStorage.setItem(
      UI_PREFS_KEY,
      JSON.stringify({ version: UI_PREFS_VERSION, theme, collapsed: !!collapsed })
    );
  } catch {
    // Preferences are optional; auth actions surface their own storage errors.
  }
}

/** Initial state, ported 1:1 from the original `Component.state`. */
const INITIAL = {
  page: 'dashboard',
  nav: 'dashboard',
  user: null,
  authView: 'login', // 'login' | 'forgot' | 'signup' — which signed-out screen shows
  theme: 'light',
  collapsed: false,
  mobileNavOpen: false,
  groups: {},
  promoOpen: true,
  bannerOpen: true,
  orderStatus: 'All',
  orderSearch: '',
  detailId: 1,
  custTab: 'All',
  custSearch: '',
  intCat: 'All',
  intQuery: '',
  messageThreadId: null,
  mktTab: 'Promo Codes',
  prodTab: 'Live Map',
  finTab: 'Overview',
  setTab: 'Store',
  supTab: 'Overview',
  storeTab: 'Services & Pricing',
  empTab: 'Employees',
  open: {},
  invSet: {},
  repTab: 'Sales',
  teamTab: 'Members',
  catTab: 'Services',
  custDetailId: 1,
  drawer: null,
  toasts: [],
  // Named `confirmState`, not `confirm`: the provider's value spreads state and
  // then actions, so a state key called `confirm` would be silently overwritten
  // by the `confirm()` action and ConfirmDialog would read a function.
  confirmState: null,
  adjItem: 'Detergent (liquid)',
  adjQty: '1',
  adjDir: 'remove',
  adjReason: 'Waste',
  adjNote: '',
  reorderSel: {},
  countScope: 'Full count',
  poReceived: {},
  poExtra: [],
  adjExtra: [],
  countExtra: [],
  memberExtra: [],
  addonOff: {},
  noteOpen: false,
  noteText: '',
  noteExtra: {},
  nmName: '',
  nmRole: 'Cashier',
  nmPhone: '',
};

export function PortalProvider({ children, defaultDark = false }) {
  const { updateStoreSettings, switchDomainScope } = useDomain();

  // Device-local today; Supabase when the env is set. One switch, both paths below.
  const authRef = useRef(null);
  if (!authRef.current) authRef.current = createAuthProvider({ client: getSupabaseClient() });
  const auth = authRef.current;

  const [state, setState] = useState(() => {
    const preferences = readUiPreferences();
    return {
      ...INITIAL,
      ...readRoute(),
      theme: preferences?.theme || (defaultDark ? 'dark' : 'light'),
      collapsed: preferences?.collapsed ?? false,
      // Local reads synchronously; Supabase hydrates in the boot effect.
      user: auth.currentUser(),
    };
  });
  const toastTimers = useRef(new Map());
  const toastSeq = useRef(0);
  const confirmResolve = useRef(null);

  // Merge-patch, matching React's legacy `this.setState` semantics that the
  // original relied on throughout.
  const set = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  useEffect(() => {
    let active = true;

    // Restore an existing session on boot.
    auth
      .getSession()
      .then((user) => {
        if (!active || !user) return;
        switchDomainScope(user.accountId);
        set({ user });
      })
      .catch(() => {
        // Sign-in/sign-up/reset screens surface actionable storage errors.
      });

    // Stay in step with the backend: a sign-out or token refresh elsewhere lands here.
    const unsubscribe = auth.subscribe?.((user) => {
      if (!active) return;
      switchDomainScope(user?.accountId ?? null);
      set(user ? { user } : (prev) => ({ ...INITIAL, theme: prev.theme, collapsed: prev.collapsed }));
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [auth, set, switchDomainScope]);

  useEffect(() => {
    writeUiPreferences({ theme: state.theme, collapsed: state.collapsed });
  }, [state.theme, state.collapsed]);

  useEffect(() => {
    // popstate fires on back/forward; no hashchange now that routes are real paths.
    const applyRoute = () => set(readRoute());
    window.addEventListener('popstate', applyRoute);
    return () => window.removeEventListener('popstate', applyRoute);
  }, [set]);

  useEffect(() => {
    const route = routeFor(state);
    const current = window.location.pathname + window.location.search;
    if (current !== route) window.history.pushState(null, '', route);
  }, [state.page, state.detailId, state.custDetailId]);

  const clearToastTimers = useCallback((id) => {
    const timers = toastTimers.current.get(id);
    if (!timers) return;
    clearTimeout(timers.hide);
    clearTimeout(timers.remove);
    toastTimers.current.delete(id);
  }, []);

  const removeToast = useCallback(
    (id) => {
      clearToastTimers(id);
      set((prev) => ({ toasts: prev.toasts.filter((toast) => toast.id !== id) }));
    },
    [set, clearToastTimers]
  );

  /**
   * Flags the toast as leaving and unmounts it only once the exit animation has
   * played. Removing it outright would cut the animation off at frame one.
   */
  const dismissToast = useCallback(
    (id) => {
      const timers = toastTimers.current.get(id);
      if (!timers || timers.leaving) return;
      clearTimeout(timers.hide);
      set((prev) => ({
        toasts: prev.toasts.map((toast) =>
          toast.id === id ? { ...toast, leaving: true } : toast
        ),
      }));
      toastTimers.current.set(id, {
        leaving: true,
        remove: setTimeout(() => removeToast(id), TOAST_EXIT_MS),
      });
    },
    [set, removeToast]
  );

  /**
   * `notify(message)` keeps working unchanged — tone defaults to neutral, which
   * is what every pre-existing call site expects. Pass a tone from lib/tone.js
   * ('ok' | 'danger' | 'warn' | 'info' | …) to colour it.
   */
  const notify = useCallback(
    (message, tone = 'neutral', { duration } = {}) => {
      const text = typeof message === 'string' ? message : String(message ?? '');
      if (!text) return null;

      const id = `toast-${(toastSeq.current += 1)}`;
      const life = duration ?? TOAST_MS[tone] ?? TOAST_DEFAULT_MS;

      set((prev) => {
        const next = [...prev.toasts, { id, message: text, tone, leaving: false }];
        // Oldest-first overflow. A trimmed toast's hide timer still fires and
        // resolves to a no-op filter, which is cheaper than tracking it here.
        return { toasts: next.slice(-TOAST_MAX) };
      });

      toastTimers.current.set(id, {
        leaving: false,
        hide: setTimeout(() => dismissToast(id), life),
      });
      return id;
    },
    [set, dismissToast]
  );

  /**
   * Promise-based confirm, replacing `window.confirm`:
   *
   *   if (!(await p.confirm({ title, message }))) return;
   *
   * Pass `onConfirm` (async) to keep the dialog open and busy while the work
   * runs, so a failure can be shown inside the dialog instead of behind it.
   */
  const confirm = useCallback(
    (options) => {
      // Only one dialog at a time; a second ask cancels the first rather than
      // leaving its caller awaiting a promise that can no longer settle.
      confirmResolve.current?.(false);
      return new Promise((resolve) => {
        confirmResolve.current = resolve;
        set({
          confirmState: {
            tone: 'danger',
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
            ...options,
          },
        });
      });
    },
    [set]
  );

  const closeConfirm = useCallback(
    (result) => {
      const resolve = confirmResolve.current;
      confirmResolve.current = null;
      set({ confirmState: null });
      resolve?.(!!result);
    },
    [set]
  );

  // Timers outlive the component if a toast is in flight when it unmounts.
  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach(({ hide, remove }) => {
        clearTimeout(hide);
        clearTimeout(remove);
      });
      timers.clear();
    };
  }, []);

  const actions = useMemo(
    () => ({
      set,
      notify,
      dismissToast,
      confirm,
      closeConfirm,
      /** Curried to match the original's `onclick={{ go(page) }}` call sites. */
      go: (page, nav) => () => set({ page, nav: nav || page, mobileNavOpen: false }),
      openDrawer: (type, id) => () => set({ drawer: { type, id } }),
      closeDrawer: () => set({ drawer: null }),
      toggleTheme: () => set((p) => ({ theme: p.theme === 'light' ? 'dark' : 'light' })),
      toggleCollapsed: () => set((p) => ({ collapsed: !p.collapsed })),
      openMobileNav: () => set({ mobileNavOpen: true }),
      closeMobileNav: () => set({ mobileNavOpen: false }),
      dismissBanner: () => set({ bannerOpen: false }),
      /** Curried, like `go`, so it can be handed straight to onClick. */
      goAuth: (view) => () => set({ authView: view }),
      signIn: async ({ identifier, password }, { remember = true } = {}) => {
        const user = await auth.signIn({ identifier, password, remember });
        switchDomainScope(user.accountId);
        set({ user, page: 'dashboard', nav: 'dashboard', authView: 'login' });
        return user;
      },
      register: async (account, { remember = true } = {}) => {
        const user = await auth.signUp({ ...account, remember });
        switchDomainScope(user.accountId);
        const storePatch = { name: user.store?.name || user.storeName };
        if (user.store?.businessType || user.store?.vertical) {
          storePatch.vertical = user.store.businessType || user.store.vertical;
        }
        if (user.store?.province) storePatch.province = user.store.province;
        if (user.phone) storePatch.phone = user.phone;
        updateStoreSettings(storePatch);
        set({ user, page: 'dashboard', nav: 'dashboard', authView: 'login' });
        return user;
      },
      requestPasswordReset: (identifier) => auth.requestPasswordReset(identifier),
      verifyPasswordReset: (payload) => auth.verifyPasswordReset(payload),
      resetPassword: (payload) => auth.resetPassword(payload),
      /** Drops screen state back to defaults while retaining UI preferences. */
      signOut: async () => {
        await auth.signOut();
        switchDomainScope(null);
        set((prev) => ({ ...INITIAL, theme: prev.theme, collapsed: prev.collapsed }));
      },
    }),
    [auth, set, notify, dismissToast, confirm, closeConfirm, switchDomainScope, updateStoreSettings]
  );

  const value = useMemo(
    () => ({ ...state, ...actions, authed: !!state.user }),
    [state, actions]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside <PortalProvider>');
  return ctx;
}
