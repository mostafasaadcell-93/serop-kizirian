/* Serop Kizirian Development: engine carried over from the S2D / Marhaba build
   (media registry by id, blur-up images, masonry gallery + lightbox, WhatsApp composer,
   floating WhatsApp that hides over heavy sections), plus: tab routing, site-visit booking,
   Trust-style finder / filters / shortlist / land owners' form, Arabic ↔ English with RTL,
   the Design-your-villa studio, video support and the schematic projects map.
   Everything that shows text is drawn by a render function so a language switch can redraw it. */
{
  const MEDIA = window.SK_MEDIA || {};
  const PROJECTS = window.SK_PROJECTS || [];
  const C = window.SK_CONTACT || {};
  const I18N = window.SK_I18N;
  const tr = (s) => I18N.tr(s);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wa = (text, num) => "https://wa.me/" + (num || C.whatsapp) + "?text=" + encodeURIComponent(text);
  const bySlug = (s) => PROJECTS.find((p) => p.slug === s) || null;
  const img = (id) => (id && MEDIA[id]) || null;
  const REGIONS = [...new Set(PROJECTS.map((p) => p.region).filter(Boolean))];
  const GOALS = { buy: "Buy a villa", customize: "Customize a villa", invest: "Invest in a villa" };
  const HELLO = "Hello, I'd like to know more about your villas.";

  /* ---------- Saved shortlist (this browser only) ---------- */
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem("sk-saved") || "[]")); } catch (e) {}
  const persist = () => { try { localStorage.setItem("sk-saved", JSON.stringify([...saved])); } catch (e) {} };
  function syncSaved() {
    $$("[data-saved-count]").forEach((n) => (n.textContent = String(saved.size)));
    $$(".saved-link").forEach((a) => a.classList.toggle("has", saved.size > 0));
    $$("[data-heart]").forEach((b) => {
      const on = saved.has(b.dataset.heart);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.setAttribute("aria-label", tr(on ? "Remove" : "Save") + " " + tr((bySlug(b.dataset.heart) || {}).title || ""));
    });
  }
  function heart(slug) {
    const b = el("button", "heart"); b.type = "button"; b.dataset.heart = slug;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"/></svg>';
    return b;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-heart]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const s = b.dataset.heart;
    saved.has(s) ? saved.delete(s) : saved.add(s);
    persist(); syncSaved();
    if (!$("#view-projects").hidden) renderRows();
  });

  /* ---------- Images and video ---------- */
  const warmed = new Set();
  function warm(src) { if (!src || warmed.has(src)) return; warmed.add(src); const i = new Image(); i.decoding = "async"; i.src = src; }
  function blurUp(host, im, m) {
    if (m.lqip) host.style.backgroundImage = 'url("' + m.lqip + '")';
    host.classList.add("blur-up");
    const done = () => host.classList.add("is-loaded");
    if (im.tagName === "VIDEO") { if (im.readyState >= 2) done(); else { im.addEventListener("loadeddata", done); im.addEventListener("error", done); } return; }
    if (im.complete && im.naturalWidth) done(); else { im.addEventListener("load", done); im.addEventListener("error", done); }
  }
  // Fill a frame with a registered photo or video, or the gold elevation drawing when there is none.
  // A video entry: { type: "video", src: "x.mp4", poster: "x-poster.webp", ... }. Cards show the poster.
  function fill(host, id, opts) {
    opts = opts || {};
    const ph = el("div", "ph");
    ph.innerHTML = '<svg aria-hidden="true"><use href="#elevation"/></svg><span>' + esc(tr("Photos coming soon")) + "</span>";
    host.appendChild(ph);
    const m = img(id);
    if (!m) { host.classList.add("is-empty"); return host; }
    let node;
    if (m.type === "video" && !opts.still && !reduced()) {
      node = document.createElement("video");
      node.muted = true; node.loop = true; node.autoplay = true; node.playsInline = true;
      ["muted", "loop", "autoplay", "playsinline"].forEach((a) => node.setAttribute(a, ""));
      node.preload = "metadata"; node.poster = m.poster || ""; node.src = m.src;
      const p = node.play(); if (p && p.catch) p.catch(() => {});
    } else {
      node = document.createElement("img");
      node.src = m.type === "video" ? (m.poster || "") : (opts.full ? m.src : (m.thumb || m.src));
      node.alt = opts.decorative ? "" : (m.alt || "");
      node.decoding = "async";
      node.loading = opts.eager ? "eager" : "lazy";
      if (opts.eager) node.setAttribute("fetchpriority", "high");
    }
    node.width = m.width; node.height = m.height;
    if (m.focal) node.style.objectPosition = m.focal;
    blurUp(host, node, m);
    node.addEventListener("error", () => { node.remove(); host.classList.add("is-empty"); });
    host.prepend(node);
    if (m.type === "video") host.classList.add("has-video");
    return host;
  }
  const frame = (id, opts) => fill(el("div", "frame"), id, opts);
  $$("[data-img]").forEach((f) => fill(f, f.dataset.img, { eager: f.hasAttribute("data-eager"), full: true, decorative: true }));

  /* ---------- Static-ish bits that carry text ---------- */
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); btn.textContent = tr("Copied"); }
    catch (e) {
      const t = btn.closest("li") && $(".num", btn.closest("li"));
      if (t) { const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      btn.textContent = tr("Selected");
    }
    setTimeout(() => (btn.textContent = tr("Copy")), 1600);
  }
  function officeLink(o) { const a = el("a", "link", tr("Open in Maps")); a.href = o.map; a.target = "_blank"; a.rel = "noopener"; return a; }
  function renderContact() {
    $$("[data-year]").forEach((n) => (n.textContent = new Date().getFullYear()));
    $$("[data-ig]").forEach((a) => { a.href = "https://instagram.com/" + C.instagram; a.textContent = "@" + C.instagram; });
    $$("[data-wa-general]").forEach((a) => (a.href = wa(tr(HELLO))));
    $$("[data-count-projects]").forEach((n) => (n.textContent = String(PROJECTS.length)));
    const phones = $("[data-phones]"); phones.replaceChildren();
    (C.phones || []).forEach((p) => {
      const li = el("li");
      const num = el("span", "num", p.display); num.dir = "ltr";
      li.appendChild(num);
      const mini = el("div", "mini");
      const w = el("a", "", tr("WhatsApp")); w.href = wa(tr(HELLO), p.wa); w.target = "_blank"; w.rel = "noopener";
      const c = el("button", "", tr("Copy")); c.type = "button"; c.addEventListener("click", () => copy(p.display, c));
      mini.append(w, c); li.appendChild(mini); phones.appendChild(li);
    });
    const officeList = $("[data-office-list]"); officeList.replaceChildren();
    (C.offices || []).forEach((o) => {
      const li = el("li"); const d = el("div");
      d.appendChild(el("strong", "", tr(o.name))); d.appendChild(el("span", "", tr(o.place)));
      li.append(d, officeLink(o)); officeList.appendChild(li);
    });
    const offices = $("[data-offices]"); offices.replaceChildren();
    (C.offices || []).forEach((o) => {
      const box = el("div", "office");
      box.append(el("h2", "display", tr(o.name)), el("p", "", tr(o.place)), officeLink(o));
      offices.appendChild(box);
    });
    const foot = $("[data-foot-contact]"); foot.replaceChildren();
    (C.phones || []).forEach((p) => { const a = el("a", "", p.display); a.dir = "ltr"; a.href = wa(tr(HELLO), p.wa); a.target = "_blank"; a.rel = "noopener"; foot.appendChild(a); });
    foot.appendChild(el("span", "", tr("Baasiri Street, Saida · Chehime")));
  }

  /* ---------- Project cards + rows ---------- */
  function card(p) {
    const c = el("article", "card");
    const a = el("a", "card-link"); a.href = "#" + p.slug; a.dataset.go = p.slug;
    a.appendChild(frame(p.coverId, { still: true }));
    const meta = el("div", "card-meta");
    meta.appendChild(el("h3", "display", tr(p.title)));
    meta.appendChild(el("p", "", tr(p.location)));
    a.appendChild(meta);
    a.appendChild(el("span", "more", tr("View project")));
    c.append(a, heart(p.slug));
    return c;
  }
  function renderCards() { $("[data-cards]").replaceChildren(...PROJECTS.map(card)); }

  function row(p) {
    const r = el("article", "row");
    const media = el("div", "row-media");
    const link = el("a", ""); link.href = "#" + p.slug; link.dataset.go = p.slug; link.setAttribute("aria-label", tr("View project") + ": " + tr(p.title));
    link.appendChild(frame(p.coverId));
    media.append(link, heart(p.slug));
    const copyBox = el("div", "row-copy");
    copyBox.appendChild(el("p", "place", tr(p.location)));
    copyBox.appendChild(el("h2", "display l", tr(p.title)));
    copyBox.appendChild(el("p", "", tr(p.summary)));
    const act = el("div", "actions");
    const v = el("a", "btn", tr("View project")); v.href = "#" + p.slug; v.dataset.go = p.slug;
    const b = el("button", "btn line", tr("Book a site visit")); b.type = "button"; b.dataset.visit = p.slug;
    act.append(v, b); copyBox.appendChild(act);
    r.append(media, copyBox);
    return r;
  }

  /* ---------- Projects filters (location + saved) ---------- */
  const filter = { region: "all", saved: false };
  function chip(label, on, fn) { const b = el("button", "chip", label); b.type = "button"; b.setAttribute("aria-pressed", on ? "true" : "false"); b.addEventListener("click", fn); return b; }
  function renderRows() {
    $("[data-filters]").replaceChildren(
      chip(tr("All locations"), filter.region === "all" && !filter.saved, () => { filter.region = "all"; filter.saved = false; renderRows(); }),
      ...REGIONS.map((r) => chip(tr(r), filter.region === r && !filter.saved, () => { filter.region = r; filter.saved = false; renderRows(); })),
      chip(tr("Saved") + " (" + saved.size + ")", filter.saved, () => { filter.saved = true; renderRows(); })
    );
    const rows = $("[data-rows]");
    const list = PROJECTS.filter((p) => (filter.saved ? saved.has(p.slug) : filter.region === "all" || p.region === filter.region));
    rows.replaceChildren(...list.map(row));
    if (!list.length) {
      const e = el("div", "empty");
      e.appendChild(el("h2", "display m", tr(filter.saved ? "No saved projects yet" : "Nothing here yet")));
      e.appendChild(el("p", "", tr(filter.saved ? "Tap the heart on any project to keep it on your shortlist." : "Tell us what you're looking for and we'll call you with options.")));
      const all = el("button", "btn", tr("See all projects")); all.type = "button";
      all.addEventListener("click", () => { filter.region = "all"; filter.saved = false; renderRows(); });
      e.appendChild(all);
      rows.appendChild(e);
    }
    syncSaved();
  }

  /* ---------- Villa finder (home) ---------- */
  const finder = $("[data-finder]");
  let intent = "buy";
  function renderFinderAreas() {
    const sel = $("[data-area-options]"), keep = sel.value;
    sel.replaceChildren(Object.assign(el("option", "", tr("All locations")), { value: "all" }), ...REGIONS.map((r) => Object.assign(el("option", "", tr(r)), { value: r })));
    sel.value = keep || "all";
  }
  finder.addEventListener("submit", (e) => {
    e.preventDefault();
    intent = finder.elements.goal.value;
    filter.region = finder.elements.area.value; filter.saved = false;
    if (location.hash.replace("#", "") === "projects") route("projects"); else location.hash = "projects";
  });

  /* ---------- Forms: site visit, land owners ---------- */
  const DAYS = ["Weekday", "Saturday"];
  const TIMES = ["Morning", "Afternoon"];
  function pills(name, list, key) {
    return '<div class="pills">' + list.map((t, i) =>
      '<label><input type="radio" name="' + name + '" id="' + key + "-" + name + "-" + i + '" value="' + t + '"' + (i === 0 ? " checked" : "") + "><span>" + esc(tr(t)) + "</span></label>").join("") + "</div>";
  }
  function missingMsg(miss) {
    const list = miss.map(tr).join(I18N.lang === "ar" ? " و" : " and ");
    return I18N.lang === "ar" ? "أضف " + list + " لإرسال الطلب." : "Add " + list + " to send the request.";
  }
  function guard(f, send, msg, extra, okText) {
    send.addEventListener("click", (e) => {
      const F = f.elements, miss = [];
      if (!F.fullname.value.trim()) miss.push("your name");
      if (F.phone.value.replace(/\D/g, "").length < 7) miss.push("a phone number we can reach");
      (extra || []).forEach(([n, label]) => { if (!F[n].value.trim()) miss.push(label); });
      if (miss.length) { e.preventDefault(); msg.textContent = missingMsg(miss); return; }
      msg.textContent = tr(okText);
    });
    f.addEventListener("submit", (e) => { e.preventDefault(); send.click(); });
  }
  const line = (k, v) => tr(k) + ": " + v;
  function visitForm(key) {
    const f = el("form", "form"); f.noValidate = true;
    f.innerHTML =
      '<div class="two">' +
        '<div class="field"><label for="' + key + '-name">' + esc(tr("Full name")) + '</label><input id="' + key + '-name" name="fullname" autocomplete="name"></div>' +
        '<div class="field"><label for="' + key + '-phone">' + esc(tr("Phone number")) + '</label><input id="' + key + '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+961" dir="ltr"></div>' +
      "</div>" +
      '<div class="two">' +
        '<div class="field"><label for="' + key + '-goal">' + esc(tr("I'm looking to")) + '</label><select id="' + key + '-goal" name="goal">' +
          Object.entries(GOALS).map(([v, t]) => '<option value="' + v + '">' + esc(tr(t)) + "</option>").join("") + "</select></div>" +
        '<div class="field"><label for="' + key + '-project">' + esc(tr("Project")) + '</label><select id="' + key + '-project" name="project"><option value="">' + esc(tr("Not sure yet")) + "</option>" +
          PROJECTS.map((p) => '<option value="' + p.slug + '">' + esc(tr(p.title)) + "</option>").join("") + "</select></div>" +
      "</div>" +
      '<div class="two"><fieldset class="field"><legend>' + esc(tr("Preferred day")) + "</legend>" + pills("day", DAYS, key) + "</fieldset>" +
      '<fieldset class="field"><legend>' + esc(tr("Preferred time")) + "</legend>" + pills("time", TIMES, key) + "</fieldset></div>" +
      '<p class="form-msg" role="status"></p>' +
      '<a class="btn gold" target="_blank" rel="noopener">' + esc(tr("Send request on WhatsApp")) + "</a>";
    const F = f.elements, send = $("a.btn", f), msg = $(".form-msg", f);
    const text = () => {
      const p = bySlug(F.project.value);
      return [tr("Hello, I'd like to book a site visit."), "",
        line("Name", F.fullname.value.trim()),
        line("Phone", F.phone.value.trim()),
        line("Looking to", tr(GOALS[F.goal.value])),
        line("Project", p ? tr(p.title) : tr("Not sure yet")),
        line("Preferred day", tr(f.querySelector("input[name=day]:checked").value)),
        line("Preferred time", tr(f.querySelector("input[name=time]:checked").value))].join("\n");
    };
    const sync = () => (send.href = wa(text()));
    f.addEventListener("input", sync); f.addEventListener("change", sync); sync();
    guard(f, send, msg, [], "WhatsApp opens with your request filled in. Press send there to confirm.");
    f.preselect = (slug, goal) => { F.project.value = slug || ""; F.goal.value = goal || intent; msg.textContent = ""; sync(); };
    return f;
  }
  function landForm() {
    const f = el("form", "form"); f.noValidate = true;
    f.innerHTML =
      '<fieldset class="field"><legend>' + esc(tr("I want to")) + '</legend><div class="pills">' +
        '<label><input type="radio" name="aim" id="land-aim-0" value="sell" checked><span>' + esc(tr("Sell my land")) + "</span></label>" +
        '<label><input type="radio" name="aim" id="land-aim-1" value="develop"><span>' + esc(tr("Develop it together")) + "</span></label>" +
      "</div></fieldset>" +
      '<div class="two">' +
        '<div class="field"><label for="land-name">' + esc(tr("Full name")) + '</label><input id="land-name" name="fullname" autocomplete="name"></div>' +
        '<div class="field"><label for="land-phone">' + esc(tr("Phone number")) + '</label><input id="land-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+961" dir="ltr"></div>' +
      "</div>" +
      '<div class="two">' +
        '<div class="field"><label for="land-where">' + esc(tr("Land location")) + '</label><input id="land-where" name="where" placeholder="' + esc(tr("Town or area")) + '"></div>' +
        '<div class="field"><label for="land-size">' + esc(tr("Plot size")) + '</label><input id="land-size" name="size" inputmode="numeric" placeholder="m²"></div>' +
      "</div>" +
      '<p class="form-msg" role="status"></p>' +
      '<a class="btn gold" target="_blank" rel="noopener">' + esc(tr("Send details on WhatsApp")) + "</a>";
    const F = f.elements, send = $("a.btn", f), msg = $(".form-msg", f);
    const text = () => {
      const aim = f.querySelector("input[name=aim]:checked").value;
      const size = F.size.value.trim().replace(/\s*m²?\s*$/i, "");
      return [tr(aim === "sell" ? "Hello, I own land and I'd like to sell it to you." : "Hello, I own land and I'd like to talk about developing it together."), "",
        line("Name", F.fullname.value.trim()),
        line("Phone", F.phone.value.trim()),
        line("Location", F.where.value.trim()),
        line("Plot size", size ? size + " m²" : tr("Not given"))].join("\n");
    };
    const sync = () => (send.href = wa(text()));
    f.addEventListener("input", sync); f.addEventListener("change", sync); sync();
    guard(f, send, msg, [["where", "where the land is"]], "WhatsApp opens with your land details filled in. Press send there and we'll call you.");
    return f;
  }
  const sheet = $("#visitSheet");
  let sheetForm = null;
  function renderForms() {
    $('[data-form-slot="contact"]').replaceChildren(visitForm("contact"));
    sheetForm = visitForm("sheet");
    $('[data-form-slot="sheet"]').replaceChildren(sheetForm);
    $("[data-land-slot]").replaceChildren(landForm());
  }
  function openVisit(slug, goal) {
    sheetForm.preselect(slug, goal);
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute("open", "");
    setTimeout(() => sheetForm.elements.fullname.focus(), 30);
  }
  const closeVisit = () => (sheet.close ? sheet.close() : sheet.removeAttribute("open"));
  $("[data-close]", sheet).addEventListener("click", closeVisit);
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeVisit(); });
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-visit]"); if (t) openVisit(t.dataset.visit || "", t.dataset.goal); });

  /* ---------- Design your villa ---------- */
  const STUDIO = {
    facade: [
      { v: "white-stone", l: "White stone", c: "#eeebe4", sw: "linear-gradient(0deg, rgba(0,0,0,.06) 1px, transparent 1px) 0 0 / 100% 12px, linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px) 0 0 / 34px 24px, #eeebe4" },
      { v: "sand-stone", l: "Warm sand stone", c: "#d8c3a0", sw: "linear-gradient(0deg, rgba(0,0,0,.07) 1px, transparent 1px) 0 0 / 100% 12px, linear-gradient(90deg, rgba(0,0,0,.06) 1px, transparent 1px) 0 0 / 34px 24px, #d8c3a0" },
      { v: "graphite", l: "Graphite render", c: "#5d6367", sw: "radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px) 0 0 / 6px 6px, #5d6367" }
    ],
    frames: [
      { v: "black", l: "Black", c: "#1f2224", sw: "#1f2224" },
      { v: "bronze", l: "Bronze", c: "#7b5b3c", sw: "linear-gradient(135deg, #8a6845, #6a4c31)" },
      { v: "white", l: "White", c: "#f4f3ef", sw: "#f4f3ef" }
    ],
    floor: [
      { v: "marble", l: "Marble", sw: "linear-gradient(118deg, transparent 38%, rgba(140,140,140,.38) 40%, transparent 43%), linear-gradient(58deg, transparent 62%, rgba(160,160,160,.3) 63.5%, transparent 66%), linear-gradient(160deg, transparent 20%, rgba(150,150,150,.22) 21%, transparent 23%), #f1efea" },
      { v: "oak", l: "Oak wood", sw: "repeating-linear-gradient(90deg, #caa46c 0 7px, #b98f57 7px 9px, #d4b07b 9px 18px)" },
      { v: "porcelain", l: "Grey porcelain", sw: "linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px) 0 0 / 50% 100%, linear-gradient(0deg, rgba(255,255,255,.4) 1px, transparent 1px) 0 0 / 100% 50%, #8f969a" }
    ],
    kitchen: [
      { v: "gloss", l: "White gloss", sw: "linear-gradient(135deg, #ffffff 0%, #e6eaec 60%, #ffffff 61%, #eef1f2 100%)" },
      { v: "walnut", l: "Walnut", sw: "repeating-linear-gradient(90deg, #6c4a31 0 6px, #5a3c27 6px 8px, #7b5639 8px 15px)" },
      { v: "matte", l: "Matte black", sw: "#26292c" }
    ],
    outdoor: [{ v: "infinity", l: "Infinity pool" }, { v: "classic", l: "Classic pool" }, { v: "garden", l: "Garden only" }],
    bedrooms: [{ v: "3", l: "3 bedrooms" }, { v: "4", l: "4 bedrooms" }, { v: "5", l: "5 or more" }],
    extras: [{ v: "smart", l: "Smart home system" }, { v: "solar", l: "Solar panels" }, { v: "elevator", l: "Private elevator" }, { v: "bbq", l: "Outdoor kitchen" }]
  };
  const pick = { facade: "white-stone", frames: "black", floor: "marble", kitchen: "walnut", outdoor: "infinity", bedrooms: "4", extras: [] };
  try { Object.assign(pick, JSON.parse(localStorage.getItem("sk-studio") || "{}")); } catch (e) {}
  const opt = (group) => STUDIO[group].find((o) => o.v === pick[group]) || STUDIO[group][0];

  function villaSVG() {
    const F = opt("facade").c, R = opt("frames").c, out = pick.outdoor, n = +pick.bedrooms, ex = pick.extras;
    const panes = Array.from({ length: n - 1 }, (_, i) => { const x = 190 + ((i + 1) * 250) / n; return '<line x1="' + x + '" y1="132" x2="' + x + '" y2="190" stroke="' + R + '" stroke-width="3"/>'; }).join("");
    const slats = Array.from({ length: 10 }, (_, i) => '<line x1="' + (349 + i * 9) + '" y1="214" x2="' + (349 + i * 9) + '" y2="300" stroke="rgba(0,0,0,.22)" stroke-width="2"/>').join("");
    const water = '<linearGradient id="wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd3df"/><stop offset="1" stop-color="#3aa9bd"/></linearGradient>';
    const pool = out === "infinity"
      ? '<rect x="50" y="318" width="480" height="30" fill="url(#wt)"/><line x1="50" y1="318" x2="530" y2="318" stroke="#eef6f7" stroke-width="3"/><line x1="50" y1="348" x2="530" y2="348" stroke="#2c8394" stroke-width="2"/>'
      : out === "classic"
        ? '<rect x="140" y="318" width="300" height="28" rx="3" fill="url(#wt)" stroke="#efece6" stroke-width="6"/>'
        : '<g fill="#7f9c78">' + [70, 112, 160, 400, 446, 492].map((x, i) => '<circle cx="' + x + '" cy="' + (318 + (i % 2) * 6) + '" r="' + (14 + (i % 3) * 3) + '"/>').join("") + '</g><g fill="#6c8a66"><circle cx="280" cy="330" r="16"/><circle cx="305" cy="326" r="12"/></g>';
    const solar = ex.includes("solar") ? '<g fill="#2c4259" stroke="#8aa0b4" stroke-width="1">' + [0, 1, 2, 3].map((i) => '<path d="M' + (300 + i * 48) + ' 112 l8 -14 h36 l-8 14 Z"/>').join("") + "</g>" : "";
    const lift = ex.includes("elevator") ? '<rect x="556" y="112" width="26" height="188" fill="url(#gl)" stroke="' + R + '" stroke-width="3"/><line x1="569" y1="112" x2="569" y2="300" stroke="' + R + '" stroke-width="1.5"/>' : "";
    const bbq = ex.includes("bbq") ? '<rect x="540" y="292" width="72" height="18" fill="#e6e1d7" stroke="#bdb6a8"/><rect x="540" y="288" width="72" height="5" fill="#3a3d40"/><rect x="552" y="279" width="14" height="9" fill="#55595c"/>' : "";
    const smart = ex.includes("smart") ? '<g fill="none" stroke="#d5ce86" stroke-width="2.2" stroke-linecap="round"><path d="M486 166 a12 12 0 0 1 20 0"/><path d="M480 160 a20 20 0 0 1 32 0"/><circle cx="496" cy="171" r="2" fill="#d5ce86"/></g>' : "";
    return '<svg viewBox="0 0 640 400" role="img" aria-label="">' +
      "<defs>" + water +
        '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dce7ee"/><stop offset="1" stop-color="#f3f6f8"/></linearGradient>' +
        '<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9c2cf"/><stop offset=".55" stop-color="#cfdee6"/><stop offset="1" stop-color="#8eaab9"/></linearGradient>' +
      "</defs>" +
      '<rect width="640" height="400" fill="url(#sky)"/>' +
      '<path d="M0 250 Q120 205 250 236 T520 222 T640 236 V310 H0 Z" fill="#cdd9d3"/>' +
      '<rect x="0" y="300" width="640" height="100" fill="#b7c8b2"/>' +
      '<rect x="0" y="300" width="640" height="14" fill="#e8e4db"/>' +
      '<rect x="90" y="200" width="360" height="100" fill="' + F + '" stroke="rgba(0,0,0,.14)"/>' +
      '<rect x="110" y="214" width="220" height="86" fill="url(#gl)" stroke="' + R + '" stroke-width="5"/>' +
      [165, 220, 275].map((x) => '<line x1="' + x + '" y1="214" x2="' + x + '" y2="300" stroke="' + R + '" stroke-width="3"/>').join("") +
      '<rect x="345" y="214" width="92" height="86" fill="#9b7651"/>' + slats +
      '<rect x="80" y="193" width="382" height="9" fill="#f6f5f2" stroke="rgba(0,0,0,.12)"/>' +
      '<rect x="450" y="202" width="100" height="7" fill="rgba(0,0,0,.14)"/>' +
      '<rect x="170" y="120" width="380" height="82" fill="' + F + '" stroke="rgba(0,0,0,.14)"/>' +
      '<rect x="190" y="132" width="250" height="58" fill="url(#gl)" stroke="' + R + '" stroke-width="5"/>' + panes +
      '<rect x="462" y="142" width="68" height="10" fill="url(#gl)" stroke="' + R + '" stroke-width="3"/>' +
      '<rect x="160" y="111" width="402" height="10" fill="#f6f5f2" stroke="rgba(0,0,0,.12)"/>' +
      solar + lift + smart + pool + bbq +
      '<g stroke="#6d5a43" stroke-width="5" fill="none" stroke-linecap="round"><path d="M612 312 C608 270 606 240 612 205"/><path d="M34 314 C38 282 37 262 32 236"/></g>' +
      '<g fill="#5f8a5a"><path d="M612 205 c-26 -8 -42 4 -50 14 c18 -6 34 -6 50 -14Z"/><path d="M612 205 c22 -12 40 -6 48 4 c-18 -2 -32 -2 -48 -4Z"/><path d="M612 205 c-6 -22 4 -34 14 -40 c-4 16 -6 28 -14 40Z"/><path d="M32 236 c-20 -6 -32 4 -38 12 c14 -4 26 -4 38 -12Z"/><path d="M32 236 c16 -10 30 -6 36 2 c-14 -2 -24 -1 -36 -2Z"/></g>' +
      "</svg>";
  }
  function studioBrief() {
    const ex = pick.extras.length ? pick.extras.map((v) => tr(STUDIO.extras.find((o) => o.v === v).l)).join(", ") : tr("None");
    const F = $("[data-studio]").elements;
    return [tr("Hello, here is the villa I'd like to build with you."), "",
      line("Name", F.fullname.value.trim()),
      line("Phone", F.phone.value.trim()), "",
      line("Facade", tr(opt("facade").l)),
      line("Window frames", tr(opt("frames").l)),
      line("Floors", tr(opt("floor").l)),
      line("Kitchen", tr(opt("kitchen").l)),
      line("Outdoor", tr(opt("outdoor").l)),
      line("Bedrooms", tr(opt("bedrooms").l)),
      line("Extras", ex)].join("\n");
  }
  function syncStudio() {
    $("[data-preview]").innerHTML = villaSVG();
    ["facade", "floor", "kitchen", "frames"].forEach((g) => {
      const s = $('[data-swatch="' + g + '"]'); if (s) s.style.background = opt(g).sw;
      const l = $('[data-pick-label="' + g + '"]'); if (l) l.textContent = tr(opt(g).l);
    });
    $("[data-studio-send]").href = wa(studioBrief());
    try { localStorage.setItem("sk-studio", JSON.stringify(pick)); } catch (e) {}
  }
  function renderStudio() {
    Object.keys(STUDIO).forEach((g) => {
      const multi = g === "extras";
      $('[data-opts="' + g + '"]').innerHTML = STUDIO[g].map((o, i) => {
        const on = multi ? pick.extras.includes(o.v) : pick[g] === o.v;
        return '<label class="opt-item"><input type="' + (multi ? "checkbox" : "radio") + '" name="' + g + '" id="st-' + g + "-" + i + '" value="' + o.v + '"' + (on ? " checked" : "") + ">" +
          '<span class="opt-chip">' + (o.sw ? '<i class="dot" style="background:' + o.sw + '"></i>' : "") + esc(tr(o.l)) + "</span></label>";
      }).join("");
    });
    syncStudio();
  }
  const studio = $("[data-studio]");
  studio.addEventListener("change", (e) => {
    const t = e.target; if (!t.name || !STUDIO[t.name]) { syncStudio(); return; }
    if (t.name === "extras") pick.extras = $$('input[name="extras"]:checked', studio).map((i) => i.value);
    else pick[t.name] = t.value;
    syncStudio();
  });
  studio.addEventListener("input", (e) => { if (e.target.name === "fullname" || e.target.name === "phone") $("[data-studio-send]").href = wa(studioBrief()); });
  guard(studio, $("[data-studio-send]"), $(".brief .form-msg"), [], "WhatsApp opens with your villa brief filled in. Press send there and our designers will call you.");

  /* ---------- Projects map (schematic, approximate) ---------- */
  const MAP = { w: 520, h: 540, lon0: 35.33, lon1: 35.52, lat0: 33.5, lat1: 33.67 };
  const px = ([lat, lon]) => [((lon - MAP.lon0) / (MAP.lon1 - MAP.lon0)) * MAP.w, ((MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0)) * MAP.h];
  const COAST = [[33.67, 35.445], [33.65, 35.428], [33.62, 35.405], [33.59, 35.383], [33.563, 35.368], [33.53, 35.358], [33.5, 35.345]];
  const LABEL = { "kfarjarra-hills": [16, 6, "start"], "chehime": [-16, -10, "end"], "ain-el-delb": [6, -20, "middle"], "qrayeh": [16, 20, "start"] };
  function renderMap() {
    const pts = COAST.map(px);
    const coast = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const sea = coast + " L0 " + MAP.h + " L0 0 Z";
    const ridges = [70, 150, 240].map((d, k) => '<path d="' + pts.map((p, i) => (i ? "L" : "M") + (p[0] + d + (i % 2) * 14).toFixed(1) + " " + p[1].toFixed(1)).join(" ") + '" fill="none" stroke="#24475e" stroke-opacity="' + (0.1 - k * 0.025) + '" stroke-width="1.2"/>').join("");
    const projectPins = PROJECTS.filter((p) => p.pin).map((p) => {
      const [x, y] = px(p.pin), [dx, dy, an] = LABEL[p.slug] || [14, 5, "start"];
      return '<a href="#' + p.slug + '" data-go="' + p.slug + '" class="pin">' +
        '<circle cx="' + x + '" cy="' + y + '" r="11" fill="#24475e" stroke="#d5ce86" stroke-width="3"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#d5ce86"/>' +
        '<text x="' + (x + dx) + '" y="' + (y + dy) + '" text-anchor="' + an + '" class="pin-label">' + esc(tr(p.title)) + "</text></a>";
    }).join("");
    const officePins = (C.offices || []).filter((o) => o.pin).map((o, i) => {
      const [x, y] = px(o.pin);
      const label = i === 0 ? '<text x="' + (x - 14) + '" y="' + (y + 5) + '" text-anchor="end" class="sea-label">' + esc(tr("Saida")) + "</text>" : "";
      return '<a href="' + o.map + '" target="_blank" rel="noopener" class="pin office-pin"><rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" fill="#d5ce86" stroke="#24475e" stroke-width="2.5"/><title>' + esc(tr(o.name)) + "</title></a>" + label;
    }).join("");
    $("[data-map]").innerHTML =
      '<svg viewBox="0 0 ' + MAP.w + " " + MAP.h + '" direction="ltr" role="img" aria-label="' + esc(tr("Where we build")) + '">' +
      '<rect width="' + MAP.w + '" height="' + MAP.h + '" fill="#f7f8f6"/>' + ridges +
      '<path d="' + sea + '" fill="#24475e"/>' +
      '<path d="' + coast + '" fill="none" stroke="#d5ce86" stroke-width="2"/>' +
      '<text x="40" y="190" class="sea-name" transform="rotate(-62 40 190)">' + esc(tr("Mediterranean")) + "</text>" +
      officePins + projectPins + "</svg>";
    const legend = $("[data-map-legend]"); legend.replaceChildren();
    PROJECTS.forEach((p) => {
      const li = el("li"); const a = el("a", "", tr(p.title)); a.href = "#" + p.slug; a.dataset.go = p.slug;
      li.appendChild(el("i", "key")); li.appendChild(a);
      if (p.map) { const g = el("a", "small-link", tr("Open in Maps")); g.href = p.map; g.target = "_blank"; g.rel = "noopener"; li.appendChild(g); }
      legend.appendChild(li);
    });
    (C.offices || []).forEach((o) => {
      const li = el("li", "is-office"); li.appendChild(el("i", "key"));
      li.appendChild(el("span", "", tr(o.name) + ", " + tr(o.place)));
      li.appendChild(officeLink(o)).className = "small-link";
      legend.appendChild(li);
    });
  }

  /* ---------- Project detail ---------- */
  const detail = $("[data-detail]"), galleryWrap = $("[data-gallery-wrap]"), gallery = $("[data-gallery]");
  let tiles = [], shots = [];
  const HIGHLIGHTS = ["Finishes chosen with our interior designers", "A flexible two-year payment plan", "High-quality materials inside and out", "A quiet neighbourhood a short drive from Saida"];
  function renderProject(p) {
    detail.replaceChildren();
    const media = el("div", "detail-media");
    const cover = frame(p.coverId, { eager: true, full: true });
    media.append(cover, heart(p.slug));
    detail.appendChild(media);
    const box = el("div", "detail-copy");
    box.appendChild(el("p", "place", tr(p.location)));
    box.appendChild(el("h1", "display xl", tr(p.title)));
    box.appendChild(el("p", "lead", tr(p.description || p.summary)));
    const dl = el("dl", "facts-list");
    [["Location", p.location], ["Type", p.type]].concat(p.facts || []).concat([["Payment plan", "Over two years"]])
      .forEach(([k, v]) => { const d = el("div"); d.append(el("dt", "", tr(k)), el("dd", "", tr(v))); dl.appendChild(d); });
    box.appendChild(dl);
    const hl = el("ul", "ticks");
    (p.highlights && p.highlights.length ? p.highlights : HIGHLIGHTS).forEach((t) => hl.appendChild(el("li", "", tr(t))));
    box.appendChild(hl);
    if (!(p.galleryIds || []).some(img)) box.appendChild(el("p", "note", I18N.lang === "ar"
      ? "مخططات وصور " + tr(p.title) + " ستُضاف قريبًا إلى هذه الصفحة. احجز زيارة للموقع وسيرافقك فريقنا في جولة على المشروع."
      : "Plans and photos of " + p.title + " are on their way to this page. Book a site visit and our team will walk you through the project in person."));
    const act = el("div", "actions");
    const b = el("button", "btn", tr("Book a site visit")); b.type = "button"; b.dataset.visit = p.slug;
    const w = el("a", "btn line", tr("Ask on WhatsApp")); w.target = "_blank"; w.rel = "noopener";
    w.href = wa(I18N.lang === "ar" ? "مرحبًا، أود معرفة المزيد عن " + tr(p.title) + " (" + tr(p.location) + ")." : "Hello, I'd like to know more about " + p.title + " (" + p.location + ").");
    act.append(b, w); box.appendChild(act);
    if (p.map) { const m = el("a", "link", I18N.lang === "ar" ? "افتح " + tr(p.title) + " في خرائط Google" : "Open " + p.title + " in Google Maps"); m.href = p.map; m.target = "_blank"; m.rel = "noopener"; box.appendChild(m); }
    detail.appendChild(box);

    tiles = []; shots = [];
    (p.galleryIds || []).forEach((id) => {
      const m = img(id); if (!m) return;
      shots.push(m);
      const idx = shots.length - 1;
      if (id === p.coverId) { cover.style.cursor = "zoom-in"; cover.addEventListener("click", () => openLb(idx, tr(p.title))); return; }
      const t = el("button", "tile" + (m.type === "video" ? " is-video" : "")); t.type = "button"; t.style.aspectRatio = m.width + " / " + m.height;
      t.setAttribute("aria-label", m.alt || "");
      const im = document.createElement("img"); im.src = m.type === "video" ? m.poster : (m.thumb || m.src); im.alt = m.alt || ""; im.loading = idx < 6 ? "eager" : "lazy"; im.decoding = "async";
      blurUp(t, im, m); t.appendChild(im);
      t.addEventListener("click", () => openLb(idx, tr(p.title)));
      tiles.push({ el: t, ratio: m.height / m.width });
    });
    $("[data-gallery-title]").textContent = I18N.lang === "ar" ? tr("Gallery") + "، " + shots.length + " صور" : "Gallery, " + shots.length + " photos";
    galleryWrap.hidden = !tiles.length;
    gallery.dataset.cols = "";
    layout();
    const others = PROJECTS.filter((o) => o.slug !== p.slug).sort((a, b) => (b.region === p.region) - (a.region === p.region)).slice(0, 3);
    $("[data-more]").replaceChildren(...others.map(card));
    $("[data-more-wrap]").hidden = !others.length;
    syncSaved();
  }
  function layout() {
    if (!tiles.length) return;
    const n = Math.min(matchMedia("(min-width: 1000px)").matches ? 3 : 2, tiles.length);
    if (gallery.dataset.cols === String(n)) return;
    gallery.dataset.cols = String(n); gallery.style.setProperty("--cols", n); gallery.replaceChildren();
    const cols = [], h = [];
    for (let i = 0; i < n; i++) { const c = el("div", "gallery-col"); gallery.appendChild(c); cols.push(c); h.push(0); }
    tiles.forEach((t) => { const s = h.indexOf(Math.min(...h)); cols[s].appendChild(t.el); h[s] += t.ratio; });
  }
  window.addEventListener("resize", layout);

  /* ---------- Lightbox (photos and videos) ---------- */
  const lb = $(".lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb);
  let lbI = 0, lbTitle = "", lastFocus = null;
  function show() {
    const m = shots[lbI];
    const old = $("video", lb); if (old) { old.pause(); old.remove(); }
    if (m.type === "video") {
      lbImg.hidden = true;
      const v = document.createElement("video");
      v.controls = true; v.autoplay = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.poster = m.poster || ""; v.src = m.src;
      lbImg.after(v);
    } else {
      lbImg.hidden = false;
      lbImg.src = m.thumb || m.src; lbImg.alt = m.alt || "";
      if (m.thumb) { const full = new Image(); full.onload = () => { if (shots[lbI] === m) lbImg.src = m.src; }; full.src = m.src; }
    }
    lbCap.textContent = lbTitle + "   " + (lbI + 1) + " / " + shots.length;
    [1, -1].forEach((d) => { const n = shots[(lbI + d + shots.length) % shots.length]; warm(n.type === "video" ? n.poster : n.src); });
  }
  function openLb(i, title) { lastFocus = document.activeElement; lbI = i; lbTitle = title; show(); lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); document.body.classList.add("lock"); $("[data-lb-close]", lb).focus(); }
  function closeLb() { const v = $("video", lb); if (v) { v.pause(); v.remove(); } lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); document.body.classList.remove("lock"); if (lastFocus) lastFocus.focus(); }
  const step = (d) => { lbI = (lbI + d + shots.length) % shots.length; show(); };
  $("[data-lb-close]", lb).addEventListener("click", closeLb);
  $("[data-lb-prev]", lb).addEventListener("click", () => step(-1));
  $("[data-lb-next]", lb).addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLb(); if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1);
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); tx = null; });

  /* ---------- Tabs: bare #tokens ---------- */
  const VIEWS = { home: "Serop Kizirian Development", projects: "Projects", about: "About us", contact: "Contact us", design: "Design your villa" };
  let current = "home";
  function route(token, keepScroll) {
    token = (token || "").replace(/^#/, "") || "home";
    current = token;
    const p = bySlug(token);
    if (token === "saved") filter.saved = true;
    const view = p ? "project" : token === "saved" ? "projects" : token === "sell" ? "home" : (VIEWS[token] ? token : "home");
    $$(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
    const tab = p ? "projects" : view;
    $$("[data-tab]").forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    if (p) renderProject(p);
    if (view === "projects") renderRows();
    const name = tr("Serop Kizirian Development");
    document.title = p ? tr(p.title) + " | " + name : (view === "home" ? name : tr(VIEWS[view]) + " | " + name);
    if (!keepScroll) {
      if (token === "sell") requestAnimationFrame(() => $("#sell").scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }));
      else window.scrollTo(0, 0);
    }
    syncFab();
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-go]"); if (!a) return;
    e.preventDefault();
    const t = a.dataset.go || a.getAttribute("data-go");
    if (t === "projects") filter.saved = false;
    if (location.hash.replace("#", "") === t) { route(t); return; }
    location.hash = t;
  });
  window.addEventListener("hashchange", () => route(location.hash));

  /* ---------- Language ---------- */
  const toggle = $("[data-lang-toggle]");
  function renderAll() {
    renderContact(); renderCards(); renderFinderAreas(); renderForms(); renderStudio(); renderMap();
    I18N.apply();
    toggle.textContent = I18N.lang === "ar" ? "English" : "عربي";
    toggle.lang = I18N.lang === "ar" ? "en" : "ar";
    toggle.setAttribute("aria-label", I18N.lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
    syncSaved();
  }
  toggle.addEventListener("click", () => {
    I18N.set(I18N.lang === "ar" ? "en" : "ar");
    renderAll();
    route(current, true);
  });

  /* ---------- Header shadow + floating WhatsApp ---------- */
  const header = $(".site-header");
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", syncHeader, { passive: true }); syncHeader();
  const fab = $(".fab"), blocking = new Set();
  function syncFab() { fab.classList.toggle("is-hidden", [...blocking].some((n) => n.offsetParent !== null)); }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? blocking.add(en.target) : blocking.delete(en.target)));
      syncFab();
    }, { threshold: 0.1 });
    $$(".hero, .page-head, .form-card, .land, .brief, .cta, .site-footer").forEach((n) => io.observe(n));
  }

  renderAll();
  route(location.hash);

  /* ---------- Opening intro: once per visit, skipped for reduced motion ---------- */
  (function intro() {
    const box = $("#intro"); if (!box) return;
    const root = document.documentElement;
    if (!root.classList.contains("show-intro")) { box.remove(); return; }
    try { sessionStorage.setItem("sk-intro", "1"); } catch (e) {}
    let gone = false;
    const end = () => {
      if (gone) return; gone = true;
      box.remove();
      root.classList.remove("show-intro");
      setTimeout(() => root.classList.remove("intro-playing"), 4000);
    };
    box.addEventListener("animationend", (e) => { if (e.animationName === "introLift") end(); });
    box.addEventListener("click", () => {
      if (box.classList.contains("is-leaving")) return;
      box.classList.add("is-leaving");
      $$(".arcs").forEach((a) => (a.style.animationDelay = "0.5s"));
    });
    setTimeout(end, 4500);
  })();

  window.addEventListener("load", () => {
    const go = () => Object.values(MEDIA).forEach((m) => warm(m.type === "video" ? m.poster : (m.thumb || m.src)));
    "requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200);
  });
}
