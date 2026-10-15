// Run in the folder with app.js:   node patch-shared-amount.js
const fs = require("fs");
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("applySharedBultyAmount")) { console.log("Already patched — skipped."); process.exit(0); }

const edits = [
  // Edit form: amount stays editable on a shared bilty
  ["      amountInput.disabled = true;\n", "      amountInput.disabled = false;\n"],
  ["`Locked — this Bulty No. is already used by another record, and one bilty has one shared price (${formatINR(match.amount)}).`",
   "`Shared price (${formatINR(match.amount)}) — you can change it; the new amount applies to every record with this Bulty No.`"],
  // Form save: keep the typed amount and apply it to the whole bilty
  ["  if (bultyMatch) data.amount = bultyMatch.amount;\n", "  // shared bilty: the amount typed here becomes the shared price (applied after save)\n"],
  ["  saveRecords();\n  renderMasterOptions();\n  closeModal(\"modalRecord\");",
   "  applySharedBultyAmount(data.bultyNo, data.amount, APP.editingRecordId || (APP.records[APP.records.length - 1] || {}).id);\n  saveRecords();\n  renderMasterOptions();\n  closeModal(\"modalRecord\");"],
  // Inline edit: no more block on the Amount cell
  [/\n\s*showToast\(`Amount is locked — Bulty No\.[^\n]*\n\s*return;/, ""],
  ["    record[field] = val;\n    if (field === \"bultyNo\") {",
   "    record[field] = val;\n    if (field === \"amount\") applySharedBultyAmount(record.bultyNo, toNum(record.amount), record.id);\n    if (field === \"bultyNo\") {"],
];
for (const [a, b] of edits) {
  const hit = typeof a === "string" ? t.split(a).length - 1 : (t.match(new RegExp(a.source, "g")) || []).length;
  if (hit !== 1) { console.error(`STOPPED: expected 1 match, found ${hit} for: ${String(a).slice(0, 70)}`); process.exit(1); }
}
fs.copyFileSync("app.js", "app.js.sharedamt.bak");
for (const [a, b] of edits) t = typeof a === "string" ? t.replace(a, () => b) : t.replace(a, b);
t = t.replace(/\s*$/, "\n") + `
// Shared bilty: one Bulty No = one price. Changing the amount on one record updates the rest.
function applySharedBultyAmount(bultyNo, amount, exceptId) {
  const key = String(bultyNo || "").trim().toLowerCase();
  if (!key) return; 
  APP.records.forEach(r => {
    if (r.id === exceptId) return;
    if (String(r.bultyNo || "").trim().toLowerCase() !== key) return;
    if (toNum(r.amount) === toNum(amount)) return;
    r.amount = toNum(amount);
    syncRecordFieldToExport(r, "amount");
  });
}
`;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.sharedamt.bak). Refresh with Ctrl+F5.");