/* SQLite access.
 *
 * Vercel's filesystem is read-only except /tmp, which is wiped between cold starts.
 * So the live database is a single file kept in Vercel Blob:
 *   - read:  make sure /tmp holds the latest copy from Blob (re-download only if it changed)
 *   - write: edit the /tmp copy, then upload the whole file back to Blob
 * The first time (nothing in Blob yet) the seed database shipped in data/seed.db is used.
 * Without BLOB_READ_WRITE_TOKEN (local dev) data/local.db is used directly.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const Database = require("better-sqlite3");
const { migrate } = require("./schema");

const KEY = "db/aroma17.db";
const SEED = path.join(__dirname, "..", "data", "seed.db");
const LOCAL = path.join(__dirname, "..", "data", "local.db");
const TMP = path.join(os.tmpdir(), "aroma17.db");
const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

let cachedVersion = null;   // which Blob version /tmp currently holds ("seed" = shipped seed)
let queue = Promise.resolve();

async function remoteHead() {
  const { head } = require("@vercel/blob");
  try { return await head(KEY); }
  catch (e) { if (e instanceof require("@vercel/blob").BlobNotFoundError) { return null; } throw e; }
}

async function prepare() {
  if (!useBlob()) {
    if (process.env.VERCEL) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not set. Connect a Blob store to this Vercel project (Storage tab) and redeploy.");
    }
    if (!fs.existsSync(LOCAL)) { fs.copyFileSync(SEED, LOCAL); }
    return LOCAL;
  }
  const h = await remoteHead();
  if (!h) {
    if (cachedVersion !== "seed") { fs.copyFileSync(SEED, TMP); cachedVersion = "seed"; }
    return TMP;
  }
  const version = String(new Date(h.uploadedAt).getTime());
  if (cachedVersion !== version || !fs.existsSync(TMP)) {
    const res = await fetch(h.url + "?v=" + version, { cache: "no-store" });
    if (!res.ok) { throw new Error("Could not download database from Blob (" + res.status + ")"); }
    fs.writeFileSync(TMP, Buffer.from(await res.arrayBuffer()));
    cachedVersion = version;
  }
  return TMP;
}

/* Run fn(db). Reads can run concurrently; writes are serialised and uploaded afterwards. */
async function withDb(fn, opts) {
  if (!(opts && opts.write)) {
    const db = new Database(await prepare(), { readonly: true });
    try { return fn(db); } finally { db.close(); }
  }
  const run = queue.then(async () => {
    const file = await prepare();
    const db = new Database(file);
    let result, buf;
    try { migrate(db); result = fn(db); buf = db.serialize(); } finally { db.close(); }
    if (useBlob()) {
      const { put } = require("@vercel/blob");
      await put(KEY, buf, {
        access: "public", addRandomSuffix: false, allowOverwrite: true,
        contentType: "application/octet-stream", cacheControlMaxAge: 60
      });
      cachedVersion = null;   // force re-check against Blob next time
    }
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

module.exports = { withDb, useBlob };
