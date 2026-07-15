import assert from 'node:assert/strict';
import test from 'node:test';
import { createDomainSeed } from '../src/data/domainSeed.js';
import { applyDomainMutation, parseQuantity, receiptQuantity } from '../src/store/domainMutations.js';

test('quantity parsing accepts inventory labels and Unicode minus signs', () => {
  assert.equal(parseQuantity('1,000 pcs'), 1000);
  assert.equal(parseQuantity('−2 L'), -2);
  assert.equal(parseQuantity('not recorded'), null);
});

test('partial PO receipts use only the remaining quantity unless explicitly supplied', () => {
  const line = { name: 'Stain remover', qty: '24 bottles', receivedQuantity: 12 };
  assert.equal(receiptQuantity('Partial', line, line).quantity, 12);
  assert.equal(receiptQuantity('Partial', { ...line, receivedQty: '3 bottles' }, line).quantity, 3);
  assert.equal(receiptQuantity('Ordered', line, line).quantity, 24);
});

test('domain mutations are immutable and append an audit event', () => {
  const original = createDomainSeed({ now: () => '2026-07-13T00:00:00.000Z' });
  const beforeAuditCount = original.auditEvents.length;
  const next = applyDomainMutation(original, {
    type: 'test.changed',
    target: 'store',
    at: '2026-07-13T01:00:00.000Z',
    auditId: 'audit-test',
    mutate: (draft) => { draft.storeSettings.name = 'Changed'; },
  });

  assert.equal(original.storeSettings.name, 'Sok Laundry');
  assert.equal(next.storeSettings.name, 'Changed');
  assert.equal(next.auditEvents.length, beforeAuditCount + 1);
  assert.equal(next.auditEvents.at(-1).type, 'test.changed');
});
