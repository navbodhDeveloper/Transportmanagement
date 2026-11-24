// Run in the folder with app.js:   node patch-bilty-separate.js
// Same Bulty No: every record keeps its OWN amount. Totals add up every record's amount.
const fs = require("fs");
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("BILTY-SEPARATE")) { console.log("Already patched — skipped."); process.exit(0); }
if (!t.includes("function applySharedBultyAmount")) {
  console.error("STOPPED: run patch-shared-amount.js first (applySharedBultyAmount not found).");
  process.exit(1);
}
const edits = [
  // 1. export batch: every record's amount counts
  ["    const amt = (bKey && seenBulty.has(bKey)) ? 0 : toNum(eligible[i].amount);\n",
   "    const amt = toNum(eligible[i].amount); // BILTY-SEPARATE\n"],
  // 2. totals: add every record's amount
  ["    if (key && seenBulty.has(key)) return;\n    if (key) seenBulty.add(key);\n    total += toNum(r.amount);",
   "    total += toNum(r.amount); // BILTY-SEPARATE: every record counts"],
  // 3. dispatch table: no merged Amount cell, each row shows its own amount
  ["      if (j - i > 1) { amtSpan[i] = j - i; for (let k = i + 1; k < j; k++) amtSkip.add(k); }\n",
   "      // BILTY-SEPARATE: amount cells are no longer merged\n"],
  // 4. export report: merged cell shows the SUM of the group
  ["      groupStartAt[i] = { span, groupAmount: toNum(d.rows[i].amount) };",
   "      groupStartAt[i] = { span, groupAmount: d.rows.slice(i, j).reduce((s, x) => s + toNum(x.amount), 0) };"],
  // 5. inline: changing Bulty No no longer overwrites the amount
  ["      if (match && toNum(record.amount) !== toNum(match.amount)) {",
   "      if (false && match) { // BILTY-SEPARATE: keep the record's own amount"],
  // 6. edit form: do not overwrite this record's amount when the form opens
  ["      amountInput.value = match.amount;\n      amountInput.disabled = false;\n      if (!hint) {",
   "      if (refresh.initDone && !toNum(amountInput.value)) amountInput.value = match.amount; // only pre-fill an empty amount\n      amountInput.disabled = false;\n      if (!hint) {"],
  ["  bultyInput.addEventListener(\"input\", refresh);\n  refresh();\n}",
   "  bultyInput.addEventListener(\"input\", refresh);\n  refresh();\n  refresh.initDone = true;\n}"],
  ["`Shared price (${formatINR(match.amount)}) — you can change it; the new amount applies to every record with this Bulty No.`",
   "`Same Bulty No. as another record (${formatINR(match.amount)}). The amount here is for this record only.`"],
];
for (const [a] of edits) {
  const hit = t.split(a).length - 1;
  if (hit !== 1) { console.error(`STOPPED: expected 1 match, found ${hit} for: ${a.slice(0, 80).replace(/\n/g, "\\n")}`); process.exit(1); }
}
fs.copyFileSync("app.js", "app.js.biltysep.bak");
for (const [a, b] of edits) t = t.replace(a, () => b);
t = t.replace(/\s*$/, "\n") + `
// BILTY-SEPARATE: changing one record's amount never changes another record.
applySharedBultyAmount = function () { /* no propagation */ };
`;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("Done (backup: app.js.biltysep.bak). Refresh with Ctrl+F5.");