// Vercel serverless proxy: browser -> /api/... -> AWS server (adds the secret key on the server side)
module.exports = async function (req, res) {
  const KEY = process.env.BTD_API_KEY, TARGET = process.env.BTD_API_URL || "http://3.111.37.11:3000";
  if (!KEY) { res.status(500).json({ error: "BTD_API_KEY not set in Vercel" }); return; }
  let p = req.query && req.query.p ? String([].concat(req.query.p)[0]) : String(req.url || "").replace(/^\/api\/?/, "");
  if (!/^[A-Za-z0-9_\/-]*$/.test(p)) { res.status(400).json({ error: "bad path" }); return; }
  const headers = { "x-api-key": KEY, "x-user": String(req.headers["x-user"] || "") };
  const init = { method: req.method, headers };
  if (req.method === "PUT") { headers["content-type"] = "application/json"; init.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}); }
  try {
    const r = await fetch(TARGET + "/api/" + p, init);
    const t = await r.text();
    res.status(r.status).setHeader("content-type", r.headers.get("content-type") || "application/json").send(t);
  } catch (e) { res.status(502).json({ error: "Server not reachable" }); }
};