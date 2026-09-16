# Book Transport & Dispatch Management

A single-page prototype for managing book dispatch, transport expenses, and export reports — built with plain HTML, CSS, and JavaScript. No build step, no backend, no database.

## Running it

Open `index.html` directly in a browser (double-click it, or drag it into a browser window). That's it.

All data is stored in the browser's `localStorage`, so it persists across refreshes and works offline once the page has loaded once. Each browser/profile has its own separate data.

## Files

- `index.html` — page structure, navigation, and all modal dialogs
- `styles.css` — the full design system (spreadsheet look, print styles, responsive layout)
- `data.js` — sample seed data and constants (only used the very first time the app runs)
- `utils.js` — storage helpers, Indian currency formatting, number-to-words, validation
- `app.js` — all application logic: rendering, filtering, the export engine, Excel import/export

## Notes on the optional CDN library

Excel import/export uses [SheetJS](https://sheetjs.com/) loaded from a CDN. If that CDN is unreachable (e.g. fully offline), the app automatically falls back to CSV for both import and export, so the feature still works — just with `.csv` files instead of `.xlsx`.

## Key behavior to know about

- **Export limit**: "Export Report" walks the currently filtered, not-yet-exported records in the order shown and adds them to a report until the next one would push the total over the configured limit (default ₹10,000). That record and everything after it is left for the next export — nothing is partially included.
- **Export numbering**: Export No. and VO.NO. always continue from the highest number already used; they never reset, even after a browser refresh.
- **Historical reports never change**: each export saves a snapshot of its records at the time of export, so editing a dispatch record later does not alter reports that have already been generated.
- **Resetting**: Settings → Clear Demo Data removes only the pre-loaded sample rows; Settings → Reset Application wipes everything in this browser and starts fresh (with a confirmation step).
