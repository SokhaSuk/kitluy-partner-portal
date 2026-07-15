import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, toCsv } from '../src/lib/export.js';

test('csvCell quotes commas, quotes, and line breaks', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('a"b'), '"a""b"');
});

test('toCsv uses selected labels and stable CRLF rows', () => {
  const csv = toCsv([{ name: 'Sophea', total: 24800 }], [
    { key: 'name', label: 'Customer' },
    { key: 'total', label: 'Total' },
  ]);
  assert.equal(csv, '\uFEFFCustomer,Total\r\nSophea,24800');
});
