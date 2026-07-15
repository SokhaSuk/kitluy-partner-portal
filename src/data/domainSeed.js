import { ADDONS, PRICE_LOG } from './catalog.js';
import { CUSTOMERS, CUST_NOTES, CUST_PREFS } from './customers.js';
import { ADJUSTMENTS, COUNTS, STOCK_MOVES } from './inventory.js';
import { API_KEYS, MARKETPLACE, WEBHOOKS } from './marketplace.js';
import { THREADS } from './messages.js';
import { ORDERS } from './orders.js';
import { PURCHASE_ORDERS, SUPPLIERS } from './suppliers.js';
import { ATTENDANCE, PERMISSIONS, SHIFTS_TODAY } from './team.js';

export const DOMAIN_SCHEMA_VERSION = 1;

const SERVICES = [
  { id: 'service-wash-fold', name: 'Wash & Fold', icon: 'shirt', price: 4000, priceLabel: '៛4,000', unit: '/ kg', turnaround: '48h', weight: true, tag: 'Weight-priced', items: 124, dailyCapacity: 120, active: true },
  { id: 'service-express-wash', name: 'Express Wash', icon: 'droplet', price: 6000, priceLabel: '៛6,000', unit: '/ kg', turnaround: '24h', weight: true, tag: '+50% express', items: 58, dailyCapacity: 40, active: true },
  { id: 'service-dry-clean', name: 'Dry Clean', icon: 'shirt', price: 14000, priceLabel: '៛14,000', unit: '/ item', turnaround: '72h', weight: false, tag: 'Per item', items: 96, dailyCapacity: 80, active: true },
  { id: 'service-press-only', name: 'Press Only', icon: 'factory', price: 2000, priceLabel: '៛2,000', unit: '/ item', turnaround: '24h', weight: false, tag: 'Per item', items: 41, dailyCapacity: 60, active: true },
];

const PROMOTIONS = [
  { id: 'promo-welcome15', code: 'WELCOME15', type: '15% off', applies: 'First visit', used: 142, limit: 500, revenue: 1850000, status: 'Active' },
  { id: 'promo-rainy8k', code: 'RAINY8K', type: '៛8,000 off', applies: 'Min ៛40,000', used: 88, limit: 200, revenue: 980000, status: 'Active' },
  { id: 'promo-sleungwed', code: 'SLEUNGWED', type: '2× coins', applies: 'Wednesdays', used: 210, limit: 0, revenue: 2640000, status: 'Active' },
  { id: 'promo-newyear25', code: 'NEWYEAR25', type: '25% off', applies: 'All services', used: 512, limit: 512, revenue: 4100000, status: 'Ended' },
];

const MARKETING_FLOWS = [
  { id: 'flow-win-back', type: 'We miss you', desc: 'Win back customers inactive 30+ days', sent: 64, on: true },
  { id: 'flow-review', type: 'Review request', desc: 'Ask for a rating after pickup', sent: 188, on: true },
  { id: 'flow-late-pickup', type: 'Late pickup', desc: 'Remind after 3 days ready (max 3×)', sent: 42, on: true },
  { id: 'flow-first-visit', type: 'First visit', desc: 'Welcome + WELCOME15 code', sent: 142, on: true },
  { id: 'flow-birthday', type: 'Birthday', desc: 'Birthday treat with bonus coins', sent: 21, on: false },
  { id: 'flow-tier-up', type: 'Tier up', desc: 'Celebrate reaching a new tier', sent: 33, on: true },
  { id: 'flow-recurring', type: 'Recurring', desc: 'Nudge weekly-cadence customers', sent: 0, on: false },
];

const OFFERS = [
  { id: 'offer-happy-hour', type: 'Happy hour', desc: '−15% Wash & Fold, 2–6pm', on: true },
  { id: 'offer-bundle', type: 'Bundle', desc: '5 shirts press → ៛8,000', on: true },
  { id: 'offer-seasonal', type: 'Seasonal', desc: 'Rainy-season blanket clean', on: false },
  { id: 'offer-double-coins', type: 'Double coins', desc: '2× points on Wednesdays', on: true },
  { id: 'offer-min-spend', type: 'Min spend', desc: 'Free fold over ៛50,000', on: false },
  { id: 'offer-new-customer', type: 'New customer', desc: '−20% first order', on: true },
];

