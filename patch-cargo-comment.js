// Run in the folder with app.js:   node patch-cargo-comment.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };
const APPEND = S(function () {/*

// ===== Cargo report: Comment / Remark box (same as the Export report) =====
APP.viewingCargoReportId = null;

const __buildCargoReportHTMLOrig = buildCargoReportHTML;
buildCargoReportHTML = function (d) {
  let html = __buildCargoReportHTMLOrig.apply(this, arguments);
  if (d && d.comment) {
    const n = 5 + (d.showDateCol ? 1 : 0) + 1 + 1 + (d.hasMarking ? 2 : 0);
    const row = `<tr><td colspan="${n}" class="report-comment-row">Remarks:- ${escapeHtml(d.comment)}</td></tr>`;
    const i = html.lastIndexOf("</table>");
    if (i >= 0) html = html.slice(0, i) + row + html.slice(i);
  }
  return html;
};

const __viewCargoReportOrig = viewCargoReport;
viewCargoReport = function (id) {
  __viewCargoReportOrig.apply(this, arguments);
  const rep = APP.cargoReports.find(r => r.id === id);
  if (!rep) return;
  APP.viewingCargoReportId = id;
  document.getElementById("reportCommentInput").value = rep.comment || "";
  document.getElementById("reportCommentBox").hidden = false;
};

const __viewExportOrig = viewExport;
viewExport = function () { APP.viewingCargoReportId = null; return __viewExportOrig.apply(this, arguments); };
const __printSelectedExportsOrig = printSelectedExports;
printSelectedExports = function () { APP.viewingCargoReportId = null; return __printSelectedExportsOrig.apply(this, arguments); };

const __saveReportCommentOrig = saveReportComment;
saveReportComment = function () {
  if (!APP.viewingCargoReportId) return __saveReportCommentOrig.apply(this, arguments);
  const rep = APP.cargoReports.find(r => r.id === APP.viewingCargoReportId);
  if (!rep) return;
  rep.comment = document.getElementById("reportCommentInput").value.trim();
  saveCargoReports();
  document.getElementById("reportPrintArea").innerHTML = buildCargoReportHTML(rep);
  showToast("Comment saved.", "success");
};
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("viewingCargoReportId")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["buildCargoReportHTML", "viewCargoReport", "saveReportComment", "viewExport", "printSelectedExports", "saveCargoReports"])
  if (!t.includes("function " + fn)) { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.cargocomment.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.cargocomment.bak). Refresh with Ctrl+F5.");