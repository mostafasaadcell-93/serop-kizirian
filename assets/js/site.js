/* Serop Kizirian Development: engine carried over from the S2D / Marhaba build
   (media registry by id, blur-up images, masonry gallery + lightbox, WhatsApp composer,
   floating WhatsApp that hides over heavy sections), with tab routing and site-visit booking. */
{
  const MEDIA = window.SK_MEDIA || {};
  const PROJECTS = window.SK_PROJECTS || [];
  const C = window.SK_CONTACT || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wa = (text, num) => "https://wa.me/" + (num || C.whatsapp) + "?text=" + encodeURIComponent(text);
  const bySlug = (s) => PROJECTS.find((p) => p.slug === s) || null;
  const img = (id) => (id && MEDIA[id]) || null;

  /* ---------- Images ---------- */
  const warmed = new Set();
  function warm(src) { if (!src || warmed.has(src)) return; warmed.add(src); const i = new Image(); i.decoding = "async"; i.src = src; }

  function blurUp(host, im, m) {
    if (m.lqip) host.style.backgroundImage = 'url("' + m.lqip + '")';
    host.classList.add("blur-up");
    const done = () => host.classList.add("is-loaded");
    if (im.complete && im.naturalWidth) done(); else { im.addEventListener("load", done); im.addEventListener("error", done); }
  }

  // Fill a frame with a registered photo, or the gold elevation drawing when there is none.
  function fill(host, id, opts) {
    opts = opts || {};
    const ph = el("div", "ph");
    ph.innerHTML = '<svg aria-hidden="true"><use href="#elevation"/></svg><span>' + (opts.label || "Photos coming soon") + "</span>";
    host.appendChild(ph);
    const m = img(id);
    if (!m) { host.classList.add("is-empty"); return host; }
    const im = document.createElement("img");
    im.src = opts.full ? m.src : (m.thumb || m.src);
    im.alt = opts.decorative ? "" : (m.alt || "");
    im.width = m.width; im.height = m.height;
    im.decoding = "async";
    im.loading = opts.eager ? "eager" : "lazy";
    if (opts.eager) im.setAttribute("fetchpriority", "high");
    if (m.focal) im.style.objectPosition = m.focal;
    blurUp(host, im, m);
    im.addEventListener("error", () => { im.remove(); host.classList.add("is-empty"); });
    host.prepend(im);
    return host;
  }
  const frame = (id, opts) => fill(el("div", "frame"), id, opts);

  $$("[data-img]").forEach((f) => fill(f, f.dataset.img, { eager: f.hasAttribute("data-eager"), full: true, decorative: true }));

  /* ---------- Contact bits ---------- */
  $$("[data-year]").forEach((n) => (n.textContent = new Date().getFullYear()));
  $$("[data-ig]").forEach((a) => { a.href = "https://instagram.com/" + C.instagram; a.textContent = "@" + C.instagram; });
  $$("[data-wa-general]").forEach((a) => (a.href = wa("Hello, I'd like to know more about your villas.")));
  $$("[data-count-projects]").forEach((n) => (n.textContent = String(PROJECTS.length)));

  async function copy(text, btn) {
    const was = btn.textContent;
    try { await navigator.clipboard.writeText(text); btn.textContent = "Copied"; }
    catch (e) {
      const t = btn.closest("li") && $(".num", btn.closest("li"));
      if (t) { const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      btn.textContent = "Selected";
    }
    setTimeout(() => (btn.textContent = was), 1600);
  }

  const phones = $("[data-phones]");
  (C.phones || []).forEach((p) => {
    const li = el("li");
    li.appendChild(el("span", "num", p.display));
    const mini = el("div", "mini");
    const w = el("a", "", "WhatsApp"); w.href = wa("Hello, I'd like to know more about your villas.", p.wa); w.target = "_blank"; w.rel = "noopener";
    const c = el("button", "", "Copy"); c.type = "button"; c.addEventListener("click", () => copy(p.display, c));
    mini.append(w, c); li.appendChild(mini); phones.appendChild(li);
  });

  function officeLink(o) { const a = el("a", "link", "Open in Maps"); a.href = o.map; a.target = "_blank"; a.rel = "noopener"; return a; }
  const officeList = $("[data-office-list]");
  (C.offices || []).forEach((o) => {
    const li = el("li"); const d = el("div");
    d.appendChild(el("strong", "", o.name)); d.appendChild(el("span", "", o.place));
    li.append(d, officeLink(o)); officeList.appendChild(li);
  });
  const offices = $("[data-offices]");
  (C.offices || []).forEach((o) => {
    const box = el("div", "office");
    box.append(el("h2", "display", o.name), el("p", "", o.place), officeLink(o));
    offices.appendChild(box);
  });
  const foot = $("[data-foot-contact]");
  (C.phones || []).forEach((p) => { const a = el("a", "", p.display); a.href = wa("Hello, I'd like to know more about your villas.", p.wa); a.target = "_blank"; a.rel = "noopener"; foot.appendChild(a); });
  foot.appendChild(el("span", "", "Baasiri Street, Saida · Chehime"));

  /* ---------- Project cards + rows ---------- */
  function card(p) {
    const a = el("a", "card"); a.href = "#" + p.slug; a.dataset.go = p.slug;
    a.appendChild(frame(p.coverId));
    a.appendChild(el("h3", "display", p.title));
    a.appendChild(el("p", "", p.location));
    a.appendChild(el("span", "more", "View project"));
    return a;
  }
  $("[data-cards]").append(...PROJECTS.map(card));

  function row(p) {
    const r = el("article", "row");
    const media = el("a", "row-media"); media.href = "#" + p.slug; media.dataset.go = p.slug; media.setAttribute("aria-label", "View " + p.title);
    media.appendChild(frame(p.coverId));
    const copyBox = el("div", "row-copy");
    copyBox.appendChild(el("p", "place", p.location));
    copyBox.appendChild(el("h2", "display l", p.title));
    copyBox.appendChild(el("p", "", p.summary));
    const act = el("div", "actions");
    const v = el("a", "btn", "View project"); v.href = "#" + p.slug; v.dataset.go = p.slug;
    const b = el("button", "btn line", "Book a site visit"); b.type = "button"; b.dataset.visit = p.slug;
    act.append(v, b); copyBox.appendChild(act);
    r.append(media, copyBox);
    return r;
  }
  $("[data-rows]").append(...PROJECTS.map(row));

  /* ---------- Site-visit form (contact page + dialog share one builder) ---------- */
  const DAYS = ["Weekday", "Saturday"];
  const TIMES = ["Morning", "Afternoon"];
  function pills(name, list, key) {
    return '<div class="pills">' + list.map((t, i) =>
      '<label><input type="radio" name="' + name + '" id="' + key + "-" + name + "-" + i + '" value="' + t + '"' + (i === 0 ? " checked" : "") + "><span>" + t + "</span></label>").join("") + "</div>";
  }
  function visitForm(key) {
    const f = el("form", "form"); f.noValidate = true;
    f.innerHTML =
      '<div class="two">' +
        '<div class="field"><label for="' + key + '-name">Full name</label><input id="' + key + '-name" name="fullname" autocomplete="name"></div>' +
        '<div class="field"><label for="' + key + '-phone">Phone number</label><input id="' + key + '-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+961"></div>' +
      "</div>" +
      '<div class="field"><label for="' + key + '-project">Project</label><select id="' + key + '-project" name="project"><option value="">Not sure yet</option>' +
        PROJECTS.map((p) => '<option value="' + p.slug + '">' + p.title + "</option>").join("") + "</select></div>" +
      '<div class="two"><fieldset class="field"><legend>Preferred day</legend>' + pills("day", DAYS, key) + "</fieldset>" +
      '<fieldset class="field"><legend>Preferred time</legend>' + pills("time", TIMES, key) + "</fieldset></div>" +
      '<p class="form-msg" role="status"></p>' +
      '<a class="btn gold" target="_blank" rel="noopener">Send request on WhatsApp</a>';
    const F = f.elements, send = $("a.btn", f), msg = $(".form-msg", f);
    const text = () => {
      const p = bySlug(F.project.value);
      return ["Hello, I'd like to book a site visit.", "",
        "Name: " + F.fullname.value.trim(),
        "Phone: " + F.phone.value.trim(),
        "Project: " + (p ? p.title : "Not sure yet"),
        "Preferred day: " + f.querySelector("input[name=day]:checked").value,
        "Preferred time: " + f.querySelector("input[name=time]:checked").value].join("\n");
    };
    const sync = () => (send.href = wa(text()));
    f.addEventListener("input", sync); f.addEventListener("change", sync); sync();
    send.addEventListener("click", (e) => {
      const miss = [];
      if (!F.fullname.value.trim()) miss.push("your name");
      if (F.phone.value.replace(/\D/g, "").length < 7) miss.push("a phone number we can reach");
      if (miss.length) { e.preventDefault(); msg.textContent = "Add " + miss.join(" and ") + " to send the request."; (miss[0] === "your name" ? F.fullname : F.phone).focus(); return; }
      msg.textContent = "WhatsApp opens with your request filled in. Press send there to confirm.";
    });
    f.addEventListener("submit", (e) => { e.preventDefault(); send.click(); });
    f.preselect = (slug) => { F.project.value = slug || ""; msg.textContent = ""; sync(); };
    return f;
  }
  const contactForm = visitForm("contact");
  $('[data-form-slot="contact"]').appendChild(contactForm);
  const sheet = $("#visitSheet");
  const sheetForm = visitForm("sheet");
  $('[data-form-slot="sheet"]').appendChild(sheetForm);

  function openVisit(slug) {
    sheetForm.preselect(slug);
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute("open", "");
    setTimeout(() => sheetForm.elements.fullname.focus(), 30);
  }
  const closeVisit = () => (sheet.close ? sheet.close() : sheet.removeAttribute("open"));
  $("[data-close]", sheet).addEventListener("click", closeVisit);
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeVisit(); });
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-visit]"); if (t) openVisit(t.dataset.visit || ""); });

  /* ---------- Project detail ---------- */
  const detail = $("[data-detail]"), galleryWrap = $("[data-gallery-wrap]"), gallery = $("[data-gallery]");
  let tiles = [], shots = [];

  function renderProject(p) {
    detail.replaceChildren();
    const cover = frame(p.coverId, { eager: true, full: true });
    detail.appendChild(cover);
    const box = el("div", "detail-copy");
    box.appendChild(el("p", "place", p.location));
    box.appendChild(el("h1", "display xl", p.title));
    box.appendChild(el("p", "lead", p.description || p.summary));
    const dl = el("dl", "facts-list");
    [["Location", p.location], ["Type", p.type]].concat(p.facts || [])
      .concat([["Payment plan", "Over two years"], ["Finishes", "Chosen with our interior designers"]])
      .forEach(([k, v]) => { const d = el("div"); d.append(el("dt", "", k), el("dd", "", v)); dl.appendChild(d); });
    box.appendChild(dl);
    if (!(p.galleryIds || []).some(img)) box.appendChild(el("p", "note", "Plans and photos of " + p.title + " are on their way to this page. Book a site visit and our team will walk you through the project in person."));
    const act = el("div", "actions");
    const b = el("button", "btn", "Book a site visit"); b.type = "button"; b.dataset.visit = p.slug;
    const w = el("a", "btn line", "Ask on WhatsApp"); w.href = wa("Hello, I'd like to know more about " + p.title + " (" + p.location + ")."); w.target = "_blank"; w.rel = "noopener";
    act.append(b, w); box.appendChild(act);
    detail.appendChild(box);

    tiles = []; shots = [];
    (p.galleryIds || []).forEach((id) => {
      const m = img(id); if (!m) return;
      shots.push(m);
      const idx = shots.length - 1;
      if (id === p.coverId) { cover.style.cursor = "zoom-in"; cover.addEventListener("click", () => openLb(idx, p.title)); return; }
      const t = el("button", "tile"); t.type = "button"; t.style.aspectRatio = m.width + " / " + m.height;
      t.setAttribute("aria-label", "Open photo: " + m.alt);
      const im = document.createElement("img"); im.src = m.thumb || m.src; im.alt = m.alt; im.loading = idx < 6 ? "eager" : "lazy"; im.decoding = "async";
      blurUp(t, im, m); t.appendChild(im);
      t.addEventListener("click", () => openLb(idx, p.title));
      tiles.push({ el: t, ratio: m.height / m.width });
    });
    $("[data-gallery-title]").textContent = "Gallery, " + shots.length + " photos";
    galleryWrap.hidden = !tiles.length;
    gallery.dataset.cols = "";
    layout();
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

  /* ---------- Lightbox ---------- */
  const lb = $(".lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb);
  let lbI = 0, lbTitle = "", lastFocus = null;
  function show() {
    const m = shots[lbI];
    lbImg.src = m.thumb || m.src; lbImg.alt = m.alt || "";
    if (m.thumb) { const full = new Image(); full.onload = () => { if (shots[lbI] === m) lbImg.src = m.src; }; full.src = m.src; }
    lbCap.textContent = lbTitle + "   " + (lbI + 1) + " / " + shots.length;
    [1, -1].forEach((d) => warm(shots[(lbI + d + shots.length) % shots.length].src));
  }
  function openLb(i, title) { lastFocus = document.activeElement; lbI = i; lbTitle = title; show(); lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); document.body.classList.add("lock"); $("[data-lb-close]", lb).focus(); }
  function closeLb() { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); document.body.classList.remove("lock"); if (lastFocus) lastFocus.focus(); }
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

  /* ---------- Tabs: bare #tokens (home, projects, about, contact, or a project slug) ---------- */
  const VIEWS = { home: "Serop Kizirian Development", projects: "Projects", about: "About us", contact: "Contact us" };
  function route(token) {
    token = (token || "").replace(/^#/, "") || "home";
    const p = bySlug(token);
    const view = p ? "project" : (VIEWS[token] ? token : "home");
    $$(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
    const tab = p ? "projects" : view;
    $$("[data-tab]").forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    if (p) renderProject(p);
    document.title = p ? p.title + " | Serop Kizirian Development" : (view === "home" ? VIEWS.home : VIEWS[view] + " | Serop Kizirian Development");
    window.scrollTo(0, 0);
    syncFab();
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-go]"); if (!a) return;
    e.preventDefault();
    const t = a.dataset.go;
    if (location.hash.replace("#", "") === t) { route(t); return; }
    location.hash = t; // hashchange routes
  });
  window.addEventListener("hashchange", () => route(location.hash));

  /* ---------- Floating WhatsApp: hidden over the hero, forms, CTA and footer ---------- */
  const fab = $(".fab"), blocking = new Set();
  let io = null;
  function syncFab() { fab.classList.toggle("is-hidden", [...blocking].some((n) => n.offsetParent !== null)); }
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? blocking.add(en.target) : blocking.delete(en.target)));
      syncFab();
    }, { threshold: 0.1 });
    $$(".hero, .page-head, .form-card, .cta, .site-footer").forEach((n) => io.observe(n));
  }

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
    setTimeout(end, 4500); // safety net if animation events never fire
  })();

  window.addEventListener("load", () => {
    const go = () => Object.values(MEDIA).forEach((m) => warm(m.thumb || m.src));
    "requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200);
  });
}