const AD_CAMPAIGNS = [
  { id: 'campaign-rainy-blanket', name: 'Rainy-season blanket clean', channel: 'Facebook · Telegram', budget: 120000, status: 'Running', tone: 'ok' },
  { id: 'campaign-new-customer', name: 'New customer −20%', channel: 'TikTok', budget: 80000, status: 'Paused', tone: 'neutral' },
];

const INVENTORY_ITEMS = [
  { id: 'item-detergent', name: 'Detergent (liquid)', quantity: 12, unit: 'L', stock: '12 L', usage: '4.1 L/day', days: 3, reorder: '60 L' },
  { id: 'item-softener', name: 'Fabric softener', quantity: 18, unit: 'L', stock: '18 L', usage: '2.0 L/day', days: 9, reorder: '40 L' },
  { id: 'item-hangers', name: 'Hangers', quantity: 240, unit: 'pcs', stock: '240 pcs', usage: '40/day', days: 6, reorder: '1,000 pcs' },
  { id: 'item-garment-bags', name: 'Garment bags', quantity: 310, unit: 'pcs', stock: '310 pcs', usage: '34/day', days: 9, reorder: '500 pcs' },
  { id: 'item-starch-spray', name: 'Starch spray', quantity: 22, unit: 'cans', stock: '22 cans', usage: '1.5/day', days: 14, reorder: '24 cans' },
  { id: 'item-stain-remover', name: 'Stain remover', quantity: 7, unit: 'bottles', stock: '7 bottles', usage: '0.8/day', days: 8, reorder: '24 bottles' },
];

const INVENTORY_SETTINGS = {
  deduct: true,
  negative: false,
  alerts: true,
  countReminder: 'Weekly · Monday 8:00 AM',
  valuationMethod: 'Weighted average',
  defaultUnits: 'Metric — L, kg, pcs',
  reorderBasis: 'Days of cover (usage-based)',
};

const STATIONS = [
  { id: 'station-intake', name: 'Intake', load: 3, cap: 8, note: 'Tagging & check-in' },
  { id: 'station-wash-1', name: 'Wash 1', load: 6, cap: 6, note: 'Heavy / B2B loads' },
  { id: 'station-wash-2', name: 'Wash 2', load: 4, cap: 6, note: 'Standard W&F' },
  { id: 'station-dry-1', name: 'Dry 1', load: 2, cap: 5, note: 'Tumble dry' },
  { id: 'station-dry-2', name: 'Dry 2', load: 1, cap: 5, note: 'Air / delicate' },
  { id: 'station-press', name: 'Press', load: 5, cap: 6, note: 'Press & finishing' },
];

const PRODUCTION_EXCEPTIONS = [
  { id: 'exception-4823', code: 'KIT-4823', item: 'Hotel duvet · stain', reason: 'Stain treatment', status: 'in_progress', station: 'Wash 1' },
  { id: 'exception-4805', code: 'KIT-4805', item: 'White shirt · grey cast', reason: 'Re-clean', status: 'pending', station: 'Wash 2' },
  { id: 'exception-4811', code: 'KIT-4811', item: 'Wrong service applied', reason: 'Wrong service', status: 'resolved', station: 'Press' },
];

const MEMBERS = [
  { id: 'member-owner', name: 'Het Sovannara', role: 'Owner', contact: '+855 12 345 678', pin: 'Full access', active: 'Now' },
  { id: 'member-maly', name: 'Maly Sok', role: 'Manager', contact: '+855 96 771 003', pin: 'PIN · void/refund', active: '5 min ago' },
  { id: 'member-dara', name: 'Dara Chan', role: 'Cashier', contact: 'PIN 4-digit', pin: 'POS only', active: '1 hr ago' },
  { id: 'member-rith', name: 'Rith Pov', role: 'Cashier', contact: 'PIN 4-digit', pin: 'POS only', active: 'Yesterday' },
  { id: 'member-sreyneang', name: 'Sreyneang Kim', role: 'Staff', contact: 'PIN 4-digit', pin: 'Washing station', active: 'Now' },
  { id: 'member-vibol', name: 'Vibol Chea', role: 'Staff', contact: 'PIN 4-digit', pin: 'Press station', active: 'Now' },
];

