/* IradLoto: page chrome, language and the live parts of each page. */
(function () {
  "use strict";
  var L = window.Loto, I = window.I18N || {};
  var LANGS = ["en", "ir", "ru"];
  var lang = "en";
  try { lang = localStorage.getItem("loto-lang") || "en"; } catch (e) {}
  var qs = location.search.match(/[?&]lang=(en|ir|ru)/);
  if (qs) lang = qs[1];
  if (LANGS.indexOf(lang) < 0) lang = "en";
  var li = LANGS.indexOf(lang);

  function T(k) { var v = I[k]; if (!v) return k; return v[li] || v[0] || k; }
  function F(k, o) { return T(k).replace(/\{(\w+)\}/g, function (_, n) { return o[n] != null ? o[n] : ""; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function num(n) {
    var s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : " ");
    return s;
  }
  function som(n) { return num(n) + " " + T("som"); }
  var MON = { en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
  function date(day, withDay) {
    var d = new Date(day * L.DAY), wd = T("wd").split(",")[d.getUTCDay()];
    var s = lang === "en" ? d.getUTCDate() + " " + MON.en[d.getUTCMonth()] + " " + d.getUTCFullYear()
      : ("0" + d.getUTCDate()).slice(-2) + "." + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "." + d.getUTCFullYear();
    return withDay ? wd + " " + s : s;
  }
  function pl(p) { return I["pl." + p] ? T("pl." + p) : p; }
  function shopText(w) { return F("shop." + w.shop.t, { place: esc(pl(w.place)), b: esc(pl(w.shop.b)) }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function gname(gid) { return L.GAMES[gid].name; }
  function ballsHTML(arr, colour, size, hits) {
    return '<div class="balls">' + arr.map(function (n) {
      var c = "ball" + (colour && colour !== "gold" ? " " + colour : "") + (size ? " " + size : "") + (hits && hits.indexOf(n) < 0 ? " miss" : "");
      return '<span class="' + c + '">' + n + "</span>";
    }).join("") + "</div>";
  }
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  /* ---------- chrome ---------- */
  var NAV = [["index.html", "nav.home", "Home"], ["games.html", "nav.games", "Games"], ["chabysh.html", "nav.race", "Horse race"], ["results.html", "nav.results", "Results"],
    ["check.html", "nav.check", "Check a ticket"], ["winners.html", "nav.winners", "Winners"], ["buy.html", "nav.buy", "Where to buy"], ["about.html", "nav.about", "About us"]];
  function chrome() {
    var page = (location.pathname.split("/").pop() || "index.html");
    var head = document.getElementById("top");
    if (head) {
      head.innerHTML =
        '<div class="strip"><div class="wrap"><span>' + T("strip") + '</span><span class="lang">' +
        LANGS.map(function (l) { return '<a href="#" data-lang="' + l + '" class="' + (l === lang ? "on" : "") + '">' + l.toUpperCase() + "</a>"; }).join("") +
        '</span></div></div><header class="top"><div class="wrap"><a class="logo" href="index.html"><img src="assets/logo.svg" alt="IradLoto" width="137" height="46"></a>' +
        '<button class="burger" aria-label="Menu">&#9776;</button><nav class="main">' +
        NAV.map(function (n) { return '<a href="' + n[0] + '"' + (n[0] === page ? ' class="on"' : "") + ">" + T(n[1]) + "</a>"; }).join("") +
        "</nav></div></header>";
      $(".burger", head).onclick = function () { $("nav.main", head).classList.toggle("open"); };
      $$("[data-lang]", head).forEach(function (a) {
        a.onclick = function (e) {
          e.preventDefault();
          try { localStorage.setItem("loto-lang", a.getAttribute("data-lang")); } catch (x) {}
          location.href = location.pathname + location.hash;
        };
      });
    }
    var foot = document.getElementById("foot");
    if (foot) {
      foot.innerHTML = '<footer class="foot"><div class="wrap cols"><div><p><span class="age">18+</span>' + T("foot.play") + "</p><p>" + T("foot.legal") +
        "</p><p class=\"small\">&copy; 2012&ndash;" + new Date().getFullYear() + " " + T("foot.copy") + "</p></div><div><b>" + T("foot.contact") +
        "</b><br>" + T("foot.addr") + '<br>+996-39-2-25-55-55<br><a href="mailto:info@loto.iradgov.org">info@loto.iradgov.org</a><br><a href="mailto:prizes@loto.iradgov.org">prizes@loto.iradgov.org</a></div><div><b>' +
        T("foot.links") + '</b><br><a href="https://iradgov.org/">iradgov.org</a><br><a href="https://stats.iradgov.org/">' + T("foot.stats") +
        '</a><br><a href="https://iradone.com/">IradOne</a><br><a href="https://post.iradgov.org/">Irad Pochtasy</a><br><a href="https://e-irad.org/forms.html">' + T("foot.forms") + '</a><br><a href="https://tender.e-irad.org/">' + T("foot.tender") + '</a></div></div></footer>';
    }
    document.documentElement.lang = lang === "ir" ? "ky-Latn" : lang;
    if (lang !== "en") $$("[data-t]").forEach(function (el) {
      var v = I[el.getAttribute("data-t")];
      if (v && v[li]) el.innerHTML = v[li];
    });
    var t = document.querySelector("title");
    if (t && t.getAttribute("data-t") && I[t.getAttribute("data-t")] && I[t.getAttribute("data-t")][li]) document.title = I[t.getAttribute("data-t")][li];
  }

  /* ---------- shared bits ---------- */
  function countdown(el, at) {
    function tick() {
      var s = Math.max(0, Math.floor((at - Date.now()) / 1000));
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
      el.innerHTML = [[d, T("cd.d")], [h, T("cd.h")], [m, T("cd.m")], [x, T("cd.s")]].map(function (p) {
        return "<div><b>" + ("0" + p[0]).slice(-2) + "</b><span>" + p[1] + "</span></div>";
      }).join("");
    }
    tick(); setInterval(tick, 1000);
  }
  function timeOf(g) { return ("0" + g.time[0]).slice(-2) + ":" + ("0" + g.time[1]).slice(-2); }
  function topLabel(gid) { return L.GAMES[gid].fixed ? T("top.prize") : T("jackpot"); }
  function last(gid) { var h = L.history(gid); return h[h.length - 1]; }
  function drawLink(d) { return "results.html#" + d.game + "-" + d.no; }

  /* ---------- home ---------- */
  function home() {
    var nd = L.nextDraw("ab"), g = L.GAMES.ab;
    $("#hero-jp").innerHTML = num(nd.jackpot) + " <small>" + T("som") + "</small>";
    $("#hero-when").innerHTML = F("hero.when", { no: nd.no, date: date(nd.day, true), time: timeOf(g) });
    if (nd.mbw) $("#hero-badge").innerHTML = '<span class="badge">' + T("mbw") + "</span> " + T("mbw.note");
    else $("#hero-badge").innerHTML = '<span class="badge gold">' + T("rolling") + "</span>";
    countdown($("#hero-count"), nd.closes);
    var l = last("ab");
    $("#hero-last").innerHTML = "<h3>" + F("last.draw", { game: "Altın Bayge", no: l.no }) + '</h3><p class="small">' + date(l.day, true) + "</p>" +
      ballsHTML(l.balls, "gold", "") + '<p class="small">' + resultLine(l) + '</p><a class="btn" href="' + drawLink(l) + '">' + T("all.prizes") + "</a>";
    var wins = kept().map(keptStatus).filter(function (k) { return k && k.won && !k.expired; }).length;
    if (wins) $("#hero-last").insertAdjacentHTML("beforeend", '<p class="my-note">' + F("my.win.n", { n: wins }) + "</p>");

    $("#games").innerHTML = L.ORDER.map(function (gid) {
      var g = L.GAMES[gid], n = L.nextDraw(gid), d = last(gid);
      return '<a class="card game tilt ' + g.colour + '" href="games.html#' + gid + '"><img class="tile-img" src="assets/img/' + gid + '.jpg" alt="" loading="lazy" onerror="this.remove()"><h3>' + g.name + ' <span class="muted small">' + g.pick + "/" + g.of + "</span></h3>" +
        '<div class="muted small">' + topLabel(gid) + '</div><div class="big">' + som(n.jackpot) + "</div>" +
        (n.mbw ? '<span class="badge">' + T("mbw") + "</span>" : "") +
        '<p class="small">' + F("next.draw", { no: n.no, date: date(n.day, true), time: timeOf(g) }) + "<br>" + F("line.price", { p: som(g.price) }) + "</p>" +
        '<div class="muted small">' + F("last.draw.short", { no: d.no, date: date(d.day) }) + "</div>" + ballsHTML(d.balls, g.colour, "sm") +
        '<span class="tile-go">' + T("how.play") + " &rsaquo;</span></a>";
    }).join("") + (function () {
      var n = L.nextRace(), d = L.raceHistory().slice(-1)[0];
      return '<a class="card game tilt green" href="chabysh.html"><img class="tile-img" src="assets/img/ch.jpg" alt="" loading="lazy" onerror="this.remove()"><h3>Chabysh <span class="muted small">' + T("ch.tag") + "</span></h3>" +
        '<div class="muted small">' + T("top.prize") + '</div><div class="big">' + som(L.RACE.prizes.tricast) + "</div>" +
        '<p class="small">' + F("ch.next", { no: n.no, date: date(n.day, true), time: "19:30" }) + "<br>" + F("line.price", { p: som(L.RACE.price) }) + "</p>" +
        '<div class="muted small">' + F("ch.last", { no: d.no, a: d.order[0] + " " + esc(hname(d.order[0])) }) + "</div>" +
        '<span class="tile-go">' + T("ch.watch") + " &rsaquo;</span></a>";
    })();

    var big = [];
    ["ab", "jg"].forEach(function (gid) {
      L.history(gid).forEach(function (d) { if (d.tiers[0].winners > 0) big.push(d); });
    });
    big.sort(function (a, b) { return b.day - a.day; });
    $("#bigwins").innerHTML = big.slice(0, 5).map(function (d) {
      var w = L.winners(d.game, d)[0];
      return "<tr><td>" + date(d.day) + "</td><td>" + gname(d.game) + '</td><td class="r"><b>' + som(d.tiers[0].prize) + "</b></td><td>" + esc(pl(w.place)) + "</td></tr>";
    }).join("");

    var f = $("#quick");
    if (f) f.onsubmit = function (e) { e.preventDefault(); location.href = "check.html#" + encodeURIComponent($("#quick-serial").value.trim()); };
    fundBar($("#fund"));
  }
  function resultLine(d) {
    var t = d.tiers[0], g = L.GAMES[d.game];
    if (g.fixed) return F("tt.result", { n: num(t.winners) });
    if (t.winners > 0) return F("jp.won", { n: t.winners, p: som(t.prize) });
    if (d.rolldown) return T("rolled.down");
    return F("jp.rolls", { p: som(d.next) });
  }

  /* ---------- results ---------- */
  function results() {
    var state = { gid: "ab", page: 0, year: "", sel: null };
    var m = location.hash.match(/^#(ab|jg|tt)(?:-(\d+))?/);
    if (m) { state.gid = m[1]; if (m[2]) state.sel = +m[2]; }
    var tabs = $("#tabs");
    tabs.innerHTML = L.ORDER.map(function (gid) { return '<button data-g="' + gid + '">' + gname(gid) + "</button>"; }).join("");
    $$("button", tabs).forEach(function (b) {
      b.onclick = function () { state.gid = b.getAttribute("data-g"); state.page = 0; state.year = ""; state.sel = null; history.replaceState(null, "", "#" + state.gid); render(); };
    });
    $("#year").onchange = function () { state.year = this.value; state.page = 0; render(); };
    $("#find").onsubmit = function (e) {
      e.preventDefault();
      var n = +$("#find-no").value;
      if (L.getDraw(state.gid, n)) { state.sel = n; history.replaceState(null, "", "#" + state.gid + "-" + n); render(); $("#detail").scrollIntoView({ behavior: "smooth" }); }
      else $("#find-msg").textContent = T("no.such.draw");
    };
    window.addEventListener("hashchange", function () {
      var m2 = location.hash.match(/^#(ab|jg|tt)(?:-(\d+))?/);
      if (m2) { state.gid = m2[1]; state.sel = m2[2] ? +m2[2] : null; render(); }
    });
    function render() {
      $$("button", tabs).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-g") === state.gid); });
      var g = L.GAMES[state.gid], h = L.history(state.gid);
      var years = {}; h.forEach(function (d) { years[d.date.slice(0, 4)] = 1; });
      $("#year").innerHTML = '<option value="">' + T("all.years") + "</option>" + Object.keys(years).sort().reverse().map(function (y) {
        return '<option' + (y === state.year ? " selected" : "") + ">" + y + "</option>";
      }).join("");
      var list = h.filter(function (d) { return !state.year || d.date.slice(0, 4) === state.year; }).reverse();
      var per = 20, pages = Math.ceil(list.length / per);
      var sel = state.sel ? L.getDraw(state.gid, state.sel) : h[h.length - 1];
      detail(sel);
      var rows = list.slice(state.page * per, state.page * per + per);
      $("#arch").innerHTML = '<table class="tbl"><thead><tr><th>' + T("th.no") + "</th><th>" + T("th.date") + "</th><th>" + T("th.numbers") + '</th><th class="r">' +
        topLabel(state.gid) + '</th><th class="r">' + T("th.topwin") + "</th></tr></thead><tbody>" +
        rows.map(function (d) {
          return '<tr class="click' + (sel && d.no === sel.no ? " sel" : "") + '" data-no="' + d.no + '"><td>' + d.no + '</td><td class="nowrap">' + date(d.day) + "</td><td>" +
            ballsHTML(d.sorted, g.colour, "sm") + '</td><td class="r">' + (g.fixed ? som(g.fixed[g.pick]) : som(d.jackpot)) + '</td><td class="r">' +
            (d.tiers[0].winners ? "<b>" + d.tiers[0].winners + "</b>" : d.rolldown ? T("rolldown.short") : "&ndash;") + "</td></tr>";
        }).join("") + "</tbody></table>";
      $$("#arch tr.click").forEach(function (tr) {
        tr.onclick = function () { state.sel = +tr.getAttribute("data-no"); history.replaceState(null, "", "#" + state.gid + "-" + state.sel); render(); $("#detail").scrollIntoView({ behavior: "smooth" }); };
      });
      var pg = "";
      if (pages > 1) {
        pg = '<div class="row" style="margin-top:12px;align-items:center"><button class="btn ghost" id="prev"' + (state.page ? "" : " disabled") + ">&larr; " + T("newer") +
          '</button><span class="muted small">' + F("page.of", { a: state.page + 1, b: pages }) + '</span><button class="btn ghost" id="nextp"' + (state.page < pages - 1 ? "" : " disabled") + ">" + T("older") + " &rarr;</button></div>";
      }
      $("#pager").innerHTML = pg;
      if ($("#prev")) $("#prev").onclick = function () { if (state.page) { state.page--; render(); } };
      if ($("#nextp")) $("#nextp").onclick = function () { if (state.page < pages - 1) { state.page++; render(); } };
      freq(g, h);
    }
    function detail(d) {
      var g = L.GAMES[d.game];
      $("#detail").innerHTML = '<div class="card"><h2>' + F("draw.title", { game: g.name, no: d.no }) + '</h2><p class="muted">' + date(d.day, true) + ", " + timeOf(g) + " " + T("irt") +
        (d.mbw ? ' &middot; <span class="badge">' + T("mbw") + "</span>" : "") + "</p>" +
        '<div class="grid2"><div><h3>' + T("drawn.order") + "</h3>" + ballsHTML(d.balls, g.colour, "lg") + '<h3 style="margin-top:14px">' + T("sorted") + "</h3>" + ballsHTML(d.sorted, g.colour, "") +
        '<p class="small">' + resultLine(d) + "</p></div><div>" +
        '<table class="tbl"><thead><tr><th>' + T("th.match") + '</th><th class="r">' + T("th.winners") + '</th><th class="r">' + T("th.prize") + "</th></tr></thead><tbody>" +
        d.tiers.map(function (t) {
          return "<tr><td>" + F("match.of", { k: t.k, n: g.pick }) + (t.k === g.pick && !g.fixed ? " (" + T("jackpot") + ")" : "") + '</td><td class="r">' + num(t.winners) + '</td><td class="r">' +
            (t.winners ? som(t.prize) : t.k === g.pick && !g.fixed ? (d.rolldown ? T("rolldown.short") : T("rolls.over")) : "&ndash;") + "</td></tr>";
        }).join("") + "</tbody></table>" +
        '<p class="small muted">' + F("sales.line", { lines: num(d.lines), sales: som(d.sales) }) +
        (g.fixed ? "" : "<br>" + F("this.jp", { p: som(d.jackpot) }) + "<br>" + F("next.jp", { p: som(d.next) })) + "</p></div></div></div>";
    }
    function freq(g, h) {
      var n = Math.min(100, h.length), cnt = [], i, mx = 0;
      for (i = 0; i <= g.of; i++) cnt[i] = 0;
      h.slice(-n).forEach(function (d) { d.balls.forEach(function (b) { cnt[b]++; }); });
      for (i = 1; i <= g.of; i++) mx = Math.max(mx, cnt[i]);
      var mn = mx; for (i = 1; i <= g.of; i++) mn = Math.min(mn, cnt[i]);
      $("#freq-title").textContent = F("freq.title", { n: n });
      var out = "";
      for (i = 1; i <= g.of; i++) {
        var f = mx === mn ? 0.5 : (cnt[i] - mn) / (mx - mn);
        var col = "hsl(" + Math.round(220 - f * 220) + ",65%," + Math.round(48 - f * 6) + "%)";
        out += '<div><b style="background:' + col + '">' + i + "</b>" + cnt[i] + "&times;</div>";
      }
      $("#freq").innerHTML = out;
    }
    render();
  }

  /* ---------- kept tickets (this browser only) ---------- */
  function kept() { try { return JSON.parse(localStorage.getItem("loto-tickets") || "[]"); } catch (e) { return []; } }
  function keep(list) { try { localStorage.setItem("loto-tickets", JSON.stringify(list.slice(0, 30))); } catch (e) {} }
  function keptStatus(serial) {
    var t = L.parseSerial(serial);
    if (!t.ok) return null;
    var d = L.getDraw(t.game, t.draw), nd = L.nextDraw(t.game), won = 0;
    if (d) t.lines.forEach(function (ln) { won += L.score(d, ln).prize; });
    return { t: t, d: d, nd: nd, won: won, expired: d && L.todayTalas(Date.now()) - d.day > 180 };
  }

  /* ---------- ticket check ---------- */
  function check() {
    var st = { gid: "ab", picks: [] };
    var f = $("#by-serial");
    f.onsubmit = function (e) { e.preventDefault(); bySerial($("#serial").value); };
    var h = decodeURIComponent(location.hash.slice(1));
    if (h && h !== "my") { $("#serial").value = h; bySerial(h); }
    myTickets();
    function myTickets() {
      var box = $("#my");
      if (!box) return;
      var list = kept();
      box.hidden = !list.length;
      if (!list.length) return;
      $("#my-list").innerHTML = list.map(function (s) {
        var k = keptStatus(s);
        if (!k) return "";
        var g = L.GAMES[k.t.game], st;
        if (!k.d) st = '<span class="muted">' + F("my.wait", { date: date(k.nd.day) }) + "</span>";
        else if (k.won && k.expired) st = '<span class="muted">' + T("my.old") + "</span>";
        else st = k.won ? '<b class="my-win">' + F("my.won", { p: som(k.won) }) + "</b>" : '<span class="muted">' + T("my.none") + "</span>";
        return '<tr><td><a href="#' + k.t.serial + '" data-open="' + k.t.serial + '">' + k.t.serial + "</a></td><td>" + g.name + "</td><td>" + F("my.draw", { no: k.t.draw }) +
          "</td><td>" + st + '</td><td class="r"><button type="button" class="btn ghost sm" data-del="' + k.t.serial + '">' + T("my.remove") + "</button></td></tr>";
      }).join("");
      $$("[data-open]", box).forEach(function (a) { a.onclick = function (e) { e.preventDefault(); $("#serial").value = a.getAttribute("data-open"); bySerial(a.getAttribute("data-open")); $("#serial-result").scrollIntoView({ behavior: "smooth" }); }; });
      $$("[data-del]", box).forEach(function (b) { b.onclick = function () { keep(kept().filter(function (x) { return x !== b.getAttribute("data-del"); })); myTickets(); }; });
    }
    var gsel = $("#ck-game");
    gsel.innerHTML = L.ORDER.map(function (gid) { return '<option value="' + gid + '">' + gname(gid) + " " + L.GAMES[gid].pick + "/" + L.GAMES[gid].of + "</option>"; }).join("");
    gsel.onchange = function () { st.gid = gsel.value; st.picks = []; setup(); };
    $("#ck-quick").onclick = function () {
      var g = L.GAMES[st.gid], r = L.rng((Math.random() * 4294967296) >>> 0), pool = [];
      for (var i = 1; i <= g.of; i++) pool.push(i);
      st.picks = [];
      for (var j = 0; j < g.pick; j++) st.picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
      grid();
    };
    $("#ck-clear").onclick = function () { st.picks = []; grid(); };
    $("#ck-go").onclick = function () { byNumbers(); };
    function setup() {
      var hist = L.history(st.gid);
      $("#ck-draw").innerHTML = hist.slice(-30).reverse().map(function (d) {
        return '<option value="' + d.no + '">' + F("draw.opt", { no: d.no, date: date(d.day) }) + "</option>";
      }).join("") + '<option value="last10">' + T("last.10") + "</option>";
      grid();
    }
    function grid() {
      var g = L.GAMES[st.gid], out = "";
      for (var i = 1; i <= g.of; i++) out += '<button type="button" data-n="' + i + '" class="' + (st.picks.indexOf(i) >= 0 ? "on" : "") + '">' + i + "</button>";
      $("#ck-grid").innerHTML = out;
      $("#ck-count").textContent = F("picked", { a: st.picks.length, b: g.pick });
      $$("#ck-grid button").forEach(function (b) {
        b.onclick = function () {
          var n = +b.getAttribute("data-n"), k = st.picks.indexOf(n);
          if (k >= 0) st.picks.splice(k, 1); else if (st.picks.length < g.pick) st.picks.push(n);
          grid();
        };
      });
    }
    function byNumbers() {
      var g = L.GAMES[st.gid], out = $("#ck-result");
      if (st.picks.length !== g.pick) { out.className = "result bad"; out.innerHTML = F("pick.n", { n: g.pick }); return; }
      var v = $("#ck-draw").value, hist = L.history(st.gid);
      var draws = v === "last10" ? hist.slice(-10).reverse() : [L.getDraw(st.gid, +v)];
      var won = 0, rows = draws.map(function (d) {
        var s = L.score(d, st.picks); won += s.prize;
        return "<tr><td>" + d.no + "</td><td class=\"nowrap\">" + date(d.day) + "</td><td>" + ballsHTML(d.sorted, g.colour, "sm", st.picks) + '</td><td class="r">' + s.hits +
          '</td><td class="r">' + (s.prize ? "<b>" + som(s.prize) + "</b>" : "&ndash;") + "</td></tr>";
      }).join("");
      out.className = "result " + (won ? "win" : "lose");
      out.innerHTML = "<h3>" + (won ? F("you.won", { p: som(won) }) : T("no.win")) + '</h3><div class="scroll"><table class="tbl"><thead><tr><th>' + T("th.no") + "</th><th>" + T("th.date") +
        "</th><th>" + T("th.numbers") + '</th><th class="r">' + T("th.hits") + '</th><th class="r">' + T("th.prize") + "</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
        (won ? '<p class="small">' + T("claim.hint") + "</p>" : "");
    }
    function bySerial(s) {
      var out = $("#serial-result"), t = L.parseSerial(s);
      if (!t.ok) { out.className = "result bad"; out.innerHTML = "<b>" + T("bad." + t.why) + "</b><br><span class=\"small\">" + T("serial.help") + "</span>"; return; }
      var g = L.GAMES[t.game], d = L.getDraw(t.game, t.draw), nd = L.nextDraw(t.game);
      var hits = d ? d.balls : [];
      var total = 0, lines = t.lines.map(function (ln, i) {
        var sc = d ? L.score(d, ln) : null; if (sc) total += sc.prize;
        return '<div class="t-line">' + String.fromCharCode(65 + i) + ". " + ln.map(function (n) { return '<span class="n' + (hits.indexOf(n) >= 0 ? " hit" : "") + '">' + n + "</span>"; }).join("") +
          (sc ? " <b>" + (sc.prize ? som(sc.prize) : "") + "</b>" : "") + "</div>";
      }).join("");
      var ticket = '<div class="ticket"><div class="t-head">IRADLOTO &middot; ' + g.name.toUpperCase() + " " + g.pick + "/" + g.of + "<br>" + F("tk.draw", { no: t.draw }) + "</div>" + lines +
        '<div class="t-foot">' + F("tk.price", { p: som(g.price * t.lines.length) }) + "<br>" + F("tk.term", { t: t.terminal, r: T("reg." + t.terminal[0]) }) + "<br>" + t.serial + '<div class="barcode"></div></div></div>';
      var msg;
      if (!d) {
        if (t.draw === nd.no) msg = "<h3>" + T("tk.pending") + "</h3><p>" + F("tk.pending.when", { date: date(nd.day, true), time: timeOf(g) }) + "</p>";
        else if (t.draw > nd.no) msg = "<h3>" + T("bad.future") + "</h3>";
        else msg = "<h3>" + T("bad.format") + "</h3>";
        out.className = "result bad";
      } else {
        var expired = L.todayTalas(Date.now()) - d.day > 180;
        out.className = "result " + (total ? "win" : "lose");
        msg = "<h3>" + (total ? F("you.won", { p: som(total) }) : T("no.win")) + "</h3><p>" + F("tk.drawn", { no: d.no, date: date(d.day) }) + "</p>" + ballsHTML(d.sorted, g.colour, "sm") +
          (total ? '<p class="small">' + (expired ? T("tk.expired") : total > 50000 ? T("claim.office") : total > 1000 ? T("claim.post") : T("claim.any")) + "</p>" : "");
      }
      var have = kept().indexOf(t.serial) >= 0;
      out.innerHTML = '<div class="grid2"><div>' + ticket + "</div><div>" + msg + '<p><button type="button" class="btn ghost" id="keep"' + (have ? " disabled" : "") + ">" + T(have ? "my.saved" : "my.save") + "</button></p></div></div>";
      $("#keep").onclick = function () {
        var list = kept().filter(function (x) { return x !== t.serial; });
        list.unshift(t.serial); keep(list);
        this.disabled = true; this.textContent = T("my.saved"); myTickets();
      };
    }
    setup();
  }

  /* ---------- winners ---------- */
  function winnersPage() {
    var gid = "all", today = L.todayTalas(Date.now());
    var all = [];
    ["ab", "jg"].forEach(function (g) {
      L.history(g).forEach(function (d) {
        if (d.tiers[0].winners > 0) L.winners(g, d).forEach(function (w) { all.push({ d: d, w: w }); });
      });
    });
    all.sort(function (a, b) { return b.d.day - a.d.day; });
    var unclaimed = all.filter(function (x) { return x.w.claimDay > today && today - x.d.day <= 180; });
    $("#unclaimed").innerHTML = unclaimed.length ? unclaimed.map(function (x) {
      return '<div class="notice warn"><b>' + F("unclaimed", { p: som(x.d.tiers[0].prize), game: gname(x.d.game), no: x.d.no, date: date(x.d.day) }) + "</b><br>" +
        F("unclaimed.where", { shop: shopText(x.w), until: date(x.d.day + 180) }) + "</div>";
    }).join("") : '<p class="muted">' + T("all.claimed") + "</p>";
    var abJ = all.filter(function (x) { return x.d.game === "ab"; });
    var paid = all.reduce(function (s, x) { return s + x.d.tiers[0].prize; }, 0);
    $("#wstats").innerHTML = '<div class="card"><div class="big">' + all.length + '</div><div class="muted">' + T("ws.jackpots") + '</div></div><div class="card"><div class="big">' + som(paid) +
      '</div><div class="muted">' + T("ws.paid") + '</div></div><div class="card"><div class="big">' + som(Math.max.apply(null, abJ.map(function (x) { return x.d.tiers[0].prize; }))) +
      '</div><div class="muted">' + T("ws.record") + "</div></div>";
    var tabs = $("#wtabs");
    tabs.innerHTML = [["all", T("all.games")], ["ab", gname("ab")], ["jg", gname("jg")]].map(function (p) { return '<button data-g="' + p[0] + '">' + p[1] + "</button>"; }).join("");
    $$("button", tabs).forEach(function (b) { b.onclick = function () { gid = b.getAttribute("data-g"); render(); }; });
    function story(x) {
      var w = x.w;
      var who = w.named ? F("story.named", { name: esc(w.name), age: w.age, who: T("who." + w.who), place: esc(pl(w.place)) })
        : cap(F("story.anon", { who: T("who." + w.who), place: esc(pl(w.place)) }));
      return who + " " + F("story.shop", { shop: shopText(w), lines: w.lines }) + (w.claimDay <= today ? " " + F("story.claimed", { date: date(w.claimDay) }) : today - x.d.day > 180 ? " <b>" + T("story.lapsed") + "</b>" : " <b>" + T("story.waiting") + "</b>");
    }
    function render() {
      $$("button", tabs).forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-g") === gid); });
      var list = all.filter(function (x) { return gid === "all" || x.d.game === gid; }).slice(0, 60);
      $("#wlist").innerHTML = list.map(function (x) {
        return '<div class="card" style="margin-bottom:12px"><div class="row" style="justify-content:space-between;align-items:baseline"><h3 style="margin:0">' + som(x.d.tiers[0].prize) +
          '</h3><span class="muted small">' + gname(x.d.game) + " &middot; " + F("draw.no", { no: x.d.no }) + " &middot; " + date(x.d.day) + "</span></div><p style=\"margin:.4em 0 0\">" + story(x) + "</p></div>";
      }).join("");
    }
    render();
  }

  /* ---------- games ---------- */
  function games() {
    L.ORDER.forEach(function (gid) {
      var g = L.GAMES[gid], el = $("#odds-" + gid), n = L.nextDraw(gid);
      if (!el) return;
      var rows = "";
      for (var k = g.pick; k >= (g.fixed ? 3 : g.low.k); k--) {
        var p = L.pMatch(g, k), prize;
        if (g.fixed) prize = som(g.fixed[k]);
        else if (k === g.pick) prize = T("jackpot") + " (" + F("from", { p: som(g.seed) }) + ")";
        else if (k === g.low.k) prize = som(g.low.prize);
        else prize = F("share", { s: Math.round(g.shares[k] * 100) });
        rows += "<tr><td>" + F("match.of", { k: k, n: g.pick }) + '</td><td class="r">1 : ' + num(1 / p) + '</td><td class="r">' + prize + "</td></tr>";
      }
      el.innerHTML = '<table class="tbl"><thead><tr><th>' + T("th.match") + '</th><th class="r">' + T("th.odds") + '</th><th class="r">' + T("th.prize") + "</th></tr></thead><tbody>" + rows + "</tbody></table>";
      var nx = $("#next-" + gid);
      if (nx) nx.innerHTML = F("next.draw", { no: n.no, date: date(n.day, true), time: timeOf(g) }) + " &middot; <b>" + topLabel(gid) + ": " + som(n.jackpot) + "</b>";
    });
    var ty = $("#tyin");
    if (ty) ty.innerHTML = L.TYIN.map(function (t) {
      var s = L.tyinState(t);
      return '<div class="tyin ' + t.art + '"><div class="coin"></div><h3>' + t.name + '</h3><div class="small">' + F("series", { id: t.id }) + "</div><p><b>" + som(t.price) + "</b> &middot; " +
        F("top.ty", { p: t.horse ? T("ty.horse") : som(t.top) }) + "<br>" + (s.ended ? T("ty.ended") : F("ty.left", { a: s.left, b: t.tops })) + '<br><span class="small">' + F("ty.until", { d: date(L.dayOf(t.to)) }) + "</span></p>" + (t.horse ? '<p class="small">' + T("ty.horse.p") + "</p>" : "") + "</div>";
    }).join("");
    scratch();
  }

  /* ---------- about ---------- */
  var SPLIT = [[50, "#f4b400", "sp.prizes"], [20, "#1f8a4c", "sp.fund"], [10, "#5a2a98", "sp.budget"], [12, "#0f8a8a", "sp.retail"], [8, "#9a8fb0", "sp.costs"]];
  function fundBar(el) {
    if (!el) return;
    el.innerHTML = '<div class="bar">' + SPLIT.map(function (s) { return '<div style="width:' + s[0] + "%;background:" + s[1] + '">' + s[0] + "%</div>"; }).join("") + '</div><div class="legend">' +
      SPLIT.map(function (s) { return '<span><i style="background:' + s[1] + '"></i>' + s[0] + "% " + T(s[2]) + "</span>"; }).join("") + "</div>";
  }
  function about() {
    fundBar($("#fund"));
    var y = new Date(Date.now() + L.TZ).getUTCFullYear() - 1, sales = 0, lines = 0;
    L.ORDER.forEach(function (gid) { L.history(gid).forEach(function (d) { if (d.date.slice(0, 4) === String(y)) { sales += d.sales; lines += d.lines; } }); });
    $("#yearfig").innerHTML = F("year.fig", { y: y, sales: som(Math.round(sales / 1e5) * 1e5), lines: num(Math.round(lines / 1e3) * 1e3), fund: som(Math.round(sales * 0.2 / 1e5) * 1e5) });
  }

  /* ---------- Chabysh: the horse-race lottery ---------- */
  function horseSVG(h, cls) { return window.Horse ? Horse.svg(h, cls) : ""; }
  function hname(n) { return L.RACE.horses[n - 1].name; }
  function chabysh() {
    var R = L.RACE, H = L.raceHistory(), st = { sel: H.length, type: "win", picks: [] };
    var nr = L.nextRace();
    $("#ch-next").innerHTML = F("ch.next", { no: nr.no, date: date(nr.day, true), time: "19:30" });
    countdown($("#ch-count"), nr.closes);
    $("#ch-race").innerHTML = H.slice(-14).reverse().map(function (d) { return '<option value="' + d.no + '">' + F("draw.opt", { no: d.no, date: date(d.day) }) + "</option>"; }).join("");
    $("#ch-race").onchange = function () { st.sel = +this.value; setup(); run(); };
    $("#ch-replay").onclick = function () { run(); };
    var track = $("#track"), raf = null;
    function setup() {
      track.innerHTML = '<div class="finish"></div>' + R.horses.map(function (h) {
        return '<div class="lane"><span class="bib" style="background:' + h.silk + ";color:" + (h.silk === "#ffffff" || h.silk === "#f4c430" || h.silk === "#c9a227" ? "#222" : "#fff") + '">' + h.n + '</span><div class="runner" id="hr' + h.n + '">' + horseSVG(h) + "</div></div>";
      }).join("");
      $("#podium").innerHTML = "";
    }
    function run() {
      if (raf) cancelAnimationFrame(raf);
      var d = L.getRace(st.sel), r = L.rng(L.h32("anim:" + d.no)), rank = {}, ph = {}, fq = {}, cy = {}, fin = {};
      d.order.forEach(function (n, i) { rank[n] = i; ph[n] = r() * 6.28; fq[n] = 1.2 + r() * 1.6; cy[n] = r(); });
      var els = {}, svgs = {}, w = 0, t0 = null, dur = 9000, last = null;
      R.horses.forEach(function (h) { els[h.n] = $("#hr" + h.n); svgs[h.n] = els[h.n].querySelector("svg"); });
      w = track.clientWidth - 28 - 30 - (svgs[1] ? svgs[1].getBoundingClientRect().width * 0.88 : 80);
      $("#podium").innerHTML = "";
      $("#ch-title").textContent = F("ch.race.title", { no: d.no, date: date(d.day, true) });
      function frame(ts) {
        if (!t0) t0 = last = ts;
        var t = (ts - t0) / dur, dt = (ts - last) / 1000, done = true;
        last = ts;
        R.horses.forEach(function (h) {
          var n = h.n, T = 0.8 + rank[n] * 0.016, x, amp = 1;
          if (t >= T) {
            if (fin[n] == null) fin[n] = ts;
            var k = Math.min(1, (ts - fin[n]) / 900);
            amp = 1 - k; x = 1 + 0.035 * (1 - (1 - k) * (1 - k));
          } else { var u = t / T; x = Math.min(0.995, u * (1 + 0.09 * Math.sin(Math.PI * u) * Math.sin(6.28 * fq[n] * u + ph[n]))); }
          if (amp > 0) done = false;
          els[n].style.transform = "translateX(" + Math.max(0, x * w).toFixed(1) + "px)";
          if (svgs[n] && window.Horse) {
            cy[n] = (cy[n] + dt * 2.4 * (0.4 + 0.6 * amp)) % 1;
            if (amp > 0) Horse.pose(svgs[n], cy[n], amp); else Horse.stand(svgs[n]);
          }
        });
        if (!done) raf = requestAnimationFrame(frame); else { raf = null; podium(d); }
      }
      raf = requestAnimationFrame(frame);
    }
    function podium(d) {
      $("#podium").innerHTML = '<div class="pod">' + [1, 0, 2].map(function (i) {
        var h = R.horses[d.order[i] - 1];
        return '<div class="step s' + (i + 1) + '">' + horseSVG(h, "still") + "<b>" + (i + 1) + ". " + esc(h.name) + "</b>" + (i ? '<span class="small muted">' + T("mg." + d.margins[i - 1]) + "</span>" : "") + "</div>";
      }).join("") + "</div>" +
        '<table class="tbl" style="margin-top:12px"><thead><tr><th>' + T("ch.bet") + '</th><th>' + T("ch.result") + '</th><th class="r">' + T("th.winners") + '</th><th class="r">' + T("th.prize") + "</th></tr></thead><tbody>" +
        ["win", "forecast", "tricast"].map(function (k, i) {
          return "<tr><td>" + T("ch." + k) + "</td><td>" + d.order.slice(0, i + 1).join(" &ndash; ") + '</td><td class="r">' + num(d.winners[k]) + '</td><td class="r">' + som(R.prizes[k]) + "</td></tr>";
        }).join("") + "</tbody></table>";
    }
    // the stable: form and wins
    var wins = {}, form = {};
    H.forEach(function (d) { wins[d.order[0]] = (wins[d.order[0]] || 0) + 1; });
    H.slice(-5).forEach(function (d) { d.order.forEach(function (n, i) { (form[n] = form[n] || []).push(i + 1); }); });
    $("#stable").innerHTML = R.horses.map(function (h) {
      return "<tr><td>" + horseSVG(h, "still sm") + "</td><td><b>" + h.n + ". " + esc(h.name) + '</b><br><span class="small muted">' + T("hs." + h.n) + '</span></td><td class="nowrap">' + form[h.n].join("-") + '</td><td class="r">' + num(wins[h.n] || 0) + "</td></tr>";
    }).join("");
    $("#ch-list").innerHTML = H.slice(-20).reverse().map(function (d) {
      return '<tr class="click" data-no="' + d.no + '"><td>' + d.no + '</td><td class="nowrap">' + date(d.day) + "</td><td>" + d.order.slice(0, 3).map(function (n) { return "<b>" + n + "</b> " + esc(hname(n)); }).join(", ") + '</td><td class="r">' + num(d.winners.tricast) + "</td></tr>";
    }).join("");
    $$("#ch-list tr").forEach(function (tr) { tr.onclick = function () { st.sel = +tr.getAttribute("data-no"); $("#ch-race").value = st.sel; setup(); run(); $("#ch-title").scrollIntoView({ behavior: "smooth" }); }; });
    // bet checker
    $$("#bt-type button").forEach(function (b) { b.onclick = function () { st.type = b.getAttribute("data-k"); st.picks = []; bet(); }; });
    $("#bt-race").innerHTML = H.slice(-14).reverse().map(function (d) { return '<option value="' + d.no + '">' + F("draw.opt", { no: d.no, date: date(d.day) }) + "</option>"; }).join("");
    $("#bt-go").onclick = function () {
      var k = st.type === "win" ? 1 : st.type === "forecast" ? 2 : 3, out = $("#bt-result");
      if (st.picks.length !== k) { out.className = "result bad"; out.innerHTML = F("ch.pick.n", { n: k }); return; }
      var d = L.getRace(+$("#bt-race").value), p = L.raceScore(d, st.type, st.picks);
      out.className = "result " + (p ? "win" : "lose");
      out.innerHTML = "<h3>" + (p ? F("you.won", { p: som(p) }) : T("no.win")) + "</h3><p>" + F("ch.finish", { a: d.order[0] + " " + esc(hname(d.order[0])), b: d.order[1] + " " + esc(hname(d.order[1])), c: d.order[2] + " " + esc(hname(d.order[2])) }) + "</p>";
    };
    function bet() {
      var k = st.type === "win" ? 1 : st.type === "forecast" ? 2 : 3;
      $$("#bt-type button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-k") === st.type); });
      $("#bt-grid").innerHTML = R.horses.map(function (h) {
        var i = st.picks.indexOf(h.n);
        return '<button type="button" data-n="' + h.n + '" class="' + (i >= 0 ? "on" : "") + '">' + (i >= 0 ? '<i class="ord">' + (i + 1) + "</i>" : "") + horseSVG(h, "still sm") + "<span>" + h.n + ". " + esc(h.name) + "</span></button>";
      }).join("");
      $("#bt-hint").textContent = F("ch.pick.hint", { n: k });
      $$("#bt-grid button").forEach(function (b) {
        b.onclick = function () {
          var n = +b.getAttribute("data-n"), i = st.picks.indexOf(n);
          if (i >= 0) st.picks.splice(i, 1); else if (st.picks.length < k) st.picks.push(n);
          bet();
        };
      });
    }
    bet(); setup();
    // run the race when the track comes into view
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
      io.observe(track);
    } else run();
  }

  /* ---------- fun bits: tilting tiles and the tear-off ticket strip ---------- */
  function tilt() {
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
    $$(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
        el.style.transform = "perspective(700px) rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 10).toFixed(2) + "deg) translateY(-6px) scale(" + (el.classList.contains("game") ? 1.07 : 1) + ")";
        el.style.setProperty("--gx", (x * 100 + 50).toFixed(0) + "%"); el.style.setProperty("--gy", (y * 100 + 50).toFixed(0) + "%");
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }
  /* a demo Tyin Akyel card on the games page: scratch the silver off; three matching symbols win (for fun, no prize) */
  function scratch() {
    var box = $("#scratch");
    if (!box) return;
    var SYM = ["horse", "1000", "100", "50", "20", "10"], W = [1, 3, 5, 7, 9, 11], cells = [], i;
    function pick() { var t = 0, r = Math.random() * 36; for (var k = 0; k < SYM.length; k++) { t += W[k]; if (r < t) return SYM[k]; } return "10"; }
    function deal() {
      cells = []; var win = Math.random() < 0.3 ? (Math.random() < 0.18 ? "horse" : pick()) : null, n = {};
      if (win) for (i = 0; i < 3; i++) cells.push(win);
      while (cells.length < 9) { var c = pick(); if (c === win || (n[c] || 0) >= 2) continue; n[c] = (n[c] || 0) + 1; cells.push(c); }
      for (i = 8; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = cells[i]; cells[i] = cells[j]; cells[j] = x; }
      return win;
    }
    function cellHTML(c) {
      return '<div class="sc-cell' + (c === "horse" ? " h" : "") + '">' + (c === "horse" ? horseSVG(L.RACE.horses[8], "still sm") + "<b>" + T("sc.horse") + "</b>" : "<b>" + num(+c) + "</b><span>som</span>") + "</div>";
    }
    function start() {
      var win = deal(), done = false;
      box.innerHTML = '<div class="sc-card"><div class="sc-head"><b>Tyin Akyel</b><span>' + T("sc.rule") + '</span></div><div class="sc-play"><div class="sc-grid">' + cells.map(cellHTML).join("") +
        '</div><canvas></canvas></div><div class="sc-foot">' + T("sc.demo") + '</div></div><p class="sc-msg" aria-live="polite"></p>';
      var cv = $("canvas", box), grid = $(".sc-grid", box), msg = $(".sc-msg", box), ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
      var bw = grid.offsetWidth, bh = grid.offsetHeight;
      cv.width = bw * dpr; cv.height = bh * dpr; cv.style.width = bw + "px"; cv.style.height = bh + "px"; ctx.scale(dpr, dpr);
      var gr = ctx.createLinearGradient(0, 0, bw, bh); gr.addColorStop(0, "#b9b9c2"); gr.addColorStop(0.5, "#e6e6ec"); gr.addColorStop(1, "#a4a4ae");
      ctx.fillStyle = gr; ctx.fillRect(0, 0, bw, bh);
      ctx.fillStyle = "rgba(58,23,104,.35)"; ctx.font = "800 13px Inter, Arial, sans-serif"; ctx.textAlign = "center";
      for (var yy = 22; yy < bh; yy += 34) for (var xx = (yy / 34) % 2 ? 40 : 90; xx < bw; xx += 110) ctx.fillText("\u2605 IRADLOTO \u2605", xx, yy);
      ctx.globalCompositeOperation = "destination-out"; ctx.lineCap = ctx.lineJoin = "round"; ctx.lineWidth = 30;
      var down = false, lx = 0, ly = 0, strokes = 0;
      function pos(e) { var b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
      function check() {
        var d = ctx.getImageData(0, 0, cv.width, cv.height).data, clear = 0, tot = 0;
        for (var k = 3; k < d.length; k += 64) { tot++; if (d[k] < 40) clear++; }
        if (clear / tot > 0.6 && !done) {
          done = true; cv.style.transition = "opacity .5s"; cv.style.opacity = 0;
          msg.innerHTML = (win ? (win === "horse" ? T("sc.won.horse") : F("sc.won", { p: som(+win) })) : T("sc.lost")) + ' <button type="button" class="btn sm">' + T("sc.again") + "</button>";
          $("button", msg).onclick = start;
          if (win) $$(".sc-cell", box).forEach(function (el, k) { if (cells[k] === win) el.classList.add("win"); });
        }
      }
      cv.addEventListener("pointerdown", function (e) { down = true; var p = pos(e); lx = p[0]; ly = p[1]; ctx.beginPath(); ctx.arc(lx, ly, 15, 0, 7); ctx.fill(); cv.setPointerCapture(e.pointerId); e.preventDefault(); });
      cv.addEventListener("pointermove", function (e) {
        if (!down) return;
        var p = pos(e); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(p[0], p[1]); ctx.stroke(); lx = p[0]; ly = p[1];
        if (++strokes % 12 === 0) check();
      });
      ["pointerup", "pointercancel"].forEach(function (ev) { cv.addEventListener(ev, function () { down = false; check(); }); });
    }
    start();
  }
  function strip() {
    var el = $("#strip");
    if (!el) return;
    var items = L.ORDER.map(function (gid) {
      var g = L.GAMES[gid], n = L.nextDraw(gid);
      return { href: "games.html#" + gid, cls: g.colour, name: g.name, line1: topLabel(gid), big: som(n.jackpot), line2: F("next.short", { date: date(n.day), time: timeOf(g) }), price: som(g.price) };
    });
    var nr = L.nextRace();
    items.push({ href: "chabysh.html", cls: "green", name: "Chabysh", line1: T("ch.tag"), big: som(L.RACE.prizes.tricast), line2: F("next.short", { date: date(nr.day), time: "19:30" }), price: som(L.RACE.price) });
    L.TYIN.filter(function (t) { return L.tyinState(t).onSale; }).forEach(function (t) {
      items.push({ href: "games.html#instant", cls: "ty-" + t.art, name: t.name, line1: T("top.prize"), big: t.horse ? T("ty.horse") : som(t.top), line2: T("ty.instant"), price: som(t.price) });
    });
    var k = 0;
    function one() {
      return items.map(function (it) {
        var no = String(L.h32("tk" + (k++) + L.todayTalas()) % 1000000 + 1000000).slice(1);
        return '<a class="tk ' + it.cls + '" href="' + it.href + '"><span class="tk-in"><span class="tk-side">IRADLOTO</span><span class="tk-body">' +
          '<span class="tk-name">&#9733; ' + esc(it.name) + ' &#9733;</span><span class="tk-l1">' + it.line1 + '</span><span class="tk-big">' + it.big + '</span><span class="tk-l2">' + it.line2 + "</span>" +
          '<span class="tk-foot"><span class="tk-no">No. ' + no + '</span><span class="tk-price">' + it.price + "</span></span></span></span>" +
          '<span class="tk-tear">' + T("tear") + "</span></a>";
      }).join("");
    }
    el.innerHTML = '<div class="strip-ribbon"><div class="strip-track">' + one() + one() + '</div></div><div class="strip-machine" aria-hidden="true"><i></i><span></span><b>IradLoto</b><span></span></div>';
    var track = $(".strip-track", el), tks = $$(".tk", el), off = 0, last = null, hover = false, half = 0;
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.addEventListener("mouseenter", function () { hover = true; });
    el.addEventListener("mouseleave", function () { hover = false; });
    // the ribbon feeds out of the machine on the right and drifts left, rippling as it goes
    function frame(ts) {
      if (last == null) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      if (!half) half = track.scrollWidth / 2;
      if (!hover) off = (off + dt * 38) % (half || 1);
      track.style.transform = "translateX(" + (-off).toFixed(1) + "px)";
      var x0 = -off;
      tks.forEach(function (a) {
        if (a.classList.contains("torn")) return;
        var x = x0 + a.offsetLeft + a.offsetWidth / 2, ph = x / 210 + ts / 900;
        var y = 7 * Math.sin(ph), rot = 1.9 * Math.cos(ph);
        a.style.transform = "translateY(" + y.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg)";
      });
      requestAnimationFrame(frame);
    }
    if (!still) requestAnimationFrame(frame);
    tks.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (a.classList.contains("torn")) return;
        a.style.setProperty("--from", a.style.transform || "none");
        try { var snd = new Audio("assets/sound/tear.mp3"); snd.volume = 0.8; var pr = snd.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (err) {}
        a.classList.add("torn");
        setTimeout(function () { location.href = a.getAttribute("href"); }, 900);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    chrome();
    var p = document.body.getAttribute("data-page");
    try {
      if (p === "home") home();
      else if (p === "results") results();
      else if (p === "check") check();
      else if (p === "winners") winnersPage();
      else if (p === "games") games();
      else if (p === "about") about();
      else if (p === "chabysh") chabysh();
    } catch (e) { if (window.console) console.error(e); }
    try { strip(); tilt(); } catch (e) { if (window.console) console.error(e); }
  });
})();

/* holiday, half-mast, pass and power notices shared by the state sites (iradgov.org/assets/irad-bar.js) */
(function () {
  var s = document.createElement("script");
  s.src = "https://iradgov.org/assets/irad-bar.js"; s.defer = true; s.setAttribute("data-kind", "loto");
  document.head.appendChild(s);
})();
