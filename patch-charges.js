// Run in the folder with app.js + styles.css:   node patch-charges.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };

const APPEND = S(function () {/*

// ===== Editable charge amounts (click an amount in the Charges column) =====
function decorateChargeCells() {
  document.querySelectorAll("#sheetBody td.charges-cell").forEach(td => {
    const label = td.querySelector(".chg-export");
    if (!label) return;
    const exportNo = (label.textContent.match(/\d+/) || [""])[0];
    const exp = APP.exports.find(x => Number(x.exportNo) === Number(exportNo));
    const hasList = !!(exp && exp.reportData && (exp.reportData.charges || []).length);
    let i = 0;
    td.querySelectorAll(".chg-line:not(.chg-total)").forEach(line => {
      const amt = line.lastElementChild;
      if (!amt) return;
      amt.classList.add("chg-amt");
      amt.dataset.export = exportNo;
      amt.dataset.ci = hasList ? i : -1;
      amt.title = "Click to edit this amount";
      i++;
    });
  });
}

function onChargeAmountClick(e) {
  const el = e.target.closest(".chg-amt");
  if (el && !el.querySelector("input")) startChargeEdit(el);
}

function startChargeEdit(el) {
  const exportNo = Number(el.dataset.export);
  const idx = Number(el.dataset.ci);
  const exp = APP.exports.find(x => Number(x.exportNo) === exportNo);
  if (!exp || !exp.reportData) return;
  const rd = exp.reportData;
  if (idx >= 0 && !(rd.charges || [])[idx]) return;
  const current = idx >= 0 ? toNum(rd.charges[idx].amount) : toNum(rd.parCharges);
  el.innerHTML = `<input type="number" min="0" step="0.01" class="chg-amt-input" value="${current}">`;
  const input = el.querySelector("input");
  input.focus();
  input.select();
  let done = false;
  function finish(save) {
    if (done) return;
    done = true;
    if (!save) { renderDispatchTable(); return; }
    const raw = input.value.trim();
    if (raw === "" || !isValidNumber(raw)) { showToast("Please enter a valid amount.", "error"); renderDispatchTable(); return; }
    const val = toNum(raw);
    if (val !== current) {
      if (idx >= 0) {
        const c = rd.charges[idx];
        c.amount = val;
        c.edited = true;
        if (c.formula) { delete c.formula; showToast("This charge is now a fixed amount (no longer calculated per bundle).", "warning"); }
        rd.parCharges = rd.charges.reduce((s, x) => s + toNum(x.amount), 0);
      } else {
        rd.parCharges = val;
        rd.parChargesEdited = true;
      }
      rd.grandTotal = toNum(rd.totalAmount) + toNum(rd.parCharges);
      saveExports();
      showToast("Charge updated. Report total is now " + formatINR(rd.grandTotal) + ".", "success");
    }
    renderDispatchTable();
    renderExportRegister();
  }
  input.addEventListener("keydown", (ev) => {
    ev.stopPropagation();
    if (ev.key === "Enter") { ev.preventDefault(); finish(true); }
    else if (ev.key === "Escape") { ev.preventDefault(); finish(false); }
  });
  input.addEventListener("blur", () => finish(true));
}

// Re-mark the amounts after every table draw
const __renderDispatchTableOrig = renderDispatchTable;
renderDispatchTable = function () { __renderDispatchTableOrig.apply(this, arguments); decorateChargeCells(); };
document.getElementById("sheetBody").addEventListener("click", onChargeAmountClick);
*/});

const CSS = `
/* Editable charge amounts */
.charges-cell .chg-amt{cursor:cell;padding:1px 4px;border-radius:4px;}
.charges-cell .chg-amt:hover{box-shadow:inset 0 0 0 1.5px var(--navy-600);background:#fff;}
.charges-cell .chg-amt-input{width:96px;padding:3px 6px;font:inherit;font-size:12.5px;text-align:right;border:1.5px solid var(--focus);border-radius:4px;}
`;

// Optional: highlight edited amounts on the printed report. Skipped (with a note) if the code looks different.
const MARK = `title="Corrected after this report was generated"`;
const OPTIONAL = [
  ["report charge amount", '<td class="num">${formatINR(c.amount).replace("₹", "")}</td>',
   '<td class="num">${c.edited ? `<span class="edited-mark" ' + MARK + '>${formatINR(c.amount).replace("₹", "")}</span>` : formatINR(c.amount).replace("₹", "")}</td>'],
  ["report single-charge amount", '<td class="num">${formatINR(d.parCharges || 0).replace("₹", "")}</td>',
   '<td class="num">${d.parChargesEdited ? `<span class="edited-mark" ' + MARK + '>${formatINR(d.parCharges || 0).replace("₹", "")}</span>` : formatINR(d.parCharges || 0).replace("₹", "")}</td>'],
  ["report footnote", "const hasEdits = d.rows.some(r => (r.editedFields || []).length > 0);",
   "const hasEdits = d.rows.some(r => (r.editedFields || []).length > 0) || (d.charges || []).some(c => c.edited) || !!d.parChargesEdited;"],
];

function load(f) { const raw = fs.readFileSync(f, "utf8"); return { crlf: raw.includes("\r\n"), text: raw.replace(/\r\n/g, "\n") }; }
function save(f, o, text) { fs.copyFileSync(f, f + ".charges.bak"); fs.writeFileSync(f, o.crlf ? text.replace(/\n/g, "\r\n") : text); }

const a = load("app.js");
let t = a.text;
if (t.includes("function startChargeEdit")) console.log("app.js already patched — skipped.");
else {
  if (!t.includes("function renderDispatchTable") || !t.includes("function showToast")) { console.error("STOPPED: this doesn't look like the right app.js."); process.exit(1); }
  for (const [label, find, repl] of OPTIONAL) {
    const n = t.split(find).length - 1;
    if (n === 1) t = t.replace(find, () => repl);
    else console.log(`note: "${label}" not highlighted on report (code differs) — editing still works.`);
  }
  t = t.replace(/\s*$/, "\n") + APPEND;
  save("app.js", a, t);
  console.log("app.js patched (backup: app.js.charges.bak)");
}
const c = load("styles.css");
if (c.text.includes(".chg-amt-input")) console.log("styles.css already patched — skipped.");
else { save("styles.css", c, c.text.replace(/\s*$/, "\n") + CSS); console.log("styles.css patched"); }
console.log("Done. Refresh with Ctrl+F5.");