// Sets up Vercel: /api/... -> one proxy function (key stays secret on Vercel). Safe to run twice.
const fs = require("fs");
fs.mkdirSync("api", { recursive: true });
fs.writeFileSync("api/proxy.js", fs.readFileSync(__dirname + "/api-proxy.js", "utf8"));
if (fs.existsSync("api/[...path].js")) fs.unlinkSync("api/[...path].js");   // old version, not needed
let j = {};
if (fs.existsSync("vercel.json")) { try { j = JSON.parse(fs.readFileSync("vercel.json", "utf8")); } catch (e) { console.log("ERROR: vercel.json is not valid JSON"); process.exit(1); } fs.copyFileSync("vercel.json", "vercel.json.bak"); }
const mine = [
  { source: "/api/kv/:key", destination: "/api/proxy?p=kv/:key" },
  { source: "/api/kv", destination: "/api/proxy?p=kv" },
  { source: "/api/versions", destination: "/api/proxy?p=versions" },
  { source: "/api/backup", destination: "/api/proxy?p=backup" }
];
j.rewrites = mine.concat((j.rewrites || []).filter(r => !String(r.source).startsWith("/api/")));
fs.writeFileSync("vercel.json", JSON.stringify(j, null, 2) + "\n");
console.log("DONE: api/proxy.js created, vercel.json updated");