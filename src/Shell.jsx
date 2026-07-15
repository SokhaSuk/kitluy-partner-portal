import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Drawer from './components/Drawer.jsx';
import { EmptyState } from './components/ui/index.jsx';
import { usePortal } from './store/PortalContext.jsx';
import { GENERIC } from './data/generic.js';
import { TAB_KEY } from './data/nav.js';

import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Catalog from './pages/Catalog.jsx';
import Marketing from './pages/Marketing.jsx';
import PromoCreate from './pages/PromoCreate.jsx';
import Production from './pages/Production.jsx';
import Finance from './pages/Finance.jsx';
import Loyalty from './pages/Loyalty.jsx';
import AIInsights from './pages/AIInsights.jsx';
import Supplies from './pages/Supplies.jsx';
import Team from './pages/Team.jsx';
import Settings from './pages/Settings.jsx';
import Messages from './pages/Messages.jsx';
import Fulfillment from './pages/Fulfillment.jsx';
import Capacity from './pages/Capacity.jsx';
import Advertising from './pages/Advertising.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import Complaints from './pages/Complaints.jsx';
import KnowledgeBase from './pages/KnowledgeBase.jsx';
import IntegrationHub from './pages/IntegrationHub.jsx';
import Reports from './pages/Reports.jsx';
import GenericPage from './pages/GenericPage.jsx';

/** Sub-tabs each module handles with a bespoke page rather than the generic renderer. */
const BESPOKE_TABS = {
  supplies: [
    'Overview',
    'Items',
    'Purchase Orders',
    'Suppliers',
    'Adjustments',
    'Counts',
    'History',
    'Waste',
    'InvSettings',
  ],
  finance: ['Overview', 'Reconciliation', 'Shift Finance', 'Settings'],
  reports: ['Sales', 'Services', 'Payments', 'Staff', 'Issues & Rewash'],
};

const TEAM_TAB_MAP = {
  Overview: 'Members',
  Employees: 'Members',
  'Roles & Access': 'Permissions',
  'POS PIN Access': 'Members',
  'Time Clock': 'Attendance',
  'Time Cards': 'Attendance',
  Shifts: 'Shifts',
  Attendance: 'Attendance',
  Scheduling: 'Shifts',
};

const SUPPLY_TAB_MAP = {
  'Stock Receipts': 'History',
  'AI Reorder Suggestions': 'Overview',
};

const FINANCE_TAB_MAP = {
  'Sales Ledger': 'Overview',
  'Payment Ledger': 'Reconciliation',
  'Cash Drawer': 'Shift Finance',
  'Deposits & Balances': 'Overview',
  'Customer Tabs': 'Overview',
};

/**
 * Resolves the current page. Bespoke pages win; anything left that matches a
 * GENERIC spec key falls through to the data-driven renderer.
 */
function Router() {
  const p = usePortal();
  const { page } = p;

  switch (page) {
    case 'dashboard':
      return <Dashboard />;
    case 'orders':
      return <Orders />;
    case 'orderdetail':
      return <OrderDetail />;
    case 'customers':
      return <Customers />;
    case 'b2b':
      return <Customers forcedTab="B2B" heading="B2B Accounts" />;
    case 'custdetail':
      return <CustomerDetail />;
    case 'marketing':
      return <Marketing />;
    case 'promocreate':
      return <PromoCreate />;
    case 'production':
      return <Production />;
    case 'loyalty':
      return <Loyalty />;
    case 'ai':
      return <AIInsights />;
    case 'messages':
      return <Messages />;
    case 'fulfillment':
      return <Fulfillment />;
    case 'capacity':
      return <Capacity />;
    case 'advertising':
      return <Advertising />;
    case 'subscriptions':
      return <Subscriptions />;
    case 'complaints':
      return <Complaints />;
    case 'knowledge':
      return <KnowledgeBase />;
    case 'integration':
      return <IntegrationHub />;
    case 'settings':
      return <Settings />;
    case 'audit':
      return <Settings forcedTab="Audit" heading="Audit Log" />;
    default:
      break;
  }

  if (page === 'store' && p.storeTab === 'Services & Pricing') return <Catalog />;
  if (page === 'store' && p.storeTab === 'Add-ons & Special Handling') return <Catalog forcedTab="Add-ons" />;
  if (page === 'store' && p.storeTab === 'Store Profile') return <Settings forcedTab="Store" heading="Store Profile" />;
  if (page === 'store' && p.storeTab === 'Business Hours') return <Settings forcedTab="Hours" heading="Business Hours" />;
  if (page === 'store' && p.storeTab === 'Notifications') return <Settings forcedTab="Notifications" heading="Notifications" />;
  if (page === 'store' && p.storeTab === 'Data Import / Export') return <Settings forcedTab="Data" heading="Data Import / Export" />;
  if (page === 'store' && p.storeTab === 'Payment Methods') return <Finance forcedTab="Settings" />;
  if (page === 'supplies' && BESPOKE_TABS.supplies.includes(p.supTab)) return <Supplies />;
  if (page === 'supplies' && SUPPLY_TAB_MAP[p.supTab]) return <Supplies forcedTab={SUPPLY_TAB_MAP[p.supTab]} />;
  if (page === 'finance' && p.finTab === 'AI Finance Assistant') return <AIInsights />;
  if (page === 'finance' && FINANCE_TAB_MAP[p.finTab]) return <Finance forcedTab={FINANCE_TAB_MAP[p.finTab]} />;
  if (page === 'finance' && BESPOKE_TABS.finance.includes(p.finTab)) return <Finance />;
  if (page === 'reports' && p.repTab === 'AI Summary') return <AIInsights />;
  if (page === 'reports' && BESPOKE_TABS.reports.includes(p.repTab)) return <Reports />;
  if (page === 'team' && TEAM_TAB_MAP[p.empTab]) return <Team forcedTab={TEAM_TAB_MAP[p.empTab]} />;

  const tabKey = TAB_KEY[page];
  const spec = GENERIC[tabKey ? `${page}:${p[tabKey]}` : page];
  if (spec) return <GenericPage spec={spec} />;

  // Only an unknown route should reach this fallback; configured generic pages resolve above.
  return (
    <EmptyState
      title="Page not found"
      message="This route is not configured in the Partner Portal. Choose a module from the sidebar."
    />
  );
}

/**
 * Sidebar + topbar + page area. Only reachable with a session, and pulled in as
 * its own chunk by App.jsx so signed-out visitors never download the portal.
 */
export default function Shell() {
  return (
    <>
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-100 -translate-y-16 rounded-lg bg-primary px-3 py-2 text-primary-text shadow-pop transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main-content" tabIndex="-1" className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Router />
          </div>
        </main>
      </div>

      <Drawer />
    </>
  );
}
