/* =========================================================
   Lautaro García · main.js (IIFE, sin módulos)
   Compartido por la home, las propuestas y /privacidad.
   ========================================================= */
(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[init] " + name + " falló:", e); }
  }

  /* ---------- Links de WhatsApp ---------- */
  function waUrl(text) {
    var cfg = window.LG_CONFIG || {};
    var num = String(cfg.whatsapp || "").replace(/\D/g, "");
    var msg = text || cfg.mensaje || "";
    // Si todavía no hay número cargado, queda el placeholder visible en el href.
    var base = num ? "https://wa.me/" + num : "https://wa.me/[NUMERO]";
    return msg ? base + "?text=" + encodeURIComponent(msg) : base;
  }
  window.LG_waUrl = waUrl;

  function initWhatsApp() {
    var links = document.querySelectorAll("[data-wa]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.href = waUrl(a.getAttribute("data-wa"));
      a.target = "_blank";
      a.rel = "noopener";
    }
  }

  /* ---------- Nav sólida al hacer scroll ---------- */
  function initNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("is-solid", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Reveal on scroll (con red de seguridad) ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    var showAll = function () { for (var i = 0; i < els.length; i++) els[i].classList.add("is-in"); };
    if (!("IntersectionObserver" in window)) { showAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.02, rootMargin: "0px 0px -6% 0px" });
    for (var i = 0; i < els.length; i++) io.observe(els[i]);
    setTimeout(showAll, 6000);
  }

  /* ---------- Hero: recorrido del paciente ---------- */
  function initFlow() {
    var card = document.getElementById("flowCard");
    if (!card) return;
    var items = card.querySelectorAll(".flow-item");
    var n = items.length, step = 0;
    function render() {
      for (var i = 0; i < n; i++) {
        items[i].classList.toggle("is-on", i <= step);
        items[i].classList.toggle("is-now", i === step);
      }
    }
    render();
    setInterval(function () {
      step = step + 1;
      if (step >= n + 1) step = 0;      // una pausa con todo encendido y vuelve a empezar
      if (step === n) {
        for (var i = 0; i < n; i++) { items[i].classList.add("is-on"); items[i].classList.remove("is-now"); }
        return;
      }
      render();
    }, 1700);
  }

  /* ---------- VSL opcional ---------- */
  function initVSL() {
    var box = document.getElementById("vsl");
    if (!box) return;
    var src = (box.getAttribute("data-vsl") || "").trim();
    if (!src || box.children.length > 0) return;
    var el;
    if (/\.(mp4|webm)(\?|$)/i.test(src)) {
      el = document.createElement("video");
      el.src = src; el.controls = true; el.playsInline = true; el.preload = "metadata";
    } else {
      el = document.createElement("iframe");
      el.src = src; el.allow = "autoplay; fullscreen; picture-in-picture"; el.allowFullscreen = true;
      el.loading = "lazy"; el.title = "Video";
    }
    box.appendChild(el);
    box.classList.add("is-ready");
    var flow = document.getElementById("flowCard");
    if (flow) flow.style.display = "none";
  }

  /* ---------- Loop web + WhatsApp ---------- */
  function initLoop() {
    var loop = document.getElementById("loop");
    if (!loop) return;
    var steps = loop.querySelectorAll(".loop-step");
    var i = 0;
    setInterval(function () {
      i = (i + 1) % steps.length;
      for (var k = 0; k < steps.length; k++) steps[k].classList.toggle("is-on", k === i);
    }, 1800);
  }

  /* ---------- WhatsApp flotante (mobile) ---------- */
  function initFloat() {
    var btn = document.getElementById("waFloat");
    if (!btn) return;
    var onScroll = function () {
      var nearEnd = (window.innerHeight + window.scrollY) > (document.body.scrollHeight - 160);
      btn.classList.toggle("is-on", window.scrollY > 520 && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initYear() {
    var els = document.querySelectorAll("[data-year]");
    for (var i = 0; i < els.length; i++) els[i].textContent = new Date().getFullYear();
  }

  function boot() {
    safe(initWhatsApp, "whatsapp");
    safe(initNav, "nav");
    safe(initReveal, "reveal");
    safe(initFlow, "flow");
    safe(initVSL, "vsl");
    safe(initLoop, "loop");
    safe(initFloat, "float");
    safe(initYear, "year");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