const STORE_SETTINGS = {
  name: 'Sok Laundry',
  vertical: 'Laundry (locked)',
  phone: '+855 23 880 100',
  currency: 'KHR',
  monthlyPlanFee: 30000,
  commissionPercent: 0,
  address: 'St. 271, Toul Kork, Phnom Penh',
  hours: [
    { day: 'Monday', hours: '07:00 – 20:00' },
    { day: 'Tuesday', hours: '07:00 – 20:00' },
    { day: 'Wednesday', hours: '07:00 – 20:00' },
    { day: 'Thursday', hours: '07:00 – 20:00' },
    { day: 'Friday', hours: '07:00 – 21:00' },
    { day: 'Saturday', hours: '08:00 – 21:00' },
    { day: 'Sunday', hours: '08:00 – 18:00' },
  ],
};

const NOTIFICATIONS = [
  { id: 'notification-order-received', label: 'Order received', desc: 'Telegram confirmation on intake', on: true },
  { id: 'notification-ready', label: 'Ready for pickup', desc: 'Notify when garments are ready', on: true },
  { id: 'notification-late-pickup', label: 'Late pickup reminder', desc: 'After 3 days ready (max 3×)', on: true },
  { id: 'notification-payment', label: 'Payment receipt', desc: 'Send receipt after payment', on: false },
];

const PAYMENT_OPTIONS = [
  { id: 'payment-deposit', label: 'Deposit + balance', desc: 'Take a deposit at drop-off, balance at pickup', on: true },
  { id: 'payment-pickup', label: 'Pay at pickup', desc: 'Drop off now, pay when collecting', on: true },
  { id: 'payment-tab', label: 'Customer tab (B2B)', desc: 'Pay-later balance, settled per period', on: true },
  { id: 'payment-split', label: 'Split payment', desc: 'Combine cash, KHQR and coins on one order', on: true },
  { id: 'payment-minimum', label: 'Minimum order ៛8,000', desc: 'Manager PIN required to override below minimum', on: true },
];

const INITIAL_AUDIT = [
  { id: 'audit-seed-1', type: 'marketing.promotion_created', actor: 'Het Sovannara', target: 'RAINY8K', at: '2026-07-03T09:12:00+07:00' },
  { id: 'audit-seed-2', type: 'order.voided', actor: 'Maly Sok', target: 'KIT-4830', at: '2026-07-03T08:40:00+07:00', details: { reason: 'duplicate' } },
  { id: 'audit-seed-3', type: 'production.capacity_updated', actor: 'System', target: 'Wash 1', at: '2026-07-02T19:02:00+07:00' },
  { id: 'audit-seed-4', type: 'settings.loyalty_mode_changed', actor: 'Het Sovannara', target: 'B', at: '2026-07-01T12:00:00+07:00' },
];

const copy = (value) => JSON.parse(JSON.stringify(value));
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const DOMAIN_COLLECTION_KEYS = [
  'orders', 'customers', 'customerNotes', 'customerPreferences', 'threads',
  'services', 'addons', 'priceHistory', 'promotions', 'marketingFlows', 'offers',
  'adCampaigns', 'inventoryItems', 'purchaseOrders', 'suppliers', 'adjustments',
  'counts', 'stockMoves', 'inventorySettings', 'stations', 'workOrders',
  'productionExceptions', 'members', 'shifts', 'attendance', 'permissions',
  'storeSettings', 'notifications', 'loyaltyMode', 'paymentOptions', 'auditEvents',
  'integrations', 'apiKeys', 'webhooks', 'genericState',
];

