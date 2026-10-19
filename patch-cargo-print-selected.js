// Run in the folder with app.js:   node patch-cargo-print-selected.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Cargo Saved Reports: select several + "Print Selected Together" =====
APP.cargoRepSel = new Set();

function cargoRepSelectedList() {
  const cargo = getActiveCargo();
  if (!cargo) return [];
  return APP.cargoReports
    .filter(r => r.cargoId === cargo.id && APP.cargoRepSel.has(r.id))
    .sort((a, b) => a.no - b.no);
}

function updateCargoRepBar() {
  const cargo = getActiveCargo();
  const list = cargoRepSelectedList();
  const btn = document.getElementById("btnPrintSelectedCargoReports");
  const info = document.getElementById("cargoRepSelInfo");
  if (btn) btn.disabled = list.length === 0;
  if (info) info.textContent = list.length ? list.length + " selected" : "";
  const all = document.getElementById("cargoRepSelectAll");
  if (all && cargo) {
    const total = APP.cargoReports.filter(r => r.cargoId === cargo.id).length;
    all.checked = total > 0 && list.length === total;
  }
}

function printSelectedCargoReports() {
  const list = cargoRepSelectedList();
  if (!list.length) return;
  const cargo = getActiveCargo();
  APP.viewingExportNo = null;
  APP.viewingCargoReportId = null;
  document.getElementById("modalReportTitle").textContent = `${cargo.name} — ${list.length} Report${list.length === 1 ? "" : "s"} Combined`;
  document.getElementById("reportPrintArea").innerHTML = list.map(r => buildCargoReportHTML(r)).join("");
  document.getElementById("reportCommentBox").hidden = true;
  openModal("modalReport");
}

(function setupCargoPrintSelected() {
  const body = document.getElementById("cargoReportsBody");
  const head = body && body.closest("table").querySelector("thead tr");
  const h2 = document.querySelector("#cargoWrap .cargo-subhead");
  if (!body || !head || !h2 || document.getElementById("btnPrintSelectedCargoReports")) return;

  const th = document.createElement("th");
  th.className = "col-check";
  th.innerHTML = '<input type="checkbox" id="cargoRepSelectAll" title="Select all">';
  head.insertBefore(th, head.firstChild);

  const bar = document.createElement("div");
  bar.className = "action-bar";
  bar.innerHTML = '<button class="btn btn-primary" id="btnPrintSelectedCargoReports" disabled>' +
    '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print Selected Together</button>' +
    '<div class="selection-info" id="cargoRepSelInfo"></div>';
  h2.insertAdjacentElement("afterend", bar);

  document.getElementById("btnPrintSelectedCargoReports").addEventListener("click", printSelectedCargoReports);
  document.getElementById("cargoRepSelectAll").addEventListener("change", (e) => {
    const cargo = getActiveCargo();
    if (!cargo) return;
    APP.cargoReports.filter(r => r.cargoId === cargo.id).forEach(r => {
      if (e.target.checked) APP.cargoRepSel.add(r.id); else APP.cargoRepSel.delete(r.id);
    });
    body.querySelectorAll(".crep-check").forEach(cb => { cb.checked = e.target.checked; });
    updateCargoRepBar();
  });
  body.addEventListener("change", (e) => {
    const cb = e.target.closest(".crep-check");
    if (!cb) return;
    const rid = cb.closest("tr").dataset.rid;
    if (cb.checked) APP.cargoRepSel.add(rid); else APP.cargoRepSel.delete(rid);
    updateCargoRepBar();
  });
})();

const __renderCargoPageForSel = renderCargoPage;
renderCargoPage = function () {
  const r = __renderCargoPageForSel.apply(this, arguments);
  const body = document.getElementById("cargoReportsBody");
  if (body) {
    const live = new Set(APP.cargoReports.map(x => x.id));
    [...APP.cargoRepSel].forEach(id => { if (!live.has(id)) APP.cargoRepSel.delete(id); });
    body.querySelectorAll("tr[data-rid]").forEach(tr => {
      if (tr.querySelector(".crep-check")) return;
      const td = document.createElement("td");
      td.className = "col-check";
      td.innerHTML = `<input type="checkbox" class="crep-check" ${APP.cargoRepSel.has(tr.dataset.rid) ? "checked" : ""}>`;
      tr.insertBefore(td, tr.firstChild);
    });
    updateCargoRepBar();
  }
  return r;
};
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("cargoRepSelectAll")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["renderCargoPage", "buildCargoReportHTML", "getActiveCargo", "openModal"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.cargoprint.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.cargoprint.bak). Refresh with Ctrl+F5.");