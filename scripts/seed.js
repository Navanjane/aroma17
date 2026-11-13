/* Builds data/seed.db from scripts/seed-data.js. Run: npm run seed
   The seed is only used until the first admin save; after that the live db lives in Vercel Blob. */
const fs = require("fs"), path = require("path");
const Database = require("better-sqlite3");
const { createSchema, DEFAULT_SETTINGS } = require("../lib/schema");
const { products } = require("./seed-data");

const file = path.join(__dirname, "..", "data", "seed.db");
fs.mkdirSync(path.dirname(file), { recursive: true });
if (fs.existsSync(file)) { fs.unlinkSync(file); }
const db = new Database(file);
createSchema(db);

const ins = db.prepare(`INSERT INTO products (slug,name,brand,category,description,note_top,note_heart,note_base,price_5,price_10,image_url,credit_text,credit_url,bestseller,active,sort)
  VALUES (@slug,@name,@brand,@category,@description,@top,@heart,@base,@p5,@p10,@image,@ctext,@curl,@best,1,@sort)`);
const best = ["dior-sauvage-edt", "ysl-libre", "baccarat-rouge-540"];
db.transaction(() => {
  products.forEach((p, i) => {
    const hasImg = fs.existsSync(path.join(__dirname, "..", "images", p.slug + ".jpg"));
    ins.run({
      slug: p.slug, name: p.name, brand: p.brand, category: p.category, description: p.description,
      top: p.notes.top, heart: p.notes.heart, base: p.notes.base,
      p5: p.prices[5], p10: p.prices[10],
      image: hasImg ? "images/" + p.slug + ".jpg" : "",
      ctext: p.credit ? p.credit.author + ", " + p.credit.license + ", via Wikimedia Commons" : "",
      curl: p.credit ? p.credit.url : "", best: best.indexOf(p.slug) > -1 ? 1 : 0, sort: i + 1
    });
  });
  const set = db.prepare("INSERT INTO settings (key,value) VALUES (?,?)");
  Object.keys(DEFAULT_SETTINGS).forEach((k) => set.run(k, DEFAULT_SETTINGS[k]));
})();
db.close();
console.log("Wrote " + file + " with " + products.length + " products");
