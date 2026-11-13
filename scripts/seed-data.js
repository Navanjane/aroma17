/* Starter catalogue used by scripts/seed.js to build data/seed.db.
   After the first deploy, edit products in the /admin.html page instead. */

const SIZES = [2, 5, 10];

// Optional credit: {author, license, url} is shown under the photo (needed for CC-licensed images).
// Prices are SAMPLE prices in LKR. Leave notes as empty strings to hide the notes block.
const products = [
  {
    slug: "dior-sauvage-edt",
    name: "Sauvage EDT",
    brand: "Dior",
    category: "Him",
    description: "A fresh, spicy fragrance built around bergamot and pepper, with a warm woody base. A confident everyday choice.",
    notes: {
      top: "Calabrian bergamot, pepper",
      heart: "Lavender, Sichuan pepper, vetiver",
      base: "Ambroxan, cedar, labdanum"
    },
    prices: { 5: 2400, 10: 4500 },
    credit: { author: "DYVER", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Dior_Sauvage_Verpackung.jpg" }
  },
  {
    slug: "bleu-de-chanel-edp",
    name: "Bleu de Chanel EDP",
    brand: "Chanel",
    category: "Him",
    description: "A Chanel fragrance for men, available as 5 ml and 10 ml decants so you can wear it before committing to a full bottle.",
    notes: { top: "", heart: "", base: "" },
    prices: { 5: 2900, 10: 5400 }
  },
  {
    slug: "ysl-libre",
    name: "Libre",
    brand: "Yves Saint Laurent",
    category: "Her",
    description: "A Yves Saint Laurent fragrance for women, available as 5 ml and 10 ml decants so you can wear it before committing to a full bottle.",
    notes: { top: "", heart: "", base: "" },
    prices: { 5: 2600, 10: 4900 }
  },
  {
    slug: "coco-mademoiselle",
    name: "Coco Mademoiselle",
    brand: "Chanel",
    category: "Her",
    description: "A Chanel fragrance for women, available as 5 ml and 10 ml decants so you can wear it before committing to a full bottle.",
    notes: { top: "", heart: "", base: "" },
    prices: { 5: 2900, 10: 5400 },
    credit: { author: "Brownchl", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:Coco_mademoiselle.jpg" }
  },
  {
    slug: "tom-ford-oud-wood",
    name: "Oud Wood",
    brand: "Tom Ford",
    category: "Unisex",
    description: "A Tom Ford fragrance for any wearer, available as 5 ml and 10 ml decants so you can wear it before committing to a full bottle.",
    notes: { top: "", heart: "", base: "" },
    prices: { 5: 4300, 10: 8000 }
  },
  {
    slug: "baccarat-rouge-540",
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    category: "Unisex",
    description: "A Maison Francis Kurkdjian fragrance for any wearer, available as 5 ml and 10 ml decants so you can wear it before committing to a full bottle.",
    notes: { top: "", heart: "", base: "" },
    prices: { 5: 4800, 10: 9000 }
  }
];

if (typeof module !== "undefined") {
  module.exports = { SIZES, products };
}
