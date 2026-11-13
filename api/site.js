/* Public: site settings + visible products. */
const { withDb } = require("../lib/db");
const { send, route } = require("../lib/http");
const { fromRow } = require("../lib/products");
const { DEFAULT_SETTINGS } = require("../lib/schema");

module.exports = route(["GET"], async (req, res) => {
  const data = await withDb((db) => {
    const settings = Object.assign({}, DEFAULT_SETTINGS);
    db.prepare("SELECT key, value FROM settings").all().forEach((r) => { settings[r.key] = r.value; });
    const products = db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY sort, id").all().map(fromRow);
    return { settings, products };
  });
  send(res, 200, data);
});
