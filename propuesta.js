/* =========================================================
   Propuestas por cliente: vuelca window.PROPUESTA en la página.
   Corre antes de demo.js y main.js (orden de los <script defer>).
   ========================================================= */
(function () {
  "use strict";
  var P = window.PROPUESTA;
  if (!P) return;

  // Las rutas de la carpeta del cliente ("logo.png") funcionan con o sin "/" al final de la URL
  function local(src) {
    if (!src || /^(https?:|\/|data:)/.test(src)) return src;
    var p = location.pathname;
    return (p.charAt(p.length - 1) === "/" ? p : p + "/") + src;
  }
  function safe(fn, name) { try { fn(); } catch (e) { if (window.console) console.warn("[propuesta] " + name, e); } }
  function $all(sel) { return document.querySelectorAll(sel); }

  // Convierte links normales de Loom, Google Drive o YouTube a su versión para incrustar
  function videoEmbed(url) {
    if (!url) return "";
    url = String(url).trim();
    var m = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    if (m) return "https://www.loom.com/embed/" + m[1] + "?hideEmbedTopBar=true";
    m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
    if (m) return "https://drive.google.com/file/d/" + m[1] + "/preview";
    m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    return url;
  }

  function texts() {
    var els = $all("[data-p]");
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-p");
      if (P[k]) els[i].textContent = P[k];
    }
    var who = P.cliente || P.clinica;
    if (P.pestana) document.title = P.pestana;
    else if (who) document.title = "Propuesta para " + who + " · Lautaro García";
  }

  function logo() {
    var box = document.querySelector("[data-p-logo]");
    if (!box || box.children.length) return;
    if (P.logo) {
      var img = document.createElement("img");
      img.src = local(P.logo); img.alt = P.cliente || P.clinica || "Logo";
      img.addEventListener("load", function () { if (img.naturalWidth > img.naturalHeight * 1.4) box.classList.add("is-wide"); });
      box.appendChild(img);
    } else {
      var w = String(P.cliente || P.clinica || "").replace(/cl[ií]nica|consultorio|dra?\.?\s/gi, "").trim().split(/\s+/).filter(Boolean);
      box.textContent = w.length ? (w[0][0] + (w[1] ? w[1][0] : "")).toUpperCase() : "?";
    }
  }

  function video() {
    var box = document.querySelector("[data-p-loom]");
    var raw = String(P.video || P.loom || "").trim();
    if (!box || !raw) return;
    // Video propio (.mp4 en la carpeta del cliente): reproductor nativo, funciona bien en celular
    if (/\.mp4([?#]|$)/i.test(raw)) {
      box.innerHTML = "";
      var v = document.createElement("video");
      v.src = local(raw); v.controls = false; v.preload = "metadata";
      v.setAttribute("playsinline", ""); v.setAttribute("controlslist", "nodownload");
      if (P.poster) v.poster = local(P.poster);
      box.appendChild(v);
      // Play grande y centrado hasta que arranca; después quedan los controles nativos
      var play = document.createElement("button");
      play.type = "button"; play.className = "prop-play"; play.setAttribute("aria-label", "Reproducir video");
      play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
      play.addEventListener("click", function () { v.play(); });
      v.addEventListener("play", function () { v.controls = true; box.classList.add("is-playing"); });
      box.appendChild(play);
      box.classList.add("is-ready");
      return;
    }
    var src = videoEmbed(raw);
    box.innerHTML = "";
    var f = document.createElement("iframe");
    f.src = src; f.allowFullscreen = true; f.title = "Video propuesta";
    f.allow = "autoplay; fullscreen; picture-in-picture";
    box.appendChild(f);
    // Drive pone arriba a la derecha un botón para abrir el video en Drive: una capa invisible lo deja sin efecto
    if (/drive\.google\.com/.test(src)) {
      var shield = document.createElement("span");
      shield.className = "prop-video-shield"; shield.setAttribute("aria-hidden", "true");
      box.appendChild(shield);
    }
    box.classList.add("is-ready");
  }

  function demo() {
    var d = document.getElementById("propDemo");
    if (!d) return;
    d.setAttribute("data-clinic", P.clinica || "Su clínica");
    d.setAttribute("data-doctor", P.medico || "el doctor");
    if (P.tratamientos) d.setAttribute("data-treatments", P.tratamientos);
    if (P.origen) d.setAttribute("data-source", P.origen);
    if (P.crm) d.setAttribute("data-crm", P.crm);
    // El avatar del chat es redondo: solo usa un logo cuadrado (logoChat); si no, iniciales
    if (P.logoChat) d.setAttribute("data-logo", local(P.logoChat));
    d.setAttribute("data-lg-demo", "");
  }

  function blocks() {
    var inc = P.incluye || {};
    var els = $all("[data-inc]");
    for (var i = 0; i < els.length; i++) {
      if (inc[els[i].getAttribute("data-inc")] === false) els[i].parentNode.removeChild(els[i]);
    }
  }

  function cta() {
    var els = $all("[data-p-cta-msg]");
    for (var i = 0; i < els.length; i++) if (P.ctaMensaje) els[i].setAttribute("data-wa", P.ctaMensaje);
  }

  function boot() {
    safe(texts, "textos"); safe(logo, "logo"); safe(video, "video");
    safe(demo, "demo"); safe(blocks, "bloques"); safe(cta, "cta");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