/** Creates a detached, complete domain snapshot. Existing data modules remain canonical seeds. */
export function createDomainSeed({ now = () => new Date().toISOString() } = {}) {
  const createdAt = now();
  const orders = copy(ORDERS).map((order) => ({
    ...order,
    garments: order.garments || [
      { tag: `GT-${order.code.slice(-4)}-01`, item: order.detail, care: order.service, slot: 'A-14' },
    ],
    payments: order.payments || [
      {
        id: `payment-${order.id}-summary`,
        type: 'Order total',
        method: order.method,
        amount: order.total,
        when: order.status === 'cancelled'
          ? 'Cancelled'
          : order.method === 'tab'
            ? 'Outstanding'
            : order.status === 'created'
              ? 'Pending'
              : 'Recorded',
      },
    ],
    timeline: order.timeline || [
      { id: `timeline-${order.id}-created`, status: 'created', title: 'Order created', at: createdAt, by: 'Seed data' },
    ],
  }));

  return {
    meta: { schemaVersion: DOMAIN_SCHEMA_VERSION, createdAt, updatedAt: createdAt },
    orders,
    customers: copy(CUSTOMERS),
    customerNotes: copy(CUST_NOTES),
    customerPreferences: copy(CUST_PREFS),
    threads: copy(THREADS),
    services: copy(SERVICES),
    addons: copy(ADDONS).map((addon) => ({ id: `addon-${slug(addon.name)}`, ...addon })),
    priceHistory: copy(PRICE_LOG).map((row, index) => ({ id: `price-${index + 1}`, ...row })),
    promotions: copy(PROMOTIONS),
    marketingFlows: copy(MARKETING_FLOWS),
    offers: copy(OFFERS),
    adCampaigns: copy(AD_CAMPAIGNS),
    inventoryItems: copy(INVENTORY_ITEMS),
    purchaseOrders: copy(PURCHASE_ORDERS).map((po) => {
      const progress = po.status === 'Partial' ? String(po.qty).match(/([\d,]+)\s+of\s+([\d,]+)/i) : null;
      const lines = (po.lines || []).map((line) => ({ ...line }));
      if (progress && lines.length === 1) lines[0].receivedQuantity = Number(progress[1].replace(/,/g, ''));
      return { id: `po-${slug(po.code)}`, ...po, lines };
    }),
    suppliers: copy(SUPPLIERS).map((supplier) => ({ id: `supplier-${slug(supplier.name)}`, ...supplier })),
    adjustments: copy(ADJUSTMENTS).map((row, index) => ({ id: `adjustment-seed-${index + 1}`, ...row })),
    counts: copy(COUNTS).map((row) => ({ id: `count-${slug(row.code)}`, ...row })),
    stockMoves: copy(STOCK_MOVES).map((row, index) => ({ id: `move-seed-${index + 1}`, ...row })),
    inventorySettings: copy(INVENTORY_SETTINGS),
    stations: copy(STATIONS),
    workOrders: orders
      .filter((order) => ['paid', 'processing'].includes(order.status))
      .map(({ id, code, customer, service, station, due, status }) => ({ id: `work-${id}`, orderId: id, code, customer, service, station, due, status })),
    productionExceptions: copy(PRODUCTION_EXCEPTIONS),
    members: copy(MEMBERS),
    shifts: copy(SHIFTS_TODAY).map((row, index) => ({ id: `shift-${index + 1}`, ...row })),
    attendance: copy(ATTENDANCE).map((row, index) => ({ id: `attendance-${index + 1}`, ...row })),
    permissions: copy(PERMISSIONS),
    storeSettings: copy(STORE_SETTINGS),
    notifications: copy(NOTIFICATIONS),
    loyaltyMode: { id: 'B', contributionPercent: 2 },
    paymentOptions: copy(PAYMENT_OPTIONS),
    auditEvents: copy(INITIAL_AUDIT),
    integrations: copy(MARKETPLACE).map((integration) => ({ id: `integration-${slug(integration.name)}`, ...integration })),
    apiKeys: copy(API_KEYS).map((key, index) => ({ id: `api-key-${index + 1}`, ...key })),
    webhooks: copy(WEBHOOKS).map((webhook, index) => ({ id: `webhook-${index + 1}`, ...webhook })),
    genericState: { toggles: {}, actions: [] },
  };
}
