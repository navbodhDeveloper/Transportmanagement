// Run in the folder with app.js and styles.css:   node patch-login.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };

const JS = S(function () {/*

// =========================================================
// LOGIN / ROLES / PROFILE
// Data Entry: everything, but records older than 24 hrs are locked.
// Admin: everything, no lock, and can unlock Data Entry users.
// NOTE: data lives in this browser (localStorage), so this is an access
// gate for normal use — not protection against someone using DevTools.
// =========================================================
const AUTH = { USERS_KEY: "btd_users", SESSION_KEY: "btd_session", LOCK_MS: 24 * 60 * 60 * 1000, mode: "login", role: "entry" };

function authUsers() { return Store.get(AUTH.USERS_KEY, []); }
function authSaveUsers(list) { Store.set(AUTH.USERS_KEY, list); }
function authSessionId() {
  try { return sessionStorage.getItem(AUTH.SESSION_KEY) || localStorage.getItem(AUTH.SESSION_KEY); } catch (e) { return null; }
}
function authCurrent() {
  const id = authSessionId();
  return id ? (authUsers().find(u => u.id === id && u.active !== false) || null) : null;
}
function authIsAdmin() { const u = authCurrent(); return !!u && u.role === "admin"; }

function authCyrb(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
async function authHash(pw, salt, kind) {
  const s = salt + ":" + pw;
  if (kind === "s2" && window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return "s2:" + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  return "c1:" + authCyrb(s);
}
async function authMakeUser(name, username, password, role) {
  const salt = uid("s");
  const kind = (window.crypto && crypto.subtle) ? "s2" : "c1";
  return {
    id: uid("usr"), name, username: username.toLowerCase(), role, salt,
    hash: await authHash(password, salt, kind), active: true,
    canEditOld: false, unlockRequested: false, createdAt: Date.now(),
  };
}
async function authCheckPassword(user, pw) {
  const kind = String(user.hash).startsWith("s2:") ? "s2" : "c1";
  return (await authHash(pw, user.salt, kind)) === user.hash;
}

// ---------- 24-hour lock ----------
function authLocked(item) {
  const u = authCurrent();
  if (!u) return true;
  if (u.role === "admin" || u.canEditOld) return false;
  if (!item || !item.createdAt) return false;
  return Date.now() - item.createdAt > AUTH.LOCK_MS;
}
const AUTH_LOCK_MSG = "Locked — records can't be changed after 24 hours. Ask an Admin to unlock your account (Profile → Request edit access).";

function authLookup(t) {
  let tr;
  if (t.closest(".chg-amt")) {
    const el = t.closest(".chg-amt");
    return APP.exports.find(x => Number(x.exportNo) === Number(el.dataset.export)) || null;
  }
  if ((tr = t.closest("#sheetBody tr"))) {
    const a = t.closest("[data-action]");
    if (t.closest("td.editable-cell") || (a && (a.dataset.action === "edit" || a.dataset.action === "delete")))
      return APP.records.find(r => r.id === tr.dataset.id) || null;
    return null;
  }
  if ((tr = t.closest("#cargoRows tr"))) {
    const a = t.closest("[data-action]");
    if (a && (a.dataset.action === "edit" || a.dataset.action === "delete"))
      return APP.cargoEntries.find(x => x.id === tr.dataset.id) || null;
    return null;
  }
  if ((tr = t.closest("#expenseBody tr"))) {
    if (t.closest('[data-action="delete-expense"]')) return APP.expenses.find(x => x.id === tr.dataset.id) || null;
    return null;
  }
  if ((tr = t.closest("#cargoReportsBody tr"))) {
    if (t.closest('[data-action="delete-report"]')) return APP.cargoReports.find(r => r.id === tr.dataset.rid) || null;
    return null;
  }
  if (t.closest("#exportRegisterBody td.editable-cell")) {
    const td = t.closest("td.editable-cell");
    return APP.exports.find(x => x.exportNo === Number(td.dataset.export)) || null;
  }
  if (t.closest("#btnSaveReportComment")) {
    if (APP.viewingExportNo) return APP.exports.find(e => e.exportNo === APP.viewingExportNo) || null;
    if (APP.viewingCargoReportId) return APP.cargoReports.find(r => r.id === APP.viewingCargoReportId) || null;
  }
  return null;
}
document.addEventListener("click", function (e) {
  if (!e.target.closest) return;
  const item = authLookup(e.target);
  if (item && authLocked(item)) {
    e.stopImmediatePropagation();
    e.preventDefault();
    showToast(AUTH_LOCK_MSG, "error");
  }
}, true);

function applyLockMarks() {
  document.querySelectorAll("#sheetBody tr[data-id]").forEach(tr => {
    const r = APP.records.find(x => x.id === tr.dataset.id);
    tr.classList.toggle("row-locked", !!r && authLocked(r));
  });
  document.querySelectorAll("#cargoRows tr[data-id]").forEach(tr => {
    const r = APP.cargoEntries.find(x => x.id === tr.dataset.id);
    tr.classList.toggle("row-locked", !!r && authLocked(r));
  });
  document.querySelectorAll("#expenseBody tr[data-id]").forEach(tr => {
    const r = APP.expenses.find(x => x.id === tr.dataset.id);
    const locked = !!r && authLocked(r);
    tr.classList.toggle("row-locked", locked);
    tr.querySelectorAll("input, select").forEach(el => { el.disabled = locked; });
  });
}
["renderDispatchTable", "renderCargoPage", "renderExpenseTable"].forEach(name => {
  const orig = window[name] || eval(name);
  const wrapped = function () { const r = orig.apply(this, arguments); applyLockMarks(); return r; };
  eval(name + " = wrapped");
});

// ---------- created-at stamps (needed for the 24-hour rule) ----------
function authStamp(list) { let ch = false; list.forEach(x => { if (x && !x.createdAt) { x.createdAt = Date.now(); ch = true; } }); return ch; }
const __sRec = saveRecords; saveRecords = function () { authStamp(APP.records); return __sRec.apply(this, arguments); };
const __sCE = saveCargoEntries; saveCargoEntries = function () { authStamp(APP.cargoEntries); return __sCE.apply(this, arguments); };
const __sExp = saveExpenses; saveExpenses = function () { authStamp(APP.expenses); return __sExp.apply(this, arguments); };
const __sExs = saveExports; saveExports = function () { authStamp(APP.exports); return __sExs.apply(this, arguments); };
const __sCR = saveCargoReports; saveCargoReports = function () { authStamp(APP.cargoReports); return __sCR.apply(this, arguments); };

// A duplicated row is a NEW row — it must start its own 24 hours.
function authWrapDuplicate(fnName, getList, save) {
  const orig = eval(fnName);
  const w = function () {
    const before = new Set(getList().map(x => x.id));
    const r = orig.apply(this, arguments);
    let ch = false;
    getList().forEach(x => { if (!before.has(x.id)) { x.createdAt = Date.now(); ch = true; } });
    if (ch) save();
    return r;
  };
  eval(fnName + " = w");
}
authWrapDuplicate("duplicateRecord", () => APP.records, () => saveRecords());
if (typeof duplicateCargoEntry === "function") authWrapDuplicate("duplicateCargoEntry", () => APP.cargoEntries, () => saveCargoEntries());

document.addEventListener("DOMContentLoaded", () => {
  // Existing data from before login was added: give it a fresh 24 hours once.
  const need = [APP.records, APP.cargoEntries, APP.expenses, APP.exports, APP.cargoReports].some(l => l.some(x => !x.createdAt));
  if (need) { saveRecords(); saveCargoEntries(); saveExpenses(); saveExports(); saveCargoReports(); }
  if (authCurrent()) authApplyUI(); else authShow();
});

// ---------- Login screen ----------
function authBuildOverlay() {
  const el = document.createElement("div");
  el.id = "authOverlay";
  el.className = "auth-overlay";
  el.hidden = true;
  el.innerHTML = `
  <div class="auth-card">
    <div class="auth-side">
      <span class="auth-circle auth-c1"></span><span class="auth-circle auth-c2"></span><span class="auth-circle auth-c3"></span>
      <div class="auth-welcome">
        <h2>WELCOME</h2>
        <p>Book Transport &amp; Dispatch Management</p>
        <small>Book Publication &amp; Distribution System</small>
      </div>
    </div>
    <div class="auth-main">
      <h1 id="authTitle">Sign in</h1>
      <p class="auth-sub" id="authSub">Choose your login type and enter your details.</p>
      <div class="auth-tabs" id="authTabs">
        <button type="button" data-role="entry" class="active">Data Entry Login</button>
        <button type="button" data-role="admin">Admin Login</button>
      </div>
      <form id="authForm" autocomplete="off">
        <div class="auth-field" id="authNameWrap" hidden><label for="authName">Full name</label><input id="authName" type="text"></div>
        <div class="auth-field"><label for="authUser">Username</label><input id="authUser" type="text" autocapitalize="none" spellcheck="false"></div>
        <div class="auth-field"><label for="authPass">Password</label><input id="authPass" type="password"></div>
        <div class="auth-field" id="authConfirmWrap" hidden><label for="authPass2">Confirm password</label><input id="authPass2" type="password"></div>
        <label class="auth-remember" id="authRememberWrap"><input type="checkbox" id="authRemember"> Keep me signed in on this computer</label>
        <div class="auth-error" id="authError" role="alert"></div>
        <button type="submit" class="auth-btn" id="authSubmit">Sign in</button>
      </form>
    </div>
  </div>`;
  document.body.appendChild(el);

  el.querySelector("#authTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-role]");
    if (!b) return;
    AUTH.role = b.dataset.role;
    authRenderMode();
  });
  el.querySelector("#authForm").addEventListener("submit", authSubmit);
  return el;
}
function authRenderMode() {
  const setup = authUsers().length === 0;
  AUTH.mode = setup ? "setup" : "login";
  document.getElementById("authTitle").textContent = setup ? "Create Admin account" : "Sign in";
  document.getElementById("authSub").textContent = setup
    ? "First time here. Create the Admin account — you can add Data Entry users later from Profile."
    : (AUTH.role === "admin" ? "Admin login — full access, can unlock records." : "Data Entry login — records lock 24 hours after they are created.");
  document.getElementById("authTabs").hidden = setup;
  document.getElementById("authNameWrap").hidden = !setup;
  document.getElementById("authConfirmWrap").hidden = !setup;
  document.getElementById("authSubmit").textContent = setup ? "Create Admin & Sign in" : "Sign in";
  document.querySelectorAll("#authTabs button").forEach(b => b.classList.toggle("active", b.dataset.role === AUTH.role));
  document.getElementById("authError").textContent = "";
}
function authShow() {
  const el = document.getElementById("authOverlay") || authBuildOverlay();
  el.hidden = false;
  document.body.classList.add("auth-locked");
  authRenderMode();
  document.getElementById("authForm").reset();
  setTimeout(() => { const f = document.getElementById(AUTH.mode === "setup" ? "authName" : "authUser"); if (f) f.focus(); }, 30);
}
function authSetError(msg) { document.getElementById("authError").textContent = msg; }

async function authSubmit(e) {
  e.preventDefault();
  const username = document.getElementById("authUser").value.trim().toLowerCase();
  const pw = document.getElementById("authPass").value;
  const remember = document.getElementById("authRemember").checked;
  authSetError("");
  if (AUTH.mode === "setup") {
    const name = document.getElementById("authName").value.trim();
    const pw2 = document.getElementById("authPass2").value;
    if (!name) return authSetError("Please enter your name.");
    if (username.length < 3) return authSetError("Username must be at least 3 characters.");
    if (pw.length < 4) return authSetError("Password must be at least 4 characters.");
    if (pw !== pw2) return authSetError("Passwords do not match.");
    const admin = await authMakeUser(name, username, pw, "admin");
    authSaveUsers([admin]);
    return authFinishLogin(admin, remember);
  }
  const user = authUsers().find(u => u.username === username);
  if (!user || !(await authCheckPassword(user, pw))) return authSetError("Incorrect username or password.");
  if (user.active === false) return authSetError("This account is disabled. Please contact the Admin.");
  if (user.role !== AUTH.role) {
    return authSetError(user.role === "admin" ? "This is an Admin account — use the Admin Login tab." : "This is a Data Entry account — use the Data Entry Login tab.");
  }
  authFinishLogin(user, remember);
}
function authFinishLogin(user, remember) {
  try {
    sessionStorage.removeItem(AUTH.SESSION_KEY); localStorage.removeItem(AUTH.SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(AUTH.SESSION_KEY, user.id);
  } catch (err) { }
  document.getElementById("authOverlay").hidden = true;
  document.body.classList.remove("auth-locked");
  authApplyUI();
  showPage("dashboard");
}
function authLogout() {
  try { sessionStorage.removeItem(AUTH.SESSION_KEY); localStorage.removeItem(AUTH.SESSION_KEY); } catch (e) { }
  location.reload();
}

// ---------- Top bar chip, nav item, role-based bits ----------
(function authBuildShell() {
  const bar = document.querySelector(".topbar");
  if (bar && !document.getElementById("userChip")) {
    const chip = document.createElement("div");
    chip.className = "user-chip"; chip.id = "userChip"; chip.hidden = true;
    chip.innerHTML = '<span class="user-chip-text" id="userChipText"></span><button type="button" class="btn btn-secondary btn-sm" id="btnLogoutTop">Logout</button>';
    bar.appendChild(chip);
    chip.querySelector("#btnLogoutTop").addEventListener("click", authLogout);
  }
  const nav = document.querySelector("#sidebar .nav");
  if (nav && !document.querySelector('.nav-item[data-page="profile"]')) {
    const b = document.createElement("button");
    b.className = "nav-item"; b.dataset.page = "profile";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Profile</span>';
    nav.appendChild(b);
  }
  const content = document.getElementById("content");
  if (content && !document.getElementById("page-profile")) {
    const sec = document.createElement("section");
    sec.className = "page"; sec.id = "page-profile";
    content.appendChild(sec);
    sec.addEventListener("click", authProfileClick);
  }
})();

function authApplyUI() {
  const u = authCurrent();
  if (!u) return;
  const chip = document.getElementById("userChip");
  chip.hidden = false;
  document.getElementById("userChipText").innerHTML = `${escapeHtml(u.name)} <span class="role-badge ${u.role}">${u.role === "admin" ? "Admin" : "Data Entry"}</span>`;
  const danger = document.getElementById("btnResetApp");
  if (danger) { const p = danger.closest(".panel"); if (p) p.hidden = u.role !== "admin"; }
  authRenderProfile();
  applyLockMarks();
}
const __showPageForAuth = showPage;
showPage = function (name) {
  if (!authCurrent()) return;
  const r = __showPageForAuth.apply(this, arguments);
  if (name === "profile") authRenderProfile();
  return r;
};

// ---------- Profile page ----------
function authRenderProfile() {
  const sec = document.getElementById("page-profile");
  const u = authCurrent();
  if (!sec || !u) return;
  const admin = u.role === "admin";
  let html = `
  <div class="page-head"><div><h1>Profile</h1><p class="page-desc">Your account${admin ? " and user management" : ""}.</p></div></div>
  <div class="panel settings-panel">
    <div class="profile-top">
      <div class="profile-avatar">${escapeHtml((u.name || "?").trim().charAt(0).toUpperCase())}</div>
      <div><div class="profile-name">${escapeHtml(u.name)}</div>
        <div class="profile-meta">@${escapeHtml(u.username)} · <span class="role-badge ${u.role}">${admin ? "Admin" : "Data Entry"}</span></div></div>
      <button type="button" class="btn btn-secondary profile-logout" data-act="logout">Logout</button>
    </div>
    ${admin ? `<p class="field-hint">Admin: no 24-hour lock. You can unlock Data Entry users below.</p>` :
      (u.canEditOld
        ? `<p class="field-hint"><strong>Old-record editing is unlocked</strong> for your account by an Admin.</p>`
        : `<p class="field-hint">Records you create can be edited or deleted for 24 hours. After that they are locked.</p>
           <button type="button" class="btn btn-secondary btn-sm" data-act="request" ${u.unlockRequested ? "disabled" : ""}>${u.unlockRequested ? "Request sent to Admin" : "Request edit access"}</button>`)}
    <div class="field-grid profile-form">
      <div class="field"><label for="pfName">Display name</label><input type="text" id="pfName" value="${escapeHtml(u.name)}"></div>
      <div class="field"><label>&nbsp;</label><button type="button" class="btn btn-primary" data-act="save-name">Save name</button></div>
    </div>
    <h3 class="profile-sub">Change password</h3>
    <div class="field-grid profile-form">
      <div class="field"><label for="pfOld">Current password</label><input type="password" id="pfOld"></div>
      <div class="field"><label for="pfNew">New password</label><input type="password" id="pfNew"></div>
      <div class="field"><label for="pfNew2">Confirm new password</label><input type="password" id="pfNew2"></div>
      <div class="field"><label>&nbsp;</label><button type="button" class="btn btn-primary" data-act="change-pw">Change password</button></div>
    </div>
  </div>`;
  if (admin) {
    const users = authUsers();
    html += `
  <div class="panel settings-panel">
    <h2 class="profile-sub" style="margin-top:0">Users</h2>
    <div class="table-scroll"><table class="sheet-table"><thead><tr>
      <th>NAME</th><th>USERNAME</th><th>ROLE</th><th>STATUS</th><th>EDIT OLD RECORDS</th><th class="col-actions">ACTIONS</th></tr></thead><tbody>
      ${users.map(x => {
        const self = x.id === u.id;
        return `<tr data-uid="${x.id}">
          <td>${escapeHtml(x.name)}${self ? " <em>(you)</em>" : ""}</td>
          <td>${escapeHtml(x.username)}</td>
          <td><span class="role-badge ${x.role}">${x.role === "admin" ? "Admin" : "Data Entry"}</span></td>
          <td>${x.active === false ? "Disabled" : "Active"}</td>
          <td>${x.role === "admin" ? "Always" : `<button type="button" class="btn btn-secondary btn-sm" data-act="toggle-old">${x.canEditOld ? "Unlocked — click to lock" : "Locked — click to unlock"}</button>${x.unlockRequested && !x.canEditOld ? ' <span class="badge-shared">requested</span>' : ""}`}</td>
          <td class="col-actions"><div class="cell-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-act="reset-pw">Reset password</button>
            ${self ? "" : `<button type="button" class="btn btn-secondary btn-sm" data-act="toggle-active">${x.active === false ? "Enable" : "Disable"}</button>
            <button type="button" class="btn btn-secondary btn-sm" data-act="delete-user">Delete</button>`}
          </div></td></tr>`;
      }).join("")}
    </tbody></table></div>
    <h3 class="profile-sub">Add user</h3>
    <div class="field-grid profile-form">
      <div class="field"><label for="nuName">Full name</label><input type="text" id="nuName"></div>
      <div class="field"><label for="nuUser">Username</label><input type="text" id="nuUser" autocapitalize="none"></div>
      <div class="field"><label for="nuPass">Password</label><input type="password" id="nuPass"></div>
      <div class="field"><label for="nuRole">Login type</label><select id="nuRole"><option value="entry">Data Entry</option><option value="admin">Admin</option></select></div>
      <div class="field"><label>&nbsp;</label><button type="button" class="btn btn-primary" data-act="add-user">Add user</button></div>
    </div>
  </div>`;
  }
  sec.innerHTML = html;
}

function authUpdateUser(id, fn) {
  const list = authUsers();
  const x = list.find(u => u.id === id);
  if (!x) return null;
  fn(x);
  authSaveUsers(list);
  return x;
}
async function authProfileClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  const me = authCurrent();
  if (!me) return;
  const val = id => document.getElementById(id).value;
  const rowId = () => b.closest("tr") && b.closest("tr").dataset.uid;

  if (act === "logout") return authLogout();
  if (act === "request") {
    authUpdateUser(me.id, x => { x.unlockRequested = true; });
    showToast("Request sent to the Admin.", "success");
    return authRenderProfile();
  }
  if (act === "save-name") {
    const n = val("pfName").trim();
    if (!n) return showToast("Name can't be empty.", "error");
    authUpdateUser(me.id, x => { x.name = n; });
    showToast("Name updated.", "success");
    return authApplyUI();
  }
  if (act === "change-pw") {
    const o = val("pfOld"), n = val("pfNew"), n2 = val("pfNew2");
    if (!(await authCheckPassword(me, o))) return showToast("Current password is wrong.", "error");
    if (n.length < 4) return showToast("New password must be at least 4 characters.", "error");
    if (n !== n2) return showToast("New passwords do not match.", "error");
    const fresh = await authMakeUser(me.name, me.username, n, me.role);
    authUpdateUser(me.id, x => { x.salt = fresh.salt; x.hash = fresh.hash; });
    showToast("Password changed.", "success");
    return authRenderProfile();
  }
  if (!authIsAdmin()) return;
  if (act === "toggle-old") {
    authUpdateUser(rowId(), x => { x.canEditOld = !x.canEditOld; x.unlockRequested = false; });
    return authRenderProfile();
  }
  if (act === "toggle-active") {
    authUpdateUser(rowId(), x => { x.active = x.active === false; });
    return authRenderProfile();
  }
  if (act === "reset-pw") {
    const target = authUsers().find(x => x.id === rowId());
    const p = prompt(`New password for ${target.name} (min 4 characters):`);
    if (p === null) return;
    if (p.length < 4) return showToast("Password must be at least 4 characters.", "error");
    const fresh = await authMakeUser(target.name, target.username, p, target.role);
    authUpdateUser(target.id, x => { x.salt = fresh.salt; x.hash = fresh.hash; });
    return showToast("Password reset.", "success");
  }
  if (act === "delete-user") {
    const target = authUsers().find(x => x.id === rowId());
    if (!confirm(`Delete user "${target.name}"? Their records stay.`)) return;
    authSaveUsers(authUsers().filter(x => x.id !== target.id));
    return authRenderProfile();
  }
  if (act === "add-user") {
    const name = val("nuName").trim(), un = val("nuUser").trim().toLowerCase(), pw = val("nuPass"), role = val("nuRole");
    if (!name) return showToast("Enter the user's name.", "error");
    if (un.length < 3) return showToast("Username must be at least 3 characters.", "error");
    if (pw.length < 4) return showToast("Password must be at least 4 characters.", "error");
    if (authUsers().some(x => x.username === un)) return showToast("That username is already taken.", "error");
    const nu = await authMakeUser(name, un, pw, role);
    authSaveUsers(authUsers().concat(nu));
    showToast("User added.", "success");
    return authRenderProfile();
  }
}

// Show the login screen right away (before the app paints) unless already signed in.
if (!authCurrent()) { authBuildOverlay(); authShow(); }
*/});

