// Run in the folder with app.js (after patch-delete-sync.js):   node patch-remove-empty-export.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== An export with no records left is removed from the Export Register =====
function dropEmptyExports() {
  const before = APP.exports.length;
  APP.exports = APP.exports.filter(e => !(e.reportData && Array.isArray(e.reportData.rows) && e.reportData.rows.length === 0));
  if (APP.exports.length === before) return false;
  const live = new Set(APP.exports.map(e => Number(e.exportNo)));
  [...APP.selectedExports].forEach(n => { if (!live.has(Number(n))) APP.selectedExports.delete(n); });
  saveExports();
  return true;
}

const __removeRecordFromExportOrig = removeRecordFromExport;
removeRecordFromExport = function (rec) {
  const ok = __removeRecordFromExportOrig.apply(this, arguments);
  if (ok && dropEmptyExports()) showToast(`Export ${rec.exportNo} had no records left, so it was removed.`, "success");
  return ok;
};

// clean up empty exports that are already saved (runs once the app has loaded)
document.addEventListener("DOMContentLoaded", () => {
  if (dropEmptyExports()) { renderExportRegister(); renderDispatchTable(); renderDashboard(); }
});
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("function dropEmptyExports")) { console.log("Already patched — skipped."); process.exit(0); }
if (!t.includes("function removeRecordFromExport")) { console.error("STOPPED: run patch-delete-sync.js first."); process.exit(1); }
fs.copyFileSync("app.js", "app.js.empty.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.empty.bak). Refresh with Ctrl+F5.");