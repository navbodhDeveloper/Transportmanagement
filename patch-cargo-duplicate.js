// Run in the folder with app.js:   node patch-cargo-duplicate.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Cargo Entry: Duplicate button on each entry =====
const CARGO_ICON_DUP = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

function duplicateCargoEntry(id) {
  const i = APP.cargoEntries.findIndex(x => x.id === id);
  if (i < 0) return;
  const copy = { ...APP.cargoEntries[i], id: uid("ce"), reportNo: null, reportId: null };
  APP.cargoEntries.splice(i + 1, 0, copy); // right below the original
  saveCargoEntries();
  renderCargoPage();
  showToast("Entry duplicated.", "success");
}

const __renderCargoPageOrig3 = renderCargoPage;
renderCargoPage = function () {
  __renderCargoPageOrig3.apply(this, arguments);
  document.querySelectorAll("#cargoRows tr .cell-actions").forEach(box => {
    if (box.querySelector('[data-action="duplicate"]')) return;
    const btn = document.createElement("button");
    btn.className = "icon-btn btn-sm";
    btn.dataset.action = "duplicate";
    btn.title = "Duplicate entry";
    btn.innerHTML = CARGO_ICON_DUP;
    const del = box.querySelector('[data-action="delete"]');
    box.insertBefore(btn, del || null);
  });
};
document.getElementById("cargoRows").addEventListener("click", (e) => {
  const btn = e.target.closest('[data-action="duplicate"]');
  if (btn) duplicateCargoEntry(btn.closest("tr").dataset.id);
});
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("function duplicateCargoEntry")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["renderCargoPage", "saveCargoEntries", "showToast"]) if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.dup.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.dup.bak). Refresh with Ctrl+F5.");