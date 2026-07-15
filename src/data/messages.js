/** Inbox threads. `unread` counts sum to 3, matching the sidebar badge. */

export const CHANNEL_TONE = {
  Telegram: 'info',
  SMS: 'neutral',
  Platform: 'purple',
  Team: 'gold',
};

/** Thread kinds drive the filter chips above the list. */
export const FILTERS = ['All', 'Unread', 'Customers', 'Team', 'Platform'];

export const THREADS = [
  {
    id: 1,
    who: 'Sophea Chan',
    kind: 'Customers',
    channel: 'Telegram',
    tier: 'Gold',
    context: 'Order #1042 · Wash & Fold',
    presence: 'Active 2m ago',
    time: '2m',
    unread: 2,
    messages: [
      { id: 1, from: 'them', day: 'Today', at: '09:12', text: 'Hi! I dropped off 2 bags this morning.' },
      {
        id: 2,
        from: 'me',
        day: 'Today',
        at: '09:14',
        by: 'Maly',
        text: 'Got them — Wash & Fold, gentle wash with lavender, same as always.',
      },
      { id: 3, from: 'them', day: 'Today', at: '11:38', text: 'Perfect, thank you!' },
      { id: 4, from: 'them', day: 'Today', at: '11:40', text: 'Is my order ready for pickup?' },
    ],
  },
  {
    id: 2,
    who: 'Lux Riverside Hotel',
    kind: 'Customers',
    channel: 'Telegram',
    tier: 'B2B',
    context: 'Daily collection · 09:00',
    presence: 'Active 18m ago',
    time: '18m',
    unread: 1,
    messages: [
      {
        id: 1,
        from: 'them',
        day: 'Yesterday',
        at: '16:20',
        text: 'Linen volume will be heavier this week — a conference checks in Thursday.',
      },
      {
        id: 2,
        from: 'me',
        day: 'Yesterday',
        at: '16:32',
        by: 'You',
        text: 'Noted. We will add a second cart to Thursday and Friday collections.',
      },
      {
        id: 3,
        from: 'them',
        day: 'Today',
        at: '10:55',
        text: "Can we move tomorrow's collection to 8am?",
      },
    ],
  },
  {
    id: 3,
    who: 'Maly Sok',
    kind: 'Team',
    channel: 'Team',
    role: 'Manager',
    context: 'Shift · Morning',
    presence: 'On shift',
    time: '3h',
    unread: 0,
    messages: [
      { id: 1, from: 'them', day: 'Today', at: '08:05', text: 'Detergent is almost out — reordered?' },
      {
        id: 2,
        from: 'me',
        day: 'Today',
        at: '08:19',
        by: 'You',
        text: 'Not yet. AI flagged it too — I will raise a 60L purchase order today.',
      },
      { id: 3, from: 'them', day: 'Today', at: '08:21', text: 'Thanks, we have about 3 days left.' },
    ],
  },
  {
    id: 4,
    who: 'Visal Pen',
    kind: 'Customers',
    channel: 'SMS',
    tier: 'Platinum',
    context: 'Order #1038 · Dry cleaning',
    presence: 'Active yesterday',
    time: '1d',
    unread: 0,
    messages: [
      { id: 1, from: 'me', day: 'Yesterday', at: '17:02', by: 'You', text: 'Your suit is ready for collection.' },
      { id: 2, from: 'them', day: 'Yesterday', at: '17:20', text: 'Thanks! See you at 5.' },
    ],
  },
  {
    id: 5,
    who: 'KitLuy Platform',
    kind: 'Platform',
    channel: 'Platform',
    context: 'Billing',
    presence: 'Automated',
    time: '1h',
    unread: 0,
    messages: [
      {
        id: 1,
        from: 'them',
        day: 'Today',
        at: '10:00',
        text: 'Your free trial ends in 6 days. Add billing to keep the Commerce plan active — ៛30/month, 0% commission on KitLuy Pay.',
      },
    ],
  },
];

/** Canned replies offered above the composer. */
export const QUICK_REPLIES = [
  'Your order is ready for pickup!',
  'We’re on it — ready by 5pm today.',
  'Yes, 8am tomorrow works.',
];
