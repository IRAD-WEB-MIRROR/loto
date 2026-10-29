/* IradLoto: draw results and jackpots.
   Every draw is worked out from its game and number, so the archive, the jackpots and the
   winners lists run on their own: nothing here needs a hand update. */
(function () {
  "use strict";

  var DAY = 86400000, TZ = 6 * 3600000; // Irad Time, UTC+6

  function h32(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = r() || 1e-9, v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function poisson(r, l) {
    if (l <= 0) return 0;
    if (l < 30) {
      var L = Math.exp(-l), k = 0, p = 1;
      do { k++; p *= r(); } while (p > L);
      return k - 1;
    }
    return Math.max(0, Math.round(l + Math.sqrt(l) * gauss(r)));
  }
  function C(n, k) {
    if (k < 0 || k > n) return 0;
    var x = 1;
    for (var i = 1; i <= k; i++) x = x * (n - k + i) / i;
    return x;
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function wpick(r, arr) { // [[weight, value], ...]
    var t = 0, i;
    for (i = 0; i < arr.length; i++) t += arr[i][0];
    var x = r() * t;
    for (i = 0; i < arr.length; i++) { x -= arr[i][0]; if (x < 0) return arr[i][1]; }
    return arr[arr.length - 1][1];
  }

  function dayOf(iso) { var p = iso.split("-"); return Math.round(Date.UTC(+p[0], p[1] - 1, +p[2]) / DAY); }
  function isoOf(day) { return new Date(day * DAY).toISOString().slice(0, 10); }
  function weekday(day) { return (day + 4) % 7; } // 0 = Sunday
  function todayTalas(now) { return Math.floor((now + TZ) / DAY); }

  var GAMES = {
    ab: {
      id: "ab", code: "AB", name: "Altın Bayge", pick: 6, of: 45, days: [6], time: [20, 30],
      start: "2012-04-07", price: 10, seed: 1000000, cap: 6000000, base: 72000, growth: 0.04,
      low: { k: 3, prize: 20 }, jpShare: 0.45, shares: { 5: 0.20, 4: 0.35 }, colour: "gold"
    },
    jg: {
      id: "jg", code: "JG", name: "Joguru!", pick: 5, of: 36, days: [0, 3], time: [20, 30],
      start: "2014-03-02", price: 5, seed: 100000, cap: 2000000, base: 34000, growth: 0.045,
      low: { k: 3, prize: 15 }, jpShare: 0.5, shares: { 4: 0.5 }, colour: "red"
    },
    tt: {
      id: "tt", code: "TT", name: "Tört Tuyak", pick: 4, of: 20, days: [0, 1, 2, 3, 4, 5, 6], time: [21, 0],
      start: "2019-09-01", price: 3, fixed: { 4: 5000, 3: 50 }, base: 17000, growth: 0.05, colour: "teal"
    }
  };
  var ORDER = ["ab", "jg", "tt"];

  function pMatch(g, k) { return C(g.pick, k) * C(g.of - g.pick, g.pick - k) / C(g.of, g.pick); }
  function minTier(g) { return g.fixed ? 3 : g.low.k; }
  function drawInstant(g, day) { return day * DAY + (g.time[0] * 60 + g.time[1]) * 60000 - TZ; }

  function season(day) {
    var d = new Date(day * DAY), m = d.getUTCMonth() + 1, dd = d.getUTCDate();
    if (m === 12 && dd >= 15) return 1.25;
    if (m === 3 && dd >= 4 && dd <= 11) return 1.15; // Irad Day week
    if (m === 7 || m === 8) return 0.92;
    return 1;
  }

  function balls(r, g) {
    var pool = [], out = [];
    for (var i = 1; i <= g.of; i++) pool.push(i);
    for (var j = 0; j < g.pick; j++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }

  var cache = {};
  // All draws of a game held before `now` (ms), oldest first.
  function history(gid, now) {
    now = now || Date.now();
    var g = GAMES[gid], key = Math.floor(now / 600000);
    if (cache[gid] && cache[gid].key === key) return cache[gid].out;
    var start = dayOf(g.start), end = todayTalas(now), out = [], jackpot = g.seed || 0, no = 0;
    for (var day = start; day <= end; day++) {
      if (g.days.indexOf(weekday(day)) < 0) continue;
      if (drawInstant(g, day) + 10 * 60000 > now) break;
      no++;
      var r = rng(h32(gid + ":" + no));
      var b = balls(r, g);
      var yrs = (day - start) / 365.25;
      var boost = g.cap ? 0.4 * jackpot / g.cap : (weekday(day) === 0 || weekday(day) === 6 ? 0.15 : 0);
      var lines = Math.round(g.base * Math.pow(1 + g.growth, yrs) * season(day) * (1 + boost) * (1 + 0.08 * gauss(r)));
      var sales = lines * g.price, tiers = [], w = {}, k;
      for (k = g.pick; k >= minTier(g); k--) w[k] = poisson(r, lines * pMatch(g, k));
      var d = { game: gid, no: no, day: day, date: isoOf(day), balls: b, sorted: b.slice().sort(function (x, y) { return x - y; }),
        lines: lines, sales: sales, jackpot: jackpot, mbw: false, rolldown: false, tiers: tiers };
      if (g.fixed) {
        for (k = g.pick; k >= 3; k--) tiers.push({ k: k, winners: w[k], prize: g.fixed[k] });
        d.next = 0;
      } else {
        var pool = sales * 0.5, lowPay = w[g.low.k] * g.low.prize, rest = Math.max(0, pool - lowPay);
        var add = rest * g.jpShare, tierPool = {};
        for (k in g.shares) tierPool[k] = rest * g.shares[k];
        d.mbw = jackpot >= g.cap;
        var top = w[g.pick];
        var next;
        if (top > 0) {
          next = g.seed;
          tiers.push({ k: g.pick, winners: top, prize: Math.floor(jackpot / top) });
        } else if (d.mbw) {
          d.rolldown = true;
          tierPool[g.pick - 1] += jackpot * (g.pick === 6 ? 0.5 : 1);
          if (g.pick === 6) tierPool[g.pick - 2] += jackpot * 0.5;
          next = g.seed;
          tiers.push({ k: g.pick, winners: 0, prize: 0 });
        } else {
          next = jackpot + add;
          tiers.push({ k: g.pick, winners: 0, prize: 0 });
        }
        if (top > 0 || d.rolldown) next += add;
        for (k = g.pick - 1; k > g.low.k; k--) {
          var n = w[k];
          if (n > 0) tiers.push({ k: k, winners: n, prize: Math.floor(tierPool[k] / n) });
          else { tiers.push({ k: k, winners: 0, prize: 0 }); next += tierPool[k]; }
        }
        tiers.push({ k: g.low.k, winners: w[g.low.k], prize: g.low.prize });
        d.next = Math.round(next / 1000) * 1000;
        jackpot = d.next;
      }
      out.push(d);
    }
    cache[gid] = { key: key, out: out };
    return out;
  }

  function nextDraw(gid, now) {
    now = now || Date.now();
    var g = GAMES[gid], h = history(gid, now), last = h[h.length - 1];
    var day = last ? last.day + 1 : dayOf(g.start);
    while (g.days.indexOf(weekday(day)) < 0 || drawInstant(g, day) + 10 * 60000 <= now) day++;
    return { game: gid, no: (last ? last.no : 0) + 1, day: day, date: isoOf(day), at: drawInstant(g, day),
      closes: drawInstant(g, day) - 30 * 60000,
      jackpot: g.fixed ? g.fixed[g.pick] : (last ? last.next : g.seed),
      mbw: !g.fixed && last ? last.next >= g.cap : false };
  }

  function getDraw(gid, no, now) {
    var h = history(gid, now);
    return h[no - 1] || null;
  }

  // Prize for a set of numbers in a draw.
  function score(d, nums) {
    var hit = nums.filter(function (n) { return d.balls.indexOf(n) >= 0; }).length;
    var t = null;
    for (var i = 0; i < d.tiers.length; i++) if (d.tiers[i].k === hit) t = d.tiers[i];
    return { hits: hit, tier: t, prize: t ? t.prize : 0 };
  }

  /* Tickets. Serial: GG-DDDD-TTTT-SSSSS-C (game, draw, terminal, ticket, check digit). */
  function luhn(digits) {
    var s = 0, alt = true;
    for (var i = digits.length - 1; i >= 0; i--) {
      var n = +digits[i];
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      s += n; alt = !alt;
    }
    return (10 - s % 10) % 10;
  }
  var REGIONS = { 1: "Talas", 2: "Nurzhan", 3: "Iyık Janyl", 4: "Chu District", 5: "Kara-Buura District", 6: "Talas District", 7: "Lower Naryn District", 8: "Sary-Bulak District" };
  function parseSerial(s) {
    var m = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").match(/^(AB|JG|TT)(\d{4})(\d{4})(\d{5})(\d)$/);
    if (!m) return { ok: false, why: "format" };
    var gid = m[1].toLowerCase(), body = m[2] + m[3] + m[4];
    if (luhn(body) !== +m[5]) return { ok: false, why: "check" };
    var region = REGIONS[m[3][0]];
    if (!region) return { ok: false, why: "terminal" };
    var g = GAMES[gid], r = rng(h32("ticket:" + m[0]));
    var n = 1 + Math.floor(Math.pow(r(), 2) * (gid === "tt" ? 3 : 5)), lines = [];
    for (var i = 0; i < n; i++) lines.push(balls(r, g).sort(function (x, y) { return x - y; }));
    return { ok: true, game: gid, draw: +m[2], terminal: m[3], region: region, ticket: m[4],
      serial: m[1] + "-" + m[2] + "-" + m[3] + "-" + m[4] + "-" + m[5], lines: lines };
  }
  function makeSerial(gid, draw, terminal, ticket) {
    var body = ("000" + draw).slice(-4) + ("000" + terminal).slice(-4) + ("0000" + ticket).slice(-5);
    return GAMES[gid].code + "-" + body.slice(0, 4) + "-" + body.slice(4, 8) + "-" + body.slice(8) + "-" + luhn(body);
  }

  /* Big winners: who and where. Most choose not to be named. */
  var PLACES = [[30, ["Talas", 1]], [22, ["Nurzhan", 2]], [9, ["Iyık Janyl", 3]], [4, ["Kyzyl-Adyr", 5]], [3, ["Tash-Kömür", 7]],
    [3, ["Semiz", 6]], [3, ["Kara-Bulak", 6]], [3, ["Boz-Korgon", 4]], [3, ["Bazar-Korgon", 7]], [2, ["Sary-Bulak", 8]], [2, ["Ming-Örük", 6]]];
  // Where the ticket was sold: a shop type (worded on the page) and, for bazaar kiosks, the bazaar.
  var SHOPS = {
    "Talas": [["cpo"], ["bereke"], ["bereke"], ["bazaar", "Bazar-i Kalan"], ["post"], ["torgoy"], ["kiosk"]],
    "Nurzhan": [["bazaar", "Radiobazar"], ["jildiz"], ["jildiz"], ["post"], ["kiosk"], ["torgoy"], ["bereke"]],
    "Iyık Janyl": [["bazaar", "Iyık Janyl bazarı"], ["post"], ["bereke"], ["kiosk"]],
    "": [["post"], ["post"], ["kiosk"], ["bereke"]]
  };
  var NAMES = {
    m: ["Bakyt", "Nurlan", "Almaz", "Kanat", "Ermek", "Talant", "Azamat", "Mirlan", "Ulan", "Kubat", "Asylbek", "Toktosun", "Sultan", "Marat", "Erkin", "Dmitry", "Sergei", "Vladimir", "Yohannan", "Toma", "Rustam", "Daniyar"],
    f: ["Gulnara", "Aigul", "Nurgul", "Cholpon", "Ainura", "Jyldyz", "Aizada", "Bermet", "Gulmira", "Asel", "Nazira", "Elena", "Tatyana", "Svetlana", "Maryam", "Anara", "Kanykei", "Dinara"]
  };
  var WHO = [[9, "pensioner"], [6, "teacher"], [5, "driver"], [4, "nurse"], [4, "bazaar trader"], [3, "refinery worker"], [3, "farmer"],
    [2, "student"], [2, "railway worker"], [2, "builder"], [2, "shop assistant"], [1, "miner"], [1, "police officer"], [1, "engineer"]];

  function winners(gid, d) {
    var top = d.tiers[0], out = [];
    if (!top || !top.winners || top.k !== GAMES[gid].pick || GAMES[gid].fixed) return out;
    for (var j = 0; j < top.winners; j++) {
      var r = rng(h32("win:" + gid + ":" + d.no + ":" + j));
      var pl = wpick(r, PLACES), place = pl[0];
      var sh = pick(r, SHOPS[place] || SHOPS[""]), shop = { t: sh[0], b: sh[1] || "" };
      var named = r() < 0.3, sex = r() < 0.5 ? "m" : "f";
      var who = wpick(r, WHO), age = who === "pensioner" ? 60 + Math.floor(r() * 20) : who === "student" ? 18 + Math.floor(r() * 5) : 24 + Math.floor(r() * 36);
      var claimAfter = r() < 0.08 ? 99999 : 2 + Math.floor(Math.pow(r(), 3) * 120); // a few are never claimed
      var lines = 1 + Math.floor(r() * 4);
      out.push({ place: place, shop: shop, named: named, name: named ? pick(r, NAMES[sex]) + " " + "ABDEJKMNOSTU"[Math.floor(r() * 12)] + "." : null,
        sex: sex, who: who, age: age, claimDay: d.day + claimAfter, lines: lines,
        serial: makeSerial(gid, d.no, pl[1] * 1000 + Math.floor(r() * 900) + 10, 1 + Math.floor(r() * 99000)) });
    }
    return out;
  }

  /* Tyin instant tickets: series on sale and top prizes left. */
  var TYIN = [
    { id: "2026-5", name: "Tyin Akyel", price: 20, top: 400000, horse: true, tops: 3, printed: 450000, from: "2026-10-20", to: "2027-05-31", art: "akyel" },
    { id: "2026-4", name: "Tyin Kış", price: 10, top: 50000, tops: 12, printed: 600000, from: "2026-10-01", to: "2027-03-31", art: "winter" },
    { id: "2026-3", name: "Tyin Altın", price: 20, top: 200000, tops: 6, printed: 300000, from: "2026-06-01", to: "2026-12-31", art: "gold" },
    { id: "2026-2", name: "Tyin Klassik", price: 5, top: 10000, tops: 40, printed: 1500000, from: "2026-03-11", to: "2026-12-31", art: "classic" },
    { id: "2026-1", name: "Tyin Bayram", price: 10, top: 50000, tops: 10, printed: 500000, from: "2026-01-01", to: "2026-06-30", art: "holiday" }
  ];
  function tyinState(t, now) {
    var a = dayOf(t.from), b = dayOf(t.to), d = todayTalas(now || Date.now());
    var f = Math.max(0, Math.min(1, (d - a) / (b - a)));
    var sold = Math.min(t.printed, Math.round(t.printed * Math.pow(f, 0.8)));
    var r = rng(h32("tyin:" + t.id + ":" + d)), gone = 0;
    for (var i = 0; i < t.tops; i++) if (rng(h32("tyin:" + t.id + ":" + i))() < Math.pow(f, 0.9)) gone++;
    return { sold: sold, left: t.tops - gone, onSale: d >= a && d <= b, ended: d > b, r: r };
  }


  /* Chabysh: the horse-race lottery. Twelve horses; every evening the ball machine draws their finishing order,
     and the race is run on screen to match it. Bets: the winner, the first two in order, or the first three in order. */
  var RACE = {
    id: "ch", code: "CH", name: "Chabysh", time: [19, 30], start: "2023-03-11", price: 5,
    prizes: { win: 30, forecast: 330, tricast: 3300 }, base: 21000, growth: 0.06,
    horses: [
      { n: 1, coat: "#e9e4da", name: "Ak Bulut", silk: "#ffffff", cap: "#3a1768" }, { n: 2, coat: "#2b2420", name: "Kara Jel", silk: "#1e1e1e", cap: "#f4b400", marks: "star" },
      { n: 3, coat: "#9b9b9b", name: "Boz Jorgo", silk: "#8a8f99", cap: "#d22e4b" }, { n: 4, coat: "#6f7884", name: "Kök Jal", silk: "#2f6fd6", cap: "#ffffff" },
      { n: 5, coat: "#7a3e1d", name: "Toru Kaşka", silk: "#8b4a1c", cap: "#f4b400", marks: "blaze" }, { n: 6, coat: "#c9a35a", name: "Sarı Bee", silk: "#f4c430", cap: "#1e1e1e" },
      { n: 7, coat: "#9c3b1b", name: "Kızıl Ay", silk: "#d22e4b", cap: "#ffffff", marks: "blaze" }, { n: 8, coat: "#5a3a22", name: "Jıldız Tay", silk: "#3a1768", cap: "#f4b400", marks: "star" },
      { n: 9, coat: "#d4a637", name: "Doran", silk: "#c9a227", cap: "#3a1768" }, { n: 10, coat: "#7a4a2a", name: "Ak Tuyak", silk: "#0f8a8a", cap: "#ffffff", marks: "socks" },
      { n: 11, coat: "#2b2420", name: "Kara Kuyun", silk: "#5a2a98", cap: "#d22e4b" }, { n: 12, coat: "#8a5a30", name: "Jel Ayak", silk: "#1f8a4c", cap: "#f4c430", marks: "socks" }
    ]
  };
  var raceCache = {};
  function raceHistory(now) {
    now = now || Date.now();
    var key = Math.floor(now / 600000);
    if (raceCache.key === key) return raceCache.out;
    var g = RACE, start = dayOf(g.start), end = todayTalas(now), out = [], no = 0;
    for (var day = start; day <= end; day++) {
      var at = day * DAY + (g.time[0] * 60 + g.time[1]) * 60000 - TZ;
      if (at + 10 * 60000 > now) break;
      no++;
      var r = rng(h32("ch:" + no)), pool = [], order = [];
      for (var i = 1; i <= 12; i++) pool.push(i);
      while (pool.length) order.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
      var yrs = (day - start) / 365.25, wd = weekday(day);
      var lines = Math.round(g.base * Math.pow(1 + g.growth, yrs) * season(day) * (wd === 0 || wd === 6 ? 1.2 : 1) * (1 + 0.08 * gauss(r)));
      // bets split roughly 55% win, 30% forecast, 15% tricast
      var w = { win: poisson(r, lines * 0.55 / 12), forecast: poisson(r, lines * 0.30 / 132), tricast: poisson(r, lines * 0.15 / 1320) };
      out.push({ game: "ch", no: no, day: day, date: isoOf(day), order: order, lines: lines, sales: lines * g.price, winners: w,
        margins: [0, 1, 2].map(function () { return pick(r, ["a nose", "a head", "a neck", "half a length", "a length", "two lengths"]); }) });
    }
    raceCache = { key: key, out: out };
    return out;
  }
  function nextRace(now) {
    now = now || Date.now();
    var h = raceHistory(now), last = h[h.length - 1], day = last ? last.day + 1 : dayOf(RACE.start);
    var at = function (d) { return d * DAY + (RACE.time[0] * 60 + RACE.time[1]) * 60000 - TZ; };
    while (at(day) + 10 * 60000 <= now) day++;
    return { game: "ch", no: (last ? last.no : 0) + 1, day: day, date: isoOf(day), at: at(day), closes: at(day) - 15 * 60000 };
  }
  // Prize for a bet: type win (1 horse), forecast (2 in order) or tricast (3 in order).
  function getRace(no, now) { return raceHistory(now)[no - 1] || null; }
  function raceScore(d, type, picks) {
    var k = type === "win" ? 1 : type === "forecast" ? 2 : 3;
    for (var i = 0; i < k; i++) if (d.order[i] !== picks[i]) return 0;
    return RACE.prizes[type];
  }

  window.Loto = {
    GAMES: GAMES, ORDER: ORDER, TYIN: TYIN, DAY: DAY, TZ: TZ,
    history: history, nextDraw: nextDraw, getDraw: getDraw, score: score, pMatch: pMatch,
    parseSerial: parseSerial, makeSerial: makeSerial, winners: winners, tyinState: tyinState,
    RACE: RACE, raceHistory: raceHistory, nextRace: nextRace, raceScore: raceScore, getRace: getRace,
    dayOf: dayOf, isoOf: isoOf, weekday: weekday, todayTalas: todayTalas, h32: h32, rng: rng
  };
})();
