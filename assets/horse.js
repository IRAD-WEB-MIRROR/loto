/* IradLoto: the Chabysh racehorses. Each horse is an SVG with jointed legs; Horse.pose() moves it through a
   gallop cycle (t from 0 to 1), Horse.stand() puts it at rest. */
(function () {
  "use strict";
  var uid = 0;

  function shade(hex, f) { // f < 0 darker, > 0 lighter
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(x) { return Math.max(0, Math.min(255, Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f))); }
    return "#" + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }

  // leg geometry: joint position, upper and lower length, widths
  var LEGS = {
    hf: { x: 47, y: 47, L1: 17, L2: 18, w1: 10, w2: 4.2, hind: true, far: true, ph: 0.12 },
    ff: { x: 84, y: 49, L1: 16, L2: 19, w1: 8, w2: 3.8, hind: false, far: true, ph: 0.46 },
    hn: { x: 43, y: 46, L1: 17, L2: 18, w1: 11, w2: 4.4, hind: true, far: false, ph: 0 },
    fn: { x: 88, y: 49, L1: 16, L2: 19, w1: 8.5, w2: 4.2, hind: false, far: false, ph: 0.56 }
  };

  function rest(g) { return g.hind ? [18 + (g.far ? -6 : 4), -24] : [g.far ? -6 : 4, 0]; }
  function legSVG(k, coat, sock) {
    var g = LEGS[k], r0 = rest(g), x = g.x, y = g.y, c = g.far ? shade(coat, -0.32) : coat, sk = sock ? (g.far ? "#d9d4cb" : "#f4f1ea") : c;
    var hoof = g.far ? "#1a1512" : "#2a221d";
    var up = "M" + (x - g.w1 / 2) + " " + (y - 3) + " L" + (x + g.w1 / 2) + " " + (y - 3) + " L" + (x + g.w2 / 2 + 1) + " " + (y + g.L1) + " L" + (x - g.w2 / 2 - 1) + " " + (y + g.L1) + "Z";
    var ky = y + g.L1, lo = "M" + (x - g.w2 / 2) + " " + ky + " L" + (x + g.w2 / 2) + " " + ky + " L" + (x + g.w2 / 2 - 0.4) + " " + (ky + g.L2 - 3) + " L" + (x - g.w2 / 2 + 0.4) + " " + (ky + g.L2 - 3) + "Z";
    var fet = "M" + (x - g.w2 / 2 + 0.4) + " " + (ky + g.L2 - 6) + " L" + (x + g.w2 / 2 - 0.4) + " " + (ky + g.L2 - 6) + " L" + (x + g.w2 / 2 + 0.3) + " " + (ky + g.L2 - 1) + " L" + (x - g.w2 / 2 - 0.3) + " " + (ky + g.L2 - 1) + "Z";
    return '<g data-leg="' + k + '" transform="rotate(' + r0[0] + " " + x + " " + y + ')"><path d="' + up + '" fill="' + c + '"/><circle cx="' + x + '" cy="' + ky + '" r="' + (g.w2 / 2 + 0.9) + '" fill="' + c + '"/>' +
      '<g data-low="1" transform="rotate(' + r0[1] + " " + x + " " + ky + ')"><path d="' + lo + '" fill="' + c + '"/><path d="' + fet + '" fill="' + sk + '"/>' +
      '<path d="M' + (x - g.w2 / 2 - 0.6) + " " + (ky + g.L2 - 1.2) + " L" + (x + g.w2 / 2 + 1.6) + " " + (ky + g.L2 - 1.2) + " L" + (x + g.w2 / 2 + 1.2) + " " + (ky + g.L2 + 1.6) + " L" + (x - g.w2 / 2 - 0.6) + " " + (ky + g.L2 + 1.6) + 'Z" fill="' + hoof + '"/></g></g>';
  }

  function svg(h, cls) {
    var id = "hz" + (++uid), coat = h.coat, dark = shade(coat, -0.45), mane = h.mane || dark, silk = h.silk, cap = h.cap;
    var socks = h.marks === "socks", blaze = h.marks === "blaze", star = h.marks === "star";
    var white = silk.toLowerCase() === "#ffffff";
    return '<svg class="horse ' + (cls || "") + '" viewBox="0 0 140 90" aria-hidden="true" data-horse="' + h.n + '">' +
      '<defs><radialGradient id="' + id + 'm" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="68" cy="86" rx="40" ry="3" fill="#000" opacity=".18" data-shadow="1"/>' +
      '<g data-body="1">' +
      legSVG("hf", coat, socks) + legSVG("ff", coat, socks) + legSVG("hn", coat, socks) + legSVG("fn", coat, socks) +
      // tail
      '<g data-tail="1" transform="rotate(-14 34 38)"><path d="M34 37 C24 34 14 38 7 48 C10 50 13 47 17 46 C14 51 16 52 20 48 C24 46 28 45 33 44 Z" fill="' + mane + '"/></g>' +
      // body
      '<path d="M40 34 C50 29 66 31 82 31 C90 30 96 33 98 40 C100 48 97 56 90 58 C80 61 62 61 52 58 C46 57 40 56 36 52 C30 48 28 40 32 36 C34 34 37 34 40 34 Z" fill="' + coat + '"/>' +
      '<ellipse cx="44" cy="42" rx="11" ry="9" fill="url(#' + id + 'm)"/><ellipse cx="89" cy="44" rx="8" ry="9" fill="url(#' + id + 'm)"/>' +
      '<path d="M52 58 C62 60 80 60 90 57" stroke="' + dark + '" stroke-opacity=".35" stroke-width="1.2" fill="none"/>' +
      // neck and head
      '<g data-head="1" transform="rotate(-4 92 38)"><path d="M84 34 C88 24 96 15 106 10 C109 8 112 9 114 11 L124 24 C126 27 124 30 120 29 L113 27 C109 27 106 30 103 33 C99 38 98 44 96 46 Z" fill="' + coat + '"/>' +
      '<path d="M108 10 L110 3 L113 9 Z" fill="' + dark + '"/>' +
      (blaze ? '<path d="M113 12 L122 24 L120 26 L111 14 Z" fill="#f4f1ea"/>' : "") + (star ? '<circle cx="113.5" cy="13" r="1.6" fill="#f4f1ea"/>' : "") +
      '<circle cx="114.5" cy="15.5" r="1.3" fill="#140f0c"/><circle cx="121.5" cy="25.5" r=".8" fill="#140f0c"/>' +
      '<path d="M86 33 C90 23 97 15 106 9 L107 13 C100 18 94 25 90 35 Z" fill="' + mane + '"/>' +
      // bridle
      '<path d="M111 11 L117 27 M111 18 L122 20" stroke="#3a2a1e" stroke-width=".9" fill="none"/></g>' +
      // saddle cloth and number
      '<path d="M53 31 L72 30 L73 46 L55 47 Z" fill="#fff" stroke="#0002"/><text x="63.5" y="42.5" text-anchor="middle" font-size="10.5" font-weight="800" fill="#1e1530" font-family="Inter,Arial,sans-serif">' + h.n + "</text>" +
      // jockey, crouched over the withers: far arm, thigh and boot, torso, near arm, head
      '<g data-jockey="1"><path d="M86 19 L97 25" stroke="' + shade(silk, -0.3) + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M69 26 L83 29 L77 38" stroke="' + (white ? "#dcd7cd" : "#f4f1ea") + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M78.5 34 L76.5 40.5 L81 41" stroke="#1b1b1b" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '<path d="M76 40.5 L84 41" stroke="#888" stroke-width=".8"/>' +
      '<path d="M66 26 Q75 16 87 18" stroke="' + silk + '" stroke-width="9" stroke-linecap="round" fill="none"/>' +
      (white ? '<path d="M66 26 Q75 16 87 18" stroke="#0002" stroke-width="9.6" stroke-linecap="round" fill="none" style="mix-blend-mode:multiply" opacity=".25"/>' : "") +
      '<path d="M73 15.5 L76 25" stroke="' + cap + '" stroke-width="3.2"/>' +
      '<path d="M87 18.5 L98 26" stroke="' + silk + '" stroke-width="3.8" stroke-linecap="round"/><circle cx="98.5" cy="26.3" r="1.9" fill="#d9a77c"/>' +
      '<path d="M98.5 26.3 L119 27" stroke="#3a2a1e" stroke-width=".8"/>' +
      '<circle cx="92" cy="15" r="2" fill="#d9a77c"/>' +
      '<path d="M86.5 12.5 A5 5 0 0 1 96.5 12.5 Z" fill="' + cap + '" stroke="#0003" stroke-width=".5"/><path d="M95.5 12 L100 13 L95.5 13.4 Z" fill="' + shade(cap, -0.35) + '"/>' +
      '<path d="M88 12.5 L95.5 12.5 L94 16 C92 17 89.5 16.5 88.5 15 Z" fill="#d9a77c"/><path d="M93 13.6 L96.5 13.6" stroke="#222" stroke-width="1.1"/></g>' +
      "</g></svg>";
  }

  // joint angles for a leg at cycle position s (0..1); stance 0..0.38, swing after
  function angles(g, s, amp) {
    var a1, a2, fl;
    if (s < 0.38) { var v = s / 0.38; a1 = -1 + 2 * v; fl = 0; }
    else { var u = (s - 0.38) / 0.62, e = u * u * (3 - 2 * u); a1 = 1 - 2 * e; fl = Math.sin(Math.PI * Math.min(1, u * 1.15)); }
    if (g.hind) return [18 + amp * (a1 * 30), -24 - amp * (fl * 58) + amp * (a1 > 0 ? a1 * 10 : 0)];
    return [amp * (a1 * 36 - (a1 < 0 ? 8 : 0)), amp * (fl * 95 + (a1 < -0.6 ? -6 : 0))];
  }

  function parts(el) {
    if (el._hz) return el._hz;
    var p = { body: el.querySelector("[data-body]"), head: el.querySelector("[data-head]"), tail: el.querySelector("[data-tail]"), legs: {} };
    Object.keys(LEGS).forEach(function (k) { var g = el.querySelector('[data-leg="' + k + '"]'); p.legs[k] = { g: g, low: g.querySelector("[data-low]") }; });
    el._hz = p;
    return p;
  }

  // t: gallop cycle 0..1; amp: 1 at full gallop, 0 standing
  function pose(el, t, amp) {
    if (amp == null) amp = 1;
    var p = parts(el);
    Object.keys(LEGS).forEach(function (k) {
      var g = LEGS[k], a = angles(g, ((t + g.ph) % 1 + 1) % 1, amp);
      p.legs[k].g.setAttribute("transform", "rotate(" + a[0].toFixed(1) + " " + g.x + " " + g.y + ")");
      p.legs[k].low.setAttribute("transform", "rotate(" + a[1].toFixed(1) + " " + g.x + " " + (g.y + g.L1) + ")");
    });
    var bob = amp * 2.2 * Math.cos(4 * Math.PI * t), pitch = amp * 2.5 * Math.sin(2 * Math.PI * (t + 0.2));
    p.body.setAttribute("transform", "translate(0 " + bob.toFixed(2) + ") rotate(" + pitch.toFixed(2) + " 66 46)");
    p.head.setAttribute("transform", "rotate(" + (amp * 5 * Math.sin(2 * Math.PI * (t + 0.45))).toFixed(2) + " 92 38)");
    p.tail.setAttribute("transform", "rotate(" + (amp * 10 * Math.sin(2 * Math.PI * t) - amp * 12).toFixed(2) + " 34 38)");
  }
  function stand(el) {
    var p = parts(el);
    Object.keys(LEGS).forEach(function (k) {
      var g = LEGS[k], a = rest(g);
      p.legs[k].g.setAttribute("transform", "rotate(" + a[0] + " " + g.x + " " + g.y + ")");
      p.legs[k].low.setAttribute("transform", "rotate(" + a[1] + " " + g.x + " " + (g.y + g.L1) + ")");
    });
    p.body.setAttribute("transform", ""); p.head.setAttribute("transform", "rotate(-4 92 38)"); p.tail.setAttribute("transform", "rotate(-14 34 38)");
  }

  window.Horse = { svg: svg, pose: pose, stand: stand };
})();
