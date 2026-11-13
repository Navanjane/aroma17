/* Aroma 17 admin: login, product CRUD, site details. Talks to /api/admin/*. */
(function () {
  "use strict";
  var app = document.getElementById("app");
  var state = { tab: "products", products: [], settings: {}, editing: null };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }

  function api(method, url, body, raw) {
    var opt = { method: method, credentials: "same-origin", headers: {} };
    if (raw) { opt.body = raw; } else if (body) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    return fetch(url, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url.indexOf("login") < 0) { showLogin(); throw new Error("Please log in again"); }
        if (!r.ok) { throw new Error(d.error || "Request failed (" + r.status + ")"); }
        return d;
      });
    });
  }
  function msg(el, text, ok) { el.className = "a-msg " + (ok ? "ok" : "err"); el.textContent = text; el.hidden = !text; el.setAttribute("role", ok ? "status" : "alert"); }

  /* ---------- Login ---------- */
  function showLogin() {
    app.innerHTML = '<form class="a-card a-login" id="login"><h1>Aroma 17 admin</h1>' +
      '<label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required>' +
      '<div class="a-msg err" id="lm" hidden></div>' +
      '<div class="a-actions"><button class="a-btn a-btn-primary" type="submit">Log in</button></div></form>';
    $("#pw").focus();
    $("#login").addEventListener("submit", function (e) {
      e.preventDefault();
      api("POST", "/api/admin/login", { password: $("#pw").value }).then(load).catch(function (err) { msg($("#lm"), err.message); });
    });
  }

  /* ---------- Shell ---------- */
  function load() {
    return Promise.all([api("GET", "/api/admin/products"), api("GET", "/api/admin/settings")]).then(function (r) {
      state.products = r[0].products; state.settings = r[1].settings; state.editing = null; render();
    }).catch(function (e) { app.innerHTML = '<p class="a-msg err">' + esc(e.message) + '</p>'; });
  }
  function render() {
    app.innerHTML = '<div class="a-head"><h1>Aroma 17 admin</h1><div><a class="a-btn a-btn-sm" href="index.html" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">View site</a> <button class="a-btn a-btn-sm" id="logout">Log out</button></div></div>' +
      '<div class="a-tabs" role="tablist">' +
      ['products:Products', 'settings:Site details'].map(function (t) { var k = t.split(":");
        return '<button class="a-tab" role="tab" data-tab="' + k[0] + '" aria-selected="' + (state.tab === k[0]) + '">' + k[1] + '</button>'; }).join("") +
      '</div><div id="pane"></div>';
    $("#logout").addEventListener("click", function () { api("DELETE", "/api/admin/login").then(showLogin); });
    Array.prototype.forEach.call(app.querySelectorAll("[data-tab]"), function (b) {
      b.addEventListener("click", function () { state.tab = b.getAttribute("data-tab"); state.editing = null; render(); });
    });
    if (state.tab === "settings") { renderSettings(); } else if (state.editing) { renderForm(); } else { renderList(); }
  }

  /* ---------- Product list ---------- */
  function renderList() {
    var pane = $("#pane");
    pane.innerHTML = '<div class="a-head"><h2>' + state.products.length + ' products</h2><button class="a-btn a-btn-primary" id="add">Add product</button></div>' +
      '<div class="a-card" id="list">' + (state.products.map(function (p) {
        return '<div class="a-row"><div class="a-thumb" style="' + (p.image ? "background-image:url('" + esc(p.image) + "')" : "") + '"></div>' +
          '<div class="a-grow"><strong>' + esc(p.brand) + ' ' + esc(p.name) + '</strong><span class="a-muted">' + esc(p.category) + ' &middot; LKR ' + p.prices[5] + ' / ' + p.prices[10] + '</span>' +
          '<span>' + (p.active ? '' : '<span class="a-tag">Hidden</span>') + (p.bestseller ? '<span class="a-tag">Bestseller</span>' : '') + '</span></div>' +
          '<button class="a-btn a-btn-sm" data-edit="' + p.id + '">Edit</button>' +
          '<button class="a-btn a-btn-sm a-btn-danger" data-del="' + p.id + '">Delete</button></div>';
      }).join("") || '<p class="a-muted">No products yet.</p>') + '</div><div class="a-msg" id="lmsg" hidden></div>';
    $("#add").addEventListener("click", function () {
      state.editing = { name: "", brand: "", category: "Him", description: "", notes: {}, prices: {}, image: "", credit: {}, bestseller: false, active: true };
      render();
    });
    pane.addEventListener("click", function (e) {
      var ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
      if (ed) { state.editing = state.products.filter(function (p) { return p.id === +ed.getAttribute("data-edit"); })[0]; render(); }
      if (del) {
        var p = state.products.filter(function (x) { return x.id === +del.getAttribute("data-del"); })[0];
        if (!confirm("Delete " + p.brand + " " + p.name + "? This cannot be undone.")) { return; }
        del.disabled = true;
        api("DELETE", "/api/admin/products?id=" + p.id).then(load).catch(function (err) { del.disabled = false; msg($("#lmsg"), err.message); });
      }
    });
  }

  /* ---------- Product form ---------- */
  function renderForm() {
    var p = state.editing, isNew = !p.id, n = p.notes || {}, c = p.credit || {};
    function f(id, label, val, type, extra) { return '<label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + (type || "text") + '" value="' + esc(val) + '" ' + (extra || "") + '>'; }
    $("#pane").innerHTML = '<form class="a-card" id="pf" novalidate><h2>' + (isNew ? "Add product" : "Edit " + esc(p.name)) + '</h2>' +
      '<div class="a-grid a-grid-2"><div>' + f("f-brand", "Brand", p.brand) + '</div><div>' + f("f-name", "Name", p.name) + '</div></div>' +
      '<div class="a-grid a-grid-2"><div><label for="f-cat">Category</label><select id="f-cat">' +
      ["Him", "Her", "Unisex"].map(function (k) { return '<option' + (p.category === k ? " selected" : "") + '>' + k + '</option>'; }).join("") + '</select></div>' +
      '<div>' + f("f-slug", "URL name (optional)", p.slug || "", "text", 'placeholder="made from brand + name"') + '</div></div>' +
      '<label for="f-desc">Description</label><textarea id="f-desc">' + esc(p.description) + '</textarea>' +
      '<div class="a-grid a-grid-3">' + SIZES.map(function (s) { return '<div>' + f("f-p" + s, "Price " + s + " ml (LKR)", (p.prices || {})[s] || "", "number", 'min="1" step="1" inputmode="numeric"') + '</div>'; }).join("") + '</div>' +
      '<div class="a-grid a-grid-3"><div>' + f("f-top", "Top notes", n.top) + '</div><div>' + f("f-heart", "Heart notes", n.heart) + '</div><div>' + f("f-base", "Base notes", n.base) + '</div></div>' +
      '<label for="f-file">Photo</label><input id="f-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif">' +
      '<p class="a-muted" style="margin:4px 0 0;font-size:.875rem">Max 4 MB. Uploaded to Vercel Blob. Or paste an https:// link below.</p>' +
      f("f-img", "Photo link", p.image, "text", 'placeholder="https://..."') +
      '<img class="a-preview" id="prev" alt="Photo preview"' + (p.image ? ' src="' + esc(p.image) + '"' : " hidden") + '>' +
      '<div class="a-grid a-grid-2"><div>' + f("f-ctext", "Photo credit (optional)", c.text) + '</div><div>' + f("f-curl", "Credit link (optional)", c.url) + '</div></div>' +
      '<label class="a-check"><input id="f-best" type="checkbox"' + (p.bestseller ? " checked" : "") + '> Show in Bestsellers on the home page</label>' +
      '<label class="a-check"><input id="f-act" type="checkbox"' + (p.active !== false ? " checked" : "") + '> Visible in the shop</label>' +
      '<div class="a-msg err" id="fm" hidden></div>' +
      '<div class="a-actions"><button class="a-btn a-btn-primary" type="submit" id="save">Save</button><button class="a-btn" type="button" id="cancel">Cancel</button></div></form>';

    $("#cancel").addEventListener("click", function () { state.editing = null; render(); });
    $("#f-img").addEventListener("input", function () { var v = this.value.trim(), im = $("#prev"); im.hidden = !v; if (v) { im.src = v; } });
    $("#f-file").addEventListener("change", function () {
      var file = this.files[0]; if (!file) { return; }
      if (file.size > 4 * 1024 * 1024) { msg($("#fm"), "That image is over 4 MB. Please resize it first."); this.value = ""; return; }
      msg($("#fm"), "Uploading...", true);
      api("POST", "/api/admin/upload?name=" + encodeURIComponent(file.name), null, file).then(function (d) {
        $("#f-img").value = d.url; $("#prev").src = d.url; $("#prev").hidden = false; msg($("#fm"), "Photo uploaded. Press Save to keep it.", true);
      }).catch(function (e) { msg($("#fm"), e.message); });
    });
    $("#pf").addEventListener("submit", function (e) {
      e.preventDefault();
      var body = {
        id: p.id, slug: $("#f-slug").value, brand: $("#f-brand").value, name: $("#f-name").value, category: $("#f-cat").value,
        description: $("#f-desc").value, prices: { 5: $("#f-p5").value, 10: $("#f-p10").value },
        notes: { top: $("#f-top").value, heart: $("#f-heart").value, base: $("#f-base").value },
        image: $("#f-img").value, credit: { text: $("#f-ctext").value, url: $("#f-curl").value },
        bestseller: $("#f-best").checked, active: $("#f-act").checked, sort: p.sort
      };
      var btn = $("#save"); btn.disabled = true; btn.textContent = "Saving...";
      api(isNew ? "POST" : "PUT", "/api/admin/products", body).then(load).catch(function (err) {
        btn.disabled = false; btn.textContent = "Save"; msg($("#fm"), err.message);
      });
    });
  }

  /* ---------- Site details ---------- */
  var FIELDS = [
    ["whatsapp", "WhatsApp number (international, digits only, e.g. 94771234567)", "text"],
    ["email", "Email", "text"], ["address", "Store address", "text"], ["hours", "Opening hours", "text"],
    ["announcement", "Announcement bar (top of every page)", "text"],
    ["hero_tagline", "Home page tagline", "area"], ["story_1", "Our story, paragraph 1", "area"], ["story_2", "Our story, paragraph 2", "area"]
  ];
  function renderSettings() {
    $("#pane").innerHTML = '<form class="a-card" id="sf" novalidate><h2>Site details</h2>' + FIELDS.map(function (f) {
      var v = esc(state.settings[f[0]]);
      return '<label for="s-' + f[0] + '">' + f[1] + '</label>' + (f[2] === "area" ? '<textarea id="s-' + f[0] + '">' + v + '</textarea>' : '<input id="s-' + f[0] + '" type="text" value="' + v + '">');
    }).join("") + '<div class="a-msg" id="sm" hidden></div><div class="a-actions"><button class="a-btn a-btn-primary" type="submit" id="ssave">Save changes</button></div></form>';
    $("#sf").addEventListener("submit", function (e) {
      e.preventDefault();
      var body = {}; FIELDS.forEach(function (f) { body[f[0]] = $("#s-" + f[0]).value; });
      var btn = $("#ssave"); btn.disabled = true;
      api("PUT", "/api/admin/settings", body).then(function () {
        Object.keys(body).forEach(function (k) { state.settings[k] = body[k].trim(); });
        if (state.settings.whatsapp) { state.settings.whatsapp = state.settings.whatsapp.replace(/[\s+\-()]/g, ""); }
        btn.disabled = false; msg($("#sm"), "Saved.", true);
      }).catch(function (err) { btn.disabled = false; msg($("#sm"), err.message); });
    });
  }

  api("GET", "/api/admin/login").then(function (d) { if (d.authed) { load(); } else { showLogin(); } })
    .catch(function (e) { app.innerHTML = '<p class="a-msg err">' + esc(e.message) + '</p>'; });
})();
