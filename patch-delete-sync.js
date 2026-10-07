// Run in the folder with app.js:   node patch-delete-sync.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };

const APPEND = S(function () {/*

// ===== Deleting an exported record also removes it from its saved report =====
function removeRecordFromExport(rec) {
  const exp = APP.exports.find(e => Number(e.exportNo) === Number(rec.exportNo));
  if (!exp || !exp.reportData) return false;
  const rd = exp.reportData;
  let i = rd.rows.findIndex(r => r.id === rec.id);
  if (i < 0) i = rd.rows.findIndex(r => !r.id && r.srlNo === rec.srlNo); // older exports without row ids
  if (i < 0) return false;

  rd.rows.splice(i, 1);
  rd.rows.forEach((r, k) => { r.seNo = k + 1; });
  rd.totalBundles = rd.rows.reduce((s, r) => s + toNum(r.bundles), 0);
  rd.totalAmount = computeDedupedAmount(rd.rows);

  // per-bundle charges (e.g. "70*40") follow the new bundle total, same rate
  if (Array.isArray(rd.charges)) {
    rd.charges.forEach(c => {
      if (!c.formula) return;
      const m = /^\s*[\d.]+\s*\*\s*([\d.]+)\s*$/.exec(c.formula);
      if (!m) return;
      const rate = toNum(m[1]);
      c.amount = rd.totalBundles * rate;
      c.formula = `${rd.totalBundles}*${rate}`;
    });
    rd.parCharges = rd.charges.reduce((s, c) => s + toNum(c.amount), 0);
  }
  rd.grandTotal = rd.totalAmount + toNum(rd.parCharges);
  rd.driverLabel = computeDriverLabel(rd.rows);

  const srls = rd.rows.map(r => toNum(r.srlNo));
  exp.recordCount = rd.rows.length;
  exp.totalAmount = rd.totalAmount;
  exp.driver = rd.driverLabel;
  exp.transportMode = computeModeLabel(rd.rows);
  exp.srlFrom = srls.length ? Math.min(...srls) : "";
  exp.srlTo = srls.length ? Math.max(...srls) : "";
  if (!rd.rows.length) exp.status = "Empty";
  saveExports();
  return true;
}

function deleteWarningText(id) {
  const rec = APP.records.find(r => r.id === id);
  if (rec && rec.exportNo) return `This record is part of Export ${rec.exportNo}. It will also be removed from that report, and the report totals will be recalculated.`;
  return "This record will be removed from the master sheet.";
}

const __deleteRecordOrig = deleteRecord;
deleteRecord = function (id) {
  const rec = APP.records.find(r => r.id === id);
  const snap = rec ? { ...rec } : null;
  __deleteRecordOrig.apply(this, arguments);
  if (snap && snap.exportNo && removeRecordFromExport(snap)) {
    renderDispatchTable();
    renderExportRegister();
    renderDashboard();
    showToast(`Also removed from Export ${snap.exportNo} — report recalculated.`, "success");
  }
};
*/});

const OPTIONAL = [["delete confirmation text",
  'document.getElementById("modalDeleteText").textContent = "This record will be removed from the master sheet.";',
  'document.getElementById("modalDeleteText").textContent = deleteWarningText(id);']];

const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("function removeRecordFromExport")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["deleteRecord", "computeDedupedAmount", "computeDriverLabel", "computeModeLabel", "saveExports"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
for (const [label, find, repl] of OPTIONAL) {
  if (t.split(find).length - 1 === 1) t = t.replace(find, () => repl);
  else console.log(`note: "${label}" not changed (code differs) — deleting still syncs the report.`);
}
t = t.replace(/\s*$/, "\n") + APPEND;
fs.copyFileSync("app.js", "app.js.delete.bak");
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.delete.bak). Refresh with Ctrl+F5.");