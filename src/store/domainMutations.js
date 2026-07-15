import { cloneDomain } from './domainRepository.js';

export const DEFAULT_ACTOR = 'Portal user';
export const ORDER_STATUSES = ['created', 'paid', 'processing', 'ready', 'collected', 'completed', 'cancelled'];

export function makeDomainId(prefix = 'record') {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sameRef(record, ref, fields = ['id', 'code', 'name', 'label', 'type', 'url']) {
  if (ref && typeof ref === 'object') ref = ref.id ?? ref.code ?? ref.name ?? ref.label ?? ref.type ?? ref.url;
  return fields.some((field) => record?.[field] === ref);
}

export function findIndexByRef(collection, ref, fields) {
  return collection.findIndex((record) => sameRef(record, ref, fields));
}

export function parseQuantity(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value ?? '').replace(/[−–—]/g, '-').replace(/,/g, '');
  const match = normalized.match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

/** Resolves the amount that a PO receipt should add, accounting for partial receipts. */
export function receiptQuantity(status, line, canonicalLine = line) {
  const orderedQuantity = parseQuantity(canonicalLine?.quantity ?? canonicalLine?.qty);
  const previouslyReceived = parseQuantity(canonicalLine?.receivedQuantity) || 0;
  const remainingQuantity = orderedQuantity === null ? null : Math.max(0, orderedQuantity - previouslyReceived);
  const rawQuantity = line?.receivedQty ?? line?.remainingQty ??
    (status === 'Partial' && remainingQuantity !== null
      ? remainingQuantity
      : line?.quantity ?? line?.qty);
  return {
    orderedQuantity,
    previouslyReceived,
    rawQuantity,
    quantity: parseQuantity(rawQuantity),
  };
}

export function quantityUnit(value, fallback = 'units') {
  const normalized = String(value ?? '').trim().replace(/,/g, '');
  const match = normalized.match(/[+-]?\d+(?:\.\d+)?\s*(.*)$/);
  return match?.[1]?.trim() || fallback;
}

export function formatStock(quantity, unit = 'units') {
  const value = Number.isInteger(quantity) ? String(quantity) : String(Math.round(quantity * 100) / 100);
  return `${value} ${unit}`.trim();
}

/** Applies one immutable domain mutation and appends its audit event. */
export function applyDomainMutation(data, {
  type,
  target = null,
  details,
  actor = DEFAULT_ACTOR,
  at = new Date().toISOString(),
  auditId = makeDomainId('audit'),
  mutate,
}) {
  if (typeof mutate !== 'function') throw new TypeError('Domain mutation requires a mutate function');
  const next = cloneDomain(data);
  if (mutate(next) === false) return data;
  next.auditEvents.push({
    id: auditId,
    type,
    actor,
    target,
    at,
    ...(details === undefined ? {} : { details: cloneDomain(details) }),
  });
  next.meta = {
    ...next.meta,
    updatedAt: at,
  };
  return next;
}
