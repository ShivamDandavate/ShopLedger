'use strict';

const test = require('node:test');
const assert = require('node:assert');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function orderDb() {
  return {
    orders: [
      { id: 1, date: '15/03/2022', customer: 'March' },
      { id: 2, date: '30/01/2022', customer: 'January' },
      { id: 3, date: '28/12/2021', customer: 'December' }
    ]
  };
}

function ledgerDb() {
  return {
    nextSettlementId: 501,
    settlements: [],
    customers: [{
      id: 1,
      name: 'Test Customer',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }]
  };
}

test('CURRENT BEHAVIOUR: orders.list default order is newest first by real date', function () {
  const result = orders.list(orderDb());
  assert.deepStrictEqual(result.map(function (o) { return o.id; }), [1, 2, 3]);
});

test('CURRENT BEHAVIOUR: orders.list from date-picker YYYY-MM-DD excludes dates before March 2022', function () {
  const result = orders.list(orderDb(), { from: '2022-03-01' });
  assert.deepStrictEqual(result.map(function (o) { return o.id; }), [1]);
});

test('CURRENT BEHAVIOUR: orders.list to date-picker YYYY-MM-DD includes all mixed dates through March 2022', function () {
  const result = orders.list(orderDb(), { to: '2022-03-31' });
  assert.deepStrictEqual(result.map(function (o) { return o.id; }), [1, 2, 3]);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey converts ISO date strings and leaves other strings unvalidated', function () {
  assert.strictEqual(dates.normalizeDateKey('2022-03-15'), '15/03/2022');
  assert.strictEqual(dates.normalizeDateKey(' 15/03/2022 '), '15/03/2022');
  assert.strictEqual(dates.normalizeDateKey('2022-13-40'), '40/13/2022');
  assert.strictEqual(dates.normalizeDateKey('not-a-date'), 'date/a/not');
  assert.strictEqual(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement with numeric 500 updates totals arithmetically', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'cash', 'numeric');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer.totalSettled, 1700);
  assert.strictEqual(result.customer.balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
  assert.strictEqual(db.settlements.length, 1);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement with string "500" treats it as a number', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'upi', 'JSON string amount');

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer.totalSettled, 1700);
  assert.strictEqual(result.customer.balance, 732.01);
  assert.strictEqual(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects zero without changing customer totals', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 0);

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'Settlement amount must be greater than zero');
  assert.strictEqual(db.customers[0].totalSettled, 1200);
  assert.strictEqual(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects negative amounts without changing customer totals', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, -25);

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'Settlement amount must be greater than zero');
  assert.strictEqual(db.customers[0].totalSettled, 1200);
  assert.strictEqual(db.settlements.length, 0);
});

test('CURRENT BEHAVIOUR: ledger.recordSettlement rejects a non-numeric string without changing totals', function () {
  const db = ledgerDb();
  const result = ledger.recordSettlement(db, 1, 'abc');

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'Settlement amount must be greater than zero');
  assert.strictEqual(db.customers[0].totalSettled, 1200);
  assert.strictEqual(db.customers[0].balance, 1232.01);
  assert.strictEqual(db.settlements.length, 0);
});

test('REGRESSION: real-date order filters and numeric settlement amounts are correct', function () {
  const db = orderDb();
  assert.deepStrictEqual(orders.list(db).map(function (o) { return o.id; }), [1, 2, 3]);
  assert.deepStrictEqual(
    orders.list(db, { from: '2022-03-01', to: '2022-03-31' }).map(function (o) { return o.id; }),
    [1]
  );

  const numericDb = ledgerDb();
  const numericResult = ledger.recordSettlement(numericDb, 1, 500);
  assert.strictEqual(numericResult.customer.balance, 732.01);

  const stringDb = ledgerDb();
  const stringResult = ledger.recordSettlement(stringDb, 1, '500');
  assert.strictEqual(stringResult.ok, true);
  assert.strictEqual(stringResult.customer.totalSettled, 1700);
  assert.strictEqual(stringResult.customer.balance, 732.01);

  const invalidDb = ledgerDb();
  const invalidResult = ledger.recordSettlement(invalidDb, 1, 'not-a-number');
  assert.strictEqual(invalidResult.ok, false);
  assert.strictEqual(invalidDb.customers[0].totalSettled, 1200);
  assert.strictEqual(invalidDb.settlements.length, 0);
});
