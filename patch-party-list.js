// Run in the folder with app.js:   node patch-party-list.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Party / School name dropdown (suggestions from saved names) =====
(function () {
  const dl = document.createElement("datalist");
  dl.id = "partyListOptions";
  document.body.appendChild(dl);
  const pf = RECORD_FIELDS.find(f => f.key === "party");
  if (pf) { pf.type = "text-list"; pf.list = "partyListOptions"; }
  const ce = document.getElementById("ceParty");
  if (ce) ce.setAttribute("list", "partyListOptions");
})();
function refreshPartyList() {
  const seen = new Map();
  APP.records.concat(APP.cargoEntries).forEach(r => {
    const n = String(r.party || "").trim();
    if (n && !seen.has(n.toUpperCase())) seen.set(n.toUpperCase(), n);
  });
  fillDatalist("partyListOptions", [...seen.values()].sort((a, b) => a.localeCompare(b)));
}
const __openRecordModalOrig = openRecordModal;
openRecordModal = function () { refreshPartyList(); return __openRecordModalOrig.apply(this, arguments); };
const __openCargoEntryModalOrig = openCargoEntryModal;
openCargoEntryModal = function () { refreshPartyList(); return __openCargoEntryModalOrig.apply(this, arguments); };
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("partyListOptions")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["openRecordModal", "openCargoEntryModal", "fillDatalist"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.partylist.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.partylist.bak). Refresh with Ctrl+F5.");