const CSS = S(function () {/*


body.auth-locked { overflow: hidden; }
.auth-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;
  background: linear-gradient(160deg, #0a63c9 0%, #0b4aa0 45%, #072e66 100%); font-family: inherit; }
.auth-overlay[hidden] { display: none; }
.auth-card { display: flex; width: 100%; max-width: 860px; min-height: 480px; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.35); }
.auth-side { position: relative; flex: 1 1 45%; background: linear-gradient(160deg, #0b6fe0, #0a4fae); color: #fff; overflow: hidden; display: flex; align-items: center; padding: 36px; }
.auth-circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,.12); }
.auth-c1 { width: 260px; height: 260px; left: -90px; top: -80px; }
.auth-c2 { width: 190px; height: 190px; right: -60px; bottom: 30px; background: radial-gradient(circle at 30% 30%, #3b9bff, #0a58c0); }
.auth-c3 { width: 120px; height: 120px; left: 30px; bottom: -40px; }
.auth-welcome { position: relative; z-index: 1; }
.auth-welcome h2 { font-size: 30px; letter-spacing: 2px; margin: 0 0 10px; }
.auth-welcome p { font-weight: 700; margin: 0 0 6px; }
.auth-welcome small { opacity: .8; }
.auth-main { flex: 1 1 55%; padding: 40px 38px; display: flex; flex-direction: column; justify-content: center; }
.auth-main h1 { margin: 0 0 4px; font-size: 28px; color: #0b2a55; }
.auth-sub { margin: 0 0 16px; color: #5b6b82; font-size: 13px; }
.auth-tabs { display: flex; gap: 6px; margin-bottom: 14px; }
.auth-tabs button { flex: 1; padding: 9px 8px; border: 1px solid #c9d5e6; background: #f3f6fb; border-radius: 8px; font-weight: 700; font-size: 13px; color: #35507a; cursor: pointer; }
.auth-tabs button.active { background: #0b3d7e; border-color: #0b3d7e; color: #fff; }
.auth-field { margin-bottom: 11px; }
.auth-field[hidden], .auth-tabs[hidden] { display: none; }
.auth-field label { display: block; font-size: 12px; font-weight: 700; color: #35507a; margin-bottom: 4px; }
.auth-field input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #c9d5e6; border-radius: 8px; background: #f3f6fb; font-size: 14px; }
.auth-field input:focus { outline: 2px solid #0b6fe0; background: #fff; }
.auth-remember { display: flex; gap: 8px; align-items: center; font-size: 13px; color: #35507a; margin: 4px 0 8px; }
.auth-error { min-height: 18px; color: #c0262d; font-size: 13px; margin-bottom: 6px; }
.auth-btn { width: 100%; padding: 12px; border: 0; border-radius: 8px; background: #0b3d7e; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
.auth-btn:hover { background: #0a4a99; }
@media (max-width: 700px) { .auth-side { display: none; } .auth-main { padding: 28px 22px; } }

.user-chip { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; }
.user-chip[hidden] { display: none; }
.role-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #e3ecf8; color: #0b3d7e; }
.role-badge.admin { background: #fde7c8; color: #8a4b00; }
.profile-top { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
.profile-avatar { width: 52px; height: 52px; border-radius: 50%; background: #0b3d7e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; }
.profile-name { font-size: 18px; font-weight: 800; }
.profile-meta { color: #5b6b82; font-size: 13px; }
.profile-logout { margin-left: auto; }
.profile-sub { margin: 18px 0 8px; font-size: 15px; }
.profile-form { align-items: end; }
.row-locked [data-action="edit"], .row-locked [data-action="delete"], .row-locked [data-action="delete-expense"] { opacity: .35; }
.row-locked td.editable-cell { cursor: not-allowed; }
@media print { .user-chip, #authOverlay { display: none !important; } }
*/});

