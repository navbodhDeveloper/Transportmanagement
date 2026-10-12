// Run after patch-pagination-more.js, in the folder with app.js:   node patch-pagination-reports.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Pagination for Cargo "Saved Reports" =====
PG.reports = { page: 1, size: 5, lastCargo: null, lastCount: 0 };
PG_CFG.reports = { rows: "#cargoReportsBody tr", pager: "pagerReports", noun: "reports" };
(function () {
  const body = document.getElementById("cargoReportsBody");
  const anchor = body && body.closest(".sheet-panel");
  if (!anchor) return;
  const el = document.createElement("div");
  el.className = "pager";
  el.id = "pagerReports";
  el.hidden = true;
  anchor.insertAdjacentElement("afterend", el);
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pgn]");
    if (!b || b.disabled) return;
    PG.reports.page = Number(b.dataset.pgn);
    paginateDom("reports");
  });
  el.addEventListener("change", (e) => {
    if (e.target.tagName !== "SELECT") return;
    PG.reports.size = Number(e.target.value);
    PG.reports.page = 1;
    paginateDom("reports");
  });
})();

const __renderCargoPageOrig2 = renderCargoPage;
renderCargoPage = function () {
  __renderCargoPageOrig2.apply(this, arguments);
  const n = document.querySelectorAll("#cargoReportsBody tr").length;
  if (APP.activeCargoId !== PG.reports.lastCargo || n > PG.reports.lastCount) PG.reports.page = 1; // new cargo tab or new report -> newest first
  PG.reports.lastCargo = APP.activeCargoId;
  PG.reports.lastCount = n;
  paginateDom("reports");
};
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("pagerReports")) { console.log("Already patched — skipped."); process.exit(0); }
if (!t.includes("function paginateDom")) { console.error("STOPPED: run patch-pagination-more.js first."); process.exit(1); }
fs.copyFileSync("app.js", "app.js.reports.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.reports.bak). Refresh with Ctrl+F5.");