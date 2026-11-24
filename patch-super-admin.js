// Run in the folder with app.js and styles.css (after patch-login.js):   node patch-super-admin.js
const fs = require("fs");
const S = fn => { const s = fn.toString(); return s.slice(s.indexOf("/*") + 2, s.lastIndexOf("*/")); };

const JS = S(function () {/*

// ===== Three logins: Super Admin / Admin / Data Entry =====
// Super Admin: everything, manages all users.
// Admin: no 24-hour lock, can unlock Data Entry users. Cannot see Super Admin, cannot add/edit/delete users.
// Data Entry: 24-hour lock.
const AUTH_ROLE_NAMES = { entry: "Data Entry", admin: "Admin", super: "Super Admin" };
function authRole() { const u = authCurrent(); return u ? u.role : null; }
function authIsSuper() { return authRole() === "super"; }
function authIsAdmin() { const r = authRole(); return r === "admin" || r === "super"; }

// Existing installs: the oldest Admin account becomes the Super Admin (change roles later in Profile).
(function authMigrateSuper() {
  const list = authUsers();
  if (!list.length || list.some(u => u.role === "super")) return;
  const first = list.filter(u => u.role === "admin").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))[0];
  if (first) { first.role = "super"; authSaveUsers(list); }
})();

authLocked = function (item) {
  const u = authCurrent();
  if (!u) return true;
  if (u.role === "admin" || u.role === "super" || u.canEditOld) return false;
  if (!item || !item.createdAt) return false;
  return Date.now() - item.createdAt > AUTH.LOCK_MS;
};

authRenderMode = function () {
  const setup = authUsers().length === 0;
  AUTH.mode = setup ? "setup" : "login";
  const tabs = document.getElementById("authTabs");
  if (tabs && !tabs.querySelector('[data-role="super"]')) {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.role = "super"; b.textContent = "Super Admin";
    tabs.appendChild(b);
  }
  const tb = tabs.querySelectorAll("button");
  if (tb[0]) tb[0].textContent = "Data Entry";
  if (tb[1]) tb[1].textContent = "Admin";
  document.getElementById("authTitle").textContent = setup ? "Create Super Admin account" : "Sign in";
  const subs = {
    entry: "Data Entry login — records lock 24 hours after they are created.",
    admin: "Admin login — no lock, can give Data Entry users edit access.",
    super: "Super Admin login — full access and user management.",
  };
  document.getElementById("authSub").textContent = setup
    ? "First time here. Create the Super Admin account — you can add other users later from Profile."
    : subs[AUTH.role];
  tabs.hidden = setup;
  document.getElementById("authNameWrap").hidden = !setup;
  document.getElementById("authConfirmWrap").hidden = !setup;
  document.getElementById("authSubmit").textContent = setup ? "Create Super Admin & Sign in" : "Sign in";
  tabs.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.role === AUTH.role));
  document.getElementById("authError").textContent = "";
};

async function authSubmitV2(e) {
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
    const boss = await authMakeUser(name, username, pw, "super");
    authSaveUsers([boss]);
    return authFinishLogin(boss, remember);
  }
  const user = authUsers().find(u => u.username === username);
  if (!user || !(await authCheckPassword(user, pw))) return authSetError("Incorrect username or password.");
  if (user.active === false) return authSetError("This account is disabled. Please contact the Super Admin.");
  if (user.role !== AUTH.role) {
    const n = AUTH_ROLE_NAMES[user.role];
    return authSetError(`This is a ${n} account — use the ${n} tab.`);
  }
  authFinishLogin(user, remember);
}
document.addEventListener("submit", function (e) {
  if (e.target && e.target.id === "authForm") {
    e.stopImmediatePropagation();
    e.preventDefault();
    authSubmitV2(e);
  }
}, true);

authApplyUI = function () {
  const u = authCurrent();
  if (!u) return;
  document.getElementById("userChip").hidden = false;
  document.getElementById("userChipText").innerHTML = `${escapeHtml(u.name)} <span class="role-badge ${u.role}">${AUTH_ROLE_NAMES[u.role]}</span>`;
  const danger = document.getElementById("btnResetApp");
  if (danger) { const p = danger.closest(".panel"); if (p) p.hidden = u.role !== "super"; }
  authRenderProfile();
  applyLockMarks();
};

authRenderProfile = function () {
  const sec = document.getElementById("page-profile");
  const u = authCurrent();
  if (!sec || !u) return;
  const staff = u.role !== "entry";
  const sup = u.role === "super";
  const badge = r => `<span class="role-badge ${r}">${AUTH_ROLE_NAMES[r]}</span>`;
  let html = `
  <div class="page-head"><div><h1>Profile</h1><p class="page-desc">Your account${staff ? " and access control" : ""}.</p></div></div>
  <div class="panel settings-panel">
    <div class="profile-top">
      <div class="profile-avatar">${escapeHtml((u.name || "?").trim().charAt(0).toUpperCase())}</div>
      <div><div class="profile-name">${escapeHtml(u.name)}</div>
        <div class="profile-meta">@${escapeHtml(u.username)} · ${badge(u.role)}</div></div>
      <button type="button" class="btn btn-secondary profile-logout" data-act="logout">Logout</button>
    </div>
    ${staff ? `<p class="field-hint">${sup ? "Super Admin: full access, no 24-hour lock, manages all users." : "Admin: no 24-hour lock. You can give Data Entry users access to edit old records."}</p>` :
      (u.canEditOld
        ? `<p class="field-hint"><strong>Old-record editing is unlocked</strong> for your account.</p>`
        : `<p class="field-hint">Records you create can be edited or deleted for 24 hours. After that they are locked.</p>
           <button type="button" class="btn btn-secondary btn-sm" data-act="request" ${u.unlockRequested ? "disabled" : ""}>${u.unlockRequested ? "Request sent" : "Request edit access"}</button>`)}
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
  const oldCell = x => x.role !== "entry" ? "Always" :
    `<button type="button" class="btn btn-secondary btn-sm" data-act="toggle-old">${x.canEditOld ? "Unlocked — click to lock" : "Locked — click to unlock"}</button>${x.unlockRequested && !x.canEditOld ? ' <span class="badge-shared">requested</span>' : ""}`;
  if (sup) {
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
          <td>${self ? badge(x.role) : `<select data-act="set-role">${["entry", "admin", "super"].map(r => `<option value="${r}" ${x.role === r ? "selected" : ""}>${AUTH_ROLE_NAMES[r]}</option>`).join("")}</select>`}</td>
          <td>${x.active === false ? "Disabled" : "Active"}</td>
          <td>${oldCell(x)}</td>
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
      <div class="field"><label for="nuRole">Login type</label><select id="nuRole"><option value="entry">Data Entry</option><option value="admin">Admin</option><option value="super">Super Admin</option></select></div>
      <div class="field"><label>&nbsp;</label><button type="button" class="btn btn-primary" data-act="add-user">Add user</button></div>
    </div>
  </div>`;
  } else if (u.role === "admin") {
    const users = authUsers().filter(x => x.role === "entry");
    html += `
  <div class="panel settings-panel">
    <h2 class="profile-sub" style="margin-top:0">Data Entry access</h2>
    <p class="field-hint">Unlock a Data Entry user so they can edit or delete records older than 24 hours.</p>
    <div class="table-scroll"><table class="sheet-table"><thead><tr>
      <th>NAME</th><th>USERNAME</th><th>STATUS</th><th>EDIT OLD RECORDS</th></tr></thead><tbody>
      ${users.map(x => `<tr data-uid="${x.id}"><td>${escapeHtml(x.name)}</td><td>${escapeHtml(x.username)}</td><td>${x.active === false ? "Disabled" : "Active"}</td><td>${oldCell(x)}</td></tr>`).join("")
        || '<tr><td colspan="4">No Data Entry users yet.</td></tr>'}
    </tbody></table></div>
  </div>`;
  }
  sec.innerHTML = html;
};

async function authProfileClickV2(e) {
  const b = e.target.closest("[data-act]");
  if (!b || b.tagName === "SELECT") return;
  const act = b.dataset.act;
  const me = authCurrent();
  if (!me) return;
  const val = id => document.getElementById(id).value;
  const rowId = () => b.closest("tr") && b.closest("tr").dataset.uid;

  if (act === "logout") return authLogout();
  if (act === "request") {
    authUpdateUser(me.id, x => { x.unlockRequested = true; });
    showToast("Request sent.", "success");
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
  // Admin AND Super Admin: give / take back access for Data Entry users
  if (act === "toggle-old") {
    if (!authIsAdmin()) return;
    const target = authUsers().find(x => x.id === rowId());
    if (!target || target.role !== "entry") return;
    authUpdateUser(target.id, x => { x.canEditOld = !x.canEditOld; x.unlockRequested = false; });
    return authRenderProfile();
  }
  // Everything below: Super Admin only
  if (!authIsSuper()) return;
  if (act === "toggle-active") {
    if (rowId() === me.id) return;
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
    if (!target || target.id === me.id) return;
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
(function authHookProfileV2() {
  const sec = document.getElementById("page-profile");
  if (!sec || sec.dataset.v2) return;
  sec.dataset.v2 = "1";
  // runs before the older click handler and replaces it
  sec.addEventListener("click", function (e) {
    if (e.target.closest("[data-act]")) { e.stopImmediatePropagation(); authProfileClickV2(e); }
  }, true);
  sec.addEventListener("change", function (e) {
    const s = e.target.closest('select[data-act="set-role"]');
    if (!s || !authIsSuper()) return;
    const id = s.closest("tr").dataset.uid;
    const me = authCurrent();
    if (!id || id === me.id) return authRenderProfile();
    authUpdateUser(id, x => { x.role = s.value; if (s.value !== "entry") { x.canEditOld = false; x.unlockRequested = false; } });
    showToast("Role updated.", "success");
    authRenderProfile();
  });
})();

// refresh the screen for an already signed-in user
if (authCurrent()) { try { authApplyUI(); } catch (err) { } }
*/});