let app = fs.readFileSync("app.js", "utf8");
let css = fs.readFileSync("styles.css", "utf8");
const crlfA = app.includes("\r\n"), crlfC = css.includes("\r\n");
let a = app.replace(/\r\n/g, "\n"), c = css.replace(/\r\n/g, "\n");
if (a.includes("btd_users")) { console.log("Already patched — skipped."); process.exit(0); }
for (const fn of ["showPage", "saveRecords", "saveCargoEntries", "saveExpenses", "saveExports", "saveCargoReports", "renderDispatchTable", "renderCargoPage", "renderExpenseTable", "duplicateRecord", "showToast", "uid"])
  if (!a.includes("function " + fn) && !/function uid/.test(a) && fn !== "uid") { console.error(`STOPPED: function ${fn} not found — wrong app.js?`); process.exit(1); }
fs.copyFileSync("app.js", "app.js.login.bak");
fs.copyFileSync("styles.css", "styles.css.login.bak");
a = a.replace(/\s*$/, "\n") + JS;
c = c.replace(/\s*$/, "\n") + CSS;
fs.writeFileSync("app.js", crlfA ? a.replace(/\n/g, "\r\n") : a);
fs.writeFileSync("styles.css", crlfC ? c.replace(/\n/g, "\r\n") : c);
console.log("Patched app.js + styles.css (backups: *.login.bak). Refresh with Ctrl+F5.");