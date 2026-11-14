/* Aroma 17 - shared header/footer and page logic.
   Depends on js/config.js (loaded first). */
(function () {
  "use strict";

  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var params = new URLSearchParams(window.location.search);
  var page = qs("[data-page]").getAttribute("data-page");
  // Filled from /api/site before any page code runs.
  var products = [], SETTINGS = {};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return "LKR " + Number(n).toLocaleString("en-US"); }
  function findProduct(slug) { return products.filter(function (p) { return p.slug === slug; })[0]; }
  function waLink(text) { return "https://wa.me/" + SETTINGS.whatsapp + "?text=" + encodeURIComponent(text); }
  function waDisplay() { return /X/i.test(SETTINGS.whatsapp) ? "[WHATSAPP NUMBER]" : "+" + SETTINGS.whatsapp; }
  function validSize(n) { n = parseInt(n, 10); return SIZES.indexOf(n) > -1 ? n : null; }
  function catLabel(c) { return c === "Unisex" ? "Unisex" : "For " + c; }

  var WA_ICON = '<svg class="wa-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z"/></svg>';

  var VIAL = '<svg viewBox="0 0 80 120" width="64" height="96" aria-hidden="true" focusable="false"><rect x="28" y="6" width="24" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="32" y="22" width="16" height="8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="18" y="30" width="44" height="84" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><line x1="18" y1="62" x2="62" y2="62" stroke="currentColor" stroke-width="2"/></svg>';

  /* ---------- Product image slot ---------- */
  function media(p, extra) {
    return '<div class="media ' + (extra || "") + '">' +
      '<div class="media-ph">' + VIAL + '<span>PRODUCT PHOTO</span></div>' +
      (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.brand + " " + p.name + " decant") + '" loading="lazy">' : "") +
      '</div>';
  }
  // Remove images that fail to load so the placeholder underneath shows.
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.closest(".media")) { t.remove(); }
  }, true);
  function checkImages() {
    qsa(".media img").forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) { img.remove(); }
    });
  }

  /* ---------- Product card ---------- */
  function card(p, mode) {
    var detail = mode === "from"
      ? '<p class="card-from">Decants from ' + money(p.prices[SIZES[0]]) + '</p>'
      : '<ul class="chips">' + SIZES.map(function (s) {
          return '<li>' + s + ' ml &middot; ' + money(p.prices[s]) + '</li>';
        }).join("") + '</ul>';
    return '<a class="card" href="product.html?slug=' + encodeURIComponent(p.slug) + '">' +
      media(p) +
      '<div class="card-body"><p class="brand">' + esc(p.brand) + '</p>' +
      '<h3 class="card-name">' + esc(p.name) + '</h3>' + detail + '</div></a>';
  }

  /* ---------- Shared header / footer ---------- */
  function navLink(href, label, key) {
    var cur = key === page ? ' aria-current="page"' : "";
    return '<li><a href="' + href + '"' + cur + '>' + label + '</a></li>';
  }
  function renderChrome() {
    var shopActive = page === "products" || page === "product";
    var current = page;
    page = shopActive ? "products" : page; // so navLink highlights Shop on product pages
    var h = qs("#site-header");
    if (h) {
      h.innerHTML = '<header class="site-header">' +
        '<div class="top-bar"><div class="wrap top-inner">' +
        '<a class="wordmark" href="index.html" aria-label="Aroma 17 home">AROMA 17</a>' +
        '<a class="btn btn-amber btn-sm header-cta" href="order.html" aria-label="Order via WhatsApp">Order<span class="hide-sm"> via WhatsApp</span></a>' +
        '</div></div>' +
        '<div class="nav-bar"><div class="wrap"><nav class="main-nav" aria-label="Main"><ul>' +
        navLink("index.html", "Home", "home") +
        navLink("products.html", "Shop", "products") +
        navLink("contact.html", "Contact", "contact") +
        '</ul></nav></div></div>' +
        '<p class="announce">' + esc(SETTINGS.announcement) + '</p>' +
        '</header>';
    }
    page = current;
    var f = qs("#site-footer");
    if (f) {
      f.innerHTML = '<footer class="site-footer"><div class="wrap footer-inner">' +
        '<div><h2 class="footer-h">About</h2><p class="footer-tag">Aroma 17 sells luxury fragrance decants in 5 ml and 10 ml.</p></div>' +
        '<nav aria-label="Footer"><h2 class="footer-h">Explore</h2><ul class="footer-nav">' +
        '<li><a href="index.html">Home</a></li><li><a href="products.html">Shop</a></li>' +
        '<li><a href="order.html">Order</a></li><li><a href="contact.html">Contact</a></li></ul></nav>' +
        '<div class="footer-contact"><h2 class="footer-h">Contact</h2><p>WhatsApp: <a href="' + waLink("Hello Aroma 17") + '" target="_blank" rel="noopener">' + esc(waDisplay()) + '</a></p>' +
        '<p>' + esc(SETTINGS.address) + '</p></div>' +
        '</div><div class="wrap footer-base"><p>&copy; ' + new Date().getFullYear() + ' Aroma 17. All rights reserved.</p></div></footer>';
    }
  }

  /* ---------- Home ---------- */
  function initHome() {
    var list = products.filter(function (p) { return p.bestseller; });
    if (!list.length) { list = products.slice(0, 3); }
    qs("[data-bestsellers]").innerHTML = list.map(function (p) { return card(p, "from"); }).join("");
    qsa("[data-setting]").forEach(function (el) {
      var v = SETTINGS[el.getAttribute("data-setting")];
      if (v) { el.textContent = v; }
    });
  }

  /* ---------- Listing ---------- */
  function initProducts() {
    var grid = qs("#grid"), count = qs("#count"), chips = qsa("[data-cat]");
    var valid = ["All", "Him", "Her", "Unisex"];
    function apply(cat, push) {
      if (valid.indexOf(cat) < 0) { cat = "All"; }
      var list = products.filter(function (p) { return cat === "All" || p.category === cat; });
      grid.innerHTML = list.map(function (p) { return card(p); }).join("");
      count.textContent = list.length + (list.length === 1 ? " fragrance" : " fragrances") + " shown";
      chips.forEach(function (c) {
        var on = c.getAttribute("data-cat") === cat;
        c.classList.toggle("is-active", on);
        if (on) { c.setAttribute("aria-current", "true"); } else { c.removeAttribute("aria-current"); }
      });
      if (push) {
        try { history.replaceState(null, "", cat === "All" ? "products.html" : "products.html?cat=" + cat); } catch (e) { /* file:// */ }
      }
      checkImages();
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function (e) { e.preventDefault(); apply(c.getAttribute("data-cat"), true); });
    });
    apply(params.get("cat") || "All", false);
  }

  /* ---------- Product details ---------- */
  function initProduct() {
    var root = qs("#product-root"), extras = qsa("[data-product-extra]");
    var p = findProduct(params.get("slug"));
    if (!p) {
      document.title = "Fragrance not found | Aroma 17";
      extras.forEach(function (e) { e.hidden = true; });
      root.innerHTML = '<div class="not-found"><h1>We could not find that fragrance</h1>' +
        '<p>The link may be out of date. Browse the full collection to find what you are looking for.</p>' +
        '<a class="btn btn-amber" href="products.html">Back to Shop</a></div>';
      return;
    }
    document.title = p.name + " | Aroma 17";
    var size = validSize(params.get("size")) || 5;
    var n = p.notes || {};
    var hasNotes = n.top || n.heart || n.base;
    var rows = [["Top", n.top], ["Heart", n.heart], ["Base", n.base]].filter(function (r) { return r[1]; });
    root.innerHTML =
      '<nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="products.html">Shop</a></li><li aria-current="page">' + esc(p.name) + '</li></ol></nav>' +
      '<div class="product-grid">' + media(p, "media-lg") +
      '<div class="product-info"><p class="brand">' + esc(p.brand) + ' &middot; ' + esc(catLabel(p.category)) + '</p>' +
      '<h1>' + esc(p.name) + '</h1>' +
      '<p class="price" id="price" aria-live="polite"></p>' +
      '<p class="lead">' + esc(p.description) + '</p>' +
      '<div class="field-group" role="group" aria-labelledby="size-label"><p class="label" id="size-label">Decant size</p>' +
      '<div class="toggles" id="sizes">' + SIZES.map(function (s) {
        return '<button type="button" class="toggle" data-size="' + s + '" aria-pressed="false">' + s + ' ml</button>';
      }).join("") + '</div></div>' +
      '<div class="actions"><a class="btn btn-amber" id="order-link" href="order.html">Order this decant</a>' +
      '<a class="btn btn-outline" href="contact.html">Ask a question</a></div>' +
      (hasNotes ? '<table class="notes"><caption>Fragrance notes</caption><tbody>' + rows.map(function (r) {
        return '<tr><th scope="row">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>';
      }).join("") + '</tbody></table>' : '') +
      (p.credit && p.credit.text ? '<p class="credit">Photo: ' + (p.credit.url ? '<a href="' + esc(p.credit.url) + '" target="_blank" rel="noopener">' + esc(p.credit.text) + '</a>' : esc(p.credit.text)) + '. Shows the retail product, not the decant.</p>' : '') +
      '</div></div>';
    function update() {
      qs("#price").textContent = money(p.prices[size]) + " · " + size + " ml";
      qs("#order-link").setAttribute("href", "order.html?slug=" + encodeURIComponent(p.slug) + "&size=" + size);
      qsa("#sizes .toggle").forEach(function (b) {
        b.setAttribute("aria-pressed", String(parseInt(b.getAttribute("data-size"), 10) === size));
      });
    }
    qsa("#sizes .toggle").forEach(function (b) {
      b.addEventListener("click", function () { size = parseInt(b.getAttribute("data-size"), 10); update(); });
    });
    update();
    var idx = products.indexOf(p);
    qs("#related").innerHTML = [1, 2, 3].map(function (i) { return card(products[(idx + i) % products.length], "from"); }).join("");
    checkImages();
  }

  /* ---------- Order ---------- */
  function initOrder() {
    var first = findProduct(params.get("slug"));
    if (!first) {
      qs("#order-main").hidden = true;
      qs("#order-empty").hidden = false;
      return;
    }
    var st = { slug: first.slug, size: validSize(params.get("size")) || 5, qty: 1, name: "", phone: "", city: "" };
    var sz = qs("#sizes"), qty = qs("#qty");
    qs("#chosen-brand").textContent = first.brand;
    qs("#chosen-name").textContent = first.name;
    qs("#chosen-change").setAttribute("href", "product.html?slug=" + encodeURIComponent(first.slug));
    sz.innerHTML = SIZES.map(function (s) {
      return '<button type="button" class="toggle" data-size="' + s + '" aria-pressed="false">' + s + ' ml</button>';
    }).join("");

    function detailsOk() { return st.name.trim() && st.city.trim() && st.phone.replace(/\D/g, "").length >= 7; }
    function showErr() {
      var miss = [];
      if (!st.name.trim()) { miss.push("full name"); }
      if (st.phone.replace(/\D/g, "").length < 7) { miss.push("a valid phone number"); }
      if (!st.city.trim()) { miss.push("address"); }
      var el = qs("#details-err");
      el.textContent = miss.length ? "Please enter your " + miss.join(", ") + " before ordering." : "";
      el.hidden = !miss.length;
      return miss.length;
    }
    qs("#wa-btn").addEventListener("click", function (e) {
      if (showErr()) {
        e.preventDefault();
        var f = !st.name.trim() ? "#cust-name" : (st.phone.replace(/\D/g, "").length < 7 ? "#cust-phone" : "#cust-city");
        qs(f).focus();
      }
    });
    ["#cust-name", "#cust-phone", "#cust-city"].forEach(function (id) { qs(id).addEventListener("input", function () { if (!qs("#details-err").hidden) { showErr(); } }); });
    function clamp(v) { v = parseInt(v, 10); if (isNaN(v)) { v = 1; } return Math.min(20, Math.max(1, v)); }
    function render() {
      var p = findProduct(st.slug), unit = p.prices[st.size], total = unit * st.qty;
      qsa("#sizes .toggle").forEach(function (b) { b.setAttribute("aria-pressed", String(parseInt(b.getAttribute("data-size"), 10) === st.size)); });
      qty.value = st.qty;
      qs("#qty-minus").disabled = st.qty <= 1;
      qs("#qty-plus").disabled = st.qty >= 20;
      var th = qs("#sum-thumb");
      if (th.getAttribute("data-slug") !== p.slug) { th.setAttribute("data-slug", p.slug); th.innerHTML = media(p, "media-sm"); checkImages(); }
      qs("#sum-name").textContent = p.brand + " " + p.name;
      qs("#sum-size").textContent = st.size + " ml decant";
      qs("#sum-qty").textContent = st.qty;
      qs("#sum-unit").textContent = money(unit);
      qs("#sum-total").textContent = money(total);
      var lines = ["Hello Aroma 17, I would like to order:", st.qty + " x " + p.name + " (" + st.size + " ml decant)", "Total: " + money(total)];
      lines.push("Name: " + st.name.trim(), "Phone: " + st.phone.trim(), "Address: " + st.city.trim(), "", "_*Ordered via website*_");
      qs("#wa-btn").setAttribute("href", waLink(lines.join("\n")));
      qs("#wa-btn").setAttribute("aria-disabled", String(!detailsOk()));
      try { history.replaceState(null, "", "order.html?slug=" + encodeURIComponent(st.slug) + "&size=" + st.size); } catch (e) { /* file:// */ }
    }
    sz.addEventListener("click", function (e) { var b = e.target.closest("[data-size]"); if (b) { st.size = parseInt(b.getAttribute("data-size"), 10); render(); } });
    qs("#qty-minus").addEventListener("click", function () { st.qty = clamp(st.qty - 1); render(); });
    qs("#qty-plus").addEventListener("click", function () { st.qty = clamp(st.qty + 1); render(); });
    qty.addEventListener("input", function () { if (qty.value !== "") { st.qty = clamp(qty.value); render(); } });
    qty.addEventListener("blur", function () { qty.value = st.qty; });
    qs("#cust-name").addEventListener("input", function (e) { st.name = e.target.value; render(); });
    qs("#cust-phone").addEventListener("input", function (e) { st.phone = e.target.value; render(); });
    qs("#cust-city").addEventListener("input", function (e) { st.city = e.target.value; render(); });
    render();
  }

  /* ---------- Contact ---------- */
  function initContact() {
    var n = qs("#c-name"), w = qs("#c-want"), m = qs("#c-msg"), btn = qs("#c-send");
    function build() {
      var lines = ["Hello Aroma 17,", "My name is " + (n.value.trim() || "..."), "I am looking for: " + (w.value.trim() || "...")];
      if (m.value.trim()) { lines.push("", m.value.trim()); }
      btn.setAttribute("href", waLink(lines.join("\n")));
    }
    [n, w, m].forEach(function (i) { i.addEventListener("input", build); });
    build();
    qsa("[data-wa-number]").forEach(function (a) { a.setAttribute("href", waLink("Hello Aroma 17")); a.textContent = waDisplay(); });
    qsa("[data-business]").forEach(function (el) { el.textContent = SETTINGS[el.getAttribute("data-business")] || "Ask us on WhatsApp"; });
  }

  var inits = { home: initHome, products: initProducts, product: initProduct, order: initOrder, contact: initContact };
  fetch("/api/site", { cache: "no-store" })
    .then(function (r) { if (!r.ok) { throw new Error("HTTP " + r.status); } return r.json(); })
    .then(function (d) { products = d.products; SETTINGS = d.settings; })
    .catch(function () {
      SETTINGS = { whatsapp: "94XXXXXXXXX", announcement: "", address: "" };
      var m = qs("#main");
      if (m) { m.insertAdjacentHTML("afterbegin", '<div class="wrap"><p role="alert" style="padding:24px 0;color:#1d1d1f">We could not load the shop right now. Please refresh in a moment.</p></div>'); }
    })
    .then(function () {
      renderChrome();
      if (inits[page]) { inits[page](); }
      checkImages();
    });
})();
