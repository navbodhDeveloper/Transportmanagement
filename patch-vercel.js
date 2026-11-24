// Sets up Vercel so the app needs NO access key in the browser (key stays secret on Vercel). Safe to run twice.
const fs = require("fs");
fs.mkdirSync("api", { recursive: true });
fs.writeFileSync("api/[...path].js", fs.readFileSync(__dirname + "/api-proxy.js", "utf8"));
let j = {};
if (fs.existsSync("vercel.json")) { try { j = JSON.parse(fs.readFileSync("vercel.json", "utf8")); } catch (e) { console.log("ERROR: vercel.json is not valid JSON"); process.exit(1); } fs.copyFileSync("vercel.json", "vercel.json.bak"); }
if (j.rewrites) { j.rewrites = j.rewrites.filter(r => r.source !== "/api/:path*"); if (!j.rewrites.length) delete j.rewrites; }
fs.writeFileSync("vercel.json", JSON.stringify(j, null, 2) + "\n");
console.log("DONE: api/[...path].js created, vercel.json cleaned");