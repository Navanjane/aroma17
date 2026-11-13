/* Admin site details. GET all, PUT {key: value, ...} (only known keys). */
const auth = require("../../lib/auth");
const { withDb } = require("../../lib/db");
const { send, readJson, route, HttpError } = require("../../lib/http");
const { DEFAULT_SETTINGS } = require("../../lib/schema");

const LIMITS = { whatsapp: 20, email: 200, address: 300, hours: 300, announcement: 200, hero_tagline: 400, story_1: 1000, story_2: 1000 };

module.exports = route(["GET", "PUT"], async (req, res) => {
  auth.requireAuth(req);
  if (req.method === "GET") {
    const settings = await withDb((db) => {
      const s = Object.assign({}, DEFAULT_SETTINGS);
      db.prepare("SELECT key, value FROM settings").all().forEach((r) => { s[r.key] = r.value; });
      return s;
    });
    return send(res, 200, { settings });
  }
  auth.sameOrigin(req);
  const body = await readJson(req);
  const out = {};
  Object.keys(LIMITS).forEach((k) => { if (k in body) { out[k] = String(body[k] == null ? "" : body[k]).trim().slice(0, LIMITS[k]); } });
  if ("whatsapp" in out) {
    out.whatsapp = out.whatsapp.replace(/[\s+\-()]/g, "");
    if (!/^\d{8,15}$/.test(out.whatsapp)) { throw new HttpError(400, "WhatsApp number must be 8-15 digits in international format, e.g. 94771234567"); }
  }
  await withDb((db) => {
    const up = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    db.transaction(() => Object.keys(out).forEach((k) => up.run(k, out[k])))();
  }, { write: true });
  send(res, 200, { ok: true });
});
