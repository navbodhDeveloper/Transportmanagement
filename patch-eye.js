// Adds a show/hide (eye) button to every password box (login, profile, add user...). Safe to run twice.
const fs = require("fs");
const S = f => { const m = f.toString(); return m.slice(m.indexOf("/*") + 2, m.lastIndexOf("*/")); };
const APPEND = S(function () {/*
// ===== PASSWORD EYE =====
(function () {
  if (window.__pwEye) return; window.__pwEye = true;
  var st = document.createElement("style");
  st.textContent = ".pw-eye-wrap{position:relative;display:block;width:100%}.pw-eye-wrap>input{padding-right:42px!important;width:100%;box-sizing:border-box}" +
    ".pw-eye-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:0;background:transparent;cursor:pointer;color:#64748b;display:flex;align-items:center;justify-content:center;border-radius:8px;padding:0}" +
    ".pw-eye-btn:hover{color:#0f172a;background:rgba(100,116,139,.12)}.pw-eye-btn svg{width:20px;height:20px;pointer-events:none}";
  document.head.appendChild(st);
  var OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var SHUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  function add(inp) {
    if (inp.__eye || !inp.parentNode) return; inp.__eye = true;
    var w = document.createElement("span"); w.className = "pw-eye-wrap";
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    var b = document.createElement("button"); b.type = "button"; b.className = "pw-eye-btn"; b.tabIndex = -1;
    b.title = "Show password"; b.setAttribute("aria-label", "Show password"); b.innerHTML = OPEN;
    b.addEventListener("mousedown", function (e) { e.preventDefault(); });
    b.addEventListener("click", function () {
      var show = inp.type === "password"; inp.type = show ? "text" : "password";
      b.innerHTML = show ? SHUT : OPEN; b.title = show ? "Hide password" : "Show password"; inp.focus();
    });
    w.appendChild(b);
  }
  function scan() { var l = document.querySelectorAll("input[type=password]"); for (var i = 0; i < l.length; i++) add(l[i]); }
  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
*/});
const raw = fs.readFileSync("app.js", "utf8");
const crlf = raw.includes("\r\n");
let t = raw.replace(/\r\n/g, "\n");
if (t.includes("PASSWORD EYE")) { console.log("Already patched - skipped."); process.exit(0); }
fs.copyFileSync("app.js", "app.js.eye.bak");
t = t.replace(/\s*$/, "\n") + APPEND;
fs.writeFileSync("app.js", crlf ? t.replace(/\n/g, "\r\n") : t);
console.log("app.js patched (backup: app.js.eye.bak). Refresh with Ctrl+F5.");