// Run in the folder with styles.css:   node patch-theme.js
const fs = require("fs");
const THEME = `
/* ===== PREMIUM THEME v1 (clean light) ===== */
:root{
  --navy-900:#0a1a33; --navy-800:#10284b; --navy-700:#1a3c70; --navy-600:#2b559b;
  --blue-50:#f1f6ff; --blue-100:#dce9ff;
  --brand:#2563eb; --brand-700:#1d4ed8;
  --ink-900:#0f1b2d; --ink-700:#34445c; --ink-500:#64748b; --ink-300:#a4b1c4;
  --paper:#f3f6fb; --surface:#ffffff;
  --border:#e4eaf3; --border-strong:#cfd8e6;
  --green-700:#047857; --green-600:#059669; --green-100:#dcf5e9;
  --focus:#2563eb;
  --radius-sm:8px; --radius-md:14px;
  --shadow-1:0 1px 2px rgba(16,32,64,.05),0 6px 18px rgba(16,32,64,.05);
  --shadow-2:0 24px 60px rgba(8,20,45,.28);
}
body{font-size:14.5px;line-height:1.5;background:
  radial-gradient(1200px 500px at 85% -10%,#e6eeff 0%,rgba(230,238,255,0) 60%),var(--paper);
  background-attachment:fixed;}
h1{font-size:26px;font-weight:800;letter-spacing:-.02em;}
h2{font-size:17px;font-weight:700;}
:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.35);border-radius:8px;}

/* sidebar */
.sidebar{background:linear-gradient(185deg,#0a1a33 0%,#0f2a52 60%,#12356a 100%);box-shadow:4px 0 24px rgba(8,20,45,.18);}
.brand{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.07);}
.brand-mark{background:linear-gradient(135deg,#3b82f6,#1d4ed8);box-shadow:0 6px 16px rgba(37,99,235,.45);width:40px;height:40px;border-radius:11px;}
.brand-title{font-size:15.5px;letter-spacing:.01em;}
.brand-sub{color:#9db6d6;}
.nav{padding:14px 12px;gap:4px;}
.nav-item{padding:11px 14px;border-radius:11px;color:#b9cbe2;font-weight:600;position:relative;transition:background .15s,color .15s,transform .15s;}
.nav-item:hover{background:rgba(255,255,255,.08);color:#fff;transform:translateX(2px);}
.nav-item.is-active{background:linear-gradient(135deg,rgba(96,165,250,.28),rgba(37,99,235,.22));color:#fff;box-shadow:inset 0 0 0 1px rgba(147,197,253,.28);}
.nav-item.is-active::before{content:"";position:absolute;left:-12px;top:9px;bottom:9px;width:4px;border-radius:0 4px 4px 0;background:#60a5fa;}
.nav-item.is-active svg{opacity:1;color:#93c5fd;}
.sidebar-foot{border-top:1px solid rgba(255,255,255,.07);}

/* top bar */
.topbar{background:rgba(255,255,255,.82);backdrop-filter:saturate(1.4) blur(10px);-webkit-backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--border);padding:13px 30px;align-items:center;}
.topbar-title{font-size:14px;letter-spacing:.06em;color:var(--navy-800);}
.content{padding:28px 30px 64px;}

/* pages */
@keyframes pageIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.page.is-active{animation:pageIn .28s ease both;}
.page-head{margin-bottom:20px;}
.page-desc{font-size:14px;color:var(--ink-500);}

/* cards / panels */
.panel{border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-1);}
.panel-head{padding:16px 22px;}
.stat-card{border:1px solid var(--border);border-left:none;border-radius:16px;padding:20px 20px 18px;position:relative;overflow:hidden;
  background:linear-gradient(180deg,#fff,#f8fbff);transition:transform .18s,box-shadow .18s;}
.stat-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,#3b82f6,#1d4ed8);}
.stat-card.accent-green::before{background:linear-gradient(180deg,#34d399,#059669);}
.stat-card.accent-amber::before{background:linear-gradient(180deg,#fbbf24,#d97706);}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(16,32,64,.10);}
.stat-label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-500);}
.stat-value{font-size:30px;font-weight:800;color:var(--navy-800);}
.mode-track{height:12px;background:#e8effb;}
.mode-fill{background:linear-gradient(90deg,#3b82f6,#1d4ed8);}

/* form controls */
.field label{font-size:12px;font-weight:700;color:var(--ink-700);letter-spacing:.02em;}
input[type=text],input[type=date],input[type=number],input[type=password],input[type=file],select,textarea{
  border:1.5px solid var(--border-strong);border-radius:10px;padding:10px 12px;background:#fff;
  transition:border-color .15s,box-shadow .15s,background .15s;}
input::placeholder,textarea::placeholder{color:#9aa8bc;}
input:hover,select:hover,textarea:hover{border-color:#b6c3d8;}
input:focus,select:focus,textarea:focus{border-color:var(--brand);box-shadow:0 0 0 4px rgba(37,99,235,.14);outline:none;}
input[type=checkbox]{accent-color:var(--brand-700);width:16px;height:16px;cursor:pointer;}

/* buttons */
.btn{border-radius:10px;padding:10px 17px;font-weight:700;letter-spacing:.005em;transition:transform .12s,box-shadow .15s,background .15s,border-color .15s;}
.btn:hover{transform:translateY(-1px);}
.btn:active{transform:translateY(0);}
.btn-primary{background:linear-gradient(135deg,#1e3a8a,#2563eb);box-shadow:0 4px 12px rgba(37,99,235,.30);}
.btn-primary:hover{background:linear-gradient(135deg,#1e40af,#2f6df0);box-shadow:0 8px 20px rgba(37,99,235,.38);}
.btn-secondary{background:#fff;border:1.5px solid var(--border-strong);color:var(--navy-800);box-shadow:0 1px 2px rgba(16,32,64,.05);}
.btn-secondary:hover{background:#f4f8ff;border-color:#9db4dc;}
.btn-accent{background:linear-gradient(135deg,#047857,#10b981);box-shadow:0 4px 12px rgba(5,150,105,.30);}
.btn-accent:hover{background:linear-gradient(135deg,#065f46,#059669);box-shadow:0 8px 20px rgba(5,150,105,.38);}
.btn-danger{background:linear-gradient(135deg,#b91c1c,#ef4444);box-shadow:0 4px 12px rgba(220,38,38,.28);}
.btn-sm{border-radius:8px;padding:6px 11px;}
.btn:disabled{box-shadow:none;transform:none;}
.icon-btn{border-radius:9px;transition:background .12s,transform .12s;}
.icon-btn:hover{background:#e7efff;transform:scale(1.06);}
.action-bar{gap:10px;margin-bottom:16px;}

/* tabs */
.view-tabs{gap:8px;margin-bottom:14px;}
.view-tab{border:1.5px solid var(--border-strong);border-radius:999px;padding:8px 18px;font-weight:700;font-size:13.5px;color:var(--navy-700);background:#fff;box-shadow:0 1px 2px rgba(16,32,64,.04);transition:all .15s;}
.view-tab:hover{background:#f1f6ff;border-color:#9db4dc;transform:translateY(-1px);}
.view-tab.active{background:linear-gradient(135deg,#10284b,#1d4ed8);border-color:transparent;color:#fff;box-shadow:0 6px 16px rgba(29,78,216,.32);}
.view-count{background:#e6eefc;color:var(--navy-700);}
.view-tab.active .view-count{background:rgba(255,255,255,.24);color:#fff;}
.view-tab-add{border-style:dashed;background:transparent;box-shadow:none;}
.tab{font-weight:700;}
.tab.is-active{color:var(--brand-700);border-bottom-color:var(--brand);}

/* tables */
.sheet-panel{border-radius:16px;}
.sheet-table{font-size:14px;}
.sheet-table thead th{background:#eef3fb;color:#2b3b57;font-size:11.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
  padding:13px 12px;border-right:1px solid #e1e8f4;border-bottom:2px solid #c9d6ec;}
.sheet-table thead th.sortable:hover{background:#e2ebfa;}
.sheet-table .col-actions{background:#eef3fb;}
.sheet-table tbody td{border-bottom:1px solid #edf1f7;border-right:1px solid #f0f3f9;}
.sheet-table td .cell-inner{padding:11px 12px;}
.sheet-table tbody tr:nth-child(even) td{background:#fafcff;}
.sheet-table tbody tr:hover td{background:#eef4ff;}
.sheet-table tbody tr.is-selected td{background:#e3edff;}
.sheet-table tbody tr.is-exported td{background:#d3ecdd;}
.sheet-table tbody tr.is-exported:hover td{background:#c2e5d1;}
.sheet-table td.editable-cell:hover{box-shadow:inset 0 0 0 2px #7aa2ee;}
.sheet-table td .cell-edit-input{outline:2px solid var(--brand);border-radius:4px;}
.sheet-table td.col-actions{background:#fff;}
.sheet-table tbody tr:nth-child(even) td.col-actions{background:#fafcff;}
.sheet-table tbody tr:hover td.col-actions{background:#eef4ff;}
.sheet-table tbody tr.is-exported td.col-actions{background:#d3ecdd;}
.sheet-table .row-index{color:var(--ink-300);font-weight:700;}
.table-scroll{scrollbar-width:thin;scrollbar-color:#b9c7de transparent;}
.table-scroll::-webkit-scrollbar{height:10px;width:10px;}
.table-scroll::-webkit-scrollbar-thumb{background:#c2cfe4;border-radius:8px;border:2px solid #fff;}
.mini-table th{font-size:11px;letter-spacing:.07em;text-transform:uppercase;background:#f4f7fc;}
.mini-table tbody tr:hover td{background:#f4f8ff;}

/* badges */
.badge{padding:4px 11px;font-size:11px;letter-spacing:.03em;text-transform:uppercase;}
.badge-exported,.badge-completed{background:#d7f3e5;color:#046c4e;}
.badge-pending{background:#e2ecff;color:#1d4ed8;}
.badge-shared{background:#dbe8ff;color:#1d4ed8;}

/* summary bar */
.summary-bar{background:linear-gradient(120deg,#0a1a33 0%,#12315f 100%);border-radius:16px;box-shadow:0 12px 30px rgba(10,26,51,.28);}
.summary-item{padding:18px 26px;}
.summary-label{text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:#8fb2de;}
.summary-value{font-size:26px;letter-spacing:-.01em;}

/* modals */
.modal-overlay{background:rgba(8,18,40,.52);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);}
.modal{border-radius:18px;box-shadow:var(--shadow-2);border:1px solid rgba(255,255,255,.6);}
.modal-head{padding:18px 24px;background:linear-gradient(180deg,#fff,#f6f9ff);}
.modal-head h2{font-size:18px;}
.modal-body{padding:22px 24px;}
.modal-foot{padding:16px 24px;background:#f6f9ff;}
.export-summary-grid .row{padding:9px 0;}
.export-source-note{border-radius:10px;background:#eef4ff;}
.export-warning{border-radius:10px;}

/* toasts / dropdown */
.toast{border-radius:12px;padding:14px 18px;box-shadow:0 14px 34px rgba(8,20,45,.30);backdrop-filter:blur(4px);}
.dropdown-menu{border-radius:12px;box-shadow:var(--shadow-2);padding:8px;}
.dropdown-menu button{border-radius:8px;padding:10px 12px;}

/* misc */
.empty-state{padding:64px 20px;}
.empty-state strong{font-size:17px;color:var(--navy-800);}
.filter-panel{padding:20px 22px 18px;}
.settings-panel{padding:24px;}
.report-comment-box textarea{min-height:60px;}
.user-chip-text{color:var(--navy-800);}
.role-badge{letter-spacing:.02em;}
@media (max-width:860px){.content{padding:18px 14px 44px;}.topbar{padding:12px 14px;}h1{font-size:22px;}}
@media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important;}}
.mode-track{display:block;}
.mode-fill{display:block;min-width:6px;}
`;
let c = fs.readFileSync("styles.css", "utf8");
const crlf = c.includes("\r\n");
c = c.replace(/\r\n/g, "\n");
if (c.includes("PREMIUM THEME v1")) { console.log("Already patched — skipped."); process.exit(0); }
fs.copyFileSync("styles.css", "styles.css.theme.bak");
c = c.replace(/\s*$/, "\n") + THEME;
fs.writeFileSync("styles.css", crlf ? c.replace(/\n/g, "\r\n") : c);
console.log("styles.css updated (backup: styles.css.theme.bak). Refresh with Ctrl+F5.");






