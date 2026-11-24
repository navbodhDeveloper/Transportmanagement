// Adds <script src="cloud.js"></script> as the FIRST script in index.html (safe to run twice)
const fs = require("fs");
const f = "index.html";
let s = fs.readFileSync(f, "utf8");
if (s.includes('src="cloud.js"')) { console.log("Already added."); process.exit(0); }
const i = s.search(/<script/i);
if (i < 0) { console.log("ERROR: no <script> tag found in index.html"); process.exit(1); }
fs.writeFileSync(f + ".cloud.bak", s);
const nl = s.includes("\r\n") ? "\r\n" : "\n";
s = s.slice(0, i) + '<script src="cloud.js"></script>' + nl + s.slice(i);
fs.writeFileSync(f, s);
console.log("DONE: cloud.js added to index.html");
