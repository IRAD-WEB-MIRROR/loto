/* IradLoto: the draw machine. At the draw hour the draw is shown live, ball by ball, with the same numbers as the
   published results; the rest of the time the last draw can be replayed. */
(function () {
  "use strict";
  var L = window.Loto, I = window.I18N || {};
  var COL = { gold: ["#fff6cf", "#f4b400", "#a87800", "#2a1a00"], red: ["#ffd0d8", "#d22e4b", "#7d1027", "#fff"], teal: ["#c9f2f2", "#0f8a8a", "#064d4d", "#fff"] };
  var LIVE_LEAD = 60, LIVE_GAP = 75, REPLAY_LEAD = 3, REPLAY_GAP = 3.2;
  var li = 0;

  function T(k) { var v = I[k]; return v ? (v[li] || v[0]) : k; }
  function F(k, o) { return T(k).replace(/\{(\w+)\}/g, function (_, n) { return o[n] != null ? o[n] : ""; }); }
  function $(s) { return document.querySelector(s); }
  function pad(n) { return ("0" + n).slice(-2); }
  function dstr(day) { var p = L.isoOf(day).split("-"); return p[2] + "." + p[1] + "." + p[0]; }

  /* the draw that is on air now, if any: [at, at + 10 min) */
  function onAir(now) {
    for (var i = 0; i < L.ORDER.length; i++) {
      var gid = L.ORDER[i], g = L.GAMES[gid], day = L.todayTalas(now);
      if (g.days.indexOf(L.weekday(day)) < 0) continue;
      var at = day * L.DAY + (g.time[0] * 60 + g.time[1]) * 60000 - L.TZ;
      if (now >= at && now < at + 10 * 60000) {
        var n = L.nextDraw(gid, now);  /* not yet in the results until ten minutes after */
        return { gid: gid, no: n.no, day: day, at: at };
      }
    }
    return null;
  }
  function soonest(now) {
    var best = null;
    L.ORDER.forEach(function (gid) { var n = L.nextDraw(gid, now); if (!best || n.at < best.at) best = n; });
    return best;
  }
  function latest(now) {
    var best = null;
    L.ORDER.forEach(function (gid) { var h = L.history(gid, now), d = h[h.length - 1]; if (d && (!best || d.day > best.day || (d.day === best.day && L.GAMES[gid].time[0] * 60 + L.GAMES[gid].time[1] > L.GAMES[best.game].time[0] * 60 + L.GAMES[best.game].time[1]))) best = d; });
    return best;
  }

  /* ---------- the machine ---------- */
  function Machine(cv) {
    var ctx = cv.getContext("2d"), W, H, cx, cy, R, rb, balls = [], out = [], flying = null, colour = "gold", spin = 0.4, last = 0;
    function size() {
      var w = cv.clientWidth || 360, dpr = window.devicePixelRatio || 1;
      W = w; H = Math.round(w * 0.82); cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H * 0.44; R = Math.min(W * 0.38, H * 0.4); rb = R * 0.085;
    }
    function load(g, drawn) {
      colour = g.colour; balls = []; out = drawn.slice(); flying = null;
      for (var n = 1; n <= g.of; n++) {
        if (out.indexOf(n) >= 0) continue;
        var a = Math.random() * Math.PI * 2, r = Math.random() * (R - rb * 2);
        balls.push({ n: n, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2 });
      }
    }
    function ballDraw(b, x, y, s) {
      var c = COL[colour], r = rb * (s || 1), gr = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
      gr.addColorStop(0, c[0]); gr.addColorStop(.55, c[1]); gr.addColorStop(1, c[2]);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
      ctx.fillStyle = c[3]; ctx.font = "bold " + Math.round(r * 1.05) + "px Inter, Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(b.n), x, y + r * .05);
    }
    function step(dt) {
      var grav = (520 * spin + 180) * R / 150;
      balls.forEach(function (b) {
        b.vy += grav * dt;
        if (b.y > cy + R * .3 && Math.random() < 6 * dt * spin) { b.vy = -(350 + Math.random() * 450) * spin * R / 150; b.vx += (Math.random() - .5) * 420 * spin * R / 150; }
        b.vx *= 0.998; b.vy *= 0.998;
        b.x += b.vx * dt; b.y += b.vy * dt;
        var dx = b.x - cx, dy = b.y - cy, d = Math.sqrt(dx * dx + dy * dy), lim = R - rb - 3;
        if (d > lim) {
          var nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          b.x = cx + nx * lim; b.y = cy + ny * lim;
          if (dot > 0) { b.vx -= 1.85 * dot * nx; b.vy -= 1.85 * dot * ny; }
        }
      });
      for (var i = 0; i < balls.length; i++) for (var j = i + 1; j < balls.length; j++) {
        var a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, dd = dx * dx + dy * dy, m = rb * 2;
        if (dd < m * m && dd > 0.01) {
          var d = Math.sqrt(dd), push = (m - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
          var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { a.vx += rv * nx; a.vy += rv * ny; b.vx -= rv * nx; b.vy -= rv * ny; }
        }
      }
      if (flying) flying.t = Math.min(1, flying.t + dt / 1.4);
    }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      /* stand and chute */
      ctx.fillStyle = "#2a1150"; ctx.fillRect(cx - R * .55, cy + R + 2, R * 1.1, H * .06);
      ctx.fillStyle = "#3a1768"; ctx.beginPath(); ctx.moveTo(cx - R * .7, H - 4); ctx.lineTo(cx + R * .7, H - 4); ctx.lineTo(cx + R * .45, cy + R + H * .06); ctx.lineTo(cx - R * .45, cy + R + H * .06); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = rb * 2.5;
      ctx.beginPath(); ctx.moveTo(cx + R * .2, cy + R * .97); ctx.quadraticCurveTo(cx + R * 1.15, cy + R * 1.05, cx + R * 1.18, H - rb * 2); ctx.stroke();
      /* globe */
      var gl = ctx.createRadialGradient(cx - R * .3, cy - R * .4, R * .1, cx, cy, R);
      gl.addColorStop(0, "rgba(255,255,255,.35)"); gl.addColorStop(.7, "rgba(200,190,255,.12)"); gl.addColorStop(1, "rgba(90,42,152,.35)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      balls.forEach(function (b) { ballDraw(b, b.x, b.y); });
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - R * .1, cy - R * .1, R * .78, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
      /* a ball on its way down the chute */
      if (flying) {
        var t = flying.t, x0 = cx + R * .2, y0 = cy + R * .97, x2 = cx + R * 1.18, y2 = H - rb * 2, x1 = cx + R * 1.15, y1 = cy + R * 1.05;
        var x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
        ballDraw(flying.b, x, y, 1.15);
        if (t >= 1) { var cb = flying.cb; flying = null; if (cb) cb(); }
      }
    }
    function frame(ts) {
      var dt = Math.min(0.033, (ts - (last || ts)) / 1000); last = ts;
      if (!document.hidden) { step(dt); paint(); }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", function () { size(); balls.forEach(function (b) { b.x = cx + (Math.random() - .5) * R; b.y = cy + (Math.random() - .5) * R; }); });
    requestAnimationFrame(frame);
    return {
      load: load,
      spin: function (s) { spin = s; },
      release: function (n, cb) {
        var i = -1; balls.forEach(function (b, k) { if (b.n === n) i = k; });
        var b = i >= 0 ? balls.splice(i, 1)[0] : { n: n };
        out.push(n); flying = { b: b, t: 0, cb: cb };
      }
    };
  }

  /* ---------- the page ---------- */
  function start() {
    var root = $("#draw"); if (!root || !L) return;
    li = Math.max(0, ["en", "ky-Latn", "ru"].indexOf(document.documentElement.lang));
    root.innerHTML = '<div class="dm-head"><span class="dm-badge" id="dmBadge"></span><span id="dmTitle"></span></div>' +
      '<div class="dm-stage"><canvas id="dmCanvas" aria-hidden="true"></canvas><div class="dm-side"><div class="balls dm-tray" id="dmTray"></div><p class="dm-msg" id="dmMsg"></p><div class="dm-btns" id="dmBtns"></div></div></div>';
    var M = Machine($("#dmCanvas")), timer = null, mode = null;
    function tray(g, nums) {
      $("#dmTray").innerHTML = nums.map(function (n) { return '<span class="ball lg ' + (g.colour === "gold" ? "" : g.colour) + ' dm-in">' + n + "</span>"; }).join("") +
        new Array(g.pick - nums.length + 1).join('<span class="ball lg miss">?</span>');
    }
    function buttons() {
      $("#dmBtns").innerHTML = L.ORDER.map(function (gid) {
        var h = L.history(gid), d = h[h.length - 1];
        return d ? '<button class="btn alt" data-g="' + gid + '">' + F("dm.replayOf", { g: L.GAMES[gid].name, no: d.no }) + "</button>" : "";
      }).join(" ");
      Array.prototype.forEach.call($("#dmBtns").querySelectorAll("button"), function (b) {
        b.onclick = function () { var h = L.history(b.getAttribute("data-g")); replay(h[h.length - 1]); };
      });
    }
    function replay(d) {
      clearTimeout(timer); mode = "replay";
      var g = L.GAMES[d.game], shown = [];
      M.load(g, []); M.spin(1); tray(g, []);
      $("#dmBadge").textContent = T("dm.replay"); $("#dmBadge").className = "dm-badge rep";
      $("#dmTitle").textContent = F("dm.drawOf", { g: g.name, no: d.no, d: dstr(d.day) });
      $("#dmMsg").textContent = T("dm.mixing");
      var i = 0;
      function next() {
        if (mode !== "replay") return;
        if (i >= d.balls.length) { M.spin(0.35); $("#dmMsg").innerHTML = F("dm.done", { l: '<a href="results.html#' + d.game + "-" + d.no + '">' + T("dm.prizes") + "</a>" }); mode = "idle"; timer = setTimeout(tick, 15000); return; }
        var n = d.balls[i++];
        M.release(n, function () { shown.push(n); tray(g, shown); });
        $("#dmMsg").textContent = F("dm.ball", { k: i, of: g.pick });
        timer = setTimeout(next, REPLAY_GAP * 1000);
      }
      timer = setTimeout(next, REPLAY_LEAD * 1000);
    }
    function live(a) {
      var g = L.GAMES[a.gid], nums = L.drawBalls(a.gid, a.no), now = Date.now(), el = (now - a.at) / 1000;
      var done = nums.filter(function (_, k) { return el >= LIVE_LEAD + k * LIVE_GAP + 1.4; });
      if (mode !== "live:" + a.gid + a.no) { mode = "live:" + a.gid + a.no; M.load(g, done); M.spin(1); tray(g, done); live.shown = done.slice(); }
      $("#dmBadge").textContent = T("dm.live"); $("#dmBadge").className = "dm-badge on";
      $("#dmTitle").textContent = F("dm.drawOf", { g: g.name, no: a.no, d: dstr(a.day) });
      var k = live.shown.length;
      if (k < nums.length) {
        var due = LIVE_LEAD + k * LIVE_GAP - el;
        if (due <= 0) {
          var n = nums[k]; live.shown.push(n);
          M.release(n, function () { tray(g, live.shown); });
          $("#dmMsg").textContent = F("dm.ball", { k: k + 1, of: g.pick });
        } else $("#dmMsg").textContent = k ? F("dm.nextIn", { s: Math.ceil(due) }) : F("dm.startsIn", { s: Math.ceil(due) });
        timer = setTimeout(tick, 1000);
      } else {
        M.spin(0.35);
        $("#dmMsg").textContent = T("dm.liveDone");
        timer = setTimeout(tick, 5000);
      }
    }
    function tick() {
      clearTimeout(timer);
      var now = Date.now(), a = onAir(now);
      if (a) { live(a); return; }
      if (mode && mode.indexOf("live:") === 0) mode = null;
      if (mode === "replay") return;
      var n = soonest(now), g = L.GAMES[n.game], s = Math.max(0, Math.floor((n.at - now) / 1000));
      $("#dmBadge").textContent = T("dm.next"); $("#dmBadge").className = "dm-badge";
      $("#dmTitle").textContent = F("dm.drawOf", { g: g.name, no: n.no, d: dstr(n.day) }) + ", " + pad(g.time[0]) + ":" + pad(g.time[1]);
      $("#dmMsg").textContent = F("dm.in", { h: Math.floor(s / 3600), m: pad(Math.floor(s / 60) % 60), s: pad(s % 60) });
      timer = setTimeout(tick, 1000);
    }
    buttons();
    var a = onAir(Date.now()), d = latest(Date.now());
    if (a || !d) tick(); else replay(d);   /* last night's draw plays once when the page opens */
  }
  document.addEventListener("DOMContentLoaded", function () { try { start(); } catch (e) { if (window.console) console.error(e); } });
})();
