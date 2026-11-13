/* Tiny helpers so handlers work on Vercel and in scripts/dev.js. */
function send(res, status, body, headers) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  Object.keys(headers || {}).forEach((k) => res.setHeader(k, headers[k]));
  res.end(JSON.stringify(body));
}
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new HttpError(413, "File too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) { return req.body; }
  const raw = typeof req.body === "string" ? req.body : (await readRaw(req, 1e6)).toString("utf8");
  if (!raw) { return {}; }
  try { return JSON.parse(raw); } catch (e) { throw new HttpError(400, "Invalid JSON"); }
}

/* Wrap a handler: catches errors, restricts methods. */
function route(methods, fn) {
  return async (req, res) => {
    try {
      if (methods.indexOf(req.method) < 0) {
        res.setHeader("Allow", methods.join(", "));
        return send(res, 405, { error: "Method not allowed" });
      }
      await fn(req, res);
    } catch (e) {
      if (e instanceof HttpError) { return send(res, e.status, { error: e.message }); }
      console.error(e);
      send(res, 500, { error: "Server error" });
    }
  };
}
module.exports = { send, HttpError, readJson, readRaw, route };
