/* Admin image upload to Vercel Blob. POST raw image bytes, ?name=file.jpg. Max 4 MB (Vercel body limit). */
const auth = require("../../lib/auth");
const { send, readRaw, route, HttpError } = require("../../lib/http");

const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

module.exports = route(["POST"], async (req, res) => {
  auth.requireAuth(req);
  auth.sameOrigin(req);
  if (!process.env.BLOB_READ_WRITE_TOKEN) { throw new HttpError(500, "Blob storage is not configured (BLOB_READ_WRITE_TOKEN)"); }
  const name = new URL(req.url, "http://x").searchParams.get("name") || "image.jpg";
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (!TYPES[ext]) { throw new HttpError(400, "Use a JPG, PNG, WebP or GIF image"); }
  const buf = await readRaw(req, 4 * 1024 * 1024);
  if (!buf.length) { throw new HttpError(400, "Empty file"); }
  const base = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "image";
  const { put } = require("@vercel/blob");
  const blob = await put("images/" + base + "." + ext, buf, { access: "public", addRandomSuffix: true, contentType: TYPES[ext] });
  send(res, 201, { url: blob.url });
});
