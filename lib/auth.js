/* Single-password admin login with a signed, httpOnly session cookie. */
const crypto = require("crypto");
const { HttpError } = require("./http");

const COOKIE = "a17_session";
const MAX_AGE = 60 * 60 * 24 * 7;   // 7 days

function secret() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) { throw new HttpError(500, "ADMIN_PASSWORD is not set on the server"); }
  return process.env.SESSION_SECRET || ("a17|" + pw);
}
const hmac = (s) => crypto.createHmac("sha256", secret()).update(s).digest("base64url");
function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
function checkPassword(input) { secret(); return safeEqual(input || "", process.env.ADMIN_PASSWORD); }

function sessionCookie(req) {
  const exp = Date.now() + MAX_AGE * 1000;
  const val = exp + "." + hmac(String(exp));
  const secure = /^https/.test(req.headers["x-forwarded-proto"] || "") ? "; Secure" : "";
  return COOKIE + "=" + val + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + MAX_AGE + secure;
}
function clearCookie() { return COOKIE + "=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"; }

function isAuthed(req) {
  const m = (req.headers.cookie || "").match(new RegExp("(?:^|; )" + COOKIE + "=([^;]+)"));
  if (!m) { return false; }
  const parts = m[1].split(".");
  if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || Number(parts[0]) < Date.now()) { return false; }
  return safeEqual(parts[1], hmac(parts[0]));
}
function requireAuth(req) { if (!isAuthed(req)) { throw new HttpError(401, "Not logged in"); } }

/* Reject cross-site state-changing requests (defence in depth on top of SameSite=Strict). */
function sameOrigin(req) {
  const o = req.headers.origin;
  if (o && req.headers.host && new URL(o).host !== req.headers.host) { throw new HttpError(403, "Bad origin"); }
}
module.exports = { checkPassword, sessionCookie, clearCookie, isAuthed, requireAuth, sameOrigin };
