/* ==========================================================================
   ENVIRONMENT KIT — daldongne pieces, all drawn on the shared grid.
   ========================================================================== */
const RAMP = {
  cement: [G1, G2, G2, G3], cementD: [G0, G1, G1, G2], teal: [T2, T3, T3, T4], tealD: [T1, T2, T2, T3],
  moss: [M0, M1, M2, M2, M3], ground: [G0, G1, G1, G2], groundD: [K1, G0, G0, G1], brick: [Y0, R1, Y0, R0]
};

// stepped sky: list of [colour, height] bands with a 3px dithered seam between bands
function sky(b, x, y, w, bands, seed = 1) {
  let cy = y;
  for (let i = 0; i < bands.length; i++) {
    const [c, h] = bands[i]; R(b, x, cy, w, h, c);
    if (i > 0) { D(b, x, cy, w, 2, bands[i - 1][0], 0.5); D(b, x, cy + 2, w, 2, bands[i - 1][0], 0.18); }
    cy += h;
  }
  return cy;
}
// long thin cloud strata (stepped, no blur)
function strata(b, x0, y0, w, c, seed, n = 6, lighter = null) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const cx = x0 + r() * w, cy = y0 + r() * 30, len = 30 + r() * 120, th = 1 + (r() * 3 | 0);
    for (let k = 0; k < th; k++) {
      const l = len * (1 - k / (th + 1)), sx = cx + (len - l) * 0.5 + (r() - 0.5) * 6;
      R(b, sx, cy + k, l, 1, c);
      if (lighter && k === 0) R(b, sx + l * 0.2, cy - 1, l * 0.5, 1, lighter);
    }
  }
}
// distant apartment slabs with numbered ends and a sparse scatter of lit windows
function apartments(b, x0, x1, baseY, seed, o = {}) {
  const r = rng(seed), body = o.body || T2, edge = o.edge || T3, win = o.win || T1;
  let x = x0;
  while (x < x1) {
    const w = 34 + (r() * 50 | 0), h = 46 + (r() * 46 | 0), y = baseY - h, gap = 4 + (r() * 14 | 0);
    R(b, x, y, w, h, body); R(b, x, y, 2, h, edge); R(b, x, y - 2, w, 2, edge);
    // roof structures
    R(b, x + 4 + (r() * (w - 14) | 0), y - 6, 8, 4, body);
    for (let fy = y + 4; fy < baseY - 3; fy += 4) {
      R(b, x + 3, fy + 2, w - 4, 1, win);
      for (let fx = x + 4; fx < x + w - 3; fx += 3) {
        const q = r();
        if (q < (o.lit || 0.05)) { P(b, fx, fy, Y2); if (q < 0.012) P(b, fx + 1, fy, Y1); }
        else if (q < 0.4) P(b, fx, fy, win);
      }
    }
    if (o.num && w > 40) digits(b, String(101 + (r() * 9 | 0)), x + 3, y + 3, edge);
    x += w + gap;
  }
}
// textured wall block with stains, cracks, moss foot
function wall(b, x, y, w, h, ramp, seed, o = {}) {
  tex(b, x, y, w, h, ramp, seed, o.sc || 0.07, 0.05);
  const r = rng(seed + 5);
  if (o.peel) for (let i = 0; i < o.peel; i++) { // peeled paint showing cement
    const px = x + r() * w, py = y + r() * h, pw = 3 + r() * 10, ph = 2 + r() * 6;
    tex(b, px, py, pw, ph, RAMP.cement, seed + i, 0.2, 0.1); L(b, px, py + ph, px + pw, py + ph, ramp[0]);
  }
  streaks(b, x, y, w, Math.min(h, o.streak || 14), ramp[0], seed + 9, 0.22);
  for (let i = 0; i < (o.cracks || 2); i++) crack(b, x + r() * w, y + r() * h * 0.5, 6 + r() * h * 0.6, ramp[0] === G0 ? K1 : G0, seed + i * 17);
  if (o.moss !== false) {
    for (let i = 0; i < w; i++) {
      const mh = Math.floor(fbm((x + i) * 0.15, y, seed) * 7 - 1), by = o.base ? o.base(x + i) : y + h;
      for (let j = 0; j < mh; j++) P(b, x + i, by - 1 - j, j > mh - 2 ? M2 : (bay(x + i, by - j) < 0.5 ? M1 : M0));
    }
  }
}
function brickWall(b, x, y, w, h, seed) {
  R(b, x, y, w, h, G1);
  for (let j = 0; j < h; j += 3) for (let i = -((j / 3) & 1) * 3; i < w; i += 6) {
    const c = [Y0, R1, Y0, R0, Y0][(hash(i + x, j + y, seed) * 5) | 0];
    R(b, Math.max(x, x + i), y + j, Math.min(5, x + w - (x + i)) + Math.min(0, i), Math.min(2, h - j), c);
  }
  streaks(b, x, y, w, 10, K1, seed + 2, 0.15);
}
// window: frame, glass (dark or lit), security bars, optional curtain
function windowW(b, x, y, w, h, o = {}) {
  R(b, x - 1, y - 1, w + 2, h + 2, o.frame || G0);
  if (o.lit) {
    R(b, x, y, w, h, Y2); R(b, x + 1, y + 1, w - 2, h - 3, Y3);
    if (o.curtain) { R(b, x, y, Math.ceil(w * 0.4), h, Y1); D(b, x, y, Math.ceil(w * 0.4), h, Y0, 0.3); }
  } else {
    R(b, x, y, w, h, o.glass || K1);
    if (!o.noReflect) { L(b, x + 1, y + h - 2, x + Math.min(w - 2, 3), y + h - 4, o.refl || T2); }
  }
  if (o.bars !== false) for (let i = x + 1; i < x + w; i += 2) R(b, i, y - 1, 1, h + 2, o.barc || G1);
  R(b, x - 1, y + h + 1, w + 2, 1, G3); // sill
  streaks(b, x - 1, y + h + 2, w + 2, 8, K1, x * 7 + y, 0.35);
}
// green metal gate (대문)
function gate(b, x, y, w, h, o = {}) {
  const c = o.c || M2, d = o.d || M1, l = o.l || M3;
  R(b, x - 2, y - 3, w + 4, h + 3, G1); R(b, x - 2, y - 3, w + 4, 1, G3);
  R(b, x, y, w, h, c);
  const half = w >> 1;
  for (const px of [x, x + half]) {
    R(b, px + 2, y + 3, half - 4, ri(h * 0.4), d); R(b, px + 2, y + 3, half - 4, 1, K1);
    R(b, px + 2, y + 6 + ri(h * 0.4), half - 4, ri(h * 0.45) - 4, d);
    R(b, px + 3, y + 4, 1, ri(h * 0.4) - 2, l);
  }
  R(b, x + half, y, 1, h, K1);
  R(b, x + half + 3, y + ri(h * 0.48), 2, 3, G4); // handle
  streaks(b, x, y + 2, w, ri(h * 0.6), Y0, x + y, 0.18);
  if (o.ajar) { R(b, x + half - 1, y, 2, h, K0); }
}
function door(b, x, y, w, h, c = G2) {
  R(b, x - 1, y - 1, w + 2, h + 1, G0); R(b, x, y, w, h, c);
  R(b, x + 2, y + 2, w - 4, ri(h * 0.45), DN[c]); R(b, x + 2, y + ri(h * 0.55), w - 4, ri(h * 0.38), DN[c]);
  P(b, x + w - 3, y + ri(h * 0.5), G4);
}
// corrugated slate roof seen from the front-slope (sloping upward)
function slate(b, x, y, w, h, seed, o = {}) {
  const c1 = o.c1 || G2, c2 = o.c2 || G1, c3 = o.c3 || G3;
  for (let i = 0; i < w; i++) {
    const c = (i % 3 === 0) ? c3 : (i % 3 === 1) ? c1 : c2;
    R(b, x + i, y, 1, h, c);
  }
  // moss & grime bands
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const n = fbm((x + i) * 0.12, (y + j) * 0.3, seed);
    if (n > 0.62) P(b, x + i, y + j, n > 0.7 ? M1 : M0); else if (n < 0.3 && bay(x + i, y + j) < 0.4) P(b, x + i, y + j, c2);
  }
  R(b, x - 1, y + h, w + 2, 1, K1); R(b, x - 1, y + h - 1, w + 2, 1, G0); // eave shadow
  R(b, x - 1, y, w + 2, 1, G3);
  const r = rng(seed);
  // weights: tyres and bricks
  for (let i = 0; i < (o.weights || 2); i++) {
    const tx = x + 4 + r() * (w - 14), ty = y + r() * (h - 4);
    if (r() < 0.6) { ell(b, ri(tx), ri(ty) + 1, 4, 1, K1); ell(b, ri(tx), ri(ty) + 1, 2, 0, G0); }
    else { R(b, tx, ty, 4, 2, R1); R(b, tx, ty, 4, 1, Y0); }
  }
}
// tiled roof edge (기와 style) — rows of half-round tiles
function tileRoof(b, x, y, w, h, c = T1) {
  R(b, x, y, w, h, c);
  for (let j = 0; j < h; j += 3) for (let i = (j / 3 & 1) * 2; i < w; i += 4) { P(b, x + i, y + j, UP[c]); P(b, x + i + 1, y + j, UP[c]); R(b, x + i, y + j + 2, 4, 1, DN[c]); }
  R(b, x - 1, y + h, w + 2, 1, K1);
}
function waterTank(b, x, y, s = 1) { // x,y = bottom-left; cylinder ~ 12×14
  const w = ri(12 * s), h = ri(13 * s);
  R(b, x, y - h, w, h, B1); R(b, x + w - ri(4 * s), y - h, ri(4 * s), h, B0); R(b, x + 2, y - h, 1, h, T5);
  for (let j = y - h + 3; j < y - 1; j += ri(4 * s)) R(b, x, j, w, 1, B0);
  ell(b, x + (w >> 1), y - h, w >> 1, 1, B0); R(b, x + (w >> 1) - 2, y - h - 2, 4, 1, B1);
  R(b, x - 1, y, w + 2, 1, K1);
}
function basin(b, x, y, w = 9, tipped = 0) { // red rubber basin (고무대야), x,y bottom-left
  if (!tipped) {
    poly(b, [[x, y - 5], [x + w, y - 5], [x + w - 1, y], [x + 1, y]], R3);
    R(b, x - 1, y - 6, w + 2, 1, R4); R(b, x, y - 5, w, 1, R1); R(b, x + w - 3, y - 4, 2, 4, R2);
  } else return;
}
function styro(b, x, y, w, h, seed, peppers = true) { // styrofoam box garden, x,y bottom-left
  R(b, x, y - h, w, h, G5); R(b, x, y - h, w, 1, WH); R(b, x + w - 2, y - h, 2, h, G4); R(b, x, y - 1, w, 1, G3);
  D(b, x, y - h + 1, w, h - 1, G4, 0.12);
  const r = rng(seed);
  for (let i = 1; i < w - 1; i++) {
    const ph = 2 + (r() * 6 | 0);
    L(b, x + i, y - h - 1, x + i + (r() < 0.5 ? 0 : 1), y - h - ph, r() < 0.5 ? M2 : M1);
    if (r() < 0.35) P(b, x + i + 1, y - h - ph, M3);
    if (peppers && r() < 0.3) { P(b, x + i, y - h - ph + 2, R3); P(b, x + i, y - h - ph + 3, R2); }
  }
}
// red spider-lily / pepper clusters along a base line
function redFlowers(b, x, y, w, seed, dens = 0.5) {
  const r = rng(seed);
  for (let i = 0; i < w; i++) {
    if (r() > dens) continue;
    const sh = 2 + (r() * 6 | 0), px = x + i;
    L(b, px, y, px, y - sh, M1);
    const c = r() < 0.5 ? R3 : R4;
    P(b, px, y - sh - 1, c); P(b, px - 1, y - sh, R2); P(b, px + 1, y - sh, c); if (r() < 0.4) P(b, px, y - sh - 2, R2);
  }
}
// leaning utility pole; returns crossarm points
function pole(b, x, yTop, yBot, lean = 0, o = {}) {
  const c = o.c || G1, hi = o.hi || G2;
  for (let y = yTop; y < yBot; y++) {
    const px = ri(x + lean * (yBot - y) / (yBot - yTop));
    R(b, px, y, 3, 1, c); P(b, px, y, hi); P(b, px + 2, y, K1);
  }
  const tx = ri(x + lean);
  R(b, tx - 9, yTop + 6, 21, 2, G0); R(b, tx - 6, yTop + 13, 15, 1, G0);
  for (const dx of [-8, -3, 5, 10]) { P(b, tx + dx, yTop + 5, G4); }
  if (o.trans) { R(b, tx + 3, yTop + 16, 6, 9, G2); R(b, tx + 3, yTop + 16, 6, 1, G3); R(b, tx + 7, yTop + 16, 2, 9, G1); }
  // step bolts and a tag
  for (let y = yTop + 30; y < yBot - 20; y += 9) P(b, ri(x + lean * (yBot - y) / (yBot - yTop)) + 3, y, G3);
  if (o.tag) { const ty = yBot - 46; R(b, ri(x + lean * 0.2), ty, 3, 4, Y1); }
  return [[tx - 8, yTop + 5], [tx - 3, yTop + 5], [tx + 5, yTop + 5], [tx + 10, yTop + 5], [tx, yTop + 13]];
}
function wire(b, x0, y0, x1, y1, sag, c = K0) {
  const n = Math.max(2, Math.ceil(Math.abs(x1 - x0) / 3)); let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = lerp(x0, x1, t), y = lerp(y0, y1, t) + sag * 4 * t * (1 - t);
    L(b, px, py, x, y, c); px = x; py = y;
  }
}
// gooseneck alley lamp hung from a pole
function lamp(b, x, y, on, dir = 1) { // x,y = pole attach point
  L(b, x, y, x + 8 * dir, y - 3, G0, 2); L(b, x + 8 * dir, y - 3, x + 11 * dir, y + 1, G0, 2);
  const lx = x + 11 * dir - 3;
  R(b, lx, y + 1, 7, 2, G1); R(b, lx + 1, y + 3, 5, 1, on ? Y3 : G2); if (on) { P(b, lx + 2, y + 4, Y2); P(b, lx + 3, y + 4, Y3); P(b, lx + 4, y + 4, Y2); }
  return [lx + 3, y + 4];
}
// clothes on a line; ph = animation frame (wind)
function laundry(b, x0, y0, x1, y1, sag, items, ph = 0, seed = 1, sc = 1, wc = G0) {
  wire(b, x0, y0, x1, y1, sag, wc);
  const r = rng(seed);
  for (const it of items) {
    const t = it.t, x = ri(lerp(x0, x1, t)), y = ri(lerp(y0, y1, t) + sag * 4 * t * (1 - t)) + 1;
    const sw = [0, 1, 2, 1, 0, -1][(ph + it.p) % 6] * (it.wind || 1);
    const c = it.c, d = DN[c], S = (pts) => pts.map(([u, v]) => [x + (u - x) * sc, y + (v - y) * sc]);
    const pp = (pts, cc) => poly(b, S(pts), cc), rr = (u, v, w, h, cc) => R(b, x + (u - x) * sc, y + (v - y) * sc, Math.max(1, w * sc), Math.max(1, h * sc), cc);
    if (it.k === 'shirt') {
      pp([[x, y], [x + 10, y], [x + 13 + sw, y + 3], [x + 11 + sw, y + 5], [x + 10 + sw, y + 4], [x + 10 + sw, y + 12], [x + sw, y + 12], [x + sw, y + 4], [x - 1 + sw, y + 5], [x - 3 + sw, y + 3]], c);
      pp([[x + 6, y + 1], [x + 10, y + 1], [x + 10 + sw, y + 12], [x + 6 + sw, y + 12]], d); rr(x + 5, y, 1, 1, G0); rr(x + 2, y, 1, 1, G0);
    } else if (it.k === 'towel') {
      pp([[x, y], [x + 8, y], [x + 8 + sw, y + 11], [x + sw, y + 11]], c); pp([[x + sw, y + 9], [x + 8 + sw, y + 9], [x + 8 + sw, y + 10], [x + sw, y + 10]], d); pp([[x + 5, y], [x + 8, y], [x + 8 + sw, y + 9], [x + 5 + sw, y + 9]], d);
    } else if (it.k === 'sock') {
      rr(x, y, 2, 5, c); rr(x + sw * 0.5 / sc, y + 5, 3, 2, c);
    } else if (it.k === 'pants') {
      pp([[x, y], [x + 9, y], [x + 10 + sw, y + 16], [x + 6 + sw, y + 16], [x + 4.5, y + 6], [x + 3 + sw, y + 16], [x - 1 + sw, y + 16]], c); rr(x, y, 9, 1, d);
    }
  }
}
// crimson tree crown — noise-carved leaf masses, lit from upper-left in stepped bands
function redTree(b, cx, cy, rx, ry, seed, o = {}) {
  const r = rng(seed);
  if (!o.noTrunk) {
    const tl = o.trunk || 30, lean = o.lean || 0;
    L(b, cx, cy + ry * 0.5, cx + lean, cy + ry + tl, K1, 3); P(b, cx + lean + 2, cy + ry + tl - 4, K0);
    for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.15 + r() * 0.7); L(b, cx + lean * 0.3, cy + ry * 0.6, cx + Math.cos(a) * rx * 0.8, cy + Math.sin(a) * ry * 0.7 + ry * 0.3, K1, i < 2 ? 2 : 1); }
  }
  const x0 = Math.floor(cx - rx - 4), x1 = Math.ceil(cx + rx + 4), y0 = Math.floor(cy - ry - 4), y1 = Math.ceil(cy + ry + 4);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy);
    const n = fbm(x * 0.13, y * 0.16, seed), n2 = vnoise(x * 0.5, y * 0.5, seed + 3);
    const m = 1.05 - d + (n - 0.5) * 0.9 + (n2 - 0.5) * 0.25;
    if (m < 0) { if (m > -0.08 && hash(x, y, seed) < 0.3) P(b, x, y, R1); continue; } // stray leaves at the rim
    // light from upper-left: higher = brighter band
    let l = (-dx * 0.5 - dy * 0.8) * 0.5 + (n - 0.5) * 1.4 + m * 0.6 + (bay(x, y) - 0.5) * 0.35;
    const c = l > 0.75 ? R4 : l > 0.32 ? R3 : l > -0.1 ? R2 : l > -0.5 ? R1 : R0;
    P(b, x, y, c);
  }
  // a few dark gaps where branches show through
  for (let i = 0; i < 5; i++) { const x = cx + (r() - 0.5) * rx, y = cy + (r() - 0.2) * ry * 0.7; L(b, x, y, x + (r() - 0.5) * 8, y + 3 + r() * 5, R0); }
}
// faded paper poster with a few printed marks
function poster(b, x, y, w, h, seed, o = {}) {
  const r = rng(seed), base = o.c || G4;
  R(b, x, y, w, h, base); D(b, x, y, w, h, G3, 0.25);
  if (o.red) R(b, x + 1, y + 1, w - 2, ri(h * 0.3), R2);
  for (let j = y + ri(h * 0.4); j < y + h - 2; j += 2) R(b, x + 2, j, ri((w - 4) * (0.4 + r() * 0.6)), 1, G2);
  if (o.photo) R(b, x + w - 6, y + ri(h * 0.4), 4, 5, G2);
  // torn corner & tape
  P(b, x + w - 1, y + h - 1, T); P(b, x + w - 2, y + h - 1, T); P(b, x + w - 1, y + h - 2, T);
  R(b, x + 1, y - 1, 3, 1, G5);
  streaks(b, x, y + h, w, 4, G2, seed, 0.3);
}
// demolition mark: red circle with X
function xMark(b, x, y, r, c = R3) {
  ellO(b, x, y, r, r, c); ellO(b, x, y, r - 1, r - 1, c);
  L(b, x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6, c, 2); L(b, x + r * 0.6, y - r * 0.6, x - r * 0.6, y + r * 0.6, c, 2);
}
// cement alley floor
function floor(b, x, y, w, h, seed, ramp = RAMP.ground) {
  tex(b, x, y, w, h, ramp, seed, 0.09, 0.08);
  for (let i = x; i < x + w; i += 23 + (hash(i, y, seed) * 20 | 0)) L(b, i, y, i + 6, y + h, ramp[0]);
  R(b, x, y, w, 1, K1);
}
// gas/electric meter, pipe, AC unit
function meter(b, x, y) { R(b, x, y, 5, 6, G3); R(b, x + 1, y + 1, 3, 2, K1); P(b, x + 2, y + 4, G5); L(b, x + 2, y + 6, x + 2, y + 14, G1); }
function pipe(b, x, y0, y1) { R(b, x, y0, 2, y1 - y0, G1); for (let y = y0 + 4; y < y1; y += 12) R(b, x - 1, y, 4, 1, G0); }
function acUnit(b, x, y) { R(b, x, y, 14, 10, G3); R(b, x, y, 14, 1, G4); ellO(b, x + 5, y + 5, 3, 3, G1); R(b, x + 10, y + 2, 3, 6, G2); R(b, x + 1, y + 10, 2, 2, G1); R(b, x + 11, y + 10, 2, 2, G1); }
