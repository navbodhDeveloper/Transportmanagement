// Run in the folder with app.js:   node patch-export-message.js
const fs = require("fs");
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes('id="exMessage"')) { console.log("Already patched — skipped."); process.exit(0); }

const edits = [
  // 1. no message under each charge
  [/\n\s*<input type="text" class="charge-message" list="chargeMessageOptions" placeholder="Message shown on the report, e\.g\. CHARGES OF RELOCATING FROM BHOPAL\." value="\$\{escapeHtml\(message === undefined \? "" : message\)\}">/, ""],
  // 2. no message inside the railway charge row
  [/\n\s*<input type="text" id="exRailwayMessage"[^\n]*>/, ""],
  // 3. ONE editable message box (empty by default) above the comment
  [/(\n\s*)<div class="field">(\n\s*)<label for="exComment">/,
   `$1<div class="field">$1  <label for="exMessage">Message on report (optional)</label>$1  <input type="text" id="exMessage" list="chargeMessageOptions" placeholder="e.g. Local transport booking cost from publication.">$1</div>$1<div class="field">$2<label for="exComment">`],
  // 4. don't save per-charge messages
  [/\n\s*description: row\.querySelector\("\.charge-message"\)\.value\.trim\(\),/, ""],
  [/\n\s*description: \(document\.getElementById\("exRailwayMessage"\)\.value \|\| ""\)\.trim\(\),/, ""],
  // 5. save the single message with the report
  ['driverLabel, companyName: APP.settings.companyName || "", comment,',
   'driverLabel, companyName: APP.settings.companyName || "", comment,\n      message: (document.getElementById("exMessage") ? document.getElementById("exMessage").value.trim() : ""),'],
  // 6. report: message once (new reports); older reports keep their own per-charge text
  ['<td colspan="7">${escapeHtml(c.description !== undefined ? c.description : (i === 0 ? "Local transport booking cost from publication." : ""))}</td>',
   '${d.message === undefined ? `<td colspan="7">${escapeHtml(c.description !== undefined ? c.description : (i === 0 ? "Local transport booking cost from publication." : ""))}</td>` : (i === 0 ? `<td colspan="7" rowspan="${d.charges.length}">${escapeHtml(d.message)}</td>` : "")}'],
  ['<td colspan="7">Local transport booking cost from publication.</td>',
   '<td colspan="7">${d.message === undefined ? "Local transport booking cost from publication." : escapeHtml(d.message)}</td>'],
];
for (const [a, b] of edits) {
  const hit = typeof a === "string" ? t.split(a).length - 1 : (t.match(new RegExp(a.source, "g")) || []).length;
  if (hit !== 1) { console.error(`STOPPED: expected 1 match, found ${hit} for: ${String(a).slice(0, 70)}`); process.exit(1); }
}
fs.copyFileSync("app.js", "app.js.exportmsg.bak");
for (const [a, b] of edits) t = typeof a === "string" ? t.replace(a, () => b) : t.replace(a, b);
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.exportmsg.bak). Refresh with Ctrl+F5.");