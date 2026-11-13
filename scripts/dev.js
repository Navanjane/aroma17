/* Local dev server: static files + /api/* handlers, like Vercel. Run: ADMIN_PASSWORD=secret npm run dev
   Without BLOB_READ_WRITE_TOKEN the db is data/local.db (git-ignored) and image upload is disabled. */
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const port = process.env.PORT || 3000;
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    const file = path.join(root, url.pathname.replace(/\/$/, "") + ".js");
    if (!file.startsWith(path.join(root, "api")) || !fs.existsSync(file)) { res.statusCode = 404; return res.end("Not found"); }
    return require(file)(req, res);
  }
  let p = path.normalize(path.join(root, url.pathname === "/" ? "index.html" : url.pathname));
  const rel = path.relative(root, p);
  if (rel.startsWith("..") || /^(lib|data|scripts|node_modules|api)([\\/]|$)|^\./.test(rel)) { res.statusCode = 404; return res.end("Not found"); }
  fs.readFile(p, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", types[path.extname(p)] || "application/octet-stream");
    res.end(buf);
  });
}).listen(port, () => console.log("http://localhost:" + port + "  (admin: /admin.html)"));
