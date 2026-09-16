/* =========================================================
   BOOK TRANSPORT & DISPATCH MANAGEMENT — APP LOGIC
   ========================================================= */

const RECORD_FIELDS = [
  { key: "dateBooking", label: "Date of Booking", type: "date", required: true },
  { key: "dateEntry", label: "Date of Entry (Vikry/Pete)", type: "date" },
  { key: "party", label: "Party / School Name", type: "text", required: true },
  { key: "area", label: "Area", type: "text-list", list: "areaListOptions" },
  { key: "invNo", label: "Inv. No.", type: "text" },
  { key: "bundles", label: "No of Bundles", type: "number" },
  { key: "transport", label: "Transport", type: "text-list", list: "transporterListOptions" },
  { key: "bultyNo", label: "Bulty No", type: "text" },
  { key: "amount", label: "Amount", type: "number" },
  { key: "voucherSrlNo", label: "Voucher Srl Number", type: "text" },
  { key: "voucherNo", label: "Voucher No", type: "text" },
  { key: "driver", label: "Driver", type: "text-list", list: "driverListOptions" },
];

const APP = {
  records: [],
  expenses: [],
  exports: [],
  drivers: [],
  transporters: [],
  settings: {},
  filters: { from: "", to: "", driver: "", mode: "", transporter: "", area: "", search: "" },
  sort: { key: "srlNo", dir: "asc" },
  selected: new Set(),
  pendingDeleteFn: null,
  pendingImportRows: null,
  pendingExportBatch: null,
  editingRecordId: null,
  editingDriverId: null,
  editingTransporterId: null,
  editingExportNo: null,
};

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

function init() {
  loadState();
  setupNav();
  setupModals();
  setupDispatchPage();
  setupExpensePage();
  setupMastersPage();
  setupSettingsPage();
  setupExportRegisterPage();
  renderAll();
}

function loadState() {
  const seeded = Store.get(STORE_KEYS.seeded, false);
  if (!seeded) {
    APP.records = SEED_DISPATCH_RECORDS.map(r => ({
      id: uid("rec"),
      exportStatus: "Not Exported",
      exportNo: null,
      voucherSrlNo: "",
      voucherNo: "",
      ...r,
    }));
    APP.drivers = SEED_DRIVERS.slice();
    APP.transporters = SEED_TRANSPORTERS.slice();
    APP.expenses = [];
    APP.exports = [];
    APP.settings = { ...DEFAULT_SETTINGS };
    persistAll();
    Store.set(STORE_KEYS.seeded, true);
  } else {
    APP.records = Store.get(STORE_KEYS.records, []);
    APP.expenses = Store.get(STORE_KEYS.expenses, []);
    APP.exports = Store.get(STORE_KEYS.exports, []);
    APP.drivers = Store.get(STORE_KEYS.drivers, SEED_DRIVERS.slice());
    APP.transporters = Store.get(STORE_KEYS.transporters, SEED_TRANSPORTERS.slice());
    APP.settings = { ...DEFAULT_SETTINGS, ...Store.get(STORE_KEYS.settings, {}) };
  }
}

function persistAll() {
  Store.set(STORE_KEYS.records, APP.records);
  Store.set(STORE_KEYS.expenses, APP.expenses);
  Store.set(STORE_KEYS.exports, APP.exports);
  Store.set(STORE_KEYS.drivers, APP.drivers);
  Store.set(STORE_KEYS.transporters, APP.transporters);
  Store.set(STORE_KEYS.settings, APP.settings);
}

let saveTimer = null;
function markSaving() {
  const ind = document.getElementById("saveIndicator");
  ind.classList.add("is-saving");
  ind.querySelector("span").textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    ind.classList.remove("is-saving");
    ind.querySelector("span").textContent = "All changes saved";
  }, 450);
}

function saveRecords() { Store.set(STORE_KEYS.records, APP.records); markSaving(); }
function saveExpenses() { Store.set(STORE_KEYS.expenses, APP.expenses); markSaving(); }
function saveExports() { Store.set(STORE_KEYS.exports, APP.exports); markSaving(); }
function saveDrivers() { Store.set(STORE_KEYS.drivers, APP.drivers); markSaving(); }
function saveTransporters() { Store.set(STORE_KEYS.transporters, APP.transporters); markSaving(); }
function saveSettings() { Store.set(STORE_KEYS.settings, APP.settings); markSaving(); }

function renderAll() {
  renderMasterOptions();
  renderDashboard();
  renderDispatchTable();
  renderExpenseTable();
  renderExportRegister();
  renderDriverTable();
  renderTransporterTable();
  loadSettingsForm();
}

/* ================= TOASTS ================= */
function showToast(message, type) {
  const stack = document.getElementById("toastStack");
  const el = document.createElement("div");
  el.className = "toast" + (type ? " toast-" + type : "");
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .25s ease";
    setTimeout(() => el.remove(), 260);
  }, 3200);
}

/* ================= NAVIGATION ================= */
function setupNav() {
  document.querySelectorAll(".nav-item[data-page]").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });
  document.querySelectorAll("[data-page]").forEach(el => {
    if (!el.classList.contains("nav-item")) {
      el.addEventListener("click", () => showPage(el.dataset.page));
    }
  });

  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("sidebarScrim");
  menuToggle.addEventListener("click", () => {
    sidebar.classList.add("is-open");
    scrim.classList.add("is-open");
  });
  scrim.addEventListener("click", () => {
    sidebar.classList.remove("is-open");
    scrim.classList.remove("is-open");
  });
}

const PAGE_TITLES = {
  dashboard: ["Dashboard", "Book Publication & Distribution System"],
  dispatch: ["Dispatch Records", "Book Publication & Distribution System"],
  expenses: ["Transport Expenses", "Book Publication & Distribution System"],
  exports: ["Export Register", "Book Publication & Distribution System"],
  masters: ["Masters", "Book Publication & Distribution System"],
  settings: ["Settings", "Book Publication & Distribution System"],
};

function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("is-active"));
  document.getElementById("page-" + name).classList.add("is-active");
  document.querySelectorAll(".nav-item[data-page]").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.page === name);
  });
  document.getElementById("sidebar").classList.remove("is-open");
  document.getElementById("sidebarScrim").classList.remove("is-open");
  if (name === "dashboard") renderDashboard();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/* ================= MODALS ================= */
function setupModals() {
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", (e) => { if (e.target === ov) closeModal(ov.id); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay:not([hidden])").forEach(ov => closeModal(ov.id));
    }
  });
}
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

/* =========================================================
   MASTER OPTIONS (dropdowns, datalists) — rebuilt whenever
   drivers / transporters / areas change
   ========================================================= */
function renderMasterOptions() {
  const activeDrivers = APP.drivers.filter(d => d.status !== "Inactive");
  const activeTransporters = APP.transporters.filter(t => t.status !== "Inactive");
  const areas = [...new Set(APP.records.map(r => r.area).filter(Boolean))].sort();

  // Filter bar selects
  fillSelect("fDriver", activeDrivers.map(d => d.name), "All Drivers");
  fillSelect("fMode", TRANSPORT_MODES, "All Modes");
  fillSelect("fTransporter", activeTransporters.map(t => t.name), "All Transporters");
  fillSelect("fArea", areas, "All Areas");

  // Settings selects
  fillSelect("setDefaultDriver", activeDrivers.map(d => d.name), "None");
  fillSelect("setDefaultMode", TRANSPORT_MODES, null);

  // Transporter mode select (masters modal)
  fillSelect("trnMode", TRANSPORT_MODES, null);

  // Datalists
  fillDatalist("driverListOptions", activeDrivers.map(d => d.name));
  fillDatalist("transporterListOptions", activeTransporters.map(t => t.name));
  fillDatalist("areaListOptions", areas);
  fillDatalist("modeListOptions", TRANSPORT_MODES);
}

function fillSelect(id, values, placeholderLabel) {
  const sel = document.getElementById(id);
  const prevValue = sel.value;
  sel.innerHTML = "";
  if (placeholderLabel !== null) {
    const opt = document.createElement("option");
    opt.value = ""; opt.textContent = placeholderLabel;
    sel.appendChild(opt);
  }
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
  if (values.includes(prevValue) || prevValue === "") sel.value = prevValue;
}

