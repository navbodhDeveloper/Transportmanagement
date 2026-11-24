// Run in the folder with app.js:   node patch-remember.js
// Everything you type is remembered and offered in a dropdown next time (all sections).
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== REMEMBER-TYPED: typed values are remembered and shown in dropdowns =====
(function rememberTyped() {
  const KEY = "btdm_suggest";
  const MAP = [
    { sel: "#exMessage", key: "exMessage", list: "chargeMessageOptions" },
    { sel: ".charge-label", key: "chargeLabel", list: "chargeLabelOptions" },
    { sel: "#cgName", key: "cargoName" },
    { sel: "#cgMessage, #crMessage", key: "cargoMessage" },
    { sel: "#crBooking", key: "cargoBooking" },
    { sel: ".exp-remark", key: "expRemark" },
  ];
  const baseOpts = {};
  const load = () => { const v = Store.get(KEY, {}); return v && typeof v === "object" ? v : {}; };

  function derived(key) {
    const out = [];
    try {
      if (key === "exMessage") APP.exports.forEach(e => out.push((e.reportData || {}).message));
      if (key === "chargeLabel") APP.exports.forEach(e => ((e.reportData || {}).charges || []).forEach(c => out.push(c.label)));
      if (key === "cargoName") APP.cargos.forEach(c => out.push(c.name));
      if (key === "cargoMessage") { APP.cargos.forEach(c => out.push(c.message)); (APP.cargoReports || []).forEach(r => out.push(r.message)); }
      if (key === "cargoBooking") (APP.cargoReports || []).forEach(r => out.push(r.bookingLabel));
      if (key === "expRemark") APP.expenses.forEach(e => out.push(e.remark));
    } catch (err) { }
    return out;
  }

  function values(entry) {
    const dl = document.getElementById(entry.list || ("sg_" + entry.key));
    if (dl && baseOpts[entry.key] === undefined) baseOpts[entry.key] = [...dl.querySelectorAll("option")].map(o => o.value);
    const all = [].concat(baseOpts[entry.key] || [], load()[entry.key] || [], derived(entry.key));
    const seen = new Set(), res = [];
    all.forEach(v => {
      const s = String(v || "").trim();
      const k = s.toLowerCase();
      if (!s || seen.has(k)) return;
      seen.add(k); res.push(s);
    });
    return res;
  }

  function refresh(entry) {
    const id = entry.list || ("sg_" + entry.key);
    let dl = document.getElementById(id);
    if (!dl) { dl = document.createElement("datalist"); dl.id = id; document.body.appendChild(dl); }
    const vals = values(entry);
    dl.innerHTML = vals.map(v => '<option value="' + escapeHtml(v) + '"></option>').join("");
  }

  function entryFor(el) {
    return el && el.matches ? MAP.find(m => el.matches(m.sel)) : null;
  }

  document.addEventListener("focusin", e => {
    const entry = entryFor(e.target);
    if (!entry) return;
    refresh(entry);
    if (!e.target.getAttribute("list")) e.target.setAttribute("list", entry.list || ("sg_" + entry.key));
  });

  document.addEventListener("change", e => {
    const entry = entryFor(e.target);
    if (!entry) return;
    const v = String(e.target.value || "").trim();
    if (!v || v.length > 200) return;
    const mem = load();
    const arr = (mem[entry.key] || []).filter(x => String(x).toLowerCase() !== v.toLowerCase());
    arr.unshift(v);
    mem[entry.key] = arr.slice(0, 100);
    Store.set(KEY, mem);
  });

  document.addEventListener("DOMContentLoaded", () => {
    MAP.forEach(entry => {
      refresh(entry);
      document.querySelectorAll(entry.sel).forEach(el => { if (!el.getAttribute("list")) el.setAttribute("list", entry.list || ("sg_" + entry.key)); });
    });
  });
})();

// ===== New Area / Driver names typed anywhere are saved to Masters =====
function autoAddAreasAndDrivers() {
  const haveA = new Set(APP.areas.map(a => String(a.name || "").trim().toLowerCase()));
  let addedA = 0;
  const addArea = raw => {
    const name = String(raw || "").trim().toUpperCase();
    if (!name || haveA.has(name.toLowerCase())) return;
    haveA.add(name.toLowerCase());
    APP.areas.push({ id: uid("area"), name, status: "Active" });
    addedA++;
  };
  APP.records.forEach(r => addArea(r.area));
  (APP.cargoEntries || []).forEach(e => addArea(e.area));

  const haveD = new Set(APP.drivers.map(d => String(d.name || "").trim().toLowerCase()));
  let addedD = 0;
  const addDriver = raw => {
    const name = String(raw || "").trim();
    if (!name || haveD.has(name.toLowerCase())) return;
    haveD.add(name.toLowerCase());
    APP.drivers.push({ id: uid("drv"), name, type: "Transport Driver", phone: "", status: "Active" });
    addedD++;
  };
  APP.records.forEach(r => addDriver(r.driver));
  APP.expenses.forEach(e => addDriver(e.driver));

  if (addedA) { saveAreas(); if (typeof renderAreaTable === "function") renderAreaTable(); }
  if (addedD) { saveDrivers(); if (typeof renderDriverTable === "function") renderDriverTable(); }
  if (addedA || addedD) renderMasterOptions();
}
const __srAuto = saveRecords;
saveRecords = function () { const r = __srAuto.apply(this, arguments); autoAddAreasAndDrivers(); return r; };
const __sceAuto = saveCargoEntries;
saveCargoEntries = function () { const r = __sceAuto.apply(this, arguments); autoAddAreasAndDrivers(); return r; };
const __seAuto = saveExpenses;
saveExpenses = function () { const r = __seAuto.apply(this, arguments); autoAddAreasAndDrivers(); return r; };
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("REMEMBER-TYPED")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["saveRecords", "saveCargoEntries", "saveExpenses", "saveAreas", "saveDrivers", "renderMasterOptions"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.remember.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.remember.bak). Refresh with Ctrl+F5.");