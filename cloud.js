/* =========================================================
   CLOUD SYNC  (load this FIRST, before data.js / utils.js / app.js)
   Keeps localStorage and the AWS database in sync, so the
   rest of the app works without any change.
   ========================================================= */
(function () {
  "use strict";
  var BASE = (location.protocol === "https:") ? "" : "http://3.111.37.11:3000";   // https site (Vercel) uses /api proxy; localhost calls server directly
  var KEY_OK = /^(btdm_[A-Za-z0-9_]+|btd_users)$/;
  var proto = Storage.prototype;
  var origGet = proto.getItem, origSet = proto.setItem, origRem = proto.removeItem;
  var versions = {};      // last server version we know, per key
  var state = {};         // per key: { timer, inflight, dirty }
  var readOnly = false;
  var banner = null;

  /* ---------- small banner ---------- */
  function showBanner(text, kind, btnText, btnFn) {
    function build() {
      if (!banner) {
        banner = document.createElement("div");
        banner.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;padding:10px 16px;border-radius:12px;font:600 13px Inter,Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;gap:12px;align-items:center";
        document.body.appendChild(banner);
      }
      banner.style.background = kind === "bad" ? "#b42318" : kind === "ok" ? "#067647" : "#1d4ed8";
      banner.style.color = "#fff";
      banner.textContent = text;
      if (btnText) {
        var b = document.createElement("button");
        b.textContent = btnText;
        b.style.cssText = "border:0;border-radius:8px;padding:5px 10px;font-weight:700;cursor:pointer";
        b.onclick = btnFn;
        banner.appendChild(b);
      }
    }
    if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
  }
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }

  /* ---------- access key ---------- */
  function getKey() { return BASE === "" ? "via-proxy" : (origGet.call(localStorage, "btd_apikey") || ""); }
  function askKey(msg) {
    var k = window.prompt(msg || "Enter the access key given by your admin:");
    if (k) origSet.call(localStorage, "btd_apikey", k.trim());
    return !!k;
  }
  function who() {
    try {
      var s = JSON.parse(origGet.call(sessionStorage, "btd_session") || origGet.call(localStorage, "btd_session") || "null");
      return (s && (s.username || s.name || s.user)) || "";
    } catch (e) { return ""; }
  }

  /* ---------- http helpers ---------- */
  function syncReq(method, url) {
    var x = new XMLHttpRequest();
    x.open(method, url, false);
    x.setRequestHeader("x-api-key", getKey());
    try { x.send(); } catch (e) { return { status: 0, body: null }; }
    var body = null; try { body = JSON.parse(x.responseText); } catch (e) {}
    return { status: x.status, body: body };
  }
  function asyncReq(method, url, payload) {
    return fetch(url, {
      method: method,
      headers: { "content-type": "application/json", "x-api-key": getKey(), "x-user": who() },
      body: payload ? JSON.stringify(payload) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) { return { status: r.status, body: b }; });
    });
  }

  /* ---------- initial pull (blocks, so the app starts with server data) ---------- */
  function initialPull() {
    var res, tries = 0;
    while (true) {
      if (BASE !== "" && !getKey() && !askKey()) { readOnly = true; return; }
      res = syncReq("GET", BASE + "/api/kv");
      if (res.status === 401 && tries < 3) { origRem.call(localStorage, "btd_apikey"); tries++; if (!askKey("Wrong key. Enter the access key again:")) { readOnly = true; return; } continue; }
      break;
    }
    if (res.status !== 200 || !res.body) {
      readOnly = true;
      showBanner("Cannot reach the server. Data will NOT be saved. Check internet and reload.", "bad", "Reload", function () { location.reload(); });
      return;
    }
    var server = res.body, serverKeys = Object.keys(server);
    if (serverKeys.length === 0) {
      // First ever run: upload whatever this browser already has (your existing data)
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (KEY_OK.test(k)) { state[k] = {}; schedule(k, 0); }
      }
    } else {
      // Server is the truth: replace local copies
      var toRemove = [];
      for (var j = 0; j < localStorage.length; j++) { var lk = localStorage.key(j); if (KEY_OK.test(lk) && !(lk in server)) toRemove.push(lk); }
      toRemove.forEach(function (k2) { origRem.call(localStorage, k2); });
      serverKeys.forEach(function (k3) {
        origSet.call(localStorage, k3, JSON.stringify(server[k3].value));
        versions[k3] = server[k3].version;
      });
    }
  }

  /* ---------- pushing changes ---------- */
  function schedule(key, delay) {
    var s = state[key] || (state[key] = {});
    s.dirty = true;
    clearTimeout(s.timer);
    s.timer = setTimeout(function () { push(key); }, delay === undefined ? 300 : delay);
  }
  function push(key) {
    var s = state[key]; if (!s || s.inflight || !s.dirty) return;
    var raw = origGet.call(localStorage, key);
    s.inflight = true; s.dirty = false;
    var value; try { value = JSON.parse(raw); } catch (e) { value = raw; }
    asyncReq("PUT", BASE + "/api/kv/" + encodeURIComponent(key), { value: value, baseVersion: versions[key] || 0 })
      .then(function (r) {
        s.inflight = false;
        if (r.status === 200) { versions[key] = r.body.version; if (s.dirty) push(key); else hideBanner(); }
        else if (r.status === 409) conflict();
        else if (r.status === 401) { origRem.call(localStorage, "btd_apikey"); showBanner("Access key rejected. Reload and enter the key again.", "bad", "Reload", function () { location.reload(); }); }
        else retry(key);
      })
      .catch(function () { s.inflight = false; retry(key); });
  }
  function retry(key) {
    showBanner("Saving failed, retrying… (keep this page open)", "bad");
    state[key].dirty = true;
    setTimeout(function () { push(key); }, 3000);
  }
  function conflict() {
    readOnly = true;
    showBanner("Someone else changed this data. Reload to get the latest, then redo your last change.", "bad", "Reload now", function () { location.reload(); });
  }

  /* ---------- hook localStorage writes ---------- */
  proto.setItem = function (k, v) {
    if (this === localStorage && KEY_OK.test(k)) {
      if (readOnly) throw new Error("Read-only: server not available or data changed elsewhere");
      origSet.call(this, k, v);
      schedule(k);
      return;
    }
    return origSet.call(this, k, v);
  };
  proto.removeItem = function (k) {
    if (this === localStorage && KEY_OK.test(k)) {
      if (readOnly) throw new Error("Read-only");
      origRem.call(this, k);
      asyncReq("DELETE", BASE + "/api/kv/" + encodeURIComponent(k)).then(function () { delete versions[k]; });
      return;
    }
    return origRem.call(this, k);
  };

  /* ---------- check for other people's changes ---------- */
  function poll() {
    if (readOnly) return;
    asyncReq("GET", BASE + "/api/versions").then(function (r) {
      if (r.status !== 200) return;
      var changed = Object.keys(r.body).some(function (k) {
        var s = state[k] || {};
        return !s.inflight && !s.dirty && r.body[k] !== (versions[k] || 0);
      });
      if (changed) showBanner("New data from another user is available.", "info", "Refresh", function () { location.reload(); });
    }).catch(function () {});
  }
  setInterval(poll, 20000);

  window.addEventListener("beforeunload", function (e) {
    var pending = Object.keys(state).some(function (k) { return state[k].dirty || state[k].inflight; });
    if (pending) { e.preventDefault(); e.returnValue = ""; }
  });

  initialPull();
  window.BTD_CLOUD = { versions: versions, isReadOnly: function () { return readOnly; } };
})();