function fillDatalist(id, values) {
  const dl = document.getElementById(id);
  dl.innerHTML = values.map(v => `<option value="${escapeHtml(v)}">`).join("");
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function renderDashboard() {
  const records = APP.records;
  const totalBundles = records.reduce((s, r) => s + toNum(r.bundles), 0);
  const totalAmount = records.reduce((s, r) => s + toNum(r.amount), 0);
  const exported = records.filter(r => r.exportStatus === "Exported").length;
  const pending = records.length - exported;

  document.getElementById("statTotalRecords").textContent = formatNumber(records.length);
  document.getElementById("statTotalBundles").textContent = formatNumber(totalBundles);
  document.getElementById("statTotalAmount").textContent = formatINR(totalAmount);
  document.getElementById("statExported").textContent = formatNumber(exported);
  document.getElementById("statPending").textContent = formatNumber(pending);

  // Mode bars — derive mode via transporter lookup, fallback "Other"
  const modeCounts = {};
  TRANSPORT_MODES.forEach(m => modeCounts[m] = 0);
  records.forEach(r => {
    const mode = getModeForTransportName(r.transport) || "Other";
    modeCounts[mode] = (modeCounts[mode] || 0) + 1;
  });
  const maxCount = Math.max(1, ...Object.values(modeCounts));
  const wrap = document.getElementById("modeBars");
  wrap.innerHTML = Object.entries(modeCounts)
    .filter(([, c]) => c > 0)
    .map(([mode, c]) => `
      <div class="mode-row">
        <span class="mode-name">${escapeHtml(mode)}</span>
        <span class="mode-track"><span class="mode-fill" style="width:${(c / maxCount * 100).toFixed(0)}%"></span></span>
        <span class="mode-count">${c}</span>
      </div>`).join("") || `<p style="color:var(--ink-500);font-size:13.5px;">No records yet.</p>`;

  // Recent records
  const recent = [...records].sort((a, b) => (b.dateBooking || "").localeCompare(a.dateBooking || "")).slice(0, 6);
  const tbody = document.querySelector("#recentTable tbody");
  tbody.innerHTML = recent.map(r => `
    <tr>
      <td>${escapeHtml(formatDateDMY(r.dateBooking))}</td>
      <td>${escapeHtml(r.party)}</td>
      <td>${escapeHtml(r.area)}</td>
      <td>${formatINR(r.amount)}</td>
      <td>${statusBadge(r.exportStatus)}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--ink-500);padding:20px;">No records yet.</td></tr>`;
}

function getModeForTransportName(transportName) {
  const t = APP.transporters.find(t => t.name.toLowerCase() === (transportName || "").toLowerCase());
  return t ? t.mode : null;
}

function statusBadge(status) {
  if (status === "Exported") return `<span class="badge badge-exported">Exported</span>`;
  return `<span class="badge badge-pending">Not Exported</span>`;
}

/* =========================================================
   DISPATCH RECORDS PAGE
   ========================================================= */
function setupDispatchPage() {
  document.getElementById("btnApplyFilter").addEventListener("click", applyFiltersFromInputs);
  document.getElementById("btnResetFilter").addEventListener("click", resetFilters);
  document.getElementById("btnEmptyReset").addEventListener("click", resetFilters);
  document.getElementById("fSearch").addEventListener("input", debounce(applyFiltersFromInputs, 300));
  ["fFromDate", "fToDate", "fDriver", "fMode", "fTransporter", "fArea"].forEach(id => {
    document.getElementById(id).addEventListener("change", applyFiltersFromInputs);
  });

  document.getElementById("btnAddRow").addEventListener("click", () => openRecordModal(null));
  document.getElementById("btnSaveRecord").addEventListener("click", saveRecordFromModal);

  document.getElementById("btnExportReport").addEventListener("click", startExportFlow);
  document.getElementById("btnConfirmExport").addEventListener("click", confirmExport);

  document.getElementById("btnPrintTable").addEventListener("click", printDispatchTable);

  document.getElementById("selectAllCheck").addEventListener("change", (e) => {
    const rows = getFilteredRecords();
    if (e.target.checked) rows.forEach(r => APP.selected.add(r.id));
    else rows.forEach(r => APP.selected.delete(r.id));
    renderDispatchTable();
  });

  document.querySelectorAll("#sheetTable thead th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (APP.sort.key === key) APP.sort.dir = APP.sort.dir === "asc" ? "desc" : "asc";
      else { APP.sort.key = key; APP.sort.dir = "asc"; }
      renderDispatchTable();
    });
  });

  // Excel import/export
  document.getElementById("btnImportExcel").addEventListener("click", () => {
    document.getElementById("importFileInput").value = "";
    document.getElementById("importPreviewWrap").hidden = true;
    document.getElementById("btnConfirmImport").disabled = true;
    APP.pendingImportRows = null;
    openModal("modalImport");
  });
  document.getElementById("importFileInput").addEventListener("change", handleImportFile);
  document.getElementById("btnConfirmImport").addEventListener("click", confirmImport);

  setupExportExcelDropdown();

  // Delete confirm
  document.getElementById("btnConfirmDelete").addEventListener("click", () => {
    if (typeof APP.pendingDeleteFn === "function") APP.pendingDeleteFn();
    closeModal("modalDelete");
  });

  // Report print
  document.getElementById("btnPrintReport").addEventListener("click", () => window.print());
}

function setupExportExcelDropdown() {
  const btn = document.getElementById("btnExportExcel");
  const wrap = document.createElement("div");
  wrap.className = "dropdown-wrap";
  btn.parentNode.insertBefore(wrap, btn);
  wrap.appendChild(btn);
  const menu = document.createElement("div");
  menu.className = "dropdown-menu";
  menu.hidden = true;
  menu.innerHTML = `
    <button type="button" data-scope="filtered">Export Filtered Records</button>
    <button type="button" data-scope="all">Export All Records</button>`;
  wrap.appendChild(menu);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  menu.addEventListener("click", (e) => {
    const scope = e.target.dataset.scope;
    if (scope) { exportExcel(scope); menu.hidden = true; }
  });
  document.addEventListener("click", () => { menu.hidden = true; });
}

/* ---------- Filtering ---------- */
function applyFiltersFromInputs() {
  APP.filters.from = document.getElementById("fFromDate").value;
  APP.filters.to = document.getElementById("fToDate").value;
  APP.filters.driver = document.getElementById("fDriver").value;
  APP.filters.mode = document.getElementById("fMode").value;
  APP.filters.transporter = document.getElementById("fTransporter").value;
  APP.filters.area = document.getElementById("fArea").value;
  APP.filters.search = document.getElementById("fSearch").value.trim().toLowerCase();
  renderDispatchTable();
}

function resetFilters() {
  APP.filters = { from: "", to: "", driver: "", mode: "", transporter: "", area: "", search: "" };
  document.getElementById("fFromDate").value = "";
  document.getElementById("fToDate").value = "";
  document.getElementById("fDriver").value = "";
  document.getElementById("fMode").value = "";
  document.getElementById("fTransporter").value = "";
  document.getElementById("fArea").value = "";
  document.getElementById("fSearch").value = "";
  renderDispatchTable();
}

function getFilteredRecords() {
  const f = APP.filters;
  let out = APP.records.filter(r => {
    if (f.from && (r.dateBooking || "") < f.from) return false;
    if (f.to && (r.dateBooking || "") > f.to) return false;
    if (f.driver && r.driver !== f.driver) return false;
    if (f.mode && getModeForTransportName(r.transport) !== f.mode) return false;
    if (f.transporter && r.transport !== f.transporter) return false;
    if (f.area && r.area !== f.area) return false;
    if (f.search) {
      const hay = [r.party, r.area, r.invNo, r.bultyNo, r.transport, r.driver].join(" ").toLowerCase();
      if (!hay.includes(f.search)) return false;
    }
    return true;
  });

  const { key, dir } = APP.sort;
  out.sort((a, b) => {
    let va = a[key], vb = b[key];
    if (key === "amount" || key === "bundles" || key === "srlNo") { va = toNum(va); vb = toNum(vb); }
    else { va = (va || "").toString().toLowerCase(); vb = (vb || "").toString().toLowerCase(); }
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
  return out;
}

/* ---------- Table rendering ---------- */
function renderDispatchTable() {
  const rows = getFilteredRecords();
  const tbody = document.getElementById("sheetBody");
  const emptyState = document.getElementById("dispatchEmpty");
  const scroll = document.getElementById("sheetScroll");

  document.querySelectorAll("#sheetTable thead th.sortable").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.key === APP.sort.key) th.classList.add(APP.sort.dir === "asc" ? "sort-asc" : "sort-desc");
  });

  if (rows.length === 0) {
    tbody.innerHTML = "";
    emptyState.hidden = false;
    document.getElementById("sheetTable").style.display = "none";
  } else {
    document.getElementById("sheetTable").style.display = "";
    emptyState.hidden = true;
    tbody.innerHTML = rows.map(r => rowHTML(r)).join("");
  }

  document.getElementById("filterResultCount").textContent = rows.length
    ? `Showing ${rows.length} of ${APP.records.length} records`
    : "";

  updateSelectionInfo(rows);
  renderSummaryBar(rows);
  bindRowEvents();
}

