import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { validateAttachments } from '../lib/attachments.js';
import { createDomainSeed } from '../data/domainSeed.js';
import { createLocalGateway, DomainConflictError } from './domainGateway.js';
import {
  createScopedDomainRepository,
  DOMAIN_GUEST_SCOPE,
  normalizeDomainScope,
  parseDomainImport,
} from './domainRepository.js';
import {
  applyDomainMutation,
  findIndexByRef,
  formatStock,
  makeDomainId,
  ORDER_STATUSES,
  parseQuantity,
  quantityUnit,
  receiptQuantity,
} from './domainMutations.js';

const DomainContext = createContext(null);
const defaultNow = () => new Date().toISOString();

const cleanObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const cleanText = (value, label) => {
  const text = String(value ?? '').trim();
  if (!text) throw new TypeError(`${label} is required`);
  return text;
};
const desiredToggle = (current, next) => (typeof next === 'boolean' ? next : !current);

/** How many times a mutation is replayed onto a newer snapshot before giving up. */
const MAX_CONFLICT_RETRIES = 3;

export function DomainProvider({
  children,
  /** Where the store lives. Defaults to this device; pass a Supabase gateway to sync. */
  gateway: suppliedGateway,
  repository: suppliedRepository,
  initialScope = DOMAIN_GUEST_SCOPE,
  storage,
  repositoryFactory = createScopedDomainRepository,
  now = defaultNow,
  idFactory = makeDomainId,
  /** Surfaced to the UI so a failed sync is visible rather than silent. */
  onSyncError = () => {},
}) {
  const scopeRef = useRef(normalizeDomainScope(initialScope));
  const repositoryRef = useRef(null);
  const gatewayRef = useRef(null);

  if (!gatewayRef.current) {
    if (suppliedGateway) {
      gatewayRef.current = suppliedGateway;
    } else {
      repositoryRef.current =
        suppliedRepository || repositoryFactory({ scope: scopeRef.current, storage, now });
      gatewayRef.current = createLocalGateway({ repository: repositoryRef.current });
    }
  }

  const [domainScope, setDomainScope] = useState(scopeRef.current);

  // A device-local gateway answers instantly, so the first render already has data.
  // A network gateway cannot, so `data` starts null and `ready` gates the UI.
  const [data, setData] = useState(() => gatewayRef.current.loadSync?.().data ?? null);
  const [version, setVersion] = useState(() => gatewayRef.current.loadSync?.().version ?? 0);

  const dataRef = useRef(data);
  const versionRef = useRef(version);
  const pendingWrites = useRef(0);
  const queue = useRef(Promise.resolve());

  const adopt = useCallback((snapshot) => {
    dataRef.current = snapshot.data;
    versionRef.current = snapshot.version;
    setData(snapshot.data);
    setVersion(snapshot.version);
  }, []);

  /* ---------------------------------------------------------------- hydrate */
  useEffect(() => {
    let active = true;
    const gateway = gatewayRef.current;

    if (!dataRef.current) {
      gateway
        .load()
        .then((snapshot) => active && adopt(snapshot))
        .catch(onSyncError);
    }

    // A local gateway has no channel: there are no other devices to hear from.
    const unsubscribe = gateway.subscribe?.((remote) => {
      if (!active) return;
      // Ignore an echo of our own write, and anything older than what we hold.
      if (remote.version <= versionRef.current) return;
      // A write in flight will conflict-replay onto the newer snapshot anyway;
      // adopting it now would flash the other device's state and then ours.
      if (pendingWrites.current > 0) return;
      adopt(remote);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [adopt, onSyncError]);

  const switchDomainScope = useCallback(
    (scope) => {
      const nextScope = normalizeDomainScope(scope);
      if (nextScope === scopeRef.current) return dataRef.current;

      // Scope switching is a device-local idea: it re-points the repository at another
      // account's key. A backend gateway is already scoped to its account, so it is
      // replaced wholesale by the app when the session changes, not re-pointed here.
      if (gatewayRef.current.kind !== 'local') return dataRef.current;

      const nextRepository = repositoryFactory({ scope: nextScope, storage, now });
      repositoryRef.current = nextRepository;
      gatewayRef.current = createLocalGateway({ repository: nextRepository });
      scopeRef.current = nextScope;
      setDomainScope(nextScope);

      const snapshot = gatewayRef.current.loadSync();
      adopt(snapshot);
      return snapshot.data;
    },
    [adopt, now, repositoryFactory, storage]
  );

  /**
   * Persists a snapshot, replaying the mutation if another device got there first.
   *
   * This is why a domain mutation is a function of the whole snapshot rather than a
   * diff: on a conflict we can simply run the same `mutate` again against whatever
   * the winner wrote, and the two changes merge instead of one silently erasing the other.
   *
   * Writes are queued, so two quick taps cannot race each other into a conflict loop.
   */
  const persist = useCallback(
    (snapshot, mutation) => {
      pendingWrites.current += 1;

      queue.current = queue.current
        .then(async () => {
          let candidate = snapshot;
          let base = versionRef.current;

          for (let attempt = 0; attempt <= MAX_CONFLICT_RETRIES; attempt += 1) {
            try {
              const saved = await gatewayRef.current.save(candidate, { expectedVersion: base });
              adopt(saved);
              return;
            } catch (error) {
              const conflict = error instanceof DomainConflictError || error?.code === 'DOMAIN_CONFLICT';
              if (!conflict || !error.latest || !mutation || attempt === MAX_CONFLICT_RETRIES) throw error;

              // Replay this change on top of the snapshot that won the race.
              candidate = applyDomainMutation(error.latest.data, mutation);
              base = error.latest.version;
              adopt({ data: candidate, version: base });
            }
          }
        })
        .catch((error) => {
          onSyncError(error);
        })
        .finally(() => {
          pendingWrites.current -= 1;
        });

      return queue.current;
    },
    [adopt, onSyncError]
  );

  /**
   * Replaces the whole store — Reset and Import.
   *
   * No mutation is passed to persist(), so a conflict is not replayed: these two
   * operations mean "this snapshot wins", and merging someone else's concurrent edit
   * into a restore would defeat the point of restoring.
   *
   * The local gateway keeps its own `replace`, which is what clears the repository's
   * recovery mode when the stored JSON was corrupt.
   */
  const replaceSnapshot = useCallback(
    (snapshot) => {
      dataRef.current = snapshot;
      setData(snapshot);

      queue.current = queue.current
        .then(async () => {
          const gateway = gatewayRef.current;
          const saved = await gateway.replace(snapshot);
          adopt(saved);
        })
        .catch(onSyncError);

      return snapshot;
    },
    [adopt, onSyncError]
  );

  /**
   * Applies a mutation locally and saves it in the background.
   *
   * Deliberately still synchronous: all 35 mutations, and every screen that calls
   * them, keep working unchanged. The UI updates on the spot (optimistic) and the
   * write settles behind it — which is also what makes the app usable offline.
   */
  const commit = useCallback(
    (type, target, mutate, options = {}) => {
      const at = options.at || now();
      const auditId = options.auditId || idFactory('audit');
      const previous = dataRef.current;
      if (!previous) return previous;

      const mutation = {
        type,
        target,
        mutate,
        at,
        auditId,
        actor: options.actor || 'Portal user',
        details: options.details,
      };

      const next = applyDomainMutation(previous, mutation);
      if (next === previous) return previous;

      dataRef.current = next;
      setData(next);
      persist(next, mutation);
      return next;
    },
    [idFactory, now, persist]
  );

  const actions = useMemo(() => ({
    updateOrderStatus: (ref, status, options = {}) => {
      const nextStatus = cleanText(status, 'Order status');
      if (!ORDER_STATUSES.includes(nextStatus)) throw new TypeError(`Unsupported order status: ${nextStatus}`);
      const timelineId = idFactory('timeline');
      const at = now();
      const auditDetails = { status: nextStatus, reason: options.reason };
      return commit('order.status_changed', String(ref), (next) => {
        const index = findIndexByRef(next.orders, ref, ['id', 'code']);
        if (index < 0) return false;
        const order = next.orders[index];
        const previousStatus = order.status;
        const previousStation = order.station;
        const nextStation = options.station || order.station;
        const wasInProduction = ['paid', 'processing'].includes(previousStatus);
        const isInProduction = ['paid', 'processing'].includes(nextStatus);
        const changeStationLoad = (stationName, amount) => {
          const stationIndex = findIndexByRef(next.stations, stationName, ['id', 'name']);
          if (stationIndex >= 0) {
            next.stations[stationIndex].load = Math.max(0, Number(next.stations[stationIndex].load || 0) + amount);
          }
        };
        if (wasInProduction && (!isInProduction || previousStation !== nextStation)) changeStationLoad(previousStation, -1);
        if (isInProduction && (!wasInProduction || previousStation !== nextStation)) changeStationLoad(nextStation, 1);
        next.orders[index] = {
          ...order,
          status: nextStatus,
          ...(options.station ? { station: options.station } : {}),
          ...(options.due ? { due: options.due } : {}),
          payments: (order.payments || []).map((payment) =>
            payment.type === 'Order total'
              ? {
                  ...payment,
                  when: nextStatus === 'cancelled'
                    ? 'Cancelled'
                    : payment.method === 'tab'
                      ? payment.when
                      : nextStatus === 'created'
                        ? 'Pending'
                        : 'Recorded',
                }
              : payment
          ),
          timeline: [
            ...(order.timeline || []),
            {
              id: timelineId,
              status: nextStatus,
              title: options.title || `Status changed to ${nextStatus}`,
              at,
              by: options.actor || options.by || 'Portal user',
              ...(options.note ? { note: options.note } : {}),
            },
          ],
        };
        const workIndex = findIndexByRef(next.workOrders, order.id, ['orderId']);
        if (['paid', 'processing'].includes(nextStatus)) {
          const workOrder = {
            id: workIndex >= 0 ? next.workOrders[workIndex].id : idFactory('work'),
            orderId: order.id,
            code: order.code,
            customer: order.customer,
            service: order.service,
            station: nextStation,
            due: options.due || order.due,
            status: nextStatus,
          };
          if (workIndex >= 0) next.workOrders[workIndex] = workOrder;
          else next.workOrders.push(workOrder);
        } else if (workIndex >= 0) next.workOrders.splice(workIndex, 1);
        auditDetails.previousStatus = previousStatus;
      }, { at, actor: options.actor || options.by, details: auditDetails });
    },

    settleOrderPayment: (ref, paymentRef, options = {}) => {
      const at = options.at || now();
      const timelineId = idFactory('timeline');
      return commit('finance.payment_settled', String(ref), (next) => {
        const orderIndex = findIndexByRef(next.orders, ref, ['id', 'code']);
        if (orderIndex < 0) return false;
        const order = next.orders[orderIndex];
        const paymentIndex = (order.payments || []).findIndex((payment) =>
          paymentRef ? payment.id === paymentRef || payment.type === paymentRef : payment.when === 'Outstanding'
        );
        if (paymentIndex < 0) return false;
        order.payments[paymentIndex] = {
          ...order.payments[paymentIndex],
          when: 'Recorded',
          settledAt: at,
          settledBy: options.actor || options.by || 'Portal user',
        };
        order.timeline = [...(order.timeline || []), {
          id: timelineId,
          title: 'Payment settled',
          at,
          by: options.actor || options.by || 'Portal user',
        }];
      }, { at, actor: options.actor || options.by, details: { paymentRef } });
    },

    addCustomer: (input) => {
      const values = cleanObject(input);
      const customer = {
        id: values.id || idFactory('customer'),
        name: cleanText(values.name, 'Customer name'),
        phone: String(values.phone || ''),
        type: values.type || 'B2C',
        tier: values.tier || 'Silver',
        orders: Number(values.orders || 0),
        spend: Number(values.spend || 0),
        coins: Number(values.coins || 0),
        last: values.last || 'New',
        joined: values.joined || now().slice(0, 10),
        ...values,
      };
      commit('customer.created', customer.id, (next) => { next.customers.push(customer); }, { actor: values.by });
      return customer;
    },

    addCustomerNote: (customerRef, input) => {
      const values = typeof input === 'string' ? { text: input } : cleanObject(input);
      const note = { id: values.id || idFactory('customer-note'), text: cleanText(values.text, 'Note'), by: values.by || 'Portal user', time: values.time || 'Just now', at: values.at || now() };
      commit('customer.note_added', String(customerRef), (next) => {
        const customer = next.customers.find((row) => row.id === customerRef || row.name === customerRef);
        if (!customer) return false;
        const existingNotes = next.customerNotes[customer.id] || next.customerNotes[customer.name] || [];
        next.customerNotes[customer.id] = [...existingNotes, note];
      }, { actor: note.by });
      return note;
    },

    addService: (input) => {
      const values = cleanObject(input);
      const service = { id: values.id || idFactory('service'), name: cleanText(values.name, 'Service name'), price: Number(values.price || 0), unit: values.unit || '/ item', turnaround: values.turnaround || '24h', active: values.active ?? true, items: values.items || 0, ...values };
      commit('catalog.service_created', service.id, (next) => { next.services.push(service); }, { actor: values.by });
      return service;
    },

    addAddon: (input) => {
      const values = cleanObject(input);
      const addon = {
        id: values.id || idFactory('addon'),
        name: cleanText(values.name, 'Add-on name'),
        price: values.price || 'Free',
        applies: values.applies || 'All services',
        rate: values.rate || '0%',
        on: values.on ?? true,
        ...values,
      };
      commit('catalog.addon_created', addon.id, (next) => {
        next.addons.push(addon);
      }, { actor: values.by });
      return addon;
    },

    toggleAddon: (ref, value) => commit('catalog.addon_toggled', String(ref), (next) => {
      const index = findIndexByRef(next.addons, ref);
      if (index < 0) return false;
      next.addons[index].on = desiredToggle(next.addons[index].on, value);
    }, { details: { on: value } }),

    addPromotion: (input) => {
      const values = cleanObject(input);
      const promotion = { id: values.id || idFactory('promotion'), code: cleanText(values.code, 'Promotion code').toUpperCase(), type: values.type || values.discount || '10% off', applies: values.applies || 'All services', used: Number(values.used || 0), limit: Number(values.limit || 0), revenue: Number(values.revenue || 0), status: values.status || 'Active', ...values };
      commit('marketing.promotion_created', promotion.code, (next) => { next.promotions.push(promotion); }, { actor: values.by });
      return promotion;
    },

    addAdCampaign: (input) => {
      const values = cleanObject(input);
      const campaign = {
        id: values.id || idFactory('campaign'),
        name: cleanText(values.name, 'Campaign name'),
        channel: values.channel || 'Facebook · Telegram',
        budget: Number(values.budget || 0),
        status: values.status || 'Draft',
        tone: values.tone || (values.status === 'Running' ? 'ok' : 'neutral'),
        ...values,
      };
      commit('advertising.campaign_created', campaign.id, (next) => {
        next.adCampaigns.push(campaign);
      }, { actor: values.by });
      return campaign;
    },

    toggleMarketingFlow: (ref, value) => commit('marketing.flow_toggled', String(ref), (next) => {
      const index = findIndexByRef(next.marketingFlows, ref);
      if (index < 0) return false;
      next.marketingFlows[index].on = desiredToggle(next.marketingFlows[index].on, value);
    }, { details: { on: value } }),

    toggleOffer: (ref, value) => commit('marketing.offer_toggled', String(ref), (next) => {
      const index = findIndexByRef(next.offers, ref);
      if (index < 0) return false;
      next.offers[index].on = desiredToggle(next.offers[index].on, value);
    }, { details: { on: value } }),

    receivePurchaseOrder: (ref, receipt = {}) => {
      const values = Array.isArray(receipt) ? { lines: receipt } : cleanObject(receipt);
      const at = values.at || now();
      const moveBase = idFactory('move');
      return commit('inventory.purchase_order_received', String(ref), (next) => {
        const index = findIndexByRef(next.purchaseOrders, ref, ['id', 'code']);
        if (index < 0) return false;
        const purchaseOrder = next.purchaseOrders[index];
        // Receiving the same PO twice must never duplicate stock.
        if (purchaseOrder.status === 'Received' && !values.allowDuplicate) return false;
        const lines = values.lines?.length ? values.lines : purchaseOrder.lines || [];
        const updatedLines = (purchaseOrder.lines || []).map((line) => ({ ...line }));
        lines.forEach((line, lineIndex) => {
          const name = line.name || line.item;
          const canonicalLineIndex = findIndexByRef(updatedLines, name, ['name', 'item']);
          const canonicalLine = updatedLines[canonicalLineIndex] || line;
          const { rawQuantity, quantity, previouslyReceived } = receiptQuantity(purchaseOrder.status, line, canonicalLine);
          if (quantity === null || quantity <= 0) throw new TypeError(`Enter a received quantity for ${name}`);
          const itemIndex = findIndexByRef(next.inventoryItems, name, ['id', 'name']);
          const unit = line.unit || quantityUnit(rawQuantity, next.inventoryItems[itemIndex]?.unit || 'units');
          if (itemIndex >= 0) {
            next.inventoryItems[itemIndex].quantity = Number(next.inventoryItems[itemIndex].quantity || 0) + Math.abs(quantity);
            next.inventoryItems[itemIndex].stock = formatStock(next.inventoryItems[itemIndex].quantity, next.inventoryItems[itemIndex].unit || unit);
          }
          if (canonicalLineIndex >= 0) updatedLines[canonicalLineIndex].receivedQuantity = previouslyReceived + Math.abs(quantity);
          next.stockMoves.push({ id: `${moveBase}-${lineIndex + 1}`, kind: 'receipt', title: `${name} · received ${purchaseOrder.code}`, meta: `${purchaseOrder.supplier} · ${values.by || 'Portal user'}`, qty: quantity === null ? String(rawQuantity || '') : `+${Math.abs(quantity)} ${unit}`, time: values.time || 'Just now', at });
        });
        if (!lines.length) next.stockMoves.push({ id: `${moveBase}-1`, kind: 'receipt', title: `Received ${purchaseOrder.code}`, meta: purchaseOrder.supplier, qty: values.qty || purchaseOrder.qty, time: 'Just now', at });
        next.purchaseOrders[index] = { ...purchaseOrder, lines: updatedLines, status: values.partial ? 'Partial' : 'Received', receivedAt: at };
      }, { at, actor: values.by });
    },

    addPurchaseOrder: (input) => {
      const values = cleanObject(input);
      const purchaseOrder = {
        id: values.id || idFactory('po'),
        code: values.code || `PO-${Date.now().toString().slice(-4)}`,
        supplier: cleanText(values.supplier, 'Supplier'),
        items: values.items || (values.lines || []).map((line) => `${line.name || line.item} ${line.qty || line.quantity || ''}`.trim()).join(' · '),
        qty: values.qty || `${(values.lines || []).length} line item${(values.lines || []).length === 1 ? '' : 's'}`,
        total: Number(values.total || 0),
        expected: values.expected || 'Not scheduled',
        status: values.status || 'Draft',
        lines: values.lines || [],
        ...values,
      };
      commit('inventory.purchase_order_created', purchaseOrder.code, (next) => {
        next.purchaseOrders.push(purchaseOrder);
      }, { actor: values.by });
      return purchaseOrder;
    },

    updateInventorySettings: (patch) => {
      const values = cleanObject(patch);
      return commit('inventory.settings_updated', 'inventory', (next) => {
        next.inventorySettings = { ...next.inventorySettings, ...values };
      }, { actor: values.by, details: values });
    },

    recordAdjustment: (input) => {
      const values = cleanObject(input);
      const raw = values.quantity ?? values.qty ?? values.change;
      const parsed = parseQuantity(raw);
      if (parsed === null || Math.abs(parsed) === 0) {
        throw new TypeError('Adjustment quantity must be a non-zero number');
      }
      const remove = values.neg === true || ['remove', 'out', 'subtract'].includes(values.direction || values.dir) || String(raw).trim().startsWith('-') || String(raw).trim().startsWith('−');
      const signed = parsed === null ? null : (remove ? -Math.abs(parsed) : Math.abs(parsed));
      const currentData = dataRef.current;
      const currentItemIndex = findIndexByRef(currentData.inventoryItems, values.itemId || values.item || values.itemName, ['id', 'name']);
      if (currentItemIndex < 0) throw new TypeError('Inventory item was not found');
      const currentItem = currentData.inventoryItems[currentItemIndex];
      if (Number(currentItem.quantity || 0) + signed < 0 && !currentData.inventorySettings.negative) {
        throw new RangeError('Adjustment would make stock negative');
      }
      const at = values.at || now();
      const adjustment = { id: values.id || idFactory('adjustment'), item: cleanText(values.item || values.itemName, 'Inventory item'), change: values.change || (signed === null ? String(raw || '') : `${signed >= 0 ? '+' : '−'}${Math.abs(signed)} ${values.unit || ''}`.trim()), neg: signed === null ? remove : signed < 0, reason: values.reason || 'Recount', note: values.note || '', by: values.by || 'Portal user', time: values.time || 'Just now', at };
      const moveId = idFactory('move');
      commit('inventory.stock_adjusted', adjustment.item, (next) => {
        const itemIndex = findIndexByRef(next.inventoryItems, values.itemId || adjustment.item, ['id', 'name']);
        if (signed !== null && itemIndex >= 0) {
          const item = next.inventoryItems[itemIndex];
          const quantity = Number(item.quantity || 0) + signed;
          if (quantity < 0 && !next.inventorySettings.negative) return false;
          item.quantity = quantity;
          item.stock = formatStock(item.quantity, item.unit);
        }
        next.adjustments.push(adjustment);
        next.stockMoves.push({ id: moveId, kind: 'adjust', title: `${adjustment.item} · ${adjustment.reason.toLowerCase()} adjustment`, meta: `${adjustment.note || 'Manual adjustment'} · ${adjustment.by}`, qty: adjustment.change, time: adjustment.time, at });
      }, { at, actor: adjustment.by, details: { change: adjustment.change } });
      return adjustment;
    },

    startCount: (input = {}) => {
      const values = typeof input === 'string' ? { scope: input } : cleanObject(input);
      const nextNumber = Date.now().toString().slice(-4);
      const count = { id: values.id || idFactory('count'), code: values.code || `C-${nextNumber}`, scope: values.scope || 'Full count · all storage', date: values.date || 'Today', items: values.items || `${values.itemCount || 0} items`, variance: values.variance || '—', status: values.status || 'Scheduled', ...values };
      commit('inventory.count_started', count.code, (next) => { next.counts.push(count); }, { actor: values.by });
      return count;
    },

    completeCount: (ref, entries) => {
      const currentData = dataRef.current;
      const countIndex = findIndexByRef(currentData.counts, ref, ['id', 'code']);
      if (countIndex < 0) throw new TypeError('Inventory count was not found');
      if (currentData.counts[countIndex].status === 'Completed') return currentData.counts[countIndex];
      const rows = Array.isArray(entries)
        ? entries
        : Object.entries(cleanObject(entries)).map(([itemId, counted]) => ({ itemId, counted }));
      if (!rows.length) throw new TypeError('Enter at least one counted quantity');
      const normalized = rows.map((row) => {
        const itemIndex = findIndexByRef(currentData.inventoryItems, row.itemId || row.item || row.name, ['id', 'name']);
        if (itemIndex < 0) throw new TypeError(`Inventory item was not found: ${row.itemId || row.item || row.name}`);
        const counted = Number(row.counted ?? row.quantity);
        if (!Number.isFinite(counted) || counted < 0) throw new TypeError('Counted quantities must be zero or greater');
        const item = currentData.inventoryItems[itemIndex];
        return { itemId: item.id, name: item.name, unit: item.unit, book: Number(item.quantity || 0), counted, moveId: idFactory('move') };
      });
      const at = now();
      const countCode = currentData.counts[countIndex].code;
      commit('inventory.count_completed', countCode, (next) => {
        const nextCountIndex = findIndexByRef(next.counts, ref, ['id', 'code']);
        normalized.forEach((row) => {
          const itemIndex = findIndexByRef(next.inventoryItems, row.itemId, ['id', 'name']);
          const variance = row.counted - row.book;
          next.inventoryItems[itemIndex].quantity = row.counted;
          next.inventoryItems[itemIndex].stock = formatStock(row.counted, row.unit);
          if (variance !== 0) {
            next.stockMoves.push({
              id: row.moveId,
              kind: 'count',
              title: `${row.name} · count variance posted`,
              meta: countCode,
              qty: `${variance > 0 ? '+' : ''}${variance} ${row.unit}`,
              time: 'Just now',
              at,
            });
          }
        });
        const varianceLines = normalized.filter((row) => row.counted !== row.book).length;
        next.counts[nextCountIndex] = {
          ...next.counts[nextCountIndex],
          status: 'Completed',
          completedAt: at,
          lines: normalized.map(({ moveId, ...row }) => ({ ...row, variance: row.counted - row.book })),
          variance: varianceLines ? `${varianceLines} item${varianceLines === 1 ? '' : 's'} adjusted` : '0',
        };
      }, { at, details: { items: normalized.length } });
      return { ...currentData.counts[countIndex], status: 'Completed', lines: normalized };
    },

    addMember: (input) => {
      const values = cleanObject(input);
      const member = { id: values.id || idFactory('member'), name: cleanText(values.name, 'Member name'), role: values.role || 'Staff', contact: values.contact || values.phone || 'PIN 4-digit', pin: values.pin || 'POS only', active: values.active || 'Invited', ...values };
      commit('team.member_added', member.id, (next) => { next.members.push(member); }, { actor: values.by });
      return member;
    },

    updateStoreSettings: (patch) => {
      const values = cleanObject(patch);
      return commit('settings.store_updated', 'store', (next) => {
        next.storeSettings = { ...next.storeSettings, ...values };
      }, { actor: values.by, details: values });
    },

    setNotification: (ref, value) => commit('settings.notification_changed', String(ref), (next) => {
      const index = findIndexByRef(next.notifications, ref, ['id', 'label']);
      if (index < 0) return false;
      next.notifications[index].on = desiredToggle(next.notifications[index].on, value);
    }, { details: { on: value } }),

    setLoyaltyMode: (mode) => {
      const values = typeof mode === 'string' ? { id: mode } : cleanObject(mode);
      const loyaltyMode = { contributionPercent: values.id === 'B' ? 2 : 0, ...values };
      return commit('settings.loyalty_mode_changed', loyaltyMode.id, (next) => { next.loyaltyMode = loyaltyMode; }, { details: loyaltyMode });
    },

    setPaymentOption: (ref, value) => commit('settings.payment_option_changed', String(ref), (next) => {
      const index = findIndexByRef(next.paymentOptions, ref, ['id', 'label']);
      if (index < 0) return false;
      next.paymentOptions[index].on = desiredToggle(next.paymentOptions[index].on, value);
    }, { details: { on: value } }),

    resolveException: (ref, input = {}) => {
      const values = cleanObject(input);
      const at = values.at || now();
      return commit('production.exception_resolved', String(ref), (next) => {
        const index = findIndexByRef(next.productionExceptions, ref, ['id', 'code']);
        if (index < 0) return false;
        next.productionExceptions[index] = { ...next.productionExceptions[index], ...values, status: 'resolved', resolvedAt: at, resolvedBy: values.by || 'Portal user' };
      }, { at, actor: values.by });
    },

    createThread: (input) => {
      const values = cleanObject(input);
      const who = cleanText(values.who, 'Conversation name');
      const existing = dataRef.current.threads.find((thread) => thread.who === who);
      if (existing) return existing;
      const thread = {
        id: values.id || idFactory('thread'),
        who,
        kind: values.kind || 'Customers',
        channel: values.channel || 'Local',
        context: values.context || 'Local conversation',
        presence: values.presence || 'Local-only',
        time: 'now',
        unread: 0,
        messages: [],
        ...values,
      };
      commit('message.thread_created', thread.id, (next) => {
        next.threads.push(thread);
      });
      return thread;
    },

    readThread: (id) => commit('message.thread_read', String(id), (next) => {
      const index = findIndexByRef(next.threads, id, ['id']);
      if (index < 0) return false;
      if (!next.threads[index].unread) return false;
      next.threads[index].unread = 0;
    }),

    sendMessage: (id, input) => {
      const values = typeof input === 'string' ? { text: input } : cleanObject(input);
      const at = values.at || now();
      const attachments = validateAttachments(values.attachments);
      const text = String(values.text ?? '').trim();
      // A photo or a voice note is a message on its own — only a message with
      // neither words nor attachments is empty.
      if (!text && !attachments.length) throw new TypeError('Message is required');
      const message = {
        id: values.id || idFactory('message'),
        from: 'me',
        day: values.day || 'Today',
        at: values.time || new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        by: values.by || 'You',
        text,
        ...(attachments.length ? { attachments } : {}),
        deliveryStatus: 'local-only',
      };
      commit('message.sent', String(id), (next) => {
        const index = findIndexByRef(next.threads, id, ['id']);
        if (index < 0) return false;
        next.threads[index].messages.push(message);
        next.threads[index].time = 'now';
      }, { at, actor: message.by, details: attachments.length ? { attachments: attachments.length } : undefined });
      return message;
    },

    /**
     * Rewrites the text of a message you sent. Only your own: editing what a
     * customer said would be falsifying the record, not fixing a typo.
     * The original text is kept on the message so the change is auditable.
     */
    editMessage: (threadId, messageId, input) => {
      const values = typeof input === 'string' ? { text: input } : cleanObject(input);
      const at = values.at || now();
      const text = String(values.text ?? '').trim();

      const thread = dataRef.current.threads.find((row) => String(row.id) === String(threadId));
      const message = thread?.messages.find((row) => String(row.id) === String(messageId));
      if (!message) throw new TypeError('That message was not found');
      if (message.from !== 'me') throw new TypeError('Only your own messages can be edited');
      if (message.deleted) throw new TypeError('A deleted message cannot be edited');
      // Clearing the words of a message that has none left is a delete, not an edit.
      if (!text && !message.attachments?.length) throw new TypeError('Message is required');

      return commit('message.edited', String(messageId), (next) => {
        const nextThread = next.threads.find((row) => String(row.id) === String(threadId));
        const index = nextThread?.messages.findIndex((row) => String(row.id) === String(messageId));
        if (index === undefined || index < 0) return false;
        const target = nextThread.messages[index];
        if (target.text === text) return false; // Nothing changed; do not log an edit.
        nextThread.messages[index] = {
          ...target,
          text,
          originalText: target.originalText ?? target.text,
          editedAt: at,
          editedBy: values.by || 'You',
        };
      }, { at, actor: values.by, details: { threadId } });
    },

    /**
     * Soft-deletes a message you sent: the row stays as a tombstone so the
     * conversation still reads in order and the audit trail is intact.
     *
     * Returns the attachments it dropped — their bytes live outside the domain, so
     * the caller has to delete them from the blob store.
     */
    deleteMessage: (threadId, messageId, options = {}) => {
      const at = options.at || now();

      const thread = dataRef.current.threads.find((row) => String(row.id) === String(threadId));
      const message = thread?.messages.find((row) => String(row.id) === String(messageId));
      if (!message) throw new TypeError('That message was not found');
      if (message.from !== 'me') throw new TypeError('Only your own messages can be deleted');
      if (message.deleted) return [];

      const orphaned = message.attachments || [];

      commit('message.deleted', String(messageId), (next) => {
        const nextThread = next.threads.find((row) => String(row.id) === String(threadId));
        const index = nextThread?.messages.findIndex((row) => String(row.id) === String(messageId));
        if (index === undefined || index < 0) return false;
        const target = nextThread.messages[index];
        nextThread.messages[index] = {
          id: target.id,
          from: target.from,
          day: target.day,
          at: target.at,
          by: target.by,
          text: '',
          deleted: true,
          deletedAt: at,
          deletedBy: options.by || 'You',
        };
      }, { at, actor: options.by, details: { threadId, attachments: orphaned.length } });

      return orphaned;
    },

    toggleIntegration: (ref, value) => commit('integration.toggled', String(ref), (next) => {
      const index = findIndexByRef(next.integrations, ref, ['id', 'name']);
      if (index < 0) return false;
      const connected = typeof value === 'string' ? value === 'connected' : desiredToggle(next.integrations[index].status === 'connected', value);
      next.integrations[index].status = connected ? 'connected' : 'available';
      if (connected) next.integrations[index].sync = 'just now';
    }, { details: { connected: value } }),

    addApiKey: (input = {}) => {
      const values = typeof input === 'string' ? { label: input } : cleanObject(input);
      const suffix = idFactory('key').replace(/[^a-z0-9]/gi, '').slice(-4);
      const apiKey = { id: values.id || idFactory('api-key'), label: values.label || 'New API key', key: values.key || `kl_live_••••••••••${suffix}`, created: values.created || now().slice(0, 10), scope: values.scope || 'read / write', last: values.last || 'never', ...values };
      commit('integration.api_key_added', apiKey.id, (next) => { next.apiKeys.push(apiKey); }, { actor: values.by });
      return apiKey;
    },

    addWebhook: (input) => {
      const values = cleanObject(input);
      const webhook = { id: values.id || idFactory('webhook'), url: cleanText(values.url, 'Webhook URL'), events: values.events || 'order.ready', status: values.status || 'Active', tone: values.tone || (values.status === 'Paused' ? 'neutral' : 'ok'), ...values };
      commit('integration.webhook_added', webhook.id, (next) => { next.webhooks.push(webhook); }, { actor: values.by });
      return webhook;
    },

    setGenericToggle: (key, value) => {
      const toggleKey = cleanText(key, 'Generic toggle key');
      return commit('generic.toggle_changed', toggleKey, (next) => {
        next.genericState.toggles[toggleKey] = desiredToggle(Boolean(next.genericState.toggles[toggleKey]), value);
      }, { details: { on: value } });
    },

    recordGenericAction: (key, label) => {
      const action = { id: idFactory('generic-action'), key: cleanText(key, 'Generic action key'), label: String(label || key), at: now() };
      commit('generic.action_recorded', action.key, (next) => { next.genericState.actions.push(action); }, { at: action.at, details: { label: action.label } });
      return action;
    },

    resetData: () => {
      const at = now();
      const seed = createDomainSeed({ now: () => at });
      // Business records reset to the canonical seed, but the account's store
      // identity must not silently revert to the demo tenant.
      const currentStore = dataRef.current.storeSettings || {};
      seed.storeSettings = {
        ...seed.storeSettings,
        ...Object.fromEntries(
          ['name', 'vertical', 'province', 'phone']
            .filter((key) => currentStore[key] !== undefined)
            .map((key) => [key, currentStore[key]])
        ),
      };
      const next = applyDomainMutation(seed, { type: 'data.reset', target: 'domain', at, auditId: idFactory('audit'), mutate: () => {} });
      // A wholesale replacement, so there is nothing to replay onto a conflict: the
      // point of Reset is that this snapshot wins.
      return replaceSnapshot(next);
    },

    replaceData: (input) => {
      const imported = parseDomainImport(input);
      const at = now();
      const next = applyDomainMutation(imported, { type: 'data.imported', target: 'domain', at, auditId: idFactory('audit'), mutate: () => {} });
      return replaceSnapshot(next);
    },

    exportData: ({ pretty = true } = {}) => {
      // Built from what is on screen, not re-read from storage: with a backend the
      // repository is not the source of truth any more.
      const snapshot = dataRef.current;
      const envelope = {
        schemaVersion: snapshot.meta?.schemaVersion,
        savedAt: snapshot.meta?.updatedAt || now(),
        data: snapshot,
      };
      return JSON.stringify(envelope, null, pretty ? 2 : 0);
    },

    parseImport: parseDomainImport,
    switchDomainScope,
  }), [commit, idFactory, now, replaceSnapshot, switchDomainScope]);

  const value = useMemo(
    () => ({
      data,
      ...data,
      domainScope,
      /** False until the first snapshot arrives. Always true on a device-local store. */
      ready: Boolean(data),
      /** The row version this client holds — what a save is checked against. */
      version,
      /** 'local' or 'supabase': lets a screen say whether it is syncing. */
      syncKind: gatewayRef.current.kind,
      actions,
      ...actions,
    }),
    [actions, data, domainScope, version]
  );

  // A network gateway has nothing to render until its first load resolves. The local
  // gateway seeds synchronously, so this never trips today.
  if (!data) return null;

  return <DomainContext.Provider value={value}>{children}</DomainContext.Provider>;
}

export function useDomain() {
  const context = useContext(DomainContext);
  if (!context) throw new Error('useDomain must be used inside <DomainProvider>');
  return context;
}
