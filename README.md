# Aroma 17

Static website for a luxury perfume decant business. Plain HTML, CSS and vanilla JS. No build step, no backend. Orders are sent through WhatsApp.

## Preview

Open `index.html` in a browser, or run a local server:

    npx serve

## Change the WhatsApp number

Edit `WHATSAPP_NUMBER` at the top of `js/products.js`. Use international format, digits only:

    const WHATSAPP_NUMBER = "94771234567";

Every WhatsApp link on the site uses this one value. While it still contains `X`, the footer and contact page show `[WHATSAPP NUMBER]`.

Other placeholders (`BUSINESS.email`, `BUSINESS.address`, `BUSINESS.hours`) are in the same file.

## Add a product

Add an object to the `products` array in `js/products.js`:

    {
      slug: "my-fragrance",          // used in URLs and as the photo file name
      name: "My Fragrance",
      brand: "Brand",
      category: "Him",               // "Him", "Her" or "Unisex"
      description: "One or two sentences.",
      notes: { top: "", heart: "", base: "" },   // leave empty to hide the notes block
      prices: { 2: 1000, 5: 2200, 10: 4000 }     // LKR
    }

The listing, product page and order page update automatically. Prices in the file are sample values.

## Add photos

Save each photo as `images/<slug>.jpg` (for example `images/ysl-libre.jpg`). Products without a photo show a "PRODUCT PHOTO" placeholder. See `images/README.md`.

## Files

- `index.html`, `products.html`, `product.html`, `order.html`, `contact.html`
- `css/styles.css` - all styling and colour variables
- `js/products.js` - configuration and product data
- `js/main.js` - shared header/footer and page logic

Note: `serve.json` turns off clean URLs. Without it, `npx serve` redirects `product.html?slug=x` to `/product` and drops the query string, so the product and order pages lose their selection.
