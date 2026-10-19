// Run in the folder with app.js:   node patch-auto-transporter.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Auto-save new Transport names to Masters (so they appear in the dropdown next time) =====
function autoAddTransporters() {
  const have = new Set(APP.transporters.map(t => String(t.name || "").trim().toLowerCase()));
  const mode = (APP.settings && APP.settings.defaultMode) || TRANSPORT_MODES[0];
  let added = 0;
  APP.records.forEach(r => {
    const name = String(r.transport || "").trim();
    const key = name.toLowerCase();
    if (!name || have.has(key)) return;
    have.add(key);
    APP.transporters.push({ id: uid("trn"), name, mode, contact: "", status: "Active" });
    added++;
  });
  if (added) {
    saveTransporters();
    renderMasterOptions();
    if (typeof renderTransporterTable === "function") renderTransporterTable();
  }
  return added;
}
const __saveRecordsOrig = saveRecords;
saveRecords = function () {
  const r = __saveRecordsOrig.apply(this, arguments);
  autoAddTransporters();
  return r;
};
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("autoAddTransporters")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["saveRecords", "saveTransporters", "renderMasterOptions"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.autotrn.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.autotrn.bak). Refresh with Ctrl+F5.");