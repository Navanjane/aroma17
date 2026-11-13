/* Database schema and default site settings. */
const DEFAULT_SETTINGS = {
  whatsapp: "94XXXXXXXXX",
  email: "",
  address: "",
  hours: "",
  announcement: "Luxury decants in 5 ml and 10 ml. Orders handled personally on WhatsApp.",
  hero_tagline: "Wear the world's finest fragrances in 5 ml and 10 ml decants. Find your signature before you buy the bottle.",
  story_1: "Aroma 17 makes luxury fragrance accessible. A full bottle is a big commitment for a scent you have only smelled for a moment, so we offer small decants that let you live with a fragrance first.",
  story_2: "Every order is handled personally on WhatsApp. Ask questions, get suggestions and confirm the details directly with us before anything is sent."
};

function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Him','Her','Unisex')),
      description TEXT NOT NULL DEFAULT '',
      note_top TEXT NOT NULL DEFAULT '',
      note_heart TEXT NOT NULL DEFAULT '',
      note_base TEXT NOT NULL DEFAULT '',
      price_5 INTEGER NOT NULL,
      price_10 INTEGER NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      credit_text TEXT NOT NULL DEFAULT '',
      credit_url TEXT NOT NULL DEFAULT '',
      bestseller INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);
}

/* One-time clean-ups for databases created before the 2 ml size was removed. Safe to run repeatedly. */
function migrate(db) {
  const cols = db.prepare("PRAGMA table_info(products)").all().map((c) => c.name);
  if (cols.indexOf("price_2") > -1) { db.exec("ALTER TABLE products DROP COLUMN price_2"); }
  const OLD = "2 ml, 5 ml and 10 ml", NEW = "5 ml and 10 ml";
  db.prepare("UPDATE products SET description = replace(description, ?, ?) WHERE description LIKE ?").run(OLD, NEW, "%" + OLD + "%");
  db.prepare("UPDATE settings SET value = replace(value, ?, ?) WHERE value LIKE ?").run(OLD, NEW, "%" + OLD + "%");
}

module.exports = { DEFAULT_SETTINGS, createSchema, migrate };
