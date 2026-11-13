/* Admin product CRUD. GET list, POST create, PUT update, DELETE ?id= */
const auth = require("../../lib/auth");
const { withDb } = require("../../lib/db");
const { send, readJson, route, HttpError } = require("../../lib/http");
const { fromRow, clean } = require("../../lib/products");

const COLS = "slug,name,brand,category,description,note_top,note_heart,note_base,price_5,price_10,image_url,credit_text,credit_url,bestseller,active,sort";
const uniq = (e) => { if (/UNIQUE/.test(e.message)) { throw new HttpError(409, "Another product already uses that URL name"); } throw e; };

module.exports = route(["GET", "POST", "PUT", "DELETE"], async (req, res) => {
  auth.requireAuth(req);
  if (req.method === "GET") {
    const rows = await withDb((db) => db.prepare("SELECT * FROM products ORDER BY sort, id").all());
    return send(res, 200, { products: rows.map(fromRow) });
  }
  auth.sameOrigin(req);

  if (req.method === "DELETE") {
    const id = Number(new URL(req.url, "http://x").searchParams.get("id"));
    if (!Number.isInteger(id)) { throw new HttpError(400, "id required"); }
    await withDb((db) => db.prepare("DELETE FROM products WHERE id = ?").run(id), { write: true });
    return send(res, 200, { ok: true });
  }

  const body = await readJson(req);
  const p = clean(body);
  const row = await withDb((db) => {
    try {
      if (req.method === "POST") {
        if (!body.sort) { p.sort = db.prepare("SELECT COALESCE(MAX(sort),0)+1 AS n FROM products").get().n; }
        const id = db.prepare("INSERT INTO products (" + COLS + ") VALUES (" + COLS.split(",").map((c) => "@" + c).join(",") + ")").run(p).lastInsertRowid;
        return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
      }
      const id = Number(body.id);
      if (!Number.isInteger(id)) { throw new HttpError(400, "id required"); }
      const r = db.prepare("UPDATE products SET " + COLS.split(",").map((c) => c + "=@" + c).join(",") + " WHERE id=@id").run(Object.assign({ id }, p));
      if (!r.changes) { throw new HttpError(404, "Product not found"); }
      return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    } catch (e) { uniq(e); }
  }, { write: true });
  send(res, req.method === "POST" ? 201 : 200, { product: fromRow(row) });
});
