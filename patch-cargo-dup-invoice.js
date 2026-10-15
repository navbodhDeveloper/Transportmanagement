// Run in the folder with app.js:   node patch-cargo-dup-invoice.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Cargo Entry: block duplicate Inv. No. =====
function findCargoDuplicateInvoices(invNoString, excludeId) {
  const existing = new Set();
  APP.cargoEntries.forEach(e => {
    if (e.id === excludeId) return;
    String(e.invNo || "").split(",").forEach(t => { t = t.trim().toUpperCase(); if (t) existing.add(t); });
  });
  const seen = new Set(), dupes = [];
  String(invNoString || "").split(",").map(t => t.trim()).filter(Boolean).forEach(t => {
    const k = t.toUpperCase();
    if (existing.has(k) || seen.has(k)) dupes.push(t);
    seen.add(k);
  });
  return dupes;
}
const __saveCargoEntryFromModalOrig = saveCargoEntryFromModal;
saveCargoEntryFromModal = function () {
  const el = document.getElementById("ceInvNo");
  const dupes = findCargoDuplicateInvoices(el.value, APP.editingCargoEntryId);
  if (dupes.length) {
    showToast(`Invoice No. "${dupes.join(", ")}" already exists in Cargo Entry. Please use a unique invoice number.`, "error");
    el.focus();
    return;
  }
  return __saveCargoEntryFromModalOrig.apply(this, arguments);
};
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("findCargoDuplicateInvoices")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["saveCargoEntryFromModal", "showToast"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.cargodup.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.cargodup.bak). Refresh with Ctrl+F5.");