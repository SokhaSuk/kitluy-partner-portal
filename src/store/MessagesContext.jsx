import { createContext, useContext } from 'react';

import { usePartnerConversations } from './usePartnerConversations.js';
import { usePortal } from './PortalContext.jsx';

/**
 * Messages, shared across the portal.
 *
 * The inbox screen, plus the "message this customer" buttons on Customer and
 * Order detail, all read and write the same live store through this one provider
 * — so a thread opened from an order is the same thread the inbox shows, and a
 * single realtime subscription serves the whole app.
 *
 * With no backend configured the underlying hook falls back to the device-local
 * domain, so every screen behaves exactly as before offline.
 */
const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
  const p = usePortal();

  const value = usePartnerConversations({
    notify: p.notify,
    meName: p.user?.name || 'You',
    sessionKey: p.user?.accountId || null,
  });

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) throw new Error('useMessages must be used inside <MessagesProvider>');
  return context;
}
