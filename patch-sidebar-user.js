// Run in the folder with app.js and styles.css (after patch-login.js / patch-super-admin.js):   node patch-sidebar-user.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };

const JS = S(function () {/*

// ===== User card at the bottom of the sidebar (replaces the top-right name + Logout) =====
(function sidebarUserCard() {
  const foot = document.querySelector(".sidebar-foot");
  if (!foot || document.getElementById("sidebarUser")) return;
  const card = document.createElement("div");
  card.id = "sidebarUser"; card.className = "sb-user"; card.hidden = true;
  card.innerHTML =
    '<button type="button" class="sb-user-main" id="sbUserMain" title="Open profile">' +
      '<span class="sb-avatar" id="sbAvatar"></span>' +
      '<span class="sb-user-text"><span class="sb-user-name" id="sbName"></span><span class="sb-user-role" id="sbRole"></span></span>' +
    '</button>' +
    '<button type="button" class="sb-logout" id="sbLogout" title="Logout" aria-label="Logout">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
    '</button>';
  foot.insertBefore(card, foot.firstChild);
  card.querySelector("#sbUserMain").addEventListener("click", () => showPage("profile"));
  card.querySelector("#sbLogout").addEventListener("click", () => authLogout());

  const bar = document.querySelector(".topbar");
  if (bar && !document.getElementById("topDate")) {
    const d = document.createElement("div");
    d.id = "topDate"; d.className = "topbar-date";
    d.textContent = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    bar.appendChild(d);
  }
})();

const __applyUIForSidebar = authApplyUI;
authApplyUI = function () {
  const r = __applyUIForSidebar.apply(this, arguments);
  const u = authCurrent();
  const card = document.getElementById("sidebarUser");
  if (u && card) {
    const names = (typeof AUTH_ROLE_NAMES !== "undefined") ? AUTH_ROLE_NAMES : { admin: "Admin", entry: "Data Entry", super: "Super Admin" };
    document.getElementById("sbAvatar").textContent = (u.name || "?").trim().charAt(0).toUpperCase();
    document.getElementById("sbName").textContent = u.name;
    document.getElementById("sbRole").textContent = names[u.role] || u.role;
    card.hidden = false;
  }
  return r;
};
if (authCurrent()) authApplyUI();
*/});

const CSS = `
/* ===== SIDEBAR USER CARD v1 ===== */
.user-chip{display:none !important;}
.sb-user{display:flex;align-items:center;gap:6px;padding:10px;margin:0 0 12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:16px;backdrop-filter:blur(4px);}
.sb-user[hidden]{display:none;}
.sb-user-main{flex:1;min-width:0;display:flex;align-items:center;gap:11px;background:none;border:0;color:#fff;text-align:left;cursor:pointer;padding:3px;border-radius:12px;transition:background .15s;}
.sb-user-main:hover{background:rgba(255,255,255,.07);}
.sb-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:#fff;background:linear-gradient(135deg,#60a5fa,#2563eb);box-shadow:0 4px 14px rgba(37,99,235,.5),inset 0 0 0 2px rgba(255,255,255,.25);}
.sb-user-text{display:flex;flex-direction:column;min-width:0;gap:1px;}
.sb-user-name{font-weight:700;font-size:13.5px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-user-role{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#93c5fd;}
.sb-logout{width:36px;height:36px;flex-shrink:0;border-radius:11px;border:0;background:rgba(255,255,255,.08);color:#cfe0f5;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s,transform .15s;}
.sb-logout:hover{background:rgba(239,68,68,.30);color:#fff;transform:scale(1.06);}
.sidebar-foot{padding:14px 14px 16px;}
.save-indicator{padding-left:6px;}
.topbar-date{margin-left:auto;font-size:12.5px;font-weight:700;color:var(--ink-500);padding:6px 12px;border:1px solid var(--border);border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(16,32,64,.04);}

/* profile page layout */
.profile-top{padding-bottom:16px;margin-bottom:12px;border-bottom:1px solid var(--border);}
.profile-avatar{width:60px;height:60px;font-size:24px;background:linear-gradient(135deg,#60a5fa,#1d4ed8);box-shadow:0 8px 20px rgba(37,99,235,.35);}
.profile-name{font-size:20px;letter-spacing:-.01em;}
.profile-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px 16px;align-items:end;margin-top:8px;}
.profile-form .field .btn{align-self:flex-start;}
.settings-panel .sheet-table{min-width:0;}
.settings-panel .table-scroll{border:1px solid var(--border);border-radius:12px;}
.profile-sub{margin:22px 0 6px;font-size:15px;font-weight:800;color:var(--navy-800);}
.settings-panel .field-hint{margin:6px 0 10px;}
`;

let a = fs.readFileSync("app.js", "utf8"), c = fs.readFileSync("styles.css", "utf8");
const crlfA = a.includes("\r\n"), crlfC = c.includes("\r\n");
a = a.replace(/\r\n/g, "\n"); c = c.replace(/\r\n/g, "\n");
if (!a.includes("btd_users")) { console.error("STOPPED: run patch-login.js first."); process.exit(1); }
if (a.includes("sidebarUserCard")) { console.log("Already patched — skipped."); process.exit(0); }
fs.copyFileSync("app.js", "app.js.sbuser.bak");
fs.copyFileSync("styles.css", "styles.css.sbuser.bak");
a = a.replace(/\s*$/, "\n") + JS;
c = c.replace(/\s*$/, "\n") + CSS;
fs.writeFileSync("app.js", crlfA ? a.replace(/\n/g, "\r\n") : a);
fs.writeFileSync("styles.css", crlfC ? c.replace(/\n/g, "\r\n") : c);
console.log("Patched app.js + styles.css (backups: *.sbuser.bak). Refresh with Ctrl+F5.");