function rowHTML(r) {
  const selected = APP.selected.has(r.id) ? "is-selected" : "";
  const exportedClass = r.exportStatus === "Exported" ? "is-exported" : "";
  const cell = (field, display, extraClass) => `<td data-field="${field}" class="editable-cell ${extraClass || ""}" title="Click to edit"><div class="cell-inner">${display}</div></td>`;
  return `
  <tr data-id="${r.id}" class="${selected} ${exportedClass}">
    <td class="col-check"><input type="checkbox" class="row-check" ${APP.selected.has(r.id) ? "checked" : ""}></td>
    <td class="row-index">${r.srlNo}</td>
    ${cell("dateBooking", escapeHtml(formatDateDMY(r.dateBooking)))}
    ${cell("dateEntry", escapeHtml(formatDateDMY(r.dateEntry)))}
    ${cell("party", escapeHtml(r.party))}
    ${cell("area", escapeHtml(r.area))}
    ${cell("invNo", escapeHtml(r.invNo))}
    ${cell("bundles", formatNumber(r.bundles), "num-cell")}
    ${cell("transport", escapeHtml(r.transport))}
    ${cell("bultyNo", escapeHtml(r.bultyNo))}
    ${cell("amount", formatINR(r.amount), "num-cell")}
    ${cell("voucherSrlNo", escapeHtml(r.voucherSrlNo))}
    ${cell("voucherNo", escapeHtml(r.voucherNo))}
    ${cell("driver", escapeHtml(r.driver))}
    <td>${statusBadge(r.exportStatus)}</td>
    <td class="col-actions">
      <div class="cell-actions">
        <button class="icon-btn btn-sm" data-action="edit" title="Edit row">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button class="icon-btn btn-sm" data-action="duplicate" title="Duplicate row">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="icon-btn btn-sm" data-action="delete" title="Delete row">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function bindRowEvents() {
  const tbody = document.getElementById("sheetBody");
  tbody.querySelectorAll("tr").forEach(tr => {
    const id = tr.dataset.id;

    // Click any spreadsheet cell to edit it inline, spreadsheet-style
    tr.querySelectorAll("td.editable-cell").forEach(td => {
      td.addEventListener("click", () => {
        if (td.querySelector(".cell-edit-input")) return;
        const record = APP.records.find(r => r.id === id);
        const field = td.dataset.field;
        const fieldDef = RECORD_FIELDS.find(f => f.key === field);
        startCellEdit(td, record, field, fieldDef.type);
      });
    });

    tr.querySelector(".row-check").addEventListener("change", (e) => {
      if (e.target.checked) APP.selected.add(id); else APP.selected.delete(id);
      tr.classList.toggle("is-selected", e.target.checked);
      updateSelectionInfo(getFilteredRecords());
    });

    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openRecordModal(id));
    tr.querySelector('[data-action="duplicate"]').addEventListener("click", () => duplicateRecord(id));
    tr.querySelector('[data-action="delete"]').addEventListener("click", () => {
      APP.pendingDeleteFn = () => deleteRecord(id);
      document.getElementById("modalDeleteText").textContent = "This record will be removed from the master sheet.";
      openModal("modalDelete");
    });
  });
}

const CELL_FIELD_ORDER = RECORD_FIELDS.map(f => f.key);

function startCellEdit(td, record, field, type) {
  const fieldDef = RECORD_FIELDS.find(f => f.key === field);
  const currentValue = record[field] ?? "";
  let inputEl;

  if (type === "date") {
    td.innerHTML = `<input type="date" class="cell-edit-input" value="${escapeHtml(currentValue)}">`;
  } else if (type === "number") {
    td.innerHTML = `<input type="number" min="0" step="0.01" class="cell-edit-input" value="${currentValue === "" ? 0 : currentValue}">`;
  } else if (type === "text-list") {
    td.innerHTML = `<input type="text" list="${fieldDef.list}" class="cell-edit-input" value="${escapeHtml(currentValue)}">`;
  } else {
    td.innerHTML = `<input type="text" class="cell-edit-input" value="${escapeHtml(currentValue)}">`;
  }
  inputEl = td.querySelector(".cell-edit-input");
  inputEl.focus();
  if (inputEl.select) inputEl.select();

  let committed = false;
  function commit(moveDir) {
    if (committed) return;
    committed = true;
    let val = inputEl.value;
    if (type === "number") {
      if (val !== "" && !isValidNumber(val)) {
        showToast(field === "amount" ? "Please enter a valid amount." : "Please enter a valid number.", "error");
        val = record[field];
      } else {
        val = toNum(val);
      }
    }
    if (field === "invNo") {
      const dupes = findDuplicateInvoiceNumbers(val, record.id);
      if (dupes.length) {
        showToast(`Invoice No. "${dupes.join(", ")}" already exists on another record. Please use a unique invoice number.`, "error");
        renderDispatchTable();
        return;
      }
    }
    record[field] = val;
    saveRecords();
    renderMasterOptions();
    renderDispatchTable();
    renderDashboard();
    if (moveDir) focusCell(record.id, field, moveDir);
  }

  inputEl.addEventListener("blur", () => commit(null));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit("down"); }
    else if (e.key === "Tab") { e.preventDefault(); commit(e.shiftKey ? "left" : "right"); }
    else if (e.key === "Escape") { e.preventDefault(); committed = true; renderDispatchTable(); }
  });
}

function focusCell(recordId, field, dir) {
  let row = document.querySelector(`#sheetBody tr[data-id="${recordId}"]`);
  if (!row) return;
  let idx = CELL_FIELD_ORDER.indexOf(field);

  if (dir === "right") {
    idx++;
    if (idx >= CELL_FIELD_ORDER.length) { idx = 0; row = row.nextElementSibling; }
  } else if (dir === "left") {
    idx--;
    if (idx < 0) { idx = CELL_FIELD_ORDER.length - 1; row = row.previousElementSibling; }
  } else if (dir === "down") {
    row = row.nextElementSibling;
  }
  if (!row) return;
  const nextField = CELL_FIELD_ORDER[idx];
  const td = row.querySelector(`td[data-field="${nextField}"]`);
  const nextRecord = APP.records.find(r => r.id === row.dataset.id);
  if (td && nextRecord) {
    const fieldDef = RECORD_FIELDS.find(f => f.key === nextField);
    startCellEdit(td, nextRecord, nextField, fieldDef.type);
  }
}

function updateSelectionInfo(rows) {
  const count = rows.filter(r => APP.selected.has(r.id)).length;
  document.getElementById("selectionInfo").textContent = count > 0 ? `${count} selected` : "";
  document.getElementById("selectAllCheck").checked = rows.length > 0 && count === rows.length;
}

function renderSummaryBar(rows) {
  const totalBundles = rows.reduce((s, r) => s + toNum(r.bundles), 0);
  const totalAmount = rows.reduce((s, r) => s + toNum(r.amount), 0);
  document.getElementById("sumRecords").textContent = formatNumber(rows.length);
  document.getElementById("sumBundles").textContent = formatNumber(totalBundles);
  document.getElementById("sumAmount").textContent = formatINR(totalAmount);
}

/* ---------- Add / Edit record modal ---------- */
function openRecordModal(id) {
  APP.editingRecordId = id;
  const record = id ? APP.records.find(r => r.id === id) : null;
  document.getElementById("modalRecordTitle").textContent = record ? `Edit Record — SRL ${record.srlNo}` : "Add Dispatch Record";

  const grid = document.getElementById("recordFormGrid");
  grid.innerHTML = RECORD_FIELDS.map(f => fieldHTML(f, record)).join("");
  openModal("modalRecord");
  const firstInput = grid.querySelector("input, select");
  if (firstInput) setTimeout(() => firstInput.focus(), 30);
}

function fieldHTML(f, record) {
  const value = record ? (record[f.key] ?? "") : (f.key === "driver" ? APP.settings.defaultDriver || "" : "");
  const id = "rf_" + f.key;
  const req = f.required ? "required" : "";
  if (f.type === "date") {
    return `<div class="field"><label for="${id}">${f.label}</label><input type="date" id="${id}" ${req} value="${escapeHtml(value)}"></div>`;
  }
  if (f.type === "number") {
    return `<div class="field"><label for="${id}">${f.label}</label><input type="number" id="${id}" min="0" step="0.01" ${req} value="${escapeHtml(value)}"></div>`;
  }
  if (f.type === "text-list") {
    return `<div class="field"><label for="${id}">${f.label}</label><input type="text" id="${id}" list="${f.list}" ${req} value="${escapeHtml(value)}"></div>`;
  }
  return `<div class="field"><label for="${id}">${f.label}</label><input type="text" id="${id}" ${req} value="${escapeHtml(value)}"></div>`;
}

/* ---------- Invoice No. duplicate check ---------- */
// Invoice numbers can be comma-separated (e.g. "CB5620, CB5649"). This checks
// each individual invoice number against every other record in the system.
function getExistingInvoiceNumbers(excludeRecordId) {
  const set = new Set();
  APP.records.forEach(r => {
    if (r.id === excludeRecordId) return;
    (r.invNo || "").split(",").forEach(tok => {
      const t = tok.trim().toUpperCase();
      if (t) set.add(t);
    });
  });
  return set;
}

