// Run in the folder with app.js:   node patch-cargo-excel.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Cargo Entry: Import Excel / Export Excel =====
function cargoExportExcel() {
  const cargo = getActiveCargo();
  if (!cargo) return;
  const entries = APP.cargoEntries.filter(e => e.cargoId === cargo.id);
  if (!entries.length) { showToast("There are no entries to export.", "error"); return; }
  const data = entries.map((e, i) => {
    const row = {
      "SE. NO": i + 1,
      "DATE OF BOOKING": formatDateDMY(e.dateBooking),
      "PARTY / SCHOOL NAME": e.party,
      "AREA": e.area,
      "INV. NO.": e.invNo,
      "NO OF BDL": e.bundles,
      "BILTY NO": e.bultyNo,
      "AMOUNT": e.amount,
    };
    if (cargo.hasMarking) {
      row["MARKING CHARGE"] = e.markingCharge || 0;
      row["TOTAL AMOUNT"] = cargoRowTotal(e.amount, e.markingCharge);
    }
    row["REPORT STATUS"] = e.reportNo ? "Report " + e.reportNo : "";
    return row;
  });
  const safe = cargo.name.replace(/[^\w\-]+/g, "_");
  const filename = `cargo-${safe}-${todayISO()}.xlsx`;
  if (typeof XLSX !== "undefined") {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cargo Entries");
    XLSX.writeFile(wb, filename);
  } else {
    const headers = Object.keys(data[0]);
    const csv = [headers.join(",")]
      .concat(data.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = filename.replace(".xlsx", ".csv");
    a.click();
    URL.revokeObjectURL(a.href);
  }
  showToast(`${entries.length} entr${entries.length === 1 ? "y" : "ies"} exported to Excel.`, "success");
}

function parseCargoMatrix(matrix) {
  const out = [];
  let ci = null, mk = -1;
  for (const row of matrix) {
    const cand = buildColumnIndex(row);
    if (cand.party !== undefined && cand.amount !== undefined) {
      ci = cand;
      mk = (row || []).map(normHeaderLabel).findIndex(h => h === "marking charge" || h === "marking");
      continue;
    }
    if (!ci) continue;
    const get = k => ci[k] !== undefined ? row[ci[k]] : "";
    const party = String(get("party") || "").trim();
    if (!party || LEDGER_SKIP_LINE.test(party)) continue;
    if (!isValidImportNumber(get("amount"))) continue;
    out.push({
      dateBooking: normalizeImportedDate(get("dateBooking")),
      party,
      area: String(get("area") || "").trim(),
      invNo: String(get("invNo") || "").replace(/[\r\n]+/g, ", ").trim(),
      bundles: toNumImport(get("bundles")),
      bultyNo: String(get("bultyNo") || "").trim(),
      amount: toNumImport(get("amount")),
      markingCharge: mk >= 0 ? toNumImport(row[mk]) : 0,
    });
  }
  return out;
}

function handleCargoImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const cargo = getActiveCargo();
  if (!cargo) return;
  const isCSV = /\.csv$/i.test(file.name);
  const reader = new FileReader();
  reader.onload = function (evt) {
    let rows = [];
    try {
      if (!isCSV && typeof XLSX !== "undefined") {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        wb.SheetNames.forEach(n => {
          rows = rows.concat(parseCargoMatrix(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: "" })));
        });
      } else {
        const text = typeof evt.target.result === "string" ? evt.target.result : new TextDecoder().decode(evt.target.result);
        rows = parseCargoMatrix(parseCSV(text));
      }
    } catch (err) {
      console.error(err);
      showToast("Could not read this file. Please check the format and try again.", "error");
      return;
    }
    if (!rows.length) { showToast("No recognizable cargo entries were found in this file.", "error"); return; }
    const key = r => [r.party, r.invNo, r.bultyNo, r.amount].join("|").toUpperCase();
    const have = new Set(APP.cargoEntries.filter(x => x.cargoId === cargo.id).map(key));
    const fresh = rows.filter(r => { const k = key(r); if (have.has(k)) return false; have.add(k); return true; });
    const skipped = rows.length - fresh.length;
    if (!fresh.length) { showToast("All rows already exist in this cargo. Nothing imported.", "warning"); return; }
    if (!confirm(`Import ${fresh.length} entr${fresh.length === 1 ? "y" : "ies"} into ${cargo.name}?` + (skipped ? `\n(${skipped} duplicate row(s) will be skipped.)` : ""))) return;
    fresh.forEach(r => APP.cargoEntries.push({
      id: uid("ce"), cargoId: cargo.id, reportNo: null, reportId: null, ...r,
      markingCharge: cargo.hasMarking ? r.markingCharge : 0,
    }));
    saveCargoEntries();
    renderCargoPage();
    showToast(`Imported ${fresh.length} entr${fresh.length === 1 ? "y" : "ies"}.` + (skipped ? ` Skipped ${skipped} duplicate(s).` : ""), "success");
  };
  if (isCSV) reader.readAsText(file); else reader.readAsArrayBuffer(file);
}

(function setupCargoExcelButtons() {
  const bar = document.querySelector("#cargoWrap .action-bar");
  const addBtn = document.getElementById("btnAddCargoEntry");
  if (!bar || !addBtn || document.getElementById("btnCargoImport")) return;
  const mk = (id, label, svg) => {
    const b = document.createElement("button");
    b.className = "btn btn-secondary"; b.id = id;
    b.innerHTML = svg + " " + label;
    return b;
  };
  const icn = p => `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const imp = mk("btnCargoImport", "Import Excel", icn('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'));
  const exp = mk("btnCargoExport", "Export Excel", icn('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'));
  const fi = document.createElement("input");
  fi.type = "file"; fi.id = "cargoImportInput"; fi.accept = ".xlsx,.xls,.csv"; fi.hidden = true;
  addBtn.insertAdjacentElement("afterend", exp);
  addBtn.insertAdjacentElement("afterend", imp);
  bar.appendChild(fi);
  imp.addEventListener("click", () => { fi.value = ""; fi.click(); });
  fi.addEventListener("change", handleCargoImportFile);
  exp.addEventListener("click", cargoExportExcel);
})();
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("btnCargoImport")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["buildColumnIndex", "normalizeImportedDate", "toNumImport", "isValidImportNumber", "saveCargoEntries", "renderCargoPage", "getActiveCargo"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.cargoexcel.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.cargoexcel.bak). Refresh with Ctrl+F5.");