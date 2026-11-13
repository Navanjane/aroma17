# Aroma 17

Static website for a luxury perfume decant business. Plain HTML, CSS and vanilla JS. Orders are sent through WhatsApp. Products and site details live in SQLite and are edited on `/admin.html`.

## Preview

Open `index.html` in a browser, or run a local server:

    npx serve

## How data is stored

- **SQLite database:** `data/seed.db` ships in the repo as the starting data. Vercel's project files are read-only at runtime, so the *live* database is a copy kept in **Vercel Blob** (`db/aroma17.db`). Every admin save edits it and uploads it back. Until the first save, the site reads `seed.db`.
- **Images:** uploaded from the admin page to Vercel Blob (`images/...`). The two starter photos still come from `images/` in the repo.
- **Limits:** built for one admin. Two people saving at the same moment can overwrite each other's change. Image uploads are capped at 4 MB (Vercel's request limit).

## Deploy on Vercel

1. Import the repo. Vercel installs dependencies and detects `api/`.
2. In the project, add a **Blob store** (Storage tab). This sets `BLOB_READ_WRITE_TOKEN` automatically.
3. Add environment variable `ADMIN_PASSWORD` (a long password). Optionally `SESSION_SECRET` (random string).
4. Deploy, open `/admin.html`, log in, and fill in **Site details** (WhatsApp number, email, address, hours) and your products.

## Run locally

    npm install
    ADMIN_PASSWORD=secret npm run dev      # http://localhost:3000, admin at /admin.html

Locally the database is `data/local.db` (git-ignored, copied from the seed) and photo upload is off unless you set `BLOB_READ_WRITE_TOKEN` (`vercel env pull`). `npm run seed` rebuilds `data/seed.db` from `scripts/seed-data.js`. Only needed to change the starter catalogue.

## Files

- `index.html`, `products.html`, `product.html`, `order.html`, `contact.html` - the shop
- `admin.html`, `js/admin.js`, `css/admin.css` - login + product CRUD + site details
- `api/site.js` - public data; `api/admin/*` - login, products, settings, upload
- `lib/` - SQLite/Blob sync, auth, validation, schema
- `css/styles.css`, `js/main.js`, `js/config.js` - shop styling, page logic, decant sizes
- `vercel.json` - bundles `data/seed.db` into the functions

The site no longer works by opening the HTML files directly: it needs `/api/site`, so use `npm run dev` or Vercel.