function findDuplicateInvoiceNumbers(invNoString, excludeRecordId) {
  const existing = getExistingInvoiceNumbers(excludeRecordId);
  const tokens = (invNoString || "").split(",").map(t => t.trim()).filter(Boolean);
  const seenHere = new Set();
  const dupes = [];
  tokens.forEach(t => {
    const key = t.toUpperCase();
    if (existing.has(key) || seenHere.has(key)) dupes.push(t);
    seenHere.add(key);
  });
  return dupes;
}

function saveRecordFromModal() {
  const data = {};
  for (const f of RECORD_FIELDS) {
    const el = document.getElementById("rf_" + f.key);
    let val = el.value;
    if (f.type === "number") {
      if (val !== "" && !isValidNumber(val)) {
        showToast(f.key === "amount" ? "Please enter a valid amount." : "Please enter a valid number.", "error");
        el.focus();
        return;
      }
      val = toNum(val);
    }
    if (f.required && (val === "" || val === null)) {
      showToast(`${f.label} is required.`, "error");
      el.focus();
      return;
    }
    data[f.key] = val;
  }

  const dupInvoices = findDuplicateInvoiceNumbers(data.invNo, APP.editingRecordId);
  if (dupInvoices.length) {
    showToast(`Invoice No. "${dupInvoices.join(", ")}" already exists on another record. Please use a unique invoice number.`, "error");
    document.getElementById("rf_invNo").focus();
    return;
  }

  if (APP.editingRecordId) {
    const rec = APP.records.find(r => r.id === APP.editingRecordId);
    Object.assign(rec, data);
    showToast("Changes saved.", "success");
  } else {
    const nextSrl = APP.records.reduce((m, r) => Math.max(m, toNum(r.srlNo)), 0) + 1;
    APP.records.push({
      id: uid("rec"),
      srlNo: nextSrl,
      exportStatus: "Not Exported",
      exportNo: null,
      ...data,
    });
    showToast("Record added successfully.", "success");
  }
  saveRecords();
  renderMasterOptions();
  closeModal("modalRecord");
  renderDispatchTable();
  renderDashboard();
}

function duplicateRecord(id) {
  const rec = APP.records.find(r => r.id === id);
  if (!rec) return;
  const nextSrl = APP.records.reduce((m, r) => Math.max(m, toNum(r.srlNo)), 0) + 1;
  const copy = { ...rec, id: uid("rec"), srlNo: nextSrl, exportStatus: "Not Exported", exportNo: null };
  APP.records.push(copy);
  saveRecords();
  renderDispatchTable();
  renderDashboard();
  showToast("Row duplicated.", "success");
}

function deleteRecord(id) {
  APP.records = APP.records.filter(r => r.id !== id);
  APP.selected.delete(id);
  saveRecords();
  renderDispatchTable();
  renderDashboard();
  renderMasterOptions();
  showToast("Record deleted.", "success");
}

/* ---------- Print (plain table) ---------- */
function printDispatchTable() {
  const rows = getFilteredRecords();
  const headers = ["SRL", "Date of Booking", "Party / School", "Area", "Inv. No.", "Bundles", "Transport", "Bulty No", "Amount", "Driver", "Status"];
  const bodyRows = rows.map(r => `
    <tr>
      <td>${r.srlNo}</td>
      <td>${escapeHtml(formatDateDMY(r.dateBooking))}</td>
      <td>${escapeHtml(r.party)}</td>
      <td>${escapeHtml(r.area)}</td>
      <td>${escapeHtml(r.invNo)}</td>
      <td>${formatNumber(r.bundles)}</td>
      <td>${escapeHtml(r.transport)}</td>
      <td>${escapeHtml(r.bultyNo)}</td>
      <td>${formatINR(r.amount)}</td>
      <td>${escapeHtml(r.driver)}</td>
      <td>${r.exportStatus}</td>
    </tr>`).join("");
  const totalAmount = rows.reduce((s, r) => s + toNum(r.amount), 0);
  const totalBundles = rows.reduce((s, r) => s + toNum(r.bundles), 0);

  document.getElementById("tablePrintArea").innerHTML = `
    <h2 style="margin:0 0 4px;">Dispatch Records</h2>
    <p style="margin:0 0 14px;font-size:12px;color:#333;">Generated ${escapeHtml(formatDateDMY(todayISO()))} — ${rows.length} records</p>
    <table class="print-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${bodyRows}</tbody>
      <tfoot><tr><td colspan="5"><strong>Total</strong></td><td><strong>${formatNumber(totalBundles)}</strong></td><td></td><td></td><td><strong>${formatINR(totalAmount)}</strong></td><td colspan="2"></td></tr></tfoot>
    </table>`;
  window.print();
}

/* =========================================================
   EXPORT ENGINE (₹ limit, sequential numbering, register)
   ========================================================= */
function computeExportBatch(candidateRows, limit) {
  const eligible = candidateRows.filter(r => r.exportStatus !== "Exported");
  let running = 0;
  const included = [];
  let stoppedAt = -1;
  for (let i = 0; i < eligible.length; i++) {
    const amt = toNum(eligible[i].amount);
    if (running + amt <= limit) {
      running += amt;
      included.push(eligible[i]);
    } else {
      stoppedAt = i;
      break;
    }
  }
  const excluded = stoppedAt === -1 ? [] : eligible.slice(stoppedAt);
  const excludedTotal = excluded.reduce((s, r) => s + toNum(r.amount), 0);
  return {
    eligible, included, excluded,
    includedTotal: running,
    excludedTotal,
    firstRecordTooLarge: included.length === 0 && eligible.length > 0 && toNum(eligible[0].amount) > limit,
  };
}

function startExportFlow() {
  const filtered = getFilteredRecords();
  const selectedRows = filtered.filter(r => APP.selected.has(r.id));
  const usingSelection = selectedRows.length > 0;
  const candidateRows = usingSelection ? selectedRows : filtered;

  const limit = toNum(APP.settings.exportLimit) || 0;
  const batch = computeExportBatch(candidateRows, limit);
  APP.pendingExportBatch = batch;
  APP.pendingExportUsingSelection = usingSelection;

  const nextExportNo = getNextExportNo();
  const nextVoNo = getNextVoNo();

  const body = document.getElementById("exportPreviewBody");

  if (batch.eligible.length === 0) {
    body.innerHTML = `<div class="export-error">${usingSelection ? "The records you selected have already been exported." : "All filtered records have already been exported, or no records match the current filters."} Adjust your selection or filters and try again.</div>`;
    document.getElementById("btnConfirmExport").disabled = true;
    openModal("modalExportPreview");
    return;
  }

  if (batch.firstRecordTooLarge) {
    body.innerHTML = `
      <div class="export-error">
        This record cannot be included because its amount exceeds the current export limit of ${formatINR(limit)}.
        You can raise the limit in Settings if this is expected.
      </div>`;
    document.getElementById("btnConfirmExport").disabled = true;
    openModal("modalExportPreview");
    return;
  }

  document.getElementById("btnConfirmExport").disabled = false;
  const remainingCount = batch.excluded.length;

  body.innerHTML = `
    <div class="export-source-note">${usingSelection ? `Exporting <strong>${selectedRows.length} selected record(s)</strong> only.` : `No records selected — exporting from all <strong>${filtered.length} filtered record(s)</strong>.`}</div>
    <div class="export-summary-grid">
      <div class="row"><span>Export No.</span><span>${nextExportNo}</span></div>
      <div class="row"><span>VO.NO.</span><span>${nextVoNo}</span></div>
      <div class="row"><span>Maximum Amount</span><span>${formatINR(limit)}</span></div>
      <div class="row"><span>Records Available</span><span>${batch.eligible.length}</span></div>
      <div class="row"><span>Records To Export</span><span>${batch.included.length}</span></div>
      <div class="row"><span>Total Amount</span><span>${formatINR(batch.includedTotal)}</span></div>
      <div class="row"><span>Remaining Records</span><span>${remainingCount}</span></div>
      <div class="row"><span>Remaining Amount</span><span>${formatINR(batch.excludedTotal)}</span></div>
    </div>
    <div class="field">
      <label>Parking / Local Transport Charges</label>
      <div id="exChargesContainer"></div>
      <button type="button" class="btn btn-secondary btn-sm" id="btnAddCharge">+ Add Charge</button>
    </div>
    ${remainingCount > 0 ? `<div class="export-warning">Record ${escapeHtml(batch.excluded[0].party || "")} (SRL ${batch.excluded[0].srlNo}) will not be included because adding it would exceed the ${formatINR(limit)} limit.</div>` : ""}
  `;

  // Pre-fill one charge row per transport mode found in this export (e.g. Bus + Train),
  // so the user usually just needs to type in the amounts. They can add/remove rows freely.
  const modesInBatch = [...new Set(batch.included.map(r => getModeForTransportName(r.transport)).filter(Boolean))];
  if (modesInBatch.length) {
    modesInBatch.forEach(m => addChargeRow(`${m} Parking Charge`, ""));
  } else {
    addChargeRow("", "");
  }
  document.getElementById("btnAddCharge").addEventListener("click", () => addChargeRow("", ""));
  document.getElementById("exChargesContainer").addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".charge-remove");
    if (removeBtn) removeBtn.closest(".charge-row").remove();
  });

  openModal("modalExportPreview");
}

