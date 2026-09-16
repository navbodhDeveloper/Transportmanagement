/* =========================================================
   UTILITIES
   ========================================================= */

const STORE_KEYS = {
  records: "btdm_dispatchRecords",
  expenses: "btdm_transportExpenses",
  exports: "btdm_exports",
  drivers: "btdm_drivers",
  transporters: "btdm_transporters",
  settings: "btdm_settings",
  seeded: "btdm_seeded",
};

const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Storage read failed for", key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage write failed for", key, e);
      return false;
    }
  },
};

function uid(prefix) {
  return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- Currency: Indian grouping e.g. 1,25,000.00 ---------- */
function formatINR(value) {
  const num = Number(value) || 0;
  const isNeg = num < 0;
  const abs = Math.abs(num).toFixed(2);
  const [intPart, decPart] = abs.split(".");
  let lastThree = intPart.substring(intPart.length - 3);
  let other = intPart.substring(0, intPart.length - 3);
  if (other !== "") lastThree = "," + lastThree;
  const formattedInt = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return (isNeg ? "-" : "") + "₹" + formattedInt + "." + decPart;
}

function formatNumber(value) {
  const num = Number(value) || 0;
  return num.toLocaleString("en-IN");
}

/* ---------- Dates ---------- */
// Convert yyyy-mm-dd (input[type=date] format) to dd/mm/yyyy for display
function formatDateDMY(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

function formatDateDots(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
}

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* ---------- Number to Indian-English words ---------- */
function numberToWordsIndian(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return "ZERO ONLY.";
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
    "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10), o = n % 10;
    return tens[t] + (o ? "-" + ones[o] : "");
  }
  function threeDigits(n) {
    const h = Math.floor(n / 100), rest = n % 100;
    let out = "";
    if (h) out += ones[h] + " HUNDRED" + (rest ? " " : "");
    if (rest) out += twoDigits(rest);
    return out;
  }

  const isNeg = num < 0;
  num = Math.abs(num);

  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;

  let parts = [];
  if (crore) parts.push(threeDigits(crore) + " CRORE");
  if (lakh) parts.push(threeDigits(lakh) + " LAKH");
  if (thousand) parts.push(threeDigits(thousand) + " THOUSAND");
  if (hundred) parts.push(threeDigits(hundred));

  let words = parts.join(" ").replace(/\s+/g, " ").trim();
  return (isNeg ? "MINUS " : "") + words + " ONLY.";
}

/* ---------- Validation helpers ---------- */
function isValidNumber(value) {
  if (value === "" || value === null || value === undefined) return true; // empty allowed, treated as 0
  return !isNaN(parseFloat(value)) && isFinite(value) && Number(value) >= 0;
}

function toNum(value) {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

/* ---------- Debounce ---------- */
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/* ---------- CSV parse fallback (when SheetJS unavailable) ---------- */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c !== undefined && String(c).trim() !== ""));
}