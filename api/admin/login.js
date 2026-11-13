/* GET = am I logged in? POST = log in. DELETE = log out. */
const auth = require("../../lib/auth");
const { send, readJson, route, HttpError } = require("../../lib/http");

let failures = 0, lockedUntil = 0;   // best-effort brake per warm instance

module.exports = route(["GET", "POST", "DELETE"], async (req, res) => {
  if (req.method === "GET") { return send(res, 200, { authed: auth.isAuthed(req) }); }
  auth.sameOrigin(req);
  if (req.method === "DELETE") { return send(res, 200, { ok: true }, { "Set-Cookie": auth.clearCookie() }); }
  if (Date.now() < lockedUntil) { throw new HttpError(429, "Too many attempts. Try again in a minute."); }
  const body = await readJson(req);
  if (!auth.checkPassword(String(body.password || ""))) {
    if (++failures >= 5) { lockedUntil = Date.now() + 60000; failures = 0; }
    await new Promise((r) => setTimeout(r, 600));
    throw new HttpError(401, "Wrong password");
  }
  failures = 0;
  send(res, 200, { ok: true }, { "Set-Cookie": auth.sessionCookie(req) });
});
