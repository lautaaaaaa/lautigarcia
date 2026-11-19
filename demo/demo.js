/* =========================================================
   Demo interactiva · componente reutilizable (IIFE, sin módulos)

   Uso en cualquier página:
     <link rel="stylesheet" href="demo/demo.css">
     <script src="demo/demo.js" defer></script>
     <div class="lgd" data-lg-demo
          data-clinic="Clínica Aurora"            (nombre de la clínica)
          data-doctor="la Dra. Valeria Ruiz"      (cómo se nombra al médico dentro de una frase)
          data-treatments="Botox,Rellenos,Rinoplastia"   (opcional)
          data-source="Instagram"                 (origen que se registra en el CRM, opcional)
          data-crm="Botox,Rellenos,Rinoplastia"   (opcional: tratamientos de las 3 filas de ejemplo del CRM)
          data-logo="logo.png"></div>             (opcional, avatar del chat)

   Es una conversación guionada (no una IA real): reconoce intenciones
   comunes (tratamiento, precio, hablar con una persona, preguntas médicas)
   y mueve el calendario y el CRM en cada paso.
   ========================================================= */
(function () {
  "use strict";

  var DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  var DAYS_S = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Orden: lo más específico primero (liposucción antes que lipo, rinomodelación antes que rino...)
  var TREAT_RX = [
    ["Lipoabdominoplastia", "lipo ?abdomino"],
    ["Mommy makeover", "mommy|mami ?makeover|makeover"],
    ["Lipopapada", "lipo ?(de (la )?)?papada|papada"],
    ["Lifting de cuello", "lifting (de(l)? )?cuello|cuello"],
    ["Braquioplastia", "braqui\\w*plast|brachi\\w*plast|lifting (de )?brazos?|brazos?"],
    ["Lifting de muslos", "lifting (de )?muslos?|muslos?"],
    ["Lifting facial", "lifting (facial|de (la )?(cara|rostro))|face ?lift|ritidec|estiramiento facial|\\blifting\\b"],
    ["Cirugía mamaria", "cirugia (de |en )?(la |los )?(mamas?|busto|senos?|pechos?)|cirugia mamaria"],
    ["Liposucción", "liposuc|lipo ?succ"],
    ["Rinomodelación", "rinomodel|rino ?model|nariz sin cirugia"],
    ["Reducción mamaria", "reduc\\w* (de )?(busto|mama|senos|pecho)|reduccion mamaria"],
    ["Levantamiento de busto", "mastopex|levant\\w* (de )?(busto|senos|pecho)"],
    ["Levantamiento de glúteos", "\\bbbl\\b|glute|pompi|pompa"],
    ["Botox", "botox|botx|toxina|botulin|arruga|patas de gallo|entrecejo"],
    ["Rellenos", "relleno|hialuron|labio|ojera|pomulo|menton|perfilado"],
    ["Rinoplastia", "rinoplast|\\brino\\b|nariz"],
    ["Lipoescultura", "lipoescult|lipo ?escult|\\blipo\\b|lipolaser|grasa|cintura"],
    ["Aumento mamario", "aumento (de )?(busto|mama|senos|pecho)|mamari|implante|busto|\\bsenos?\\b|\\bpechos?\\b"],
    ["Bichectomía", "bichectom|bichat|cachete"],
    ["Blefaroplastia", "blefaro|parpado"],
    ["Abdominoplastia", "abdominoplast|panza|vientre|abdomen"],
    ["Hilos tensores", "hilos"],
    ["Tratamiento facial", "skin|piel|mancha|acne|limpieza|peeling|facial|hidra|microneedling|mesoterapia|plasma|\\bprp\\b"],
    ["Depilación láser", "laser|depilacion"]
  ];

  var FUZZY = [
    ["botox", "Botox"], ["relleno", "Rellenos"], ["rellenos", "Rellenos"], ["hialuronico", "Rellenos"],
    ["rinoplastia", "Rinoplastia"], ["rinomodelacion", "Rinomodelación"], ["liposuccion", "Liposucción"],
    ["lipoescultura", "Lipoescultura"], ["abdominoplastia", "Abdominoplastia"], ["blefaroplastia", "Blefaroplastia"],
    ["bichectomia", "Bichectomía"], ["mastopexia", "Levantamiento de busto"], ["implantes", "Aumento mamario"],
    ["depilacion", "Depilación láser"], ["peeling", "Tratamiento facial"],
    ["lipopapada", "Lipopapada"], ["braquioplastia", "Braquioplastia"], ["lifting", "Lifting facial"],
    ["lipoabdominoplastia", "Lipoabdominoplastia"]
  ];
  function editDist(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  // Devuelve el tratamiento si la palabra se parece a uno (1 error en palabras cortas, 2 en largas)
  function fuzzyTreatment(word) {
    if (word.length < 5) return null;
    for (var i = 0; i < FUZZY.length; i++) {
      var ref = FUZZY[i][0], max = ref.length >= 8 ? 2 : 1;
      if (editDist(word, ref) <= max) return FUZZY[i][1];
    }
    return null;
  }
  var DEFAULT_TREATMENTS = ["Botox", "Rellenos", "Rinoplastia", "Liposucción", "Aumento mamario"];
  var RECUR = { "Botox": ["4 meses", "retoque"], "Rellenos": ["9 meses", "retoque"] };

  var RX_HUMAN = /(\bpersona\b|humano|asesor|alguien real|recepcion|secretaria|hablar con (la|el) (doctor|dra|dr)|llamen|llamada)/;
  var RX_DIAG = /(candidat|como me veria|me quedaria|me recomienda|me recomiendan|duele|dolor|inflam|moreton|hinchad|riesgo|es normal|complicac|alergi|embaraz|lactan)/;
  var FAQ = [
    [/(donde (estan|quedan|queda|se ubican|se encuentran)|direccion|ubicacion|como llego|estacionamiento)/,
      "Le comparto la ubicación exacta y cómo llegar junto con la confirmación de su cita."],
    [/(que horario(s)? (tienen|manejan)|horario(s)? de atencion|a que hora (abren|cierran)|atienden (los )?(sabado|domingo|fines)|abren (los )?(sabado|domingo))/,
      "Atendemos de lunes a viernes de 9:00 a 19:00 y los sábados de 9:00 a 14:00."],
    [/(tarjeta|efectivo|transferencia|meses sin intereses|\bmsi\b|formas? de pago|financ|pagar en|a meses)/,
      "Aceptamos tarjeta, transferencia y efectivo. Las opciones de pago se las detallan en la valoración."],
    [/(puedo (hacer|tomar|comer|beber|ir|maquillarme|banarme|trabajar|manejar)|ejercicio|gimnasio|alcohol|cuidados|que debo (llevar|hacer))/,
      "Los cuidados y las indicaciones se los explican en la consulta, según su caso. Antes de su cita le comparto las indicaciones generales."],
    [/(cuanto dura|duracion|recuperacion|reposo|cuantos dias|cuanto tiempo (tarda|toma|dura))/,
      "Eso depende de cada caso. En la valoración le explican los tiempos y los cuidados para su tratamiento."]
  ];
  var RX_BOT = /\b(eres|sos|es|hablo con) (un |una )?(bot|robot|ia|inteligencia artificial|maquina|humano|persona real)\b/;
  var RX_PRICE = /(cuanto (cuesta|sale|vale|es|cobran|seria)|precio|costo|cuesta|cobran|\bvalor\b|promo|descuento)/;

  var BUSY = [
    { d: 0, t: "10:00", l: "Control" }, { d: 0, t: "16:30", l: "Botox" },
    { d: 1, t: "12:00", l: "Valoración" }, { d: 2, t: "09:30", l: "Rellenos" },
    { d: 2, t: "13:00", l: "Control" }, { d: 3, t: "17:00", l: "Valoración" },
    { d: 4, t: "11:00", l: "Botox" }
  ];
  var SLOTS_A = [{ d: 0, t: "12:30" }, { d: 1, t: "10:30" }];
  var SLOTS_B = [{ d: 1, t: "17:00" }, { d: 2, t: "11:00" }];

  var CRM_SEED = [
    { n: "Mariana Ruiz", full: "Mariana Ruiz", t: "Rellenos", o: "Google Maps", s: "Asistió", c: "s-ok" },
    { n: "Paola Gómez", full: "Paola Gómez", t: "Botox", o: "Recomendación", s: "Reseña dejada", c: "s-star" },
    { n: "Daniela Mena", full: "Daniela Mena", t: "Valoración", o: "Anuncio", s: "Recordatorio enviado", c: "" }
  ];

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function nowHM() {
    var d = new Date();
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }
  function nextBusinessDays(n) {
    var out = [], d = new Date();
    d.setHours(12, 0, 0, 0);
    while (out.length < n) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) out.push(new Date(d));
    }
    return out;
  }
  function initials(name) {
    var w = String(name).replace(/cl[ií]nica|consultorio|dr[a]?\.?/gi, "").trim().split(/\s+/).filter(Boolean);
    if (!w.length) w = String(name).split(/\s+/);
    return (w[0][0] + (w[1] ? w[1][0] : "")).toUpperCase();
  }

  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21.85 12 3.4 3.6 3.39 10.1 16.5 12 3.39 13.9z"/></svg>';
  var ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  var ICON_CRM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>';

  function mount(root) {
    if (!root || root.getAttribute("data-mounted") === "1") return;
    root.setAttribute("data-mounted", "1");

    var clinic = root.getAttribute("data-clinic") || "Clínica Aurora";
    var doctor = root.getAttribute("data-doctor") || "el doctor";
    var source = root.getAttribute("data-source") || "Instagram";
    var logo = root.getAttribute("data-logo") || "";
    var crmTreatments = (root.getAttribute("data-crm") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var treatments = (root.getAttribute("data-treatments") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!treatments.length) treatments = DEFAULT_TREATMENTS.slice();
    // "el Consultorio...", "la Clínica...", o el nombre solo
    var clinicRef = (/^consultorio/i.test(clinic) ? "el " : /^cl[ií]nica/i.test(clinic) ? "la " : "") + clinic;
    var slug = norm(clinic).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    /* ---------- Estructura ---------- */
    var noscript = root.querySelector("noscript");
    root.innerHTML = "";
    if (noscript) root.appendChild(noscript);

    var phone = el("div", "lgd-phone");
    var head = el("div", "lgd-head");
    var ava = el("div", "lgd-ava", logo ? '<img src="' + esc(logo) + '" alt="">' : esc(initials(clinic)));
    var who = el("div", "", '<div class="lgd-name">' + esc(clinic) + '</div>');
    var status = el("div", "lgd-status", "en línea");
    who.appendChild(status);
    var resetBtn = el("button", "lgd-reset", "Reiniciar");
    resetBtn.type = "button";
    head.appendChild(ava); head.appendChild(who); head.appendChild(resetBtn);

    var body = el("div", "lgd-body");
    body.setAttribute("aria-live", "polite");
    var form = el("form", "lgd-form");
    form.setAttribute("novalidate", "");
    var input = el("input", "lgd-input");
    input.type = "text"; input.maxLength = 200; input.autocomplete = "off";
    input.setAttribute("aria-label", "Escriba un mensaje como paciente");
    var send = el("button", "lgd-send", ICON_SEND);
    send.type = "submit"; send.setAttribute("aria-label", "Enviar");
    form.appendChild(input); form.appendChild(send);
    phone.appendChild(head); phone.appendChild(body); phone.appendChild(form);

    var side = el("div", "lgd-side");
    var calPanel = el("div", "lgd-panel");
    calPanel.innerHTML = '<div class="lgd-ph"><span class="lgd-pt">' + ICON_CAL + 'Agenda de la clínica</span><span class="lgd-badge">Cita nueva</span></div>';
    var cal = el("div", "lgd-cal");
    calPanel.appendChild(cal);
    var crmPanel = el("div", "lgd-panel");
    crmPanel.innerHTML = '<div class="lgd-ph"><span class="lgd-pt">' + ICON_CRM + 'Pacientes (CRM)</span><span class="lgd-badge">Actualizado</span></div>';
    var crmWrap = el("div", "lgd-crm-wrap");
    var crm = el("table", "lgd-crm", "<thead><tr><th>Paciente</th><th>Tratamiento</th><th>Origen</th><th>Estado</th></tr></thead>");
    var tbody = el("tbody");
    crm.appendChild(tbody); crmWrap.appendChild(crm); crmPanel.appendChild(crmWrap);
    var note = el("p", "lgd-note");
    crmPanel.appendChild(note);

    side.appendChild(el("p", "lgd-label", "Lo que pasa detrás"));
    side.appendChild(calPanel);
    side.appendChild(crmPanel);

    // Columna del chat: etiqueta + caja que toma la altura de los paneles (en desktop)
    var mainCol = el("div", "lgd-main");
    mainCol.appendChild(el("p", "lgd-label", "El WhatsApp de la clínica"));
    var phoneBox = el("div", "lgd-phone-box");
    phoneBox.appendChild(phone);
    mainCol.appendChild(phoneBox);
    root.appendChild(mainCol);
    root.appendChild(side);

    /* ---------- Estado ---------- */
    var days, events, S, seedRows = [], timers = [];

    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    // Minúscula dentro de una frase, salvo siglas ("LASIK")
    function lc(x) { x = String(x); return x.length > 1 && x === x.toUpperCase() ? x : x.toLowerCase(); }
    function slotLabel(s) { var d = days[s.d]; return lc(DAYS[d.getDay()]) + " " + d.getDate() + ", " + s.t; }
    function slotBtn(s) { var l = slotLabel(s); return l.charAt(0).toUpperCase() + l.slice(1); }
    function slotPhrase(s) { var d = days[s.d]; return lc(DAYS[d.getDay()]) + " " + d.getDate() + " a las " + s.t; }
    function slotsText(list) {
      if (list.length > 1 && list.every(function (x) { return x.d === list[0].d; })) {
        return "el " + slotPhrase(list[0]) + list.slice(1).map(function (x) { return " o a las " + x.t; }).join("");
      }
      var p = list.map(function (x) { return "el " + slotPhrase(x); });
      return p.length > 1 ? p.slice(0, -1).join(", ") + " o " + p[p.length - 1] : p[0];
    }
    function first() { return (S.lead && S.lead.name ? S.lead.name.split(" ")[0] : ""); }

    /* ---------- Calendario ---------- */
    function renderCal() {
      cal.innerHTML = "";
      for (var i = 0; i < days.length; i++) {
        var col = el("div", "lgd-day");
        col.appendChild(el("div", "lgd-dh", DAYS_S[days[i].getDay()] + "<b>" + days[i].getDate() + "</b>"));
        var slots = el("div", "lgd-slots");
        var list = events.filter(function (e) { return e.d === i; }).sort(function (a, b) { return a.t < b.t ? -1 : 1; });
        list.forEach(function (e) {
          slots.appendChild(el("div", "lgd-ev" + (e.isNew ? " is-new" : "") + (e.done ? " is-done" : "") + (e.flash ? " is-flash" : ""), "<b>" + e.t + (e.done ? " ✓" : "") + "</b><span>" + esc(e.l) + "</span>" + (e.done ? "<em>Asistió</em>" : "")));
        });
        col.appendChild(slots);
        cal.appendChild(col);
      }
      events.forEach(function (e) { e.flash = false; });
    }

    /* ---------- CRM ---------- */
    function rowHTML(r) {
      return "<td>" + esc(r.n) + "</td><td>" + esc(r.t) + "</td><td>" + esc(r.o) + '</td><td><span class="lgd-st ' + (r.c || "") + '">' + esc(r.s) + "</span></td>";
    }
    function renderCRM() {
      tbody.innerHTML = "";
      seedRows = CRM_SEED.map(function (r) {
        var copy = {}; for (var k in r) copy[k] = r[k];
        var idx = CRM_SEED.indexOf(r);
        if (crmTreatments[idx]) copy.t = crmTreatments[idx];
        else if (copy.t !== "Valoración") copy.t = treatments[idx % treatments.length];
        copy.row = el("tr", "", rowHTML(copy)); tbody.appendChild(copy.row);
        return copy;
      });
    }
    function updateLead(changes, noteText, label) {
      var L = S.lead;
      for (var k in changes) if (Object.prototype.hasOwnProperty.call(changes, k)) L[k] = changes[k];
      L.row.innerHTML = rowHTML(L);
      L.row.classList.remove("is-new"); void L.row.offsetWidth; L.row.classList.add("is-new");
      if (noteText) note.innerHTML = noteText;
      flashNote();
      pulse(crmPanel, label || "Actualizado");
    }
    function ensureLead() {
      if (S.lead) return;
      S.lead = { n: "Nuevo contacto", t: "Por definir", o: source, s: "Conversando", c: "s-live", name: "" };
      var tr = el("tr", "is-new", rowHTML(S.lead));
      tbody.insertBefore(tr, tbody.firstChild);
      S.lead.row = tr;
      note.innerHTML = "<b>Nuevo paciente</b> registrado automáticamente, con su origen: " + esc(source) + ".";
      flashNote();
      pulse(crmPanel, "Nuevo contacto");
    }
    function pulse(panel, label) {
      var badge = panel.querySelector(".lgd-badge");
      if (badge && label) badge.textContent = label;
      panel.classList.remove("is-pulse"); void panel.offsetWidth; panel.classList.add("is-pulse");
      clearTimeout(panel._t);
      panel._t = setTimeout(function () { panel.classList.remove("is-pulse"); }, 2600);
    }
    function flashNote() { note.classList.remove("is-flash"); void note.offsetWidth; note.classList.add("is-flash"); }

    /* ---------- Chat ---------- */
    function scrollChat() { body.scrollTop = body.scrollHeight; }
    function addMsg(side, html) {
      var m = el("div", "lgd-msg " + side, html + "<time>" + nowHM() + "</time>");
      body.appendChild(m); scrollChat();
    }
    function addSys(text, isTime) { body.appendChild(el("div", "lgd-sys" + (isTime ? " is-time" : ""), text)); scrollChat(); }
    var typingEl = null;
    function showTyping() {
      if (typingEl) return;
      typingEl = el("div", "lgd-typing", "<span></span><span></span><span></span>");
      body.appendChild(typingEl); scrollChat();
      status.textContent = "escribiendo...";
    }
    function hideTyping() {
      if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
      typingEl = null; status.textContent = "en línea";
    }
    // Sin botones: el paciente escribe todo, como en una conversación normal de WhatsApp
    function setChips() {}
    function closeSheet() {}

    // Avance en el tiempo (solo de la demo): una pastilla para ver el siguiente momento
    var nextBtn = null;
    function addNext(label, fn) {
      removeNext();
      nextBtn = el("button", "lgd-next", esc(label));
      nextBtn.type = "button";
      nextBtn.addEventListener("click", function () {
        if (S.busy) return;
        removeNext();
        fn();
      });
      body.appendChild(nextBtn); scrollChat();
    }
    function removeNext() { if (nextBtn && nextBtn.parentNode) nextBtn.parentNode.removeChild(nextBtn); nextBtn = null; }
    function nextToEnd() { if (nextBtn) { body.appendChild(nextBtn); scrollChat(); } }
    function setBusy(v) { S.busy = v; if (v) setChips([]); }

    // Cola de mensajes del agente: strings (burbujas), {sys}, {wait} o funciones (acciones del sistema)
    function say(msgs, after) {
      setBusy(true);
      var i = 0;
      (function next() {
        if (i >= msgs.length) {
          setBusy(false);
          if (after) after();
          if (S.pending) { var p = S.pending; S.pending = null; setChips([]); later(function () { handle(p); }, 350); }
          return;
        }
        var m = msgs[i++];
        if (typeof m === "function") { m(); later(next, 450); return; }
        if (m && m.sys) { later(function () { addSys(m.sys, m.time); later(next, 700); }, m.pause || 600); return; }
        showTyping();
        later(function () { hideTyping(); addMsg("in", m); later(next, 260); }, Math.min(1700, 600 + m.length * 8));
      })();
    }

    /* ---------- Lógica de la conversación ---------- */
    function treatList() {
      var known = TREAT_RX.map(function (x) { return x[0]; });
      var extra = treatments.filter(function (n) { return known.indexOf(n) < 0; }).map(function (n) { return [n, norm(n)]; });
      return extra.concat(TREAT_RX);
    }
    // Encuentra el tratamiento que pide; ignora los negados ("no una lipoescultura", "no quiero botox")
    function detectTreatment(t) {
      var list = treatList(), found = [];
      list.forEach(function (x, order) {
        var m = new RegExp(x[1]).exec(t);
        if (!m) return;
        var before = t.slice(Math.max(0, m.index - 16), m.index);
        var negated = /\bno\s+(\S+\s+)?$/.test(before);
        found.push({ name: x[0], idx: m.index, order: order, neg: negated });
      });
      var ok = found.filter(function (f) { return !f.neg; });
      if (!ok.length && !found.length) {
        // Sin coincidencia exacta: probar con errores de tipeo, palabra por palabra
        var words = t.split(/[^a-zñ]+/);
        for (var w = 0; w < words.length; w++) {
          var ft = fuzzyTreatment(words[w]);
          if (ft) {
            var pos = t.indexOf(words[w]);
            if (/\bno\s+(\S+\s+)?$/.test(t.slice(Math.max(0, pos - 16), pos))) continue;
            return ft;
          }
        }
      }
      if (!ok.length) return null;
      ok.sort(function (p, q) { return p.idx - q.idx || p.order - q.order; });
      return ok[0].name;
    }
    function offerSlots(list, intro) {
      list = list.slice(0, 2);
      S.offered = list;
      S.stage = "slots";
      say([(intro || "Tengo lugar") + " " + slotsText(list) + (list.length > 1 ? ". ¿Alguno le queda bien?" : ". ¿Le queda bien?")], function () {
        input.placeholder = "Escriba el horario que prefiera...";
      });
    }
    function matchSlot(t) {
      var o = S.offered, i, s;
      for (i = 0; i < o.length; i++) if (t.indexOf(norm(slotLabel(o[i]))) > -1) return o[i];
      for (i = 0; i < o.length; i++) if (t.indexOf(norm(DAYS[days[o[i].d].getDay()])) > -1) return o[i];
      for (i = 0; i < o.length; i++) {
        s = o[i];
        var h1 = s.t.split(":")[0].replace(/^0/, "");
        if (t.indexOf(s.t) > -1 || t.indexOf(s.t.replace(":", "")) > -1 || new RegExp("(^|\\s|a las\\s)" + h1 + "(\\s|$|:|h|am|pm)").test(t)) return s;
      }
      if (/\b(primer|primero|primera)\b/.test(t) && S.offered[0]) return S.offered[0];
      if (/\b(segundo|segunda|ultimo|ultima)\b/.test(t) && S.offered[1]) return S.offered[1];
      return null;
    }
    var STOP = "hola|buenas|buenos|buen|dia|dias|tardes|noches|soy|me|llamo|mi|nombre|es|quiero|quisiera|queria|busco|necesito|info|informacion|sobre|de|del|para|un|una|unos|el|la|los|las|y|o|con|cita|turno|consulta|valoracion|interesa|interesada|interesado|gustaria|saber|tratamiento|por|favor|gracias|ya|fui|vine|paciente|vez|otra|a|en|que|si|no|al|lo|le|hacer|hacerme|agendar|ok|dale|claro|bueno|vengo|tienen|tiene|hay|esta|este|semana|horario|horarios|disponible|lugar|como|cual|donde|cuando|hoy|manana|puedo|pueden|podria|precio|cuanto|cuesta|costo|aplicar|aplicarme|ponerme|hablar|persona|alguien|humano|asesor|recepcion|ayuda|ayudar|pregunta|duda|dudas|ver|informes|agenda|gusto|mucho|igual|tambien|bien|muy|pero|se|sabe|todavia|aun|nada|algo|eso|esto|tal|puede|seria|tengo|tenia|mas|menos|solo|ahora|luego|despues|antes|primero|entonces|pues|vale|perfecto|deseo|desearia|mismo|alguna|algun|ninguno|cualquier|todo|toda|todos|poco|aqui|ahi|alla|porfa|porfavor|oye|disculpe|perdon|sacar|reservar|apartar|programar|quien|nueva|nuevo|candidata|candidato|senora|senor|sra|sr|dra|dr|doctora|doctor|estoy|estaba|tu|su|sus|mis|yo|usted|ustedes|ella|ellos|les|nos|te|lunes|martes|miercoles|jueves|viernes|sabado|domingo|hora|horas|tarde|temprano|mes|meses|semanas|ano|cara|zona|cuerpo|resultado|resultados|fotos|foto|precios|promocion|costos|pago|pagos|tarjeta|efectivo|ubicacion|direccion|clinica|consultorio|probando|prueba|probar|demo|test|testeando|chat|bot|robot|ia|jaja|jajaja|hey|holi|saludos|disculpa|perdona|eres|sos|seria|serian|guadalajara|monterrey|cdmx|mexico|puebla|queretaro|tijuana|merida|cancun|leon|toluca|zapopan|morelia|chihuahua|hermosillo|saltillo|aguascalientes|veracruz|oaxaca|promociones|promocion|ofertas|oferta|descuentos|paquetes|paquete|informes|hija|hijo|mama|esposa|esposo|amiga|parte|quiere|quieren|queremos|podrian|informar|informan|hacen|hace|venir|pedir|preguntar|consultar|cotizar|cotizacion|mandar|enviar|dar|dan|ofrecen|manejan|atienden|trabajan|realizan|cuentan|necesita|gustaria|interesaria|interesado|interesados|buenas|tal|gracias|muchas";
    function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(); }
    // Saca nombre y apellido de un mensaje libre ("Soy Ana López, quiero botox")
    // Saca nombre y apellido de un mensaje libre:
    // "Me llamo paula gómez y quería una rinoplastia", "Soy Ana López, quiero botox", "paula gomez, rinoplastia"
    function extractName(raw, asked, patternOnly) {
      var stop = new RegExp("^(" + STOP + ")$");
      var tk = [];
      treatList().forEach(function (x) { tk.push(x[1]); });
      var tkw = new RegExp(tk.join("|"));
      function isNameWord(w) { var n = norm(w); return n.length > 1 && /[aeiou]/.test(n) && !/[bcdfghjklmnpqrstvwxyz]{4,}/.test(n) && !stop.test(n) && !tkw.test(n) && !fuzzyTreatment(n); }
      function fmt(list) {
        var u = list.filter(function (w, i) { return i === 0 || norm(w) !== norm(list[i - 1]); });
        return u.slice(0, 2).map(cap).join(" ").slice(0, 28);
      }
      var clean = String(raw).replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]/g, " ");

      // 1) Frases típicas: "me llamo X", "mi nombre es X", "soy X", "habla X"
      // Prueba cada frase en orden ("me llamo" gana a "soy": "soy candidata... me llamo Rosa")
      var pats = [/me llamo\s+(.+)/i, /mi nombre es\s+(.+)/i, /mi nombre\s+(.+)/i, /\bsoy\s+(.+)/i, /\b(?:habla|le escribe|les escribe)\s+(.+)/i];
      for (var p = 0; p < pats.length; p++) {
        var m = clean.match(pats[p]);
        if (!m) continue;
        var ws = m[1].split(/\s+/).filter(Boolean), out = [], i = 0;
        while (i < ws.length && /^(la|el|senora|senor|sra|sr|dra|dr|doctora|doctor)$/.test(norm(ws[i]))) i++;
        for (; i < ws.length && out.length < 2; i++) {
          if (!isNameWord(ws[i])) break;
          if (out.length && norm(out[out.length - 1]) === norm(ws[i])) continue;
          out.push(ws[i]);
        }
        if (out.length) return fmt(out);
      }
      if (patternOnly) return "";

      // 2) Nombre escrito con mayúscula en cualquier parte (sin contar lugares: "soy de Guadalajara")
      var words = clean.split(/\s+/).filter(Boolean);
      var idx = [];
      words.forEach(function (w, i) {
        var prev = i > 0 ? norm(words[i - 1]) : "";
        if (isNameWord(w) && !/^(de|del|desde|en)$/.test(prev)) idx.push(i);
      });
      var cand = idx.map(function (i) { return words[i]; });
      if (!cand.length) return "";
      var caps = cand.filter(function (w) { return /^[A-ZÁÉÍÓÚÑ]/.test(w); });
      if (caps.length >= 2 || (caps.length === 1 && asked)) return fmt(caps);

      // 3) En minúscula, si ya se lo pedimos y el mensaje es corto ("paula gomez, rinoplastia")
      if (asked && cand.length <= 3 && words.length <= 7) return fmt(cand);
      // 4) En minúscula en el primer mensaje: solo nombre + apellido juntos ("hola buenas paula rodriguez quiero lipo")
      var verbish = function (w) { return /(ar|er|ir|ando|iendo|amos|emos|an|en)$/.test(norm(w)); };
      if (!asked && cand.length === 2 && idx[1] === idx[0] + 1 && words.length <= 12 && !cand.some(verbish)) return fmt(cand);
      return "";
    }
    // Busca en la base por nombre (sin importar acentos) + el número de WhatsApp
    function findPatient(nm) {
      var w = norm(nm).split(" ");
      for (var i = 0; i < seedRows.length; i++) {
        var f = norm(seedRows[i].full).split(" ");
        if (w[0] === f[0] && (!w[1] || f[1].indexOf(w[1].replace(/\./g, "")) === 0)) return seedRows[i];
      }
      return null;
    }
    function setName(nm) {
      var known = findPatient(nm);
      if (known) {
        if (S.lead.row && S.lead.row.parentNode) S.lead.row.parentNode.removeChild(S.lead.row);
        var tSel = S.lead.t;
        S.lead = known; S.lead.name = known.full; S.known = true;
        S.lead.t = tSel;
        tbody.insertBefore(known.row, tbody.firstChild);
        updateLead({ s: "Conversando", c: "s-live" }, "<b>Paciente existente</b>: encontrado por nombre y número. Se abre su ficha.", "Ficha encontrada");
        return "¡Qué gusto saludarle de nuevo, " + esc(first()) + "! Ya tengo su registro.";
      }
      S.lead.name = nm;
      updateLead({ n: nm }, "<b>Paciente nuevo</b>: no hay registro con ese nombre y número. Ficha creada.", "Ficha creada");
      return "Gracias, " + esc(first()) + ". Veo que es su primera vez con nosotros, le damos la bienvenida.";
    }
    // Pide lo que falte (nombre, tratamiento) y, con todo, ofrece horarios
    function proceed(msgs) {
      msgs = msgs || [];
      var L = S.lead;
      if (!L.name) {
        var askedBefore = S.askedName;
        S.askedName = true;
        if (S.missName) msgs.push("¿Me comparte su nombre y apellido? Por ejemplo: Ana López.");
        else if (L.t !== "Por definir") {
          msgs.push(S.ackTr ? "¿Me comparte su nombre y apellido?" : "Con gusto le ayudo con " + esc(lc(L.t)) + ". ¿Me comparte su nombre y apellido?");
          S.ackTr = true;
        } else msgs.push(askedBefore
          ? "¿Me comparte su nombre y apellido, y el tratamiento que le interesa?"
          : "Para ayudarle, ¿me comparte su nombre y apellido, y el tratamiento que le interesa?");
        say(msgs, function () { S.stage = "intake"; setChips([]); input.placeholder = "Escriba su nombre..."; });
        return;
      }
      if (L.t === "Por definir") {
        msgs.push(S.missTr
          ? "Por ahora puedo ayudarle con " + treatments.map(lc).join(", ") + ". Elija uno de la lista o escríbalo."
          : (S.known ? "¿Qué tratamiento le interesa esta vez?" : "¿Qué tratamiento le interesa?"));
        say(msgs, function () { S.stage = "intake"; setChips(treatments, "Ver tratamientos"); input.placeholder = "Escriba como paciente..."; });
        return;
      }
      msgs.push(S.known
        ? "Con gusto le agendo su cita de " + esc(lc(L.t)) + "."
        : (S.ackTr ? "" : "Con gusto le ayudo con " + esc(lc(L.t)) + ". ") + "El primer paso es una valoración con " + esc(doctor) + ", donde revisa su caso y le explica las opciones.");
      say(msgs, function () { offerSlots(SLOTS_A, "Tengo lugar"); });
    }
    function indications(tr) {
      if (tr === "Botox" || tr === "Rellenos") return "• Llegue sin maquillaje en la zona.<br>• Evite alcohol 24 horas antes.<br>• Llegue 10 minutos antes de su hora.";
      return "• Llegue 10 minutos antes de su hora.<br>• Traiga una identificación.<br>• Si toma algún medicamento, tráigalo anotado.";
    }
    function stageQuestion() {
      if (S.stage === "slots") return "¿Le queda bien " + slotsText(S.offered) + "?";
      if (S.stage === "reminder") return "¿Me confirma su asistencia?";
      if (S.stage === "post") return "¿Cómo se sintió con su consulta?";
      return "";
    }
    function stageChips() {
      if (S.stage === "intake") setChips(S.lead && S.lead.name && S.lead.t === "Por definir" ? treatments : [], "Ver tratamientos");
      else if (S.stage === "slots") setChips(S.offered.map(slotBtn).concat(["Otro horario"]), "Ver horarios");
      else if (S.stage === "reminder") setChips(["Confirmo", "Necesito reprogramar"]);
      else if (S.stage === "post") setChips(["Muy bien, gracias", "Tengo una duda"]);
      else setChips([]);
    }
    function setTreatment(tr, label) { S.lead.t = tr; updateLead({ t: tr }, "Tratamiento de interés detectado: <b>" + esc(tr) + "</b>.", label); }

    function book(noteText) {
      var s = S.chosen, tr = S.lead.t === "Por definir" ? "Valoración" : S.lead.t;
      S.event = { d: s.d, t: s.t, l: first() + " · " + tr, isNew: true, flash: true };
      events.push(S.event);
      renderCal(); pulse(calPanel, "Cita nueva");
      updateLead({ n: S.lead.name, s: "Agendado", c: "s-ok" }, (noteText ? noteText + " " : "") + "Recordatorio programado para 24 horas antes.");
    }
    var FREE_TIMES = ["10:00", "12:30", "15:00", "16:00", "18:00"];
    function isBusy(d, t) { return events.some(function (e) { return e !== S.event && e.d === d && e.t === t; }); }
    // Lee el día y la hora que pide el paciente ("el martes a las 15:00") y devuelve un hueco libre
    function parseTime(t) {
      var m = t.match(/(\d{1,2})[:.](\d{2})/) || t.match(/\blas (\d{1,2})/) || t.match(/\b(\d{1,2})\s*(hs|h|pm|am)\b/);
      if (!m) return null;
      var h = parseInt(m[1], 10), mm = m[2] && /^\d{2}$/.test(m[2]) ? m[2] : "00";
      if (/y media/.test(t) && mm === "00") mm = "30";
      if (h < 8 && !/am/.test(t)) h += 12;
      return h >= 8 && h <= 20 ? ("0" + h).slice(-2) + ":" + mm : null;
    }
    function parseRequest(t) {
      var d = null, tm = parseTime(t), i;
      for (i = 0; i < days.length; i++) if (t.indexOf(norm(DAYS[days[i].getDay()])) > -1) { d = i; break; }
      if (d === null) return { slot: SLOTS_B[0], none: true };
      if (tm && !isBusy(d, tm)) return { slot: { d: d, t: tm } };
      if (!tm) for (i = 0; i < FREE_TIMES.length; i++) if (!isBusy(d, FREE_TIMES[i])) return { slot: { d: d, t: FREE_TIMES[i] }, notime: true };
      for (i = 0; i < FREE_TIMES.length; i++) if (!isBusy(d, FREE_TIMES[i])) return { slot: { d: d, t: FREE_TIMES[i] }, busy: !!tm, wanted: tm };
      return { slot: SLOTS_B[0] };
    }

    function freeOnDay(d, n) {
      var out = [], order = ["10:00", "12:30", "16:00", "18:00", "15:00"];
      for (var k = 0; k < order.length && out.length < n; k++) {
        var t = order[k];
        if (isBusy(d, t)) continue;
        if (S.resched && S.event && (d < S.event.d || (d === S.event.d && t <= S.event.t))) continue;
        out.push({ d: d, t: t });
      }
      return out.sort(function (a, b) { return a.t < b.t ? -1 : 1; });
    }
    function laterSlots(n, exclude) {
      var ev = S.event, out = [], order = ["12:30", "16:00", "10:00", "18:00", "15:00"];
      for (var d = ev.d; d < days.length && out.length < n; d++) {
        for (var k = 0; k < order.length; k++) {
          var t = order[k];
          if (d === ev.d && t <= ev.t) continue;
          if (isBusy(d, t)) continue;
          if (exclude && exclude.some(function (x) { return x.d === d && x.t === t; })) continue;
          out.push({ d: d, t: t }); break;
        }
      }
      return out;
    }
    function handToReception(why) {
      updateLead({ s: "Derivado a recepción", c: "s-human" }, "<b>Aviso a recepción</b>: " + why + ".");
      say(["Le paso con recepción para buscarle un horario que le quede bien. En breve le escriben por aquí."]);
    }
    function moveTo(ns, lead) {
      events.splice(events.indexOf(S.event), 1);
      S.chosen = ns;
      S.event = { d: ns.d, t: ns.t, l: first() + " · " + (S.lead.t === "Por definir" ? "Valoración" : S.lead.t), isNew: true, flash: true };
      events.push(S.event); renderCal(); pulse(calPanel, "Cita movida");
      updateLead({ s: "Reprogramado", c: "s-ok" }, "Cita <b>reprogramada</b>: el espacio libre vuelve a la agenda.");
      say([
        (lead || "Listo. ") + "Le muevo la cita al <b>" + slotPhrase(ns) + "</b>. Así su lugar queda guardado y el espacio no se pierde.",
        "Unas indicaciones para su cita:<br>" + indications(S.lead.t)
      ], waitPost);
    }
    function reminderStep() {
      say([
        { sys: "24 horas antes de la consulta", time: true, pause: 300 },
        function () { note.innerHTML = "<b>Recordatorio enviado</b> automáticamente."; flashNote(); pulse(crmPanel, "Recordatorio enviado"); },
        "Hola " + esc(first()) + ", le recuerdo su cita de mañana, " + slotPhrase(S.chosen) + ", en " + esc(clinicRef) + ". ¿Me confirma su asistencia?"
      ], function () { S.stage = "reminder"; });
    }
    function waitPost() { S.stage = "waitPost"; addNext("⏩ Ver qué pasa después de la consulta", goPost); }
    function goPost() {
      var tr = S.lead.t === "Por definir" ? "valoración" : S.lead.t;
      say([
        { sys: "Después de la consulta", time: true, pause: 300 },
        function () {
          if (S.event) { S.event.done = true; S.event.isNew = false; S.event.flash = true; renderCal(); pulse(calPanel, "Asistió"); }
          updateLead({ s: "Asistió", c: "s-ok" }, "Paciente <b>asistió</b> a su cita. Seguimiento posconsulta en marcha.");
        },
        "Hola " + esc(first()) + ", ¿cómo se sintió con su consulta de " + esc(lc(tr)) + "?"
      ], function () { S.stage = "post"; stageChips(); input.placeholder = "Responda como paciente..."; });
    }

    function handle(raw) {
      var t = norm(raw);
      if (S.stage === "done") {
        say(["Esta demo ya terminó. Toque «Reiniciar», arriba del chat, para probar otro camino."]);
        return;
      }
      ensureLead();
      var tr = detectTreatment(t);
      if (tr && S.lead.t === "Por definir") setTreatment(tr);
      var pre = S.stage === "start" || S.stage === "intake";
      var greet = S.stage === "start" ? ["¡Hola! Gracias por comunicarse con " + esc(clinicRef) + "."] : [];
      if (pre && !S.lead.name) {
        // Si el mensaje es una pregunta (precio, persona, diagnóstico), solo se toma el nombre si lo dice explícito ("me llamo...")
        var intent = RX_BOT.test(t) || RX_HUMAN.test(t) || RX_PRICE.test(t) || RX_DIAG.test(t);
        var nm0 = extractName(raw, S.askedName, intent);
        if (nm0) greet.push(setName(nm0));
      }

      // El paciente corrige su nombre ("perdón, me llamo Lucía")
      if (S.lead.name && /(me llamo|mi nombre es|mi nombre)/.test(t) && S.stage !== "done") {
        var nm1 = extractName(raw, true);
        if (nm1 && norm(nm1) !== norm(S.lead.name)) {
          var wasKnown = S.known;
          S.lead.name = "";
          var hi = setName(nm1);
          if (S.event) updateLead({ s: "Agendado", c: "s-ok", t: S.lead.t }, null, "Ficha actualizada");
          if (S.event) { S.event.l = first() + " · " + (S.lead.t === "Por definir" ? "Valoración" : S.lead.t); S.event.flash = true; renderCal(); pulse(calPanel, "Cita actualizada"); }
          if (!S.known || wasKnown) hi = "Perdón, lo corrijo: " + esc(S.lead.name) + ".";
          if (pre) { proceed([hi]); return; }
          if (S.stage === "wait24" || S.stage === "waitPost" || S.stage === "waitRecur") { say([hi], nextToEnd); return; }
          say([hi + (stageQuestion() ? " " + stageQuestion() : "")]);
          return;
        }
      }

      // El paciente cambia o corrige el tratamiento ("pero quiero una liposucción, no una lipoescultura")
      if (tr && S.lead.t !== "Por definir" && tr !== S.lead.t && S.stage !== "post" && S.stage !== "done") {
        setTreatment(tr, "Tratamiento actualizado");
        if (S.event) { S.event.l = first() + " · " + tr; S.event.flash = true; renderCal(); pulse(calPanel, "Cita actualizada"); }
        var fix = "Entendido, lo corrijo: " + (S.event ? "su cita queda para " : "anoto ") + esc(lc(tr)) + ".";
        if (pre) { proceed(greet.concat([fix])); return; }
        if (S.stage === "slots" && !matchSlot(t)) {
          say([fix + " Para su valoración tengo lugar " + slotsText(S.offered) + ". ¿Alguno le queda bien?"]);
          return;
        }
        if (S.stage === "reminder") { say([fix + " Le recuerdo que su cita es mañana, " + slotPhrase(S.chosen) + ". ¿Me confirma su asistencia?"]); return; }
        if (S.stage === "wait24" || S.stage === "waitPost" || S.stage === "waitRecur") { say([fix], nextToEnd); return; }
      }

      if (RX_BOT.test(t)) {
        var bm = greet.concat(["Soy el asistente de la clínica y le ayudo a agendar. Si prefiere hablar con una persona del equipo, se lo paso en cualquier momento."]);
        if (pre) proceed(bm); else say([bm.join(" ") + (stageQuestion() ? " " + stageQuestion() : "")]);
        return;
      }

      if (RX_HUMAN.test(t)) {
        updateLead({ s: "Derivado a recepción", c: "s-human" }, "<b>Aviso a recepción</b> con toda la conversación a la vista.");
        var hm = greet.concat(["Claro que sí. Ya le aviso a recepción y en un momento le escribe una persona del equipo, con toda esta conversación a la vista."]);
        if (pre) proceed(hm); else say(hm, stageChips);
        return;
      }
      if (RX_DIAG.test(t) && S.stage !== "post" && S.stage !== "slots") {
        var dm = greet.concat([
          "Esa pregunta necesita que " + esc(doctor) + " revise su caso en persona. Por aquí no puedo darle un diagnóstico ni una opinión médica.",
          "Lo que sí puedo hacer es agendarle una valoración, para que revisen su caso con calma."
        ]);
        if (pre) proceed(dm); else say(dm, stageChips);
        return;
      }
      if (RX_PRICE.test(t) && S.stage !== "post") {
        var what = S.lead.t !== "Por definir" ? "de " + esc(lc(S.lead.t)) : "de cada tratamiento";
        if (!pre) { say(["El costo " + what + " lo define " + esc(doctor) + " en la consulta, según su caso. Ahí se lo dan exacto y sin compromiso." + (S.stage === "slots" ? " ¿Le aparto " + slotsText(S.offered) + "?" : "")]); return; }
        var extra = FAQ.filter(function (x) { return x[0].test(t); }).map(function (x) { return x[1]; });
        proceed(greet.concat(["El costo " + what + " depende de lo que " + esc(doctor) + " indique en la valoración, porque cada caso es distinto. Ahí se lo dan exacto y sin compromiso."]).concat(extra));
        return;
      }

      for (var f = 0; f < FAQ.length; f++) {
        if (FAQ[f][0].test(t) && S.stage !== "done") {
          if (pre) { proceed(greet.concat([FAQ[f][1]])); return; }
          var q = stageQuestion();
          if (S.stage === "wait24" || S.stage === "waitPost" || S.stage === "waitRecur") { say([FAQ[f][1]], nextToEnd); return; }
          say([FAQ[f][1] + (q ? " " + q : "")]);
          return;
        }
      }

      switch (S.stage) {
        case "start":
        case "intake":
          if (S.stage === "intake") {
            var wantsBooking = /(agend|cita|turno|reserv|consulta|informacion|\binfo\b|valoracion|quisiera|quiero)/.test(t);
            if (!S.lead.name && greet.length === 0 && !tr && !wantsBooking) S.missName = true;
            if (!S.lead.name && greet.length === 0 && !tr && wantsBooking) { proceed(["Con gusto le ayudo a agendar."]); break; }
            if (S.lead.name && S.lead.t === "Por definir" && !tr && greet.length === 0) S.missTr = true;
          }
          proceed(greet);
          break;

        case "slots":
          // Pregunta por un día ("¿tienen algo el lunes?"): ofrece horarios de ese día en vez de agendar directo
          var isQ = /\?|tienen|hay (lugar|algo|espacio)|puede ser|habra/.test(t) && !/\d/.test(t);
          var qDay = -1;
          for (var di = 0; di < days.length; di++) if (t.indexOf(norm(DAYS[days[di].getDay()])) > -1) { qDay = di; break; }
          if (isQ && qDay > -1) {
            var same = S.offered.filter(function (x) { return x.d === qDay; });
            var qOpts = same.concat(freeOnDay(qDay, 2).filter(function (x) { return !same.some(function (y) { return y.t === x.t; }); })).slice(0, 2);
            if (S.resched && S.event) qOpts = qOpts.filter(function (x) { return x.d > S.event.d || (x.d === S.event.d && x.t > S.event.t); });
            if (qOpts.length) { offerSlots(qOpts, "Sí, tengo lugar"); break; }
          }
          var s = matchSlot(t);
          // Un "sí" cuando se ofreció un solo horario
          if (!s && S.offered.length === 1 && !/\bno\b/.test(t) && /\b(si|dale|va|perfecto|ok|claro|me queda|esta bien|me sirve|de acuerdo|listo)\b/.test(t)) s = S.offered[0];
          // Solo una hora ("el de las 4") cuando las opciones son del mismo día: ese día a esa hora, si está libre
          if (!s && qDay < 0 && S.offered.length && S.offered.every(function (x) { return x.d === S.offered[0].d; })) {
            var tOnly = parseTime(t);
            if (tOnly && !isBusy(S.offered[0].d, tOnly)) s = { d: S.offered[0].d, t: tOnly };
          }
          if (!s && /(lunes|martes|miercoles|jueves|viernes|sabado)/.test(t)) {
            var rq = parseRequest(t);
            if (rq.notime) {
              var dayOpts = freeOnDay(rq.slot.d, 2);
              if (dayOpts.length) { offerSlots(dayOpts, "Sí, tengo lugar"); break; }
            } else if (rq.slot !== SLOTS_B[0]) s = rq.slot;
          }
          if (s && S.resched && (s.d < S.event.d || (s.d === S.event.d && s.t <= S.event.t))) s = null;
          if (!s && /(otro|ningun|no puedo|no me queda|mas tarde|otra|no me sirve)/.test(t)) {
            if (S.resched) {
              var more = laterSlots(2, S.offered);
              if (more.length && !S.moreShown) { S.moreShown = true; offerSlots(more, "Sin problema. También tengo"); }
              else { S.resched = false; S.stage = "reminder"; handToReception("el paciente necesita otro horario"); }
              break;
            }
            if (S.offered !== SLOTS_B) { offerSlots(SLOTS_B, "Sin problema. También tengo"); break; }
            if (S.handed) { say(["Ya le avisé a recepción y en breve le escriben para coordinar otro horario."], stageChips); break; }
            S.handed = true;
            updateLead({ s: "Derivado a recepción", c: "s-human" }, "<b>Aviso a recepción</b>: el paciente necesita otro horario.");
            say(["Entiendo. Le paso con recepción para buscarle un horario que le quede bien. Si mientras tanto le sirve " + slotsText(S.offered) + ", me avisa."]);
            break;
          }
          if (!s) {
            var dayAsked = /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/.test(t);
            var timeAsked = /\d|manana|tarde|noche|temprano/.test(t);
            if (tr && tr === S.lead.t && !dayAsked && !timeAsked) {
              say(["Así es, su valoración es para " + esc(lc(tr)) + ". Tengo lugar " + slotsText(S.offered) + ". ¿Alguno le queda bien?"]);
            } else if (dayAsked || timeAsked) {
              say([(dayAsked ? "Ese día ya no tengo lugar." : "Ese horario no lo tengo disponible.") + " Le puedo ofrecer " + slotsText(S.offered) + ". ¿Alguno le queda bien?"]);
            } else {
              say(["Para agendar su valoración tengo lugar " + slotsText(S.offered) + ". ¿Cuál le queda mejor?"]);
            }
            break;
          }
          if (S.resched) { S.resched = false; S.stage = "reminder"; moveTo(s); break; }
          S.chosen = s;
          book(S.known ? "<b>Cita agendada</b> en su ficha." : "<b>Cita agendada</b>.");
          var kind = S.known ? "cita" : "valoración";
          var trn = S.lead.t === "Por definir" ? kind : kind + " de " + esc(lc(S.lead.t));
          S.stage = "wait24";
          say([
            "Excelente, " + esc(first()) + ". Su " + trn + " quedó agendada:<br><br>📅 <b>" + slotBtn(S.chosen) + "</b><br>📍 " + esc(clinic),
            "Un día antes le escribo para confirmar y con las indicaciones. Si le surge algo, puede reprogramar desde aquí mismo."
          ], function () { addNext("⏩ Ver qué pasa 24 horas antes de la consulta", reminderStep); input.placeholder = "Responda como paciente..."; });
          break;

        case "wait24":
        case "waitPost":
        case "waitRecur":
          say(["Con gusto. Cualquier cosa, me escribe por aquí."], nextToEnd);
          break;

        case "reminder":
          if (/(reprog|cambi|no puedo|no podre|no podr|no voy|no llego|no alcanzo|mover|otro dia|otra fecha|otro horario|mejor el|puede ser el|imprevisto|surgio)/.test(t)) {
            var req = parseRequest(t), ev = S.event;
            var okDay = !req.none && (req.slot.d > ev.d || (req.slot.d === ev.d && req.slot.t !== ev.t));
            if (okDay && !req.busy && !req.notime) { moveTo(req.slot, "Sin problema, para eso estoy. "); break; }
            var opts, lead;
            if (okDay) {
              S.resched = true;
              opts = freeOnDay(req.slot.d, 2);
              if (!opts.length) opts = laterSlots(2);
              lead = req.busy ? "A las " + req.wanted + " ya está ocupado. Le puedo ofrecer" : "Sin problema. Le puedo ofrecer";
            } else {
              opts = laterSlots(2);
              lead = req.none ? "Sin problema, para eso estoy. Le puedo ofrecer" : "Para ese día ya no tengo lugar. Le puedo ofrecer";
            }
            if (!opts.length) { handToReception("el paciente necesita reprogramar"); break; }
            S.resched = true;
            offerSlots(opts, lead);
          } else if (!/(confirm|\bsi\b|\bok\b|dale|perfecto|ahi estare|alli estare|claro|listo|de acuerdo|asistire|\bvoy\b|nos vemos|gracias|genial|excelente)/.test(t)) {
            say(["Su cita es el " + slotPhrase(S.chosen) + ", en " + esc(clinicRef) + ". ¿Me confirma si puede asistir?"]);
          } else {
            updateLead({ s: "Confirmado", c: "s-ok" }, "Paciente <b>confirmó</b> su asistencia.");
            say(["¡Perfecto, le esperamos! Unas indicaciones para mañana:<br>" + indications(S.lead.t)], waitPost);
          }
          break;

        case "post":
          var bad = /(duda|mal|no me|dolor|duele|problema|molest|preocup|no muy|no tan|regular|mas o menos|maso|no quede|no estoy|feo|inflam|hinchad)/.test(t);
          var good = !bad && /(bien|excelente|feliz|encant|genial|super|perfect|gracias|content|bueno|increible)/.test(t);
          var trp = S.lead.t === "Por definir" ? "su tratamiento" : lc(S.lead.t);
          if (!good && !bad && !S.reasked) {
            S.reasked = true;
            say(["Me alegra saber de usted. ¿Cómo se sintió con el resultado?"], stageChips);
            break;
          }
          if (good) {
            var rec = RECUR[S.lead.t] || ["6 meses", "control"];
            say([
              "¡Qué alegría leer eso!",
              "¿Nos ayudaría contando su experiencia en Google? A otras personas que buscan " + esc(trp) + " les sirve mucho. Aquí el link directo:<br><a href=\"#\" onclick=\"return false\">g.page/r/" + slug + "/review</a>",
              function () { updateLead({ s: "Reseña solicitada", c: "s-star" }, "<b>Link de reseña</b> enviado, específico de " + esc(trp) + "."); }
            ], function () {
              S.stage = "waitRecur";
              addNext("⏩ Ver qué pasa cuando se acerca el " + rec[1], function () {
                say([
                  { sys: "Cuando se acerca el " + rec[1], time: true, pause: 300 },
                  "Hola " + esc(first()) + ", ¿cómo ha estado? Le escribo porque ya se acerca el tiempo en que se suele hacer el " + rec[1] + " de " + esc(trp) + ". Si le interesa, con gusto le busco un horario, sin compromiso.",
                  function () { updateLead({ s: "Recurrencia activa", c: "s-live" }, "<b>Recurrencia:</b> el sistema le recordó el " + rec[1] + " al paciente."); },
                  { sys: "Fin de la demo. Así con cada paciente que escribe, todos los días.", pause: 700 }
                ], function () { S.stage = "done"; input.placeholder = "Demo terminada"; });
              });
            });
          } else {
            say([
              "Gracias por contarme, " + esc(first()) + ". Le paso ahora mismo con el equipo de " + esc(doctor) + " para que le atiendan personalmente.",
              function () { updateLead({ s: "Seguimiento del equipo", c: "s-human" }, "<b>Alerta al equipo</b>: el paciente tiene una duda. No se pide reseña."); },
              { sys: "Fin de la demo. Cuando algo no va bien, el sistema avisa a su equipo antes de que se convierta en una mala reseña.", pause: 900 }
            ], function () { S.stage = "done"; stageChips(); input.placeholder = "Demo terminada"; });
          }
          break;
      }
    }

    function userSays(text) {
      text = String(text || "").trim();
      if (!text) return;
      if (text === "Reiniciar demo") { reset(); return; }
      addMsg("out", esc(text));
      input.value = "";
      // Si el agente todavía está escribiendo, el mensaje se procesa apenas termine
      if (S.busy) { S.pending = S.pending ? S.pending + " " + text : text; return; }
      setChips([]);
      later(function () { handle(text); }, 350);
    }

    function reset() {
      clearTimers(); hideTyping();
      days = nextBusinessDays(5);
      events = BUSY.map(function (b, i) { return { d: b.d, t: b.t, l: (b.l === "Control" || b.l === "Valoración") ? b.l : treatments[i % treatments.length], isNew: false }; });
      S = { stage: "start", lead: null, offered: [], busy: false, chosen: null, event: null, pending: null, known: false, askedName: false, missName: false, missTr: false, ackTr: false, handed: false, reasked: false, resched: false, moreShown: false };
      body.innerHTML = ""; nextBtn = null;
      note.innerHTML = "Esperando el primer mensaje...";
      renderCal(); renderCRM();
      send.disabled = false;
      input.placeholder = "Escriba como si fuera un paciente...";
      addSys("Usted es un paciente y este es el WhatsApp " + (/^el /.test(clinicRef) ? "del " + esc(clinicRef.slice(3)) : "de " + esc(clinicRef)) + ". Escriba como lo haría por WhatsApp, por ejemplo: «Hola, quiero información de " + esc(lc(treatments[0])) + "».");
      addSys("Para ver cómo reconoce a alguien que ya es paciente, use el nombre Paola Gómez.");
      closeSheet();
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); userSays(input.value); });
    resetBtn.addEventListener("click", reset);
    reset();
  }

  function mountAll() {
    var els = document.querySelectorAll("[data-lg-demo]");
    for (var i = 0; i < els.length; i++) {
      try { mount(els[i]); } catch (e) { if (window.console) console.warn("[demo] no se pudo montar:", e); }
    }
  }

  window.LGDemo = { mount: mount, mountAll: mountAll };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
  else mountAll();
})();