function chargeRowHTML(label, amount) {
  return `
    <div class="charge-row">
      <input type="text" class="charge-label" list="chargeLabelOptions" placeholder="e.g. Bus Parking Charge" value="${escapeHtml(label || "")}">
      <input type="number" class="charge-amount" min="0" step="0.01" placeholder="Amount" value="${amount === "" || amount === undefined ? "" : amount}">
      <button type="button" class="icon-btn btn-sm charge-remove" title="Remove charge">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>`;
}

function addChargeRow(label, amount) {
  const container = document.getElementById("exChargesContainer");
  if (!container) return;
  container.insertAdjacentHTML("beforeend", chargeRowHTML(label, amount));
}

function getNextExportNo() {
  if (APP.exports.length === 0) return toNum(APP.settings.startExportNo) || 577;
  return Math.max(...APP.exports.map(e => e.exportNo)) + 1;
}
function getNextVoNo() {
  if (APP.exports.length === 0) return toNum(APP.settings.startVoNo) || 587;
  return Math.max(...APP.exports.map(e => e.voNo)) + 1;
}

function getDriverTypeLabel(name) {
  if (!name) return "—";
  const d = APP.drivers.find(d => d.name.toLowerCase() === name.toLowerCase());
  return d ? `${d.name} (${d.type.toUpperCase()})` : name;
}

function confirmExport() {
  const batch = APP.pendingExportBatch;
  if (!batch || batch.included.length === 0) return;

  const exportNo = getNextExportNo();
  const voNo = getNextVoNo();
  const exportDate = todayISO();

  const rows = batch.included.map((r, idx) => ({
    seNo: idx + 1,
    srlNo: r.srlNo,
    party: r.party, area: r.area, invNo: r.invNo, bundles: toNum(r.bundles),
    transport: r.transport, bultyNo: r.bultyNo, amount: toNum(r.amount),
    driver: r.driver, dateBooking: r.dateBooking,
  }));

  const totalBundles = rows.reduce((s, r) => s + r.bundles, 0);
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  // Parking / local transport charges — one or more named line items entered at export time
  const charges = Array.from(document.querySelectorAll("#exChargesContainer .charge-row")).map(row => ({
    label: row.querySelector(".charge-label").value.trim(),
    amount: toNum(row.querySelector(".charge-amount").value),
  })).filter(c => c.label && c.amount > 0);
  const parCharges = charges.reduce((s, c) => s + c.amount, 0);
  const grandTotal = totalAmount + parCharges;

  const driverNames = [...new Set(rows.map(r => r.driver).filter(Boolean))];
  const driverLabel = driverNames.length === 1 ? getDriverTypeLabel(driverNames[0]) : (driverNames.length > 1 ? "Multiple" : "—");
  const modes = [...new Set(rows.map(r => getModeForTransportName(r.transport)).filter(Boolean))];
  const modeLabel = modes.length === 1 ? modes[0] : (modes.length > 1 ? "Mixed" : "—");
  const bookingDates = rows.map(r => r.dateBooking).filter(Boolean).sort();
  const bookingDate = bookingDates.length ? bookingDates[0] : exportDate;

  const srlNumbers = batch.included.map(r => toNum(r.srlNo));
  const exportRecord = {
    exportNo, voNo, exportDate,
    srlFrom: Math.min(...srlNumbers), srlTo: Math.max(...srlNumbers),
    recordCount: rows.length, totalAmount, driver: driverLabel, transportMode: modeLabel,
    status: "Completed",
    reportData: {
      exportNo, voNo, exportDate, bookingDate,
      rows, totalBundles, totalAmount, parCharges, charges, grandTotal,
      driverLabel, companyName: APP.settings.companyName || "",
    },
  };
  APP.exports.push(exportRecord);

  const includedIds = new Set(batch.included.map(r => r.id));
  APP.records.forEach(r => {
    if (includedIds.has(r.id)) { r.exportStatus = "Exported"; r.exportNo = exportNo; }
  });
  includedIds.forEach(id => APP.selected.delete(id));

  saveExports();
  saveRecords();
  closeModal("modalExportPreview");
  renderDispatchTable();
  renderExportRegister();
  renderDashboard();
  showToast(`Export ${exportNo} created successfully. ${rows.length} records exported. Total amount: ${formatINR(totalAmount)}.`, "success");

  viewExport(exportNo);
}

/* =========================================================
   EXPORT REGISTER PAGE
   ========================================================= */
function setupExportRegisterPage() {
  document.getElementById("btnSaveEditExportNo").addEventListener("click", saveEditExportNo);
}

function renderExportRegister() {
  const tbody = document.getElementById("exportRegisterBody");
  const empty = document.getElementById("exportsEmpty");
  const list = [...APP.exports].sort((a, b) => b.exportNo - a.exportNo);

  if (list.length === 0) {
    tbody.innerHTML = "";
    empty.hidden = false;
    document.getElementById("exportRegisterTable").style.display = "none";
    return;
  }
  document.getElementById("exportRegisterTable").style.display = "";
  empty.hidden = true;

  tbody.innerHTML = list.map(e => `
    <tr>
      <td><strong>${e.exportNo}</strong></td>
      <td>${escapeHtml(formatDateDMY(e.exportDate))}</td>
      <td>${e.srlFrom}</td>
      <td>${e.srlTo}</td>
      <td class="num-cell">${e.recordCount}</td>
      <td class="num-cell">${formatINR(e.totalAmount)}</td>
      <td>${escapeHtml(e.driver)}</td>
      <td>${escapeHtml(e.transportMode)}</td>
      <td>${e.voNo}</td>
      <td><span class="badge badge-completed">${escapeHtml(e.status)}</span></td>
      <td class="col-actions col-actions-wide">
        <div class="cell-actions">
          <button class="btn btn-secondary btn-sm" data-view="${e.exportNo}">View</button>
          <button class="btn btn-secondary btn-sm" data-edit-no="${e.exportNo}">Edit No.</button>
        </div>
      </td>
    </tr>`).join("");

  tbody.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => viewExport(Number(btn.dataset.view)));
  });
  tbody.querySelectorAll("[data-edit-no]").forEach(btn => {
    btn.addEventListener("click", () => openEditExportNoModal(Number(btn.dataset.editNo)));
  });
}

function openEditExportNoModal(exportNo) {
  APP.editingExportNo = exportNo;
  document.getElementById("editExportNoInput").value = exportNo;
  openModal("modalEditExportNo");
}

function saveEditExportNo() {
  const newNo = toNum(document.getElementById("editExportNoInput").value);
  if (!newNo || newNo <= 0) { showToast("Please enter a valid Export No.", "error"); return; }
  if (newNo !== APP.editingExportNo && APP.exports.some(e => e.exportNo === newNo)) {
    showToast(`Export No. ${newNo} is already used by another export.`, "error");
    return;
  }
  const exp = APP.exports.find(e => e.exportNo === APP.editingExportNo);
  if (!exp) return;
  const oldNo = exp.exportNo;
  exp.exportNo = newNo;
  if (exp.reportData) exp.reportData.exportNo = newNo;
  APP.records.forEach(r => { if (r.exportNo === oldNo) r.exportNo = newNo; });
  saveExports();
  saveRecords();
  closeModal("modalEditExportNo");
  renderExportRegister();
  showToast(`Export No. updated to ${newNo}.`, "success");
}

function viewExport(exportNo) {
  const record = APP.exports.find(e => e.exportNo === exportNo);
  if (!record) return;
  document.getElementById("modalReportTitle").textContent = `Sales Expenses Report — Export ${exportNo}`;
  document.getElementById("reportPrintArea").innerHTML = buildReportHTML(record.reportData);
  openModal("modalReport");
}

function invNoLines(invNo) {
  if (!invNo) return "";
  return invNo.split(",").map(s => escapeHtml(s.trim())).filter(Boolean).join("<br>");
}

