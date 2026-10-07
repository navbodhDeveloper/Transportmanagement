// Run in the folder with styles.css:   node patch-print.js
const fs = require("fs");
const CSS = `
/* ===== Print: compact reports, no blank first page, several reports share one page ===== */
@media print{
  html,body{height:auto !important;background:#fff !important;}
  .app-shell,.toast-stack,.sidebar-scrim,.modal-overlay:not(#modalReport){display:none !important;}
  #modalReport{position:static !important;display:block !important;padding:0 !important;background:none !important;}
  #modalReport[hidden]{display:none !important;}
  #modalReport .modal{display:block !important;width:100% !important;max-width:100% !important;max-height:none !important;overflow:visible !important;box-shadow:none !important;border-radius:0 !important;}
  #modalReport .modal-body{padding:0 !important;overflow:visible !important;}
  #reportPrintArea{position:static !important;width:100% !important;}
  body *{visibility:visible !important;}
  body:has(#modalReport:not([hidden])) #tablePrintArea{display:none !important;}
  .report-sheet{break-inside:avoid;page-break-inside:avoid;}
  .report-sheet + .report-sheet{page-break-before:auto !important;break-before:auto !important;margin-top:16px !important;padding-top:0 !important;border-top:none !important;}
}
`;
const raw = fs.readFileSync("styles.css", "utf8");
if (raw.includes("Print: compact reports")) { console.log("Already patched — skipped."); process.exit(0); }
fs.copyFileSync("styles.css", "styles.css.print.bak");
const crlf = raw.includes("\r\n");
const out = raw.replace(/\s*$/, "\n") + CSS;
fs.writeFileSync("styles.css", crlf ? out.replace(/\r?\n/g, "\r\n") : out);
console.log("styles.css patched (backup: styles.css.print.bak). Refresh with Ctrl+F5.");