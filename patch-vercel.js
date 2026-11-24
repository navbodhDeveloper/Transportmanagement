// Creates/updates vercel.json so https://your-site/api/... is forwarded to the AWS server (safe to run twice)
const fs = require("fs");
let j = {};
if (fs.existsSync("vercel.json")) { try { j = JSON.parse(fs.readFileSync("vercel.json", "utf8")); } catch (e) { console.log("ERROR: vercel.json is not valid JSON"); process.exit(1); } fs.copyFileSync("vercel.json", "vercel.json.bak"); }
j.rewrites = (j.rewrites || []).filter(r => r.source !== "/api/:path*");
j.rewrites.unshift({ source: "/api/:path*", destination: "http://3.111.37.11:3000/api/:path*" });
fs.writeFileSync("vercel.json", JSON.stringify(j, null, 2) + "\n");
console.log("DONE: vercel.json ready");