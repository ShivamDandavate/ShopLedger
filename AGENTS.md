# ShopLedger

## Stack

- JavaScript using CommonJS modules on Node.js.
- Express 4.17.1 serves the browser files and API; body-parser 1.19.0 parses JSON request bodies.
- Application records are read from and written to `data/db.json` by `lib/store.js`.

## Module map

### routes/

- `routes/customers.js` — lists customers and recent settlements; records Khata settlements.
- `routes/orders.js` — lists, retrieves, places, and cancels orders.
- `routes/products.js` — lists/searches products and lists active coupons.
- `routes/reports.js` — serves dashboard/GST reports, pricing preview, and keyed admin export.

### lib/

- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons.
- `lib/dates.js` — formats today's date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers and updates Khata charges, reversals, and settlements.
- `lib/orders.js` — adds, retrieves, cancels, and filters/sorts orders.
- `lib/pricing.js` — computes subtotals, discounts, tax, and order totals.
- `lib/reports.js` — computes dashboard summaries and GST invoice reconciliation.
- `lib/store.js` — reads/writes the JSON database and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits tax into CGST/SGST.

## Commands

- Start the app: `node server.js` (or `npm start`).
- Run tests: `node --test`. The package's current `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Order history sorting and date filtering are broken, and Khata settlements corrupt customer balances. Allowed files: `lib/orders.js` (list only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.