const CSS = S(function () {/*

.role-badge.super { background: #ead4fb; color: #5b1a85; }
.auth-tabs button { font-size: 12px; padding: 9px 4px; }
.profile-form select, .sheet-table select[data-act="set-role"] { padding: 5px 6px; border: 1px solid #c9d5e6; border-radius: 6px; }
*/});

let a = fs.readFileSync("app.js", "utf8"), c = fs.readFileSync("styles.css", "utf8");
const crlfA = a.includes("\r\n"), crlfC = c.includes("\r\n");
a = a.replace(/\r\n/g, "\n"); c = c.replace(/\r\n/g, "\n");
if (!a.includes("btd_users")) { console.error("STOPPED: run patch-login.js first."); process.exit(1); }
if (a.includes("authSubmitV2")) { console.log("Already patched — skipped."); process.exit(0); }
fs.copyFileSync("app.js", "app.js.superadmin.bak");
fs.copyFileSync("styles.css", "styles.css.superadmin.bak");
a = a.replace(/\s*$/, "\n") + JS;
c = c.replace(/\s*$/, "\n") + CSS;
fs.writeFileSync("app.js", crlfA ? a.replace(/\n/g, "\r\n") : a);
fs.writeFileSync("styles.css", crlfC ? c.replace(/\n/g, "\r\n") : c);
console.log("Patched app.js + styles.css (backups: *.superadmin.bak). Refresh with Ctrl+F5.");