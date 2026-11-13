/* Product row <-> API shape, validation. */
const { HttpError } = require("./http");
const CATEGORIES = ["Him", "Her", "Unisex"];

function fromRow(r) {
  return {
    id: r.id, slug: r.slug, name: r.name, brand: r.brand, category: r.category,
    description: r.description,
    notes: { top: r.note_top, heart: r.note_heart, base: r.note_base },
    prices: { 5: r.price_5, 10: r.price_10 },
    image: r.image_url,
    credit: { text: r.credit_text, url: r.credit_url },
    bestseller: !!r.bestseller, active: !!r.active, sort: r.sort
  };
}
const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const slugify = (s) => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

function cleanUrl(v, what) {
  v = str(v, 600);
  if (v && !/^https:\/\//.test(v) && !/^images\/[\w.\-\/]+$/.test(v)) { throw new HttpError(400, what + " must be an https:// link"); }
  return v;
}
function clean(b) {
  const name = str(b.name, 120), brand = str(b.brand, 120);
  if (!name) { throw new HttpError(400, "Name is required"); }
  if (!brand) { throw new HttpError(400, "Brand is required"); }
  if (CATEGORIES.indexOf(b.category) < 0) { throw new HttpError(400, "Category must be Him, Her or Unisex"); }
  const price = (k) => {
    const n = Number(b.prices && b.prices[k]);
    if (!Number.isInteger(n) || n <= 0 || n > 10000000) { throw new HttpError(400, "Enter a whole-number price for " + k + " ml"); }
    return n;
  };
  const n = b.notes || {};
  const slug = slugify(str(b.slug, 80) || (brand + " " + name));
  if (!slug) { throw new HttpError(400, "Could not make a URL name from that name"); }
  return {
    slug, name, brand, category: b.category,
    description: str(b.description, 1500),
    note_top: str(n.top, 300), note_heart: str(n.heart, 300), note_base: str(n.base, 300),
    price_5: price(5), price_10: price(10),
    image_url: cleanUrl(b.image, "Image"),
    credit_text: str(b.credit && b.credit.text, 200), credit_url: cleanUrl(b.credit && b.credit.url, "Credit link"),
    bestseller: b.bestseller ? 1 : 0, active: b.active === false ? 0 : 1,
    sort: Number.isInteger(Number(b.sort)) ? Number(b.sort) : 0
  };
}
module.exports = { fromRow, clean, CATEGORIES };
