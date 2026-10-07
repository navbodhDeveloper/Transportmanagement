// Run in the folder containing index.html, styles.css, app.js:   node patch-pagination.js
const fs = require("fs");

function block(fn) { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")).replace(/^\n/, ""); }

const NEW_FUNCS = block(function () {/*
function updateSelectionInfo(rows) {
  const count = rows.filter(r => APP.selected.has(r.id)).length;
  const pageRows = paginateRows(rows);
  const onPage = pageRows.filter(r => APP.selected.has(r.id)).length;
  document.getElementById("selectionInfo").textContent = count > 0 ? `${count} selected` : "";
  document.getElementById("selectAllCheck").checked = pageRows.length > 0 && onPage === pageRows.length;
}

const PAGE_SIZES = [5, 10, 20, 50, 100, 0];

// Slices the filtered rows into pages. Rows sharing a Bulty No. are never split across pages.
function paginateRows(rows) {
  const size = APP.pageSize;
  if (!size) { APP.page = 1; APP.totalPages = 1; APP.pageStart = 0; return rows; }
  const pages = [];
  let cur = [];
  for (let i = 0; i < rows.length;) {
    const key = (rows[i].bultyNo || "").trim().toLowerCase();
    let j = i + 1;
    if (key) while (j < rows.length && (rows[j].bultyNo || "").trim().toLowerCase() === key) j++;
    if (cur.length && cur.length + (j - i) > size) { pages.push(cur); cur = []; }
    for (let k = i; k < j; k++) cur.push(rows[k]);
    i = j;
  }
  if (cur.length) pages.push(cur);
  APP.totalPages = Math.max(1, pages.length);
  APP.page = Math.min(Math.max(1, APP.page), APP.totalPages);
  APP.pageStart = pages.slice(0, APP.page - 1).reduce((s, p) => s + p.length, 0);
  return pages[APP.page - 1] || [];
}

function renderPager(total) {
  const el = document.getElementById("pager");
  if (!el) return;
  if (!total) { el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false;
  const from = APP.pageStart + 1;
  const to = APP.pageStart + paginateRows(getFilteredRecords()).length;
  const cur = APP.page, last = APP.totalPages;
  const nums = [];
  for (let p = 1; p <= last; p++) if (p === 1 || p === last || Math.abs(p - cur) <= 1) nums.push(p);
  let btns = "", prev = 0;
  nums.forEach(p => {
    if (prev && p - prev > 1) btns += `<span class="pager-gap">…</span>`;
    btns += `<button type="button" class="pager-btn ${p === cur ? "active" : ""}" data-pg="${p}">${p}</button>`;
    prev = p;
  });
  el.innerHTML = `
    <span class="pager-info">Showing ${from}–${to} of ${total} records</span>
    <div class="pager-nav">
      <button type="button" class="pager-btn" data-pg="${cur - 1}" ${cur <= 1 ? "disabled" : ""}>‹ Previous</button>
      ${btns}
      <button type="button" class="pager-btn" data-pg="${cur + 1}" ${cur >= last ? "disabled" : ""}>Next ›</button>
    </div>
    <label class="pager-size">Rows per page
      <select id="pageSizeSelect">${PAGE_SIZES.map(n => `<option value="${n}" ${n === APP.pageSize ? "selected" : ""}>${n || "All"}</option>`).join("")}</select>
    </label>`;
}
*/});

const PAGER_EVENTS = block(function () {/*
  document.getElementById("pager").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pg]");
    if (!b || b.disabled) return;
    APP.page = Number(b.dataset.pg);
    renderDispatchTable();
    document.getElementById("sheetTable").scrollIntoView({ block: "start" });
  });
  document.getElementById("pager").addEventListener("change", (e) => {
    if (e.target.id !== "pageSizeSelect") return;
    APP.pageSize = Number(e.target.value);
    APP.page = 1;
    renderDispatchTable();
  });

*/});

const CSS = `
/* Pagination */
.pager{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:-4px 0 14px;font-size:13.5px;}
.pager[hidden]{display:none;}
.pager-info{color:var(--ink-500);font-weight:600;}
.pager-nav{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.pager-btn{min-width:38px;padding:8px 12px;border:1.5px solid var(--border-strong);background:#fff;color:var(--navy-800);font:inherit;font-weight:700;border-radius:8px;cursor:pointer;}
.pager-btn:hover:not(:disabled){background:var(--blue-50);}
.pager-btn.active{background:var(--navy-800);color:#fff;border-color:var(--navy-800);}
.pager-btn:disabled{opacity:.45;cursor:not-allowed;}
.pager-gap{padding:0 4px;color:var(--ink-500);}
.pager-size{display:flex;align-items:center;gap:8px;font-weight:600;color:var(--ink-700);}
.pager-size select{width:auto;padding:6px 10px;}
@media print{.pager{display:none !important;}}
`;

function load(f) { const raw = fs.readFileSync(f, "utf8"); return { raw, crlf: raw.includes("\r\n"), text: raw.replace(/\r\n/g, "\n") }; }
function save(f, o, text) { fs.copyFileSync(f, f + ".bak"); fs.writeFileSync(f, o.crlf ? text.replace(/\n/g, "\r\n") : text); }
function swap(text, find, repl, label) {
  const n = text.split(find).length - 1;
  if (n !== 1) { console.error(`STOPPED: could not find "${label}" exactly once (found ${n}). Nothing was changed. Use your ORIGINAL app.js (before manual pagination edits).`); process.exit(1); }
  return text.replace(find, () => repl);
}

// ---------- app.js ----------
let a = load("app.js"), t = a.text;
if (t.includes("function paginateRows")) { console.log("app.js already has pagination — skipped."); }
else {
  t = swap(t, `view: "all", // all | regular | railways | relocation`, `view: "all", // all | regular | railways | relocation\n  page: 1,\n  pageSize: 5, // 0 = show all\n  totalPages: 1,\n  pageStart: 0,`, "APP.view line");
  t = swap(t, `function applyFiltersFromInputs() {`, `function applyFiltersFromInputs() {\n  APP.page = 1;`, "applyFiltersFromInputs");
  t = swap(t, `function resetFilters() {`, `function resetFilters() {\n  APP.page = 1;`, "resetFilters");
  t = swap(t, `APP.view = btn.dataset.view;`, `APP.view = btn.dataset.view;\n    APP.page = 1;`, "view tab click");
  t = swap(t, `const key = th.dataset.key;`, `const key = th.dataset.key;\n      APP.page = 1;`, "sort click");
  t = swap(t, `document.getElementById("selectAllCheck").addEventListener("change", (e) => {\n    const rows = getFilteredRecords();`, `document.getElementById("selectAllCheck").addEventListener("change", (e) => {\n    const rows = paginateRows(getFilteredRecords());`, "select-all handler");
  t = swap(t, `  setupExportExcelDropdown();\n`, PAGER_EVENTS + `  setupExportExcelDropdown();\n`, "setupExportExcelDropdown call");
  t = swap(t, `function renderDispatchTable() {\n  const rows = getFilteredRecords();`, `function renderDispatchTable() {\n  const all = getFilteredRecords();\n  const rows = paginateRows(all); // only the current page is drawn`, "renderDispatchTable start");
  t = swap(t, `  document.getElementById("filterResultCount").textContent = rows.length\n    ? \`Showing \${rows.length} of \${APP.records.length} records\`\n    : "";\n\n  renderViewTabs();\n  updateSelectionInfo(rows);\n  renderSummaryBar(rows);\n  bindRowEvents();`,
    `  document.getElementById("filterResultCount").textContent = all.length\n    ? \`Showing \${all.length} of \${APP.records.length} records\`\n    : "";\n\n  renderViewTabs();\n  updateSelectionInfo(all);\n  renderSummaryBar(all);\n  renderPager(all.length);\n  bindRowEvents();`, "renderDispatchTable end");
  t = swap(t, `function updateSelectionInfo(rows) {\n  const count = rows.filter(r => APP.selected.has(r.id)).length;\n  document.getElementById("selectionInfo").textContent = count > 0 ? \`\${count} selected\` : "";\n  document.getElementById("selectAllCheck").checked = rows.length > 0 && count === rows.length;\n}\n`, NEW_FUNCS, "updateSelectionInfo");
  save("app.js", a, t); console.log("app.js patched (backup: app.js.bak)");
}

// ---------- index.html ----------
let h = load("index.html");
if (h.text.includes('id="pager"')) console.log("index.html already has pager — skipped.");
else { save("index.html", h, swap(h.text, `<!-- Summary bar -->`, `<div class="pager" id="pager" hidden></div>\n\n        <!-- Summary bar -->`, "Summary bar comment")); console.log("index.html patched (backup: index.html.bak)"); }

// ---------- styles.css ----------
let c = load("styles.css");
if (c.text.includes(".pager{")) console.log("styles.css already has pager — skipped.");
else { save("styles.css", c, c.text.replace(/\s*$/, "\n") + CSS); console.log("styles.css patched (backup: styles.css.bak)"); }
console.log("Done. Refresh the page with Ctrl+F5.");