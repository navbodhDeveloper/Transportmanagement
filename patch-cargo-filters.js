// Run in the folder with app.js:   node patch-cargo-filters.js
// Adds the same filter bar to Cargo Entry as Dispatch Records.
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== CARGO FILTERS (same style as Dispatch Records) =====
APP.cargoFilters = { from: "", to: "", area: "", party: "", status: "", q: "" };
let __cfLastCargo = null;

(function buildCargoFilterBar() {
  const bar = document.querySelector("#cargoWrap .action-bar");
  if (!bar || document.getElementById("cargoFilterPanel")) return;
  const panel = document.createElement("div");
  panel.className = "panel filter-panel";
  panel.id = "cargoFilterPanel";
  panel.innerHTML =
    '<div class="filter-grid">' +
    '<div class="field"><label for="cfFrom">From Date</label><input type="date" id="cfFrom"></div>' +
    '<div class="field"><label for="cfTo">To Date</label><input type="date" id="cfTo"></div>' +
    '<div class="field"><label for="cfArea">Area / City</label><select id="cfArea"><option value="">All Areas</option></select></div>' +
    '<div class="field"><label for="cfParty">Party / School</label><select id="cfParty"><option value="">All Parties</option></select></div>' +
    '<div class="field"><label for="cfStatus">Report Status</label><select id="cfStatus"><option value="">All</option><option value="pending">Not Reported</option><option value="reported">Reported</option></select></div>' +
    '<div class="field field-search"><label for="cfSearch">Search</label><input type="text" id="cfSearch" placeholder="Search Party / Invoice / Bilty..."></div>' +
    '</div>' +
    '<div class="filter-actions">' +
    '<button class="btn btn-primary" id="btnCfApply">Apply Filter</button>' +
    '<button class="btn btn-secondary" id="btnCfReset">Reset Filters</button>' +
    '<span class="filter-result-count" id="cfResultCount"></span>' +
    '</div>';
  bar.insertAdjacentElement("beforebegin", panel);

  const apply = () => {
    const v = id => document.getElementById(id).value;
    APP.cargoFilters = { from: v("cfFrom"), to: v("cfTo"), area: v("cfArea"), party: v("cfParty"), status: v("cfStatus"), q: v("cfSearch").trim() };
    if (typeof PG !== "undefined" && PG.cargo) PG.cargo.page = 1;
    renderCargoPage();
  };
  const reset = () => {
    ["cfFrom", "cfTo", "cfArea", "cfParty", "cfStatus", "cfSearch"].forEach(id => { document.getElementById(id).value = ""; });
    apply();
  };
  document.getElementById("btnCfApply").addEventListener("click", apply);
  document.getElementById("btnCfReset").addEventListener("click", reset);
  ["cfFrom", "cfTo", "cfArea", "cfParty", "cfStatus"].forEach(id => document.getElementById(id).addEventListener("change", apply));
  document.getElementById("cfSearch").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); apply(); } });
  window.__cfReset = reset;
})();

function cargoPassesFilter(e, f) {
  const d = String(e.dateBooking || "");
  if (f.from && d < f.from) return false;
  if (f.to && d > f.to) return false;
  if (f.area && String(e.area || "").trim().toLowerCase() !== f.area.toLowerCase()) return false;
  if (f.party && String(e.party || "").trim().toLowerCase() !== f.party.toLowerCase()) return false;
  if (f.status === "pending" && e.reportNo) return false;
  if (f.status === "reported" && !e.reportNo) return false;
  if (f.q) {
    const hay = [e.party, e.area, e.invNo, e.bultyNo].join(" ").toLowerCase();
    if (!hay.includes(f.q.toLowerCase())) return false;
  }
  return true;
}
function cargoFilterActive() {
  const f = APP.cargoFilters;
  return !!(f.from || f.to || f.area || f.party || f.status || f.q);
}
// Run fn with only the filtered entries of the open cargo visible to the table code
function withCargoFilter(fn) {
  const all = APP.cargoEntries;
  const f = APP.cargoFilters;
  APP.cargoEntries = all.filter(e => e.cargoId !== APP.activeCargoId || cargoPassesFilter(e, f));
  try { return fn(); } finally { APP.cargoEntries = all; }
}
function cargoFillSelect(id, values, label) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  const uniq = [...new Set(values.map(v => String(v || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (cur && !uniq.some(v => v.toLowerCase() === cur.toLowerCase())) uniq.push(cur);
  sel.innerHTML = '<option value="">' + label + '</option>' + uniq.map(v => '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>').join("");
  sel.value = cur;
}

const __renderCargoPageFilterOrig = renderCargoPage;
renderCargoPage = function () {
  if (APP.activeCargoId !== __cfLastCargo) {          // new cargo tab -> clean filters
    __cfLastCargo = APP.activeCargoId;
    if (cargoFilterActive() && window.__cfReset) {
      APP.cargoFilters = { from: "", to: "", area: "", party: "", status: "", q: "" };
      ["cfFrom", "cfTo", "cfArea", "cfParty", "cfStatus", "cfSearch"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    }
  }
  const mine = APP.cargoEntries.filter(e => e.cargoId === APP.activeCargoId);
  cargoFillSelect("cfArea", mine.map(e => e.area), "All Areas");
  cargoFillSelect("cfParty", mine.map(e => e.party), "All Parties");
  const res = withCargoFilter(() => __renderCargoPageFilterOrig.apply(this, arguments));
  // the tab badge always shows the real total
  const tab = document.querySelector('#cargoTabs [data-cargo="' + APP.activeCargoId + '"] .view-count');
  if (tab) tab.textContent = mine.length;
  const info = document.getElementById("cfResultCount");
  if (info) {
    const shown = mine.filter(e => cargoPassesFilter(e, APP.cargoFilters)).length;
    info.textContent = mine.length ? "Showing " + shown + " of " + mine.length + " entries" : "";
  }
  return res;
};

// Export Excel follows the filters too (like Dispatch Records)
if (typeof cargoExportExcel === "function") {
  const __cargoExportOrig = cargoExportExcel;
  cargoExportExcel = function () { const a = arguments, self = this; return withCargoFilter(() => __cargoExportOrig.apply(self, a)); };
}
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("CARGO FILTERS (same style")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["renderCargoPage"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.cargofilter.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.cargofilter.bak). Refresh with Ctrl+F5.");