function buildReportHTML(d) {
  const rowsHTML = d.rows.map(r => `
    <tr>
      <td class="center">${r.seNo}</td>
      <td class="center">${escapeHtml(formatDateDots(r.dateBooking))}</td>
      <td>${escapeHtml(r.party)}</td>
      <td>${escapeHtml(r.area)}</td>
      <td>${invNoLines(r.invNo)}</td>
      <td class="center">${formatNumber(r.bundles)}</td>
      <td>${escapeHtml(r.transport)}</td>
      <td class="center">${escapeHtml(r.bultyNo)}</td>
      <td class="num">${formatINR(r.amount).replace("₹", "")}</td>
    </tr>`).join("");

  return `
  <div class="report-sheet">
    <table class="report-table">
      ${d.companyName ? `<tr><td colspan="9" class="report-company">${escapeHtml(d.companyName)}</td></tr>` : ""}
      <tr class="report-title-row">
        <td class="report-exno">${d.exportNo}</td>
        <td colspan="6" class="report-title">SALES EXPENSES Date ${escapeHtml(formatDateDots(d.exportDate))}</td>
        <td class="report-vo-label">VO.NO.</td>
        <td class="report-vo-value">${d.voNo}</td>
      </tr>
      <tr class="report-col-head">
        <th>SE. NO</th>
        <th>DATE</th>
        <th>PARTY / SCHOOL NAME</th>
        <th>AREA</th>
        <th>INV. NO.</th>
        <th>NO OF<br>BUNDLES</th>
        <th>TRANSPORT</th>
        <th>BULTY NO</th>
        <th>AMOUNT</th>
      </tr>
      ${rowsHTML}
      <tr class="report-totals-row">
        <td></td><td></td><td></td><td></td>
        <td class="right">TOTAL</td>
        <td class="center">${formatNumber(d.totalBundles)}</td>
        <td></td>
        <td class="right">TOTAL</td>
        <td class="num">${formatINR(d.totalAmount).replace("₹", "")}</td>
      </tr>
      ${(d.charges && d.charges.length) ? d.charges.map((c, i) => `
      <tr>
        <td colspan="7">${i === 0 ? "Local transport booking cost from publication." : ""}</td>
        <td class="right">${escapeHtml((c.label || "PAR.CHg").toUpperCase())}</td>
        <td class="num">${formatINR(c.amount).replace("₹", "")}</td>
      </tr>`).join("") : `
      <tr>
        <td colspan="7">Local transport booking cost from publication.</td>
        <td class="right">PAR.CHg</td>
        <td class="num">${formatINR(d.parCharges || 0).replace("₹", "")}</td>
      </tr>`}
      <tr>
        <td colspan="7">In words:- ${numberToWordsIndian(d.grandTotal)}</td>
        <td class="right">TOTAL AMT.</td>
        <td class="num">${formatINR(d.grandTotal).replace("₹", "")}</td>
      </tr>
      <tr>
        <td colspan="9" class="report-driver-row">Driver:- ${escapeHtml(d.driverLabel)}</td>
      </tr>
    </table>
  </div>`;
}

/* =========================================================
   TRANSPORT EXPENSES PAGE
   ========================================================= */
function setupExpensePage() {
  document.getElementById("btnAddExpense").addEventListener("click", addExpenseRow);
}

function renderExpenseTable() {
  const tbody = document.getElementById("expenseBody");
  const empty = document.getElementById("expenseEmpty");
  if (APP.expenses.length === 0) {
    tbody.innerHTML = "";
    empty.hidden = false;
    document.getElementById("expenseTable").style.display = "none";
  } else {
    document.getElementById("expenseTable").style.display = "";
    empty.hidden = true;
    tbody.innerHTML = APP.expenses.map(expenseRowHTML).join("");
  }
  bindExpenseRowEvents();
  renderExpenseSummary();
}

function expenseRowHTML(e) {
  const total = toNum(e.bulty) * toNum(e.rate);
  return `
  <tr data-id="${e.id}">
    <td><input type="date" class="exp-date" value="${escapeHtml(e.date || "")}"></td>
    <td>
      <select class="exp-mode">
        ${TRANSPORT_MODES.map(m => `<option value="${escapeHtml(m)}" ${m === e.mode ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
      </select>
    </td>
    <td><input type="text" class="exp-driver" list="driverListOptions" value="${escapeHtml(e.driver || "")}"></td>
    <td><input type="number" class="exp-bulty" min="0" step="1" value="${e.bulty ?? 0}"></td>
    <td><input type="number" class="exp-rate" min="0" step="0.01" value="${e.rate ?? 0}"></td>
    <td class="num-cell exp-total">${formatINR(total)}</td>
    <td><input type="text" class="exp-remark" value="${escapeHtml(e.remark || "")}"></td>
    <td class="col-actions">
      <div class="cell-actions">
        <button class="icon-btn btn-sm" data-action="delete-expense" title="Delete row">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </td>
  </tr>`;
}

function bindExpenseRowEvents() {
  document.querySelectorAll("#expenseBody tr").forEach(tr => {
    const id = tr.dataset.id;
    const expense = APP.expenses.find(x => x.id === id);
    const commit = () => {
      expense.date = tr.querySelector(".exp-date").value;
      expense.mode = tr.querySelector(".exp-mode").value;
      expense.driver = tr.querySelector(".exp-driver").value;

      const bultyVal = tr.querySelector(".exp-bulty").value;
      const rateVal = tr.querySelector(".exp-rate").value;
      if (!isValidNumber(bultyVal) || !isValidNumber(rateVal)) {
        showToast("Please enter a valid number.", "error");
        return;
      }
      expense.bulty = toNum(bultyVal);
      expense.rate = toNum(rateVal);
      expense.remark = tr.querySelector(".exp-remark").value;

      const total = expense.bulty * expense.rate;
      tr.querySelector(".exp-total").textContent = formatINR(total);
      saveExpenses();
      renderExpenseSummary();
    };
    tr.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", commit);
      if (el.classList.contains("exp-bulty") || el.classList.contains("exp-rate")) {
        el.addEventListener("input", () => {
          const b = toNum(tr.querySelector(".exp-bulty").value);
          const rt = toNum(tr.querySelector(".exp-rate").value);
          tr.querySelector(".exp-total").textContent = formatINR(b * rt);
        });
      }
    });
    tr.querySelector('[data-action="delete-expense"]').addEventListener("click", () => {
      APP.pendingDeleteFn = () => {
        APP.expenses = APP.expenses.filter(x => x.id !== id);
        saveExpenses();
        renderExpenseTable();
        showToast("Expense removed.", "success");
      };
      document.getElementById("modalDeleteText").textContent = "This transport expense entry will be removed.";
      openModal("modalDelete");
    });
  });
}

function addExpenseRow() {
  APP.expenses.push({
    id: uid("exp"), date: todayISO(), mode: APP.settings.defaultMode || TRANSPORT_MODES[0],
    driver: "", bulty: 0, rate: 0, remark: "",
  });
  saveExpenses();
  renderExpenseTable();
  showToast("Expense row added.", "success");
}

function renderExpenseSummary() {
  const totalBulty = APP.expenses.reduce((s, e) => s + toNum(e.bulty), 0);
  const totalCost = APP.expenses.reduce((s, e) => s + toNum(e.bulty) * toNum(e.rate), 0);
  document.getElementById("expSumBulty").textContent = formatNumber(totalBulty);
  document.getElementById("expSumTotal").textContent = formatINR(totalCost);
}

/* =========================================================
   MASTERS PAGE — Drivers & Transporters
   ========================================================= */
function setupMastersPage() {
  document.querySelectorAll("#masterTabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#masterTabs .tab").forEach(t => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("is-active"));
      document.getElementById("tab-" + tab.dataset.tab).classList.add("is-active");
    });
  });

  document.getElementById("btnAddDriver").addEventListener("click", () => openDriverModal(null));
  document.getElementById("btnSaveDriver").addEventListener("click", saveDriverFromModal);
  document.getElementById("btnAddTransporter").addEventListener("click", () => openTransporterModal(null));
  document.getElementById("btnSaveTransporter").addEventListener("click", saveTransporterFromModal);
}

function renderDriverTable() {
  const tbody = document.getElementById("driverBody");
  tbody.innerHTML = APP.drivers.map(d => `
    <tr>
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.type)}</td>
      <td>${escapeHtml(d.phone || "—")}</td>
      <td>${d.status === "Active" ? '<span class="badge badge-exported">Active</span>' : '<span class="badge badge-pending">Inactive</span>'}</td>
      <td class="col-actions">
        <div class="cell-actions">
          <button class="icon-btn btn-sm" data-edit="${d.id}" title="Edit">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn btn-sm" data-del="${d.id}" title="Delete">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--ink-500);padding:20px;">No drivers yet.</td></tr>`;

  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openDriverModal(b.dataset.edit)));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    APP.pendingDeleteFn = () => {
      APP.drivers = APP.drivers.filter(d => d.id !== b.dataset.del);
      saveDrivers();
      renderDriverTable();
      renderMasterOptions();
      showToast("Driver removed.", "success");
    };
    document.getElementById("modalDeleteText").textContent = "This driver will be removed from the master list.";
    openModal("modalDelete");
  }));
}

function openDriverModal(id) {
  APP.editingDriverId = id;
  const d = id ? APP.drivers.find(x => x.id === id) : null;
  document.getElementById("modalDriverTitle").textContent = d ? "Edit Driver" : "Add Driver";
  document.getElementById("drvName").value = d ? d.name : "";
  document.getElementById("drvType").value = d ? d.type : "Company Vehicle";
  document.getElementById("drvPhone").value = d ? d.phone || "" : "";
  document.getElementById("drvStatus").value = d ? d.status : "Active";
  openModal("modalDriver");
}

function saveDriverFromModal() {
  const name = document.getElementById("drvName").value.trim();
  if (!name) { showToast("Driver name is required.", "error"); return; }
  const data = {
    name, type: document.getElementById("drvType").value,
    phone: document.getElementById("drvPhone").value.trim(),
    status: document.getElementById("drvStatus").value,
  };
  if (APP.editingDriverId) {
    Object.assign(APP.drivers.find(d => d.id === APP.editingDriverId), data);
    showToast("Driver updated.", "success");
  } else {
    APP.drivers.push({ id: uid("drv"), ...data });
    showToast("Driver added.", "success");
  }
  saveDrivers();
  renderDriverTable();
  renderMasterOptions();
  closeModal("modalDriver");
}

function renderTransporterTable() {
  const tbody = document.getElementById("transporterBody");
  tbody.innerHTML = APP.transporters.map(t => `
    <tr>
      <td>${escapeHtml(t.name)}</td>
      <td>${escapeHtml(t.mode)}</td>
      <td>${escapeHtml(t.contact || "—")}</td>
      <td>${t.status === "Active" ? '<span class="badge badge-exported">Active</span>' : '<span class="badge badge-pending">Inactive</span>'}</td>
      <td class="col-actions">
        <div class="cell-actions">
          <button class="icon-btn btn-sm" data-edit="${t.id}" title="Edit">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn btn-sm" data-del="${t.id}" title="Delete">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:var(--ink-500);padding:20px;">No transporters yet.</td></tr>`;

  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openTransporterModal(b.dataset.edit)));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    APP.pendingDeleteFn = () => {
      APP.transporters = APP.transporters.filter(t => t.id !== b.dataset.del);
      saveTransporters();
      renderTransporterTable();
      renderMasterOptions();
      showToast("Transporter removed.", "success");
    };
    document.getElementById("modalDeleteText").textContent = "This transporter will be removed from the master list.";
    openModal("modalDelete");
  }));
}

function openTransporterModal(id) {
  APP.editingTransporterId = id;
  const t = id ? APP.transporters.find(x => x.id === id) : null;
  document.getElementById("modalTransporterTitle").textContent = t ? "Edit Transporter" : "Add Transporter";
  document.getElementById("trnName").value = t ? t.name : "";
  document.getElementById("trnMode").value = t ? t.mode : TRANSPORT_MODES[0];
  document.getElementById("trnContact").value = t ? t.contact || "" : "";
  document.getElementById("trnStatus").value = t ? t.status : "Active";
  openModal("modalTransporter");
}

function saveTransporterFromModal() {
  const name = document.getElementById("trnName").value.trim();
  if (!name) { showToast("Transporter name is required.", "error"); return; }
  const data = {
    name, mode: document.getElementById("trnMode").value,
    contact: document.getElementById("trnContact").value.trim(),
    status: document.getElementById("trnStatus").value,
  };
  if (APP.editingTransporterId) {
    Object.assign(APP.transporters.find(t => t.id === APP.editingTransporterId), data);
    showToast("Transporter updated.", "success");
  } else {
    APP.transporters.push({ id: uid("trn"), ...data });
    showToast("Transporter added.", "success");
  }
  saveTransporters();
  renderTransporterTable();
  renderMasterOptions();
  closeModal("modalTransporter");
}

/* =========================================================
   SETTINGS PAGE
   ========================================================= */
function setupSettingsPage() {
  document.getElementById("btnSaveSettings").addEventListener("click", saveSettingsFromForm);
  document.getElementById("btnClearDemo").addEventListener("click", () => {
    APP.pendingDeleteFn = clearDemoData;
    document.getElementById("modalDeleteText").textContent = "This will remove the sample dispatch records that came pre-loaded with the app. Your own entries will not be affected.";
    document.getElementById("modalDeleteTitle").textContent = "Clear Demo Data?";
    openModal("modalDelete");
  });
  document.getElementById("btnResetApp").addEventListener("click", () => openModal("modalReset"));
  document.getElementById("btnConfirmReset").addEventListener("click", resetApplication);
}

function loadSettingsForm() {
  document.getElementById("setCompanyName").value = APP.settings.companyName || "";
  document.getElementById("setStartExportNo").value = APP.settings.startExportNo;
  document.getElementById("setStartVoNo").value = APP.settings.startVoNo;
  document.getElementById("setExportLimit").value = APP.settings.exportLimit;
  document.getElementById("setDefaultDriver").value = APP.settings.defaultDriver || "";
  document.getElementById("setDefaultMode").value = APP.settings.defaultMode || TRANSPORT_MODES[0];
}

function saveSettingsFromForm() {
  const startExportNo = document.getElementById("setStartExportNo").value;
  const startVoNo = document.getElementById("setStartVoNo").value;
  const exportLimit = document.getElementById("setExportLimit").value;
  if (!isValidNumber(startExportNo) || !isValidNumber(startVoNo) || !isValidNumber(exportLimit)) {
    showToast("Please enter valid numbers for the settings fields.", "error");
    return;
  }
  APP.settings.companyName = document.getElementById("setCompanyName").value.trim();
  APP.settings.startExportNo = toNum(startExportNo) || 577;
  APP.settings.startVoNo = toNum(startVoNo) || 587;
  APP.settings.exportLimit = toNum(exportLimit) || 10000;
  APP.settings.defaultDriver = document.getElementById("setDefaultDriver").value;
  APP.settings.defaultMode = document.getElementById("setDefaultMode").value;
  saveSettings();
  document.getElementById("topbarTitleText").textContent = "NAVBODH BOOK TRANSPORT & DISPATCH MANAGEMENT";
  showToast("Settings saved.", "success");
}

function clearDemoData() {
  const seedParties = new Set(SEED_DISPATCH_RECORDS.map(r => r.party));
  APP.records = APP.records.filter(r => !(seedParties.has(r.party) && !r.exportNo));
  saveRecords();
  renderDispatchTable();
  renderDashboard();
  renderMasterOptions();
  showToast("Demo data cleared.", "success");
}

function resetApplication() {
  Object.values(STORE_KEYS).forEach(k => localStorage.removeItem(k));
  closeModal("modalReset");
  location.reload();
}

/* =========================================================
   EXCEL IMPORT
   Supports two source formats, auto-detected per sheet:
   1) A flat table with one header row (our own export format, or any
      spreadsheet using recognizable column names).
   2) Stacked "SALES EXPENSES" ledger blocks (the original handwritten/
      Google Sheets report format) — one or many blocks per sheet,
      each with its own mini header row and totals/footer lines.
   All sheets in the workbook are scanned, not just the first.
   ========================================================= */
const IMPORT_COLUMN_MAP = [
  { key: "srlNo", labels: ["srl no", "srlno", "sr no", "sl no", "se. no", "se no"] },
  { key: "dateBooking", labels: ["date of booking", "booking date", "bundle booking date"] },
  { key: "dateEntry", labels: ["date of entry", "date of entry (vikry/pete)", "entry date", "expenses date"] },
  { key: "party", labels: ["party / school name", "party/school name", "party", "school name"] },
  { key: "area", labels: ["area", "location"] },
  { key: "invNo", labels: ["inv no", "inv. no.", "invoice no", "inv.no."] },
  { key: "bundles", labels: ["no of bundles", "bundles", "no of bdl"] },
  { key: "transport", labels: ["transport", "bus", "local transport"] },
  { key: "bultyNo", labels: ["bulty no", "bilty no"] },
  { key: "amount", labels: ["amount"] },
  { key: "voucherSrlNo", labels: ["voucher srl number", "voucher srl no"] },
  { key: "voucherNo", labels: ["voucher no", "vo.no.", "vo no"] },
  { key: "driver", labels: ["driver"] },
];

function normHeaderLabel(v) {
  return String(v == null ? "" : v).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function buildColumnIndex(row) {
  const norm = (row || []).map(normHeaderLabel);
  const colIndex = {};
  IMPORT_COLUMN_MAP.forEach(col => {
    const idx = norm.findIndex(h => col.labels.includes(h));
    if (idx !== -1) colIndex[col.key] = idx;
  });
  return colIndex;
}

// Finds a dd.mm.yyyy / dd/mm/yyyy / dd-mm-yyyy date anywhere in a string.
// If several appear (e.g. a date range), the last one is used.
function normalizeImportedDate(val) {
  if (!val) return "";
  const s = String(val).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  const matches = [...s.matchAll(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})/g)];
  if (!matches.length) return "";
  const last = matches[matches.length - 1];
  return `${last[3]}-${last[2].padStart(2, "0")}-${last[1].padStart(2, "0")}`;
}

// Import sources often format numbers as "₹150.00" or "1,200" — strip that before parsing.
function toNumImport(val) {
  if (val === null || val === undefined) return 0;
  const cleaned = String(val).replace(/[₹,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}
function isValidImportNumber(val) {
  if (val === null || val === undefined || String(val).trim() === "") return false;
  const cleaned = String(val).replace(/[₹,\s]/g, "");
  return cleaned !== "" && !isNaN(parseFloat(cleaned)) && isFinite(cleaned);
}

function recordFromRow(colIndex, row, fallbackVoNo, fallbackBookingDate) {
  const get = (key) => colIndex[key] !== undefined ? row[colIndex[key]] : "";
  return {
    dateBooking: normalizeImportedDate(get("dateBooking")) || fallbackBookingDate || "",
    dateEntry: normalizeImportedDate(get("dateEntry")),
    party: String(get("party") || "").trim(),
    area: String(get("area") || "").trim(),
    invNo: String(get("invNo") || "").replace(/[\r\n]+/g, ", ").trim(),
    bundles: toNumImport(get("bundles")),
    transport: String(get("transport") || "").trim(),
    bultyNo: String(get("bultyNo") || "").trim(),
    amount: toNumImport(get("amount")),
    voucherSrlNo: String(get("voucherSrlNo") || "").trim(),
    voucherNo: String(get("voucherNo") || fallbackVoNo || "").trim(),
    driver: String(get("driver") || "").replace(/\([^)]*\)/g, "").replace(/^driver\s*-?\s*/i, "").trim(),
  };
}

// Mode 1: a single header row followed by data rows.
function parseFlatTable(matrix) {
  const colIndex = buildColumnIndex(matrix[0]);
  if (colIndex.party === undefined) return [];
  const dataRows = matrix.slice(1).filter(r => r.some(c => String(c || "").trim() !== ""));
  return dataRows.map(row => recordFromRow(colIndex, row)).filter(r => r.party && r.amount > 0);
}

// A footer/total/note line inside a ledger block — never a real record.
const LEDGER_SKIP_LINE = /booking\s*charges|publication|in\s*words|par\.?chg|^\s*total|^\s*driver/i;

// Mode 2: one or more "SALES EXPENSES ... / BUNDLE BOOKING ... / [mini header] / rows..." blocks.
function parseLedgerBlocks(matrix) {
  const out = [];
  let colIndex = null;
  let blockVoNo = "";
  let blockBookingDate = "";

  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i] || [];
    const rowText = row.map(c => (c === null || c === undefined) ? "" : String(c)).join(" ");

    if (/sales\s*expenses/i.test(rowText)) {
      colIndex = null;
      const voIdx = row.findIndex(c => normHeaderLabel(c) === "vo.no.");
      blockVoNo = voIdx !== -1 && row[voIdx + 1] != null ? String(row[voIdx + 1]).trim() : "";
      continue;
    }

    const candidate = buildColumnIndex(row);
    if (candidate.party !== undefined && candidate.amount !== undefined) {
      colIndex = candidate;
      continue;
    }

    if (/bundle\s*booking/i.test(rowText)) {
      blockBookingDate = normalizeImportedDate(rowText);
      continue;
    }

    if (!colIndex) continue;

    const partyRaw = colIndex.party !== undefined ? row[colIndex.party] : "";
    const partyVal = partyRaw == null ? "" : String(partyRaw).trim();
    if (!partyVal || LEDGER_SKIP_LINE.test(partyVal)) continue;

    const amountRaw = colIndex.amount !== undefined ? row[colIndex.amount] : "";
    if (amountRaw === undefined || amountRaw === null || String(amountRaw).trim() === "" || !isValidImportNumber(amountRaw)) continue;

    out.push(recordFromRow(colIndex, row, blockVoNo, blockBookingDate));
  }
  return out;
}

function parseMatrixForRecords(matrix) {
  if (!matrix || !matrix.length) return [];
  const looksFlat = buildColumnIndex(matrix[0]).party !== undefined;
  return looksFlat ? parseFlatTable(matrix) : parseLedgerBlocks(matrix);
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const isCSV = /\.csv$/i.test(file.name);
  const reader = new FileReader();

  reader.onload = function (evt) {
    let allRows = [];
    try {
      if (!isCSV && typeof XLSX !== "undefined") {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        wb.SheetNames.forEach(name => {
          const matrix = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "" });
          allRows = allRows.concat(parseMatrixForRecords(matrix));
        });
      } else {
        const text = typeof evt.target.result === "string" ? evt.target.result : new TextDecoder().decode(evt.target.result);
        allRows = parseMatrixForRecords(parseCSV(text));
      }
    } catch (err) {
      console.error(err);
      showToast("Could not read this file. Please check the format and try again.", "error");
      return;
    }

    if (!allRows.length) {
      showToast("No recognizable dispatch records were found in this file.", "error");
      return;
    }

    let nextSrl = APP.records.reduce((m, r) => Math.max(m, toNum(r.srlNo)), 0) + 1;
    const parsed = allRows.map(r => ({ srlNo: nextSrl++, ...r }));

    APP.pendingImportRows = parsed;
    renderImportPreview(parsed);
  };

  if (isCSV) reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

function renderImportPreview(rows) {
  const wrap = document.getElementById("importPreviewWrap");
  wrap.hidden = false;
  document.getElementById("importPreviewCount").textContent = `${rows.length} record(s) ready to import — showing first 10 below.`;
  const table = document.getElementById("importPreviewTable");
  const headers = ["SRL", "Date", "Party", "Area", "Bundles", "Transport", "Amount", "Driver"];
  table.querySelector("thead").innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  table.querySelector("tbody").innerHTML = rows.slice(0, 10).map(r => `
    <tr>
      <td>${r.srlNo}</td><td>${escapeHtml(formatDateDMY(r.dateBooking))}</td><td>${escapeHtml(r.party)}</td>
      <td>${escapeHtml(r.area)}</td><td>${formatNumber(r.bundles)}</td><td>${escapeHtml(r.transport)}</td>
      <td>${formatINR(r.amount)}</td><td>${escapeHtml(r.driver)}</td>
    </tr>`).join("");
  document.getElementById("btnConfirmImport").disabled = false;
}

function confirmImport() {
  if (!APP.pendingImportRows || !APP.pendingImportRows.length) return;

  const existing = getExistingInvoiceNumbers(null);
  const accepted = [];
  let skipped = 0;
  APP.pendingImportRows.forEach(r => {
    const tokens = (r.invNo || "").split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
    const isDupe = tokens.some(t => existing.has(t));
    if (isDupe) { skipped++; return; }
    tokens.forEach(t => existing.add(t));
    accepted.push(r);
  });

  const newRecords = accepted.map(r => ({
    id: uid("rec"), exportStatus: "Not Exported", exportNo: null, ...r,
  }));
  APP.records.push(...newRecords);
  saveRecords();
  renderMasterOptions();
  renderDispatchTable();
  renderDashboard();
  closeModal("modalImport");
  if (skipped > 0) {
    showToast(`Imported ${newRecords.length} record(s). Skipped ${skipped} row(s) with invoice numbers that already exist.`, newRecords.length ? "warning" : "error");
  } else {
    showToast(`Excel imported successfully. ${newRecords.length} record(s) added.`, "success");
  }
  APP.pendingImportRows = null;
}

/* =========================================================
   EXCEL EXPORT
   ========================================================= */
function exportExcel(scope) {
  const rows = scope === "all" ? APP.records : getFilteredRecords();
  if (!rows.length) { showToast("There are no records to export.", "error"); return; }

  const data = rows.map(r => ({
    "SRL NO": r.srlNo,
    "DATE OF BOOKING": formatDateDMY(r.dateBooking),
    "DATE OF ENTRY (VIKRY/PETE)": formatDateDMY(r.dateEntry),
    "PARTY / SCHOOL NAME": r.party,
    "AREA": r.area,
    "INV. NO.": r.invNo,
    "NO OF BUNDLES": r.bundles,
    "TRANSPORT": r.transport,
    "BULTY NO": r.bultyNo,
    "AMOUNT": r.amount,
    "VOUCHER SRL NUMBER": r.voucherSrlNo,
    "VOUCHER NO": r.voucherNo,
    "DRIVER": r.driver,
    "EXPORT STATUS": r.exportStatus,
  }));

  //dispatch section

  const filename = `dispatch-records-${scope}-${todayISO()}.xlsx`;

  if (typeof XLSX !== "undefined") {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch Records");
    XLSX.writeFile(wb, filename);
  } else {
    // CSV fallback
    const headers = Object.keys(data[0]);
    const csv = [headers.join(",")]
      .concat(data.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });  
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename.replace(".xlsx", ".csv");
    a.click();
    URL.revokeObjectURL(url);
  }
  showToast(`${rows.length} record(s) exported to Excel.`, "